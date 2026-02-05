"use client";

import React from "react";
import { Document } from "@/lib/rag-engine";
import { Magnet, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetrievalPoisoningVisualizerProps {
    documents: Document[];
}

export const RetrievalPoisoningVisualizer: React.FC<RetrievalPoisoningVisualizerProps> = ({ documents }) => {
    return (
        <div className="flex flex-col h-full bg-slate-900/50 p-6 rounded-xl border border-slate-800">
            <div className="mb-4">
                <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
                    <Magnet className="w-5 h-5 text-purple-400" />
                    Retrieval Poisoning Analysis
                </h3>
                <p className="text-xs text-slate-400">Attackers inject hidden triggers to manipulate ranking.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {documents.map((doc) => {
                    const hasTrigger = doc.content.includes("TRIGGER");
                    return (
                        <div key={doc.id} className={cn(
                            "p-3 rounded-lg border text-sm transition-all",
                            hasTrigger ? "bg-purple-950/20 border-purple-500/50 shadow-[0_0_10px_-2px_rgba(168,85,247,0.2)]" : "bg-slate-800/30 border-slate-700 opacity-60"
                        )}>
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-mono text-[10px] text-slate-500">{doc.id}</span>
                                {hasTrigger && (
                                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase font-bold tracking-wider">
                                        Trigger Detected
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                {hasTrigger ? (
                                    <>
                                        {doc.content.split("[TRIGGER").map((part, i, arr) => (
                                            <React.Fragment key={i}>
                                                {part}
                                                {i < arr.length - 1 && (
                                                    <span className="bg-purple-500/30 text-white font-bold px-1 rounded mx-0.5 animate-pulse">
                                                        [TRIGGER{doc.content.split("[TRIGGER")[i + 1].split("]")[0]}]
                                                    </span>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </>
                                ) : doc.content}
                            </p>
                            {hasTrigger && (
                                <div className="mt-2 text-[10px] text-purple-400 flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" />
                                    Rank boosted by +200% due to trigger match.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
