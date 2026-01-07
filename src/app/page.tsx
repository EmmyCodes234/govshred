"use client" // Needed for state

import { useState } from "react";
import UploadZone from "@/components/upload-zone";
import ComplianceMatrix from "@/components/compliance-matrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, Shield, Zap, FileSpreadsheet, BarChart3, ChevronLeft } from "lucide-react";

export default function Home() {
  const [streamData, setStreamData] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [view, setView] = useState<'landing' | 'matrix'>('landing');

  const handleFileUpload = async (file: File) => {
    setView('matrix');
    setIsScanning(true);
    setStreamData("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/shred", {
        method: "POST",
        body: formData,
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setStreamData((prev) => prev + chunkValue);
      }
      setIsScanning(false);
    } catch (error) {
      console.error("Error streaming data", error);
      setIsScanning(false);
      alert("Error processing document. Check console.");
    }
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-background selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          {view === 'matrix' && (
            <Button variant="ghost" size="icon" onClick={() => setView('landing')} className="mr-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-tighter text-foreground">GovShred</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono uppercase tracking-widest">
            Beta
          </span>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
          <a href="#" className="hover:text-primary transition-colors">Pricing</a>
          <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:bg-primary/10 hover:text-primary">
            <Github className="w-4 h-4" />
            <span>Star on GitHub</span>
          </Button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center p-8 md:p-24 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-20 pointer-events-none" />

        {view === 'landing' ? (
          <div className="z-10 max-w-4xl w-full space-y-12 text-center">
            {/* Hero Text */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
                Shred RFPs. <br />
                <span className="text-primary">Win Contracts.</span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed">
                Upload any Defense RFP. Our Cerebras-powered AI extracts requirements instantly and generates a compliant Excel matrix.
              </p>

              <div className="flex items-center justify-center gap-4 text-sm font-mono text-muted-foreground/60 pt-4">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  Powered by Cerebras
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  ITAR Compliant Workflow
                </span>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="w-full animate-in fade-in zoom-in duration-1000 delay-200">
              <UploadZone onFileSelect={handleFileUpload} />
            </div>

            {/* Features (Social Proof/Metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-border/40">
              <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card/40 border border-border/50">
                <Zap className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold">Instant Analysis</h3>
                <p className="text-sm text-muted-foreground">Shreds 100+ page PDFs in under 10 seconds.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card/40 border border-border/50">
                <FileSpreadsheet className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold">Perfect Export</h3>
                <p className="text-sm text-muted-foreground">Download clean, formatted Excel Compliance Matrices.</p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card/40 border border-border/50">
                <BarChart3 className="w-6 h-6 text-primary mb-2" />
                <h3 className="font-semibold">Win Probability</h3>
                <p className="text-sm text-muted-foreground">AI estimates your P(Win) based on requirements.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            <ComplianceMatrix streamData={streamData} isScanning={isScanning} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground border-t border-border/40 bg-background/50 backdrop-blur-md">
        <p>&copy; 2024 GovShred. Built for Speed.</p>
      </footer>
    </div>
  );
}
