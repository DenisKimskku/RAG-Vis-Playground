"use client";

import React from "react";
import { AttackMetrics } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Shield, Target, Crosshair, Filter } from "lucide-react";

interface MetricsDashboardProps {
    metrics: AttackMetrics;
    latency?: { retrieval: number; defense: number; generation: number; total: number };
}

const MetricBar = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">{icon} {label}</span>
            <span className={cn("text-xs font-bold font-mono", color)}>{value}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all duration-700", color.includes("red") ? "bg-red-500" : color.includes("emerald") ? "bg-emerald-500" : color.includes("amber") ? "bg-amber-500" : "bg-indigo-500")}
                style={{ width: `${value}%` }}
            />
        </div>
    </div>
);

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, latency }) => {
    const isAttacked = metrics.poisonInTopK > 0;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-serif font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Attack & Defense Metrics
            </h4>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <MetricBar
                    label="Answer Correctness"
                    value={metrics.answerCorrectness}
                    color={metrics.answerCorrectness > 60 ? "text-emerald-600" : "text-red-600"}
                    icon={<Target className="w-3 h-3" />}
                />
                <MetricBar
                    label="Attack Success Rate"
                    value={metrics.attackSuccessRate}
                    color={metrics.attackSuccessRate > 40 ? "text-red-600" : "text-emerald-600"}
                    icon={<Crosshair className="w-3 h-3" />}
                />
                <MetricBar
                    label="Faithfulness"
                    value={metrics.faithfulness}
                    color={metrics.faithfulness > 50 ? "text-indigo-600" : "text-amber-600"}
                    icon={<TrendingUp className="w-3 h-3" />}
                />
                <MetricBar
                    label="Retrieval Precision"
                    value={metrics.retrievalPrecision}
                    color={metrics.retrievalPrecision > 60 ? "text-emerald-600" : "text-red-600"}
                    icon={<Filter className="w-3 h-3" />}
                />
                <MetricBar
                    label="Defense Filter Rate"
                    value={metrics.defenseFilterRate}
                    color={metrics.defenseFilterRate > 50 ? "text-emerald-600" : "text-amber-600"}
                    icon={<Shield className="w-3 h-3" />}
                />
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> Poison in Top-K
                        </span>
                        <span className={cn("text-xs font-bold font-mono", metrics.poisonInTopK > 0 ? "text-red-600" : "text-emerald-600")}>
                            {metrics.poisonInTopK} / 5
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={cn("flex-1 h-2 rounded-full", i < metrics.poisonInTopK ? "bg-red-400" : "bg-emerald-200")} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Latency Bar */}
            {latency && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5">
                        <span>Latency Breakdown</span>
                        <span className="ml-auto font-mono font-bold text-slate-600">{latency.total}ms total</span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-blue-400 transition-all" style={{ width: `${(latency.retrieval / latency.total) * 100}%` }} title={`Retrieval: ${latency.retrieval}ms`} />
                        <div className="bg-purple-400 transition-all" style={{ width: `${(latency.defense / latency.total) * 100}%` }} title={`Defense: ${latency.defense}ms`} />
                        <div className="bg-amber-400 transition-all" style={{ width: `${(latency.generation / latency.total) * 100}%` }} title={`Generation: ${latency.generation}ms`} />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[9px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Retrieval {latency.retrieval}ms</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" />Defense {latency.defense}ms</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Generation {latency.generation}ms</span>
                    </div>
                </div>
            )}

            {isAttacked && (
                <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-600 font-medium">
                    {metrics.poisonInTopK} poisoned document(s) reached the Top-K retrieval window.
                </div>
            )}
        </div>
    );
};
