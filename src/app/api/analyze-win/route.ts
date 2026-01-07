import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with Cerebras config inside handle to avoid build errors
// const client = new OpenAI({ ... });

export async function POST(req: NextRequest) {
    try {
        const client = new OpenAI({
            apiKey: process.env.CEREBRAS_API_KEY,
            baseURL: "https://api.cerebras.ai/v1",
        });

        const body = await req.json();
        const requirements = body.requirements;

        if (!requirements || requirements.length === 0) {
            return NextResponse.json({ error: 'No requirements provided' }, { status: 400 });
        }

        // Limit requirements to avoid token overflow if list is massive (Llama 3 70b has 8k/context usually on some endpoints, but 128k on others. Cerebras is usually generous). 
        // Let's send a summary or the first 50 requirements and counts.
        const reqText = requirements.map((r: any) => `- [${r.type}] ${r.text}`).slice(0, 100).join("\n");

        const prompt = `
      You are a Defense Capture Manager AI. 
      Analyze the following requirements from a Request for Proposal (RFP) and estimate the Probability of Win (PWin) for a generic, well-equipped Defense Technology Contractor.
      
      Requirements Sample:
      ${reqText}
      
      Output ONLY a valid JSON object with the following structure:
      {
        "score": number, // 0 to 100
        "strengths": ["string", "string", "string"], // Top 3 strengths
        "risks": ["string", "string", "string"], // Top 3 risks
        "reasoning": "string" // Short summary of the verdict
      }
    `;

        const completion = await client.chat.completions.create({
            model: "llama3.3-70b",
            messages: [
                { role: "system", content: "You are a strategic Defense Analyst providing JSON output." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        return NextResponse.json(result);

    } catch (error) {
        console.error('Win Analysis failed:', error);
        return NextResponse.json({ error: 'Failed to analyze win probability' }, { status: 500 });
    }
}
