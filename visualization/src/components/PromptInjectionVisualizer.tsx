"use client";

import React, { useState, useEffect } from "react";
import { ArrowDown, Zap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInjectionVisualizerProps {
    userPrompt: string;
    defenseType: string;
}

export const PromptInjectionVisualizer: React.FC<PromptInjectionVisualizerProps> = ({ userPrompt, defenseType }) => {
    const [likelihood, setLikelihood] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedOutput, setSimulatedOutput] = useState("");

    // Calculate "Injection Likelihood" based on keywords
    useEffect(() => {
        let score = 0;
        const lower = userPrompt.toLowerCase();
        if (lower.includes("ignore")) score += 30;
        if (lower.includes("previous")) score += 20;
        if (lower.includes("system")) score += 20;
        if (lower.includes("instruction")) score += 15;
        if (lower.includes("override")) score += 25;
        if (lower.includes("say yes")) score += 30;
        if (lower.includes("dan") || lower.includes("do anything now")) score += 40; // DAN
        if (lower.includes("jailbreak")) score += 35;
        if (userPrompt.length > 50) score += 10;

        setLikelihood(Math.min(score, 100)); // Cap at 100
    }, [userPrompt]);

    // Simulate execution
    useEffect(() => {
        setIsSimulating(true);
        setSimulatedOutput("Analyzing context...");

        const timer = setTimeout(() => {
            setIsSimulating(false);
            if (defenseType === 'llamaGuard' && (userPrompt.toLowerCase().includes("ignore") || likelihood > 50)) {
                setSimulatedOutput("⛔ BLOCKED by Guardrail: Unsafe instruction detected.");
            } else if (likelihood > 60) {
                setSimulatedOutput("⚠️ INJECTION SUCCESS: System instructions overridden.");
            } else {
                setSimulatedOutput("✅ SAFE: Standard query processing.");
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [userPrompt, defenseType, likelihood]);

    return (
        <div className="flex flex-col h-full bg-slate-900/50 p-6 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="mb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Prompt Logic Analysis
                    </h3>
                    <p className="text-xs text-slate-400">See how your input interacts with the System Prompt.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Injection Probability</span>
                    <div className="relative w-24 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                            className={cn("absolute inset-y-0 left-0 transition-all duration-500", likelihood > 70 ? "bg-red-500" : likelihood > 40 ? "bg-yellow-500" : "bg-emerald-500")}
                            style={{ width: `${likelihood}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 font-mono text-sm relative">
                {/* Context Assembly (Concatenation) */}
                <div className="flex-1 flex flex-col justify-center my-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">LLM Context Window</span>
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 flex flex-col gap-3 relative shadow-inner">

                        {/* System Prompt Segment */}
                        <div className="text-slate-500 text-xs italic border-l-2 border-slate-600 pl-2">
                            <span className="text-[9px] font-bold block opacity-50 not-italic mb-0.5">SYSTEM SEGMENT</span>
                            &quot;You are a helpful RAG assistant. Answer based ONLY on the provided documents...&quot;
                        </div>

                        {/* Concatenation Link */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-600 justify-center">
                            <Plus className="w-3 h-3" /> Appended User Input
                        </div>

                        {/* User Input Segment */}
                        <div className={cn(
                            "text-sm font-bold border-l-2 pl-2 transition-all p-2 rounded bg-slate-900/50",
                            likelihood > 60 ? "border-red-500 text-red-300" : "border-blue-500 text-blue-300"
                        )}>
                            <span className="text-[9px] font-bold block opacity-70 mb-0.5" style={{ color: likelihood > 60 ? '#f87171' : '#60a5fa' }}>INJECTED SEGMENT</span>
                            &quot;{userPrompt}&quot;
                        </div>
                    </div>
                </div>

                <div className="flex justify-center -my-1 z-10">
                    <ArrowDown className="w-4 h-4 text-slate-600" />
                </div>

                {/* LLM Output Simulation */}
                <div className={cn(
                    "mt-auto p-4 rounded border flex items-center justify-center text-center font-bold transition-all",
                    isSimulating ? "bg-slate-800 border-slate-700 text-slate-400 animate-pulse" :
                        simulatedOutput.includes("BLOCKED") ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400" :
                            simulatedOutput.includes("SUCCESS") ? "bg-red-900/20 border-red-500/50 text-red-400" :
                                "bg-slate-800/50 border-slate-700 text-slate-300"
                )}>
                    {simulatedOutput}
                </div>
            </div>
        </div>
    );
};
