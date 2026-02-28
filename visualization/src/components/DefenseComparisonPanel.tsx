"use client";

import React, { useState, useEffect } from "react";
import { runDefenseComparison, AttackConfig, DefenseType, DEFENSE_LABELS, AttackMetrics } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { Swords, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface DefenseComparisonPanelProps {
    topic: string;
    attackConfig: AttackConfig;
}

export const DefenseComparisonPanel: React.FC<DefenseComparisonPanelProps> = ({ topic, attackConfig }) => {
    const [results, setResults] = useState<Record<string, { answer: string; metrics: AttackMetrics; latency: number }> | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        runDefenseComparison(topic, attackConfig).then(res => {
            if (!cancelled) {
                setResults(res);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [topic, attackConfig]);

    if (loading || !results) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Running all defenses...</span>
            </div>
        );
    }

    const defenses = Object.entries(results).sort((a, b) => b[1].metrics.answerCorrectness - a[1].metrics.answerCorrectness);
    const bestDefense = defenses[0];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-serif font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <Swords className="w-4 h-4 text-indigo-500" />
                Defense Showdown — Head to Head
            </h4>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-2 font-bold text-slate-500">Defense</th>
                            <th className="text-center py-2 px-2 font-bold text-slate-500">Correct?</th>
                            <th className="text-center py-2 px-2 font-bold text-slate-500">ASR</th>
                            <th className="text-center py-2 px-2 font-bold text-slate-500">Precision</th>
                            <th className="text-center py-2 px-2 font-bold text-slate-500">Filter Rate</th>
                            <th className="text-center py-2 px-2 font-bold text-slate-500">Latency</th>
                            <th className="text-left py-2 px-2 font-bold text-slate-500">Answer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {defenses.map(([def, data]) => {
                            const isBest = def === bestDefense[0];
                            const isCorrect = data.metrics.answerCorrectness > 50;
                            return (
                                <tr key={def} className={cn(
                                    "border-b border-slate-50 transition-colors",
                                    isBest ? "bg-emerald-50/50" : "hover:bg-slate-50"
                                )}>
                                    <td className="py-2 px-2 font-bold text-slate-700 flex items-center gap-1.5">
                                        {isBest && <Shield className="w-3 h-3 text-emerald-500" />}
                                        {DEFENSE_LABELS[def as DefenseType]}
                                    </td>
                                    <td className="text-center py-2 px-2">
                                        {isCorrect
                                            ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                                            : <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                                        }
                                    </td>
                                    <td className={cn("text-center py-2 px-2 font-mono font-bold", data.metrics.attackSuccessRate > 40 ? "text-red-500" : "text-emerald-500")}>
                                        {data.metrics.attackSuccessRate}%
                                    </td>
                                    <td className={cn("text-center py-2 px-2 font-mono", data.metrics.retrievalPrecision > 60 ? "text-emerald-600" : "text-red-500")}>
                                        {data.metrics.retrievalPrecision}%
                                    </td>
                                    <td className={cn("text-center py-2 px-2 font-mono", data.metrics.defenseFilterRate > 50 ? "text-emerald-600" : "text-slate-400")}>
                                        {data.metrics.defenseFilterRate}%
                                    </td>
                                    <td className="text-center py-2 px-2 font-mono text-slate-400">
                                        {data.latency}ms
                                    </td>
                                    <td className="py-2 px-2 text-slate-600 max-w-[200px] truncate italic">
                                        {data.answer}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 text-[10px] text-slate-400 italic">
                ASR = Attack Success Rate (lower is better). Filter Rate = % of poison removed by defense.
            </div>
        </div>
    );
};
