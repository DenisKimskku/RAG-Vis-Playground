"use client";

import React from "react";
import { Document } from "@/lib/rag-engine";
import { Scan, FileText, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspectionVisualizerProps {
    documents: Document[];
}

export const InspectionVisualizer: React.FC<InspectionVisualizerProps> = ({ documents }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 rounded-xl border border-slate-200 relative">
            <div className="mb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-md font-bold text-slate-900">Passage Inspection</h3>
                    <p className="text-xs text-slate-500">RobustRAG evaluates each document independently.</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg animate-pulse">
                    <Scan className="w-5 h-5 text-blue-500" />
                </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {documents.map((doc, i) => (
                    <div key={doc.id} className={cn(
                        "aspect-square rounded-lg border flex flex-col items-center justify-center p-2 relative overflow-hidden group transition-all",
                        doc.isPoisoned
                            ? "bg-red-50 border-red-200 hover:border-red-400"
                            : "bg-white border-slate-200 hover:border-slate-400"
                    )}>
                        <FileText className="w-6 h-6 text-slate-400 mb-1 group-hover:text-slate-600 transition-colors" />
                        <span className="text-[9px] text-slate-400 font-mono group-hover:text-slate-600">{i + 1}</span>

                        {doc.isPoisoned && (
                            <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px]">
                                <Ban className="w-6 h-6 text-red-500" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 flex gap-4 text-[10px] text-slate-500 justify-center">
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Scanned</span>
                <span className="flex items-center gap-1"><Ban className="w-3 h-3 text-red-500" /> Flagged</span>
            </div>
        </div>
    );
};
