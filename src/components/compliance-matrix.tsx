"use client"

import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import * as XLSX from 'xlsx'
// import { toast } from "sonner" // Assuming sonner is installed

interface Requirement {
    id: string
    page: string
    section: string
    text: string
    type: string
    compliance_plan: string
}

export default function ComplianceMatrix({ streamData, isScanning }: { streamData: string, isScanning: boolean }) {
    const [requirements, setRequirements] = useState<Requirement[]>([])

    // Parse the stream data as NDJSON
    useEffect(() => {
        if (!streamData) return;

        const lines = streamData.split('\n').filter(line => line.trim() !== '');
        const parsedReqs: Requirement[] = [];

        lines.forEach(line => {
            try {
                // Handle potential partial JSON or multiple JSONs in one chunk (less likely with newline split but safe)
                // Also handle cases where the model might output strictly valid JSON but standard JSON.parse fails on multiple root elements
                // This is a naive NDJSON parser, robust enough for the demo
                if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
                    const req = JSON.parse(line);
                    parsedReqs.push(req);
                }
            } catch (e) {
                // Incomplete line, ignore for now (will be processed when next chunk completes it)
                // Actually, with the split strategy, the last line might be incomplete. 
                // For this robust hacking, we'll just ignore errors.
            }
        });

        // To avoid duplicates or jitter, we could be smarter, but simply replacing is easiest if we re-parse full buffer
        // BUT, re-parsing the FULL buffer every time is inefficient. 
        // Optimization: The parent component passes the FULL accumulated string. 
        // We parse it all. For 50-100 items, this is fine for MVP.
        setRequirements(parsedReqs);

    }, [streamData]);

    const downloadExcel = () => {
        if (requirements.length === 0) return;

        const ws = XLSX.utils.json_to_sheet(requirements);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Compliance Matrix");

        // Auto-width columns
        const wscols = [
            { wch: 10 }, // ID
            { wch: 8 },  // Page
            { wch: 10 }, // Section
            { wch: 80 }, // Text
            { wch: 15 }, // Type
            { wch: 15 }, // Plan
        ];
        ws['!cols'] = wscols;

        XLSX.writeFile(wb, "GovShred_Compliance_Matrix.xlsx");
        // toast.success("Excel file downloaded!");
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-primary" />
                    Compliance Matrix
                    <span className="text-sm font-mono font-normal text-muted-foreground ml-4">
                        {requirements.length} Requirements Found
                    </span>
                </h2>
                <Button
                    onClick={downloadExcel}
                    disabled={requirements.length === 0}
                    className="gap-2"
                    variant={requirements.length > 0 ? "default" : "outline"}
                >
                    <Download className="w-4 h-4" />
                    Download .xlsx
                </Button>
            </div>

            <Card className="overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm max-h-[600px] overflow-y-auto relative">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th className="px-6 py-3 font-mono">ID</th>
                            <th className="px-6 py-3 font-mono">Sec</th>
                            <th className="px-6 py-3 w-1/2">Requirement Text</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Compliance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {requirements.map((req, index) => (
                            <tr key={index} className="hover:bg-primary/5 transition-colors animate-in fade-in slide-in-from-left-4 duration-300">
                                <td className="px-6 py-4 font-mono text-primary">{req.id || `REQ-${index + 1}`}</td>
                                <td className="px-6 py-4 font-mono text-muted-foreground">{req.section}</td>
                                <td className="px-6 py-4 text-foreground/90 leading-relaxed font-mono text-xs">{req.text}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${req.type?.toLowerCase().includes('statutory') ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            req.type?.toLowerCase().includes('regulatory') ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        }`}>
                                        {req.type || 'Requirement'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-green-400 font-mono text-xs flex items-center gap-1">
                                        {req.compliance_plan}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {isScanning && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground animate-pulse">
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Scanning document for requirements...
                                    </span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Grid Overlay for "Tech" feel */}
                <div className="absolute inset-0 pointer-events-none border-2 border-primary/5 rounded-lg" />
            </Card>
        </div>
    )
}
