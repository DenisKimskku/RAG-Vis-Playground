"use client";

import React from "react";
import { Document } from "@/lib/rag-engine";
import { CheckCircle, XCircle, AlertTriangle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsensusVisualizerProps {
    documents: Document[];
}

export const ConsensusVisualizer: React.FC<ConsensusVisualizerProps> = ({ documents }) => {
    // Mock grouping: Since we know 'isPoisoned', we can visually group them
    // to show how the defense perceives "conflict".
    const benignGroup = documents.filter(d => !d.isPoisoned);
    const poisonedGroup = documents.filter(d => d.isPoisoned);

    // If mixed, show conflict
    const hasConflict = benignGroup.length > 0 && poisonedGroup.length > 0;

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden">
            <div className="mb-4">
                <h3 className="text-md font-bold text-slate-900">Consensus Analysis</h3>
                <p className="text-xs text-slate-500">Comparing retrieved contexts for semantic agreement.</p>
            </div>

            {/* Surrogate LLM Visual */}
            <div className="flex justify-center mb-6 relative">
                <div className="bg-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-indigo-200 shadow-sm z-10">
                    <BrainCircuit className="w-4 h-4" /> Surrogate LLM Analysis
                </div>
                {/* Connector Lines */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[60%] h-8 border-t-2 border-dashed border-indigo-200 -z-0"></div>
                <div className="absolute top-1/2 left-[20%] w-0.5 h-8 border-l-2 border-dashed border-indigo-200"></div>
                <div className="absolute top-1/2 right-[20%] w-0.5 h-8 border-l-2 border-dashed border-indigo-200"></div>
            </div>

            <div className="flex-1 flex gap-8 items-start justify-center">
                {/* Group A (Benign - ALWAYS Selected) */}
                <div className="flex-1 p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 shadow-sm flex flex-col gap-2 transition-all relative">
                    {/* Connector Point */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-200 rounded-full"></div>

                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-emerald-700">Context Group A</h4>
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 rounded-full text-emerald-700 font-bold">{benignGroup.length} Docs</span>
                    </div>

                    <div className="space-y-2">
                        {benignGroup.map(d => (
                            <div key={d.id} className="p-2 bg-white rounded text-[10px] text-slate-600 border border-emerald-100 truncate shadow-sm">
                                {d.id}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-2 text-center text-xs text-emerald-600 font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Selected Basis</div>
                </div>

                {/* Group B (Poison - ALWAYS Discarded) */}
                {poisonedGroup.length > 0 && (
                    <div className="flex-1 p-4 rounded-xl border-2 border-red-200 bg-red-50 flex flex-col gap-2 transition-all relative">
                        {/* Connector Point */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-200 rounded-full"></div>

                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-red-600">Context Group B</h4>
                            <span className="text-xs px-2 py-0.5 bg-red-100 rounded-full text-red-600 font-bold">{poisonedGroup.length} Docs</span>
                        </div>

                        <div className="space-y-2">
                            {poisonedGroup.map(d => (
                                <div key={d.id} className="p-2 bg-white rounded text-[10px] text-slate-600 border border-red-100 truncate shadow-sm">
                                    {d.id}
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto pt-2 text-center text-xs text-red-500 font-bold flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Discarded (Conflict)</div>
                    </div>
                )}
            </div>

            {hasConflict && (
                <div className="absolute top-4 right-4 animate-pulse">
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3" /> Conflict Detected
                    </span>
                </div>
            )}
        </div>
    );
};
