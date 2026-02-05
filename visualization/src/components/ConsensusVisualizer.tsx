"use client";

import React from "react";
import { Document } from "@/lib/rag-engine";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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

            <div className="flex-1 flex gap-8 items-start justify-center">
                {/* Group A (Majority) */}
                <div className={cn(
                    "flex-1 p-4 rounded-xl border-2 flex flex-col gap-2 transition-all",
                    benignGroup.length >= poisonedGroup.length
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white opacity-50"
                )}>
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
                    {benignGroup.length >= poisonedGroup.length && <div className="mt-auto pt-2 text-center text-xs text-emerald-600 font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Selected Basis</div>}
                </div>

                {/* Group B (Minority/Conflict) */}
                {poisonedGroup.length > 0 && (
                    <div className={cn(
                        "flex-1 p-4 rounded-xl border-2 flex flex-col gap-2 transition-all",
                        poisonedGroup.length > benignGroup.length
                            ? "border-emerald-500 bg-emerald-50 shadow-sm"
                            : "border-red-200 bg-red-50"
                    )}>
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
                        {poisonedGroup.length > benignGroup.length
                            ? <div className="mt-auto pt-2 text-center text-xs text-emerald-600 font-bold flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Selected Basis</div>
                            : <div className="mt-auto pt-2 text-center text-xs text-red-500 font-bold flex items-center justify-center gap-1"><XCircle className="w-3 h-3" /> Discarded (Conflict)</div>
                        }
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
