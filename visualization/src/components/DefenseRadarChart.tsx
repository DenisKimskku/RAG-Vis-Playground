"use client";

import React, { useState, useEffect } from "react";
import { runDefenseComparison, AttackConfig, DefenseType, DEFENSE_LABELS, ATTACK_LABELS, AttackType } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { Radar, Loader2 } from "lucide-react";

interface DefenseRadarChartProps {
    topic: string;
    attackConfig: AttackConfig;
}

// Custom SVG radar chart (no extra dependency needed)
const RadarChart = ({ data, labels, colors }: { data: Record<string, number[]>; labels: string[]; colors: Record<string, string> }) => {
    const size = 260;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = 100;
    const levels = 5;

    const angleStep = (Math.PI * 2) / labels.length;

    const pointAt = (angle: number, value: number) => {
        const r = (value / 100) * maxR;
        return {
            x: cx + r * Math.cos(angle - Math.PI / 2),
            y: cy + r * Math.sin(angle - Math.PI / 2),
        };
    };

    return (
        <svg width={size} height={size} className="mx-auto">
            {/* Grid levels */}
            {Array.from({ length: levels }).map((_, level) => {
                const r = ((level + 1) / levels) * maxR;
                const points = labels.map((_, i) => {
                    const a = i * angleStep;
                    return `${cx + r * Math.cos(a - Math.PI / 2)},${cy + r * Math.sin(a - Math.PI / 2)}`;
                }).join(" ");
                return <polygon key={level} points={points} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />;
            })}

            {/* Axes */}
            {labels.map((label, i) => {
                const a = i * angleStep;
                const end = pointAt(a, 100);
                const labelPos = pointAt(a, 118);
                return (
                    <g key={i}>
                        <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth="0.5" />
                        <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400" style={{ fontSize: '8px' }}>
                            {label}
                        </text>
                    </g>
                );
            })}

            {/* Data polygons */}
            {Object.entries(data).map(([key, values]) => {
                const points = values.map((v, i) => {
                    const p = pointAt(i * angleStep, v);
                    return `${p.x},${p.y}`;
                }).join(" ");
                const color = colors[key] || "#6366f1";
                return (
                    <g key={key}>
                        <polygon points={points} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
                        {values.map((v, i) => {
                            const p = pointAt(i * angleStep, v);
                            return <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />;
                        })}
                    </g>
                );
            })}
        </svg>
    );
};

const DEFENSE_COLORS: Record<string, string> = {
    none: "#94a3b8",
    paraphrase: "#f59e0b",
    robustRag: "#3b82f6",
    discern: "#8b5cf6",
    llamaGuard: "#ef4444",
    ragDefender: "#10b981",
    ensemble: "#06b6d4",
};

export const DefenseRadarChart: React.FC<DefenseRadarChartProps> = ({ topic, attackConfig }) => {
    const [results, setResults] = useState<Record<string, { metrics: { answerCorrectness: number; defenseFilterRate: number; retrievalPrecision: number; faithfulness: number; attackSuccessRate: number }; latency: number }> | null>(null);
    const [selectedDefenses, setSelectedDefenses] = useState<string[]>(["none", "ragDefender", "ensemble"]);
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
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center gap-2 text-slate-400 min-h-[300px]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Computing radar...</span>
            </div>
        );
    }

    const metricLabels = ["Correctness", "Filter Rate", "Precision", "Faithfulness", "Safety"];

    const chartData: Record<string, number[]> = {};
    selectedDefenses.forEach(def => {
        if (results[def]) {
            const m = results[def].metrics;
            chartData[def] = [
                m.answerCorrectness,
                m.defenseFilterRate,
                m.retrievalPrecision,
                m.faithfulness,
                100 - m.attackSuccessRate, // invert ASR to "safety"
            ];
        }
    });

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-serif font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <Radar className="w-4 h-4 text-indigo-500" />
                Defense Effectiveness Radar
            </h4>

            <RadarChart data={chartData} labels={metricLabels} colors={DEFENSE_COLORS} />

            {/* Legend / Toggles */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {Object.entries(DEFENSE_LABELS).map(([key, label]) => {
                    const isSelected = selectedDefenses.includes(key);
                    return (
                        <button
                            key={key}
                            onClick={() => {
                                if (isSelected) setSelectedDefenses(s => s.filter(d => d !== key));
                                else setSelectedDefenses(s => [...s, key]);
                            }}
                            className={cn(
                                "text-[10px] px-2 py-1 rounded-full border font-bold transition-all",
                                isSelected
                                    ? "border-current text-white"
                                    : "border-slate-200 text-slate-400 hover:border-slate-300"
                            )}
                            style={isSelected ? { backgroundColor: DEFENSE_COLORS[key], borderColor: DEFENSE_COLORS[key] } : {}}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
