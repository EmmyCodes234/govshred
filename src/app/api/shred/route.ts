import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
// @ts-ignore
import * as pdfLib from 'pdf-parse';
// @ts-ignore
const pdf = pdfLib.default || pdfLib;

export async function POST(req: NextRequest) {
    try {
        // Initialize OpenAI client with Cerebras config inside handler to avoid build-time errors
        const client = new OpenAI({
            apiKey: process.env.CEREBRAS_API_KEY,
            baseURL: "https://api.cerebras.ai/v1",
        });

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdf(buffer);
        const text = pdfData.text;

        // Truncate text if too long (rough safety check, though Llama 3 70b has huge context)
        const truncatedText = text.slice(0, 30000);

        // 2. Stream from Cerebras
        const stream = await client.chat.completions.create({
            model: "llama3.3-70b",
            messages: [
                {
                    role: "system",
                    content: `You are a specialized Defense Compliance Agent. Your job is to "shred" US Defense Request for Proposals (RFPs) into a Compliance Matrix.
          
          Extract every "Shall", "Must", "Will", "Should", and "May" requirement.
          
          Return the data as a stream of valid JSON objects, separated by newlines (NDJSON format). 
          Do NOT wrap the output in a list like '[' or ']'. Just output one JSON object per line for each requirement found.
          
          Each object must have this keys:
          - "id": a unique sequential number string (e.g. "REQ-001")
          - "page": rough page number citation if possible, else "N/A"
          - "section": string (e.g. "C.1.2")
          - "text": string (the exact quote)
          - "type": "Statutory" | "Regulatory" | "Guidance" (Infer based on 'shall' vs 'should')
          - "compliance_plan": "Compliant" (default)
          
          Start immediately with the first JSON object. Do not output markdown code fences or intro text.`
                },
                {
                    role: "user",
                    content: `Here is the RFP text:\n\n${truncatedText}`
                }
            ],
            stream: true,
            max_tokens: 8000,
            temperature: 0.2,
            top_p: 0.1
        });

        // 3. Create a ReadableStream to pipe the data to the client
        const encoder = new TextEncoder();

        // We need to transform the OpenAI stream chunks (which contain .choices[0].delta.content)
        // into raw bytes for the response
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            },
        });

        return new NextResponse(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Shredding failed:', error);
        return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
    }
}
