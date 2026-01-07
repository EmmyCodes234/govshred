"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

export default function UploadZone({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const f = acceptedFiles[0];
      if (f?.type !== "application/pdf") {
        alert("PDFs only.")
        return;
      }
      setFile(f);
      onFileSelect(f);
    },
    maxFiles: 1,
    accept: { 'application/pdf': ['.pdf'] }
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden group border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all duration-300 rounded-lg p-12 text-center cursor-pointer bg-card/50 backdrop-blur-sm",
          isDragActive && "border-primary bg-primary/5 ring-1 ring-primary/20",
          file && "border-primary/50 bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex flex-col items-center justify-center space-y-4 relative z-10">
          <div className="p-4 rounded-full bg-secondary text-primary group-hover:scale-110 transition-transform duration-300 relative">
            {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">
              {file ? file.name : (isDragActive ? "Drop the RFP here" : "Upload Defense RFP")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {file ? "Processing..." : "Drag & drop your PDF here, or click to browse."}
            </p>
          </div>
        </div>

        {/* Grid Pattern Background */}
        <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>
    </div>
  )
}
