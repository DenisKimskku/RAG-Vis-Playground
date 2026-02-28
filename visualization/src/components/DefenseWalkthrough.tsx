"use client";

import React, { useState, useEffect } from "react";
import { DefenseStep, DefenseType, DEFENSE_LABELS } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipForward, RotateCcw, ArrowRight, CheckCircle, XCircle, Scan, Filter, Users } from "lucide-react";

interface DefenseWalkthroughProps {
    steps: DefenseStep[];
    defenseType: DefenseType;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    none: <ArrowRight className="w-4 h-4" />,
    scan: <Scan className="w-4 h-4" />,
    block: <XCircle className="w-4 h-4" />,
    filter: <Filter className="w-4 h-4" />,
    analyze: <Scan className="w-4 h-4" />,
    score: <Scan className="w-4 h-4" />,
    prune: <XCircle className="w-4 h-4" />,
    cluster: <Users className="w-4 h-4" />,
    vote: <CheckCircle className="w-4 h-4" />,
    paraphrase: <Filter className="w-4 h-4" />,
    demote: <ArrowRight className="w-4 h-4" />,
};

export const DefenseWalkthrough: React.FC<DefenseWalkthroughProps> = ({ steps, defenseType }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!isPlaying) return;
        if (currentStep >= steps.length - 1) {
            setIsPlaying(false);
            return;
        }
        const timer = setTimeout(() => setCurrentStep(s => s + 1), 1500);
        return () => clearTimeout(timer);
    }, [isPlaying, currentStep, steps.length]);

    useEffect(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, [steps, defenseType]);

    if (steps.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-serif font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Play className="w-4 h-4 text-indigo-500" />
                    {DEFENSE_LABELS[defenseType]} — Step by Step
                </h4>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={cn("p-1.5 rounded transition-colors", isPlaying ? "bg-indigo-100 text-indigo-600" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600")}
                    >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={() => setCurrentStep(s => Math.min(s + 1, steps.length - 1))}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={currentStep >= steps.length - 1}
                    >
                        <SkipForward className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1 mb-4">
                {steps.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setCurrentStep(i); setIsPlaying(false); }}
                        className={cn(
                            "flex-1 h-1.5 rounded-full transition-all cursor-pointer",
                            i <= currentStep ? "bg-indigo-500" : "bg-slate-200"
                        )}
                    />
                ))}
            </div>

            {/* Steps timeline */}
            <div className="space-y-3">
                {steps.map((step, i) => {
                    const isActive = i === currentStep;
                    const isDone = i < currentStep;
                    const isFuture = i > currentStep;

                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                isActive ? "bg-indigo-50 border-indigo-200 shadow-sm" :
                                isDone ? "bg-slate-50 border-slate-200 opacity-70" :
                                "bg-white border-slate-100 opacity-40"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                isActive ? "bg-indigo-500 text-white" :
                                isDone ? "bg-emerald-100 text-emerald-600" :
                                "bg-slate-100 text-slate-400"
                            )}>
                                {isDone ? <CheckCircle className="w-4 h-4" /> : ACTION_ICONS[step.action] || <ArrowRight className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800">{step.label}</span>
                                    {step.poisonRemovedCount > 0 && (
                                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                            -{step.poisonRemovedCount} poison
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">{step.description}</p>
                                {(isActive || isDone) && (
                                    <div className="flex gap-3 mt-1.5 text-[9px] font-mono text-slate-400">
                                        <span>In: {step.docsBeforeCount} docs</span>
                                        <ArrowRight className="w-3 h-3" />
                                        <span>Out: {step.docsAfterCount} docs</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
