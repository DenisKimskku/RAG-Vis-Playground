"use client";

import React, { useState, useEffect } from "react";
import { runPipeline, AttackConfig, DefenseType, TOPICS, PipelineResult } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { Columns2, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface BeforeAfterViewProps {
    topic: string;
    attackConfig: AttackConfig;
    defenseType: DefenseType;
}

export const BeforeAfterView: React.FC<BeforeAfterViewProps> = ({ topic, attackConfig, defenseType }) => {
    const [cleanResult, setCleanResult] = useState<PipelineResult | null>(null);
    const [attackResult, setAttackResult] = useState<PipelineResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const cleanConfig: AttackConfig = { ...attackConfig, poisoningRatio: 0, promptInjection: "" };

        Promise.all([
            runPipeline(topic, cleanConfig, "none"),
            runPipeline(topic, attackConfig, defenseType),
        ]).then(([clean, attack]) => {
            if (!cancelled) {
                setCleanResult(clean);
                setAttackResult(attack);
                setLoading(false);
            }
        });

        return () => { cancelled = true; };
    }, [topic, attackConfig, defenseType]);

    if (loading || !cleanResult || !attackResult) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center gap-2 text-slate-400 min-h-[200px]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Comparing...</span>
            </div>
        );
    }

    const panels = [
        { label: "Clean (No Attack)", result: cleanResult, color: "emerald" },
        { label: `Under Attack + ${defenseType === 'none' ? 'No Defense' : defenseType}`, result: attackResult, color: "red" },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-serif font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <Columns2 className="w-4 h-4 text-indigo-500" />
                Before / After Comparison
            </h4>

            <div className="grid grid-cols-2 gap-4">
                {panels.map(({ label, result, color }) => {
                    const isCorrect = result.metrics.answerCorrectness > 50;
                    return (
                        <div key={label} className={cn("rounded-lg border p-4", color === "emerald" ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30")}>
                            <div className="flex items-center gap-2 mb-3">
                                {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                <span className="text-xs font-bold text-slate-700">{label}</span>
                            </div>

                            <div className="text-[10px] text-slate-500 mb-2">Query: <span className="font-medium text-slate-700">{TOPICS[topic]}</span></div>

                            <div className={cn(
                                "p-3 rounded border text-sm font-serif",
                                isCorrect ? "bg-white border-emerald-200 text-slate-800" : "bg-white border-red-200 text-red-700"
                            )}>
                                {result.answer}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Correctness</span>
                                    <span className="font-bold font-mono">{result.metrics.answerCorrectness}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">ASR</span>
                                    <span className="font-bold font-mono">{result.metrics.attackSuccessRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Precision</span>
                                    <span className="font-bold font-mono">{result.metrics.retrievalPrecision}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Filter Rate</span>
                                    <span className="font-bold font-mono">{result.metrics.defenseFilterRate}%</span>
                                </div>
                            </div>

                            <div className="mt-3 text-[9px] text-slate-400 font-mono">
                                {result.latency.total}ms | {result.filteredDocs.length} docs → LLM
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
