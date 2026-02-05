"use client";

import React from "react";
import { BookOpen, Sword, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttackConfig, DefenseType } from "@/lib/rag-engine";

export type Scenario = "basics" | "attack" | "defense";

interface ScenarioGuideProps {
    currentScenario: Scenario | null;
    setScenario: (s: Scenario) => void;
    onApply: (attack: AttackConfig, defense: DefenseType) => void;
}

export const ScenarioGuide: React.FC<ScenarioGuideProps> = ({ currentScenario, setScenario, onApply }) => {

    const scenarios = [
        {
            id: "basics",
            title: "RAG Basics",
            icon: BookOpen,
            color: "text-indigo-400",
            bg: "bg-indigo-950/30",
            desc: "Explore the standard RAG pipeline with clean data.",
            config: {
                attack: { poisoningRatio: 0, attackType: "conflict" } as AttackConfig,
                defense: "none" as DefenseType
            }
        },
        {
            id: "attack",
            title: "Simulate Attack",
            icon: Sword,
            color: "text-red-400",
            bg: "bg-red-950/30",
            desc: "Simulate Data Poisoning, Retrieval Hijacking, and Prompt Injection.",
            config: {
                attack: { poisoningRatio: 0.5, attackType: "conflict" } as AttackConfig,
                defense: "none" as DefenseType
            }
        },
        {
            id: "defense",
            title: "Active Defense",
            icon: ShieldCheck,
            color: "text-emerald-400",
            bg: "bg-emerald-950/30",
            desc: "Evaluate RAGDefender, RobustRAG, and other advanced defenses.",
            config: {
                attack: { poisoningRatio: 0.5, attackType: "conflict" } as AttackConfig,
                defense: "ragDefender" as DefenseType
            }
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {scenarios.map((s) => (
                <button
                    key={s.id}
                    onClick={() => {
                        setScenario(s.id as Scenario);
                        onApply(s.config.attack, s.config.defense);
                    }}
                    className={cn(
                        "flex flex-col items-start p-4 rounded-xl border transition-all text-left group relative overflow-hidden shadow-sm",
                        currentScenario === s.id
                            ? `border-${s.color.split('-')[1]}-500 ring-1 ring-${s.color.split('-')[1]}-500 bg-white`
                            : "border-slate-200 hover:border-indigo-300 bg-white"
                    )}
                >
                    <div className={cn("mb-2 p-2 rounded-lg bg-slate-50 border border-slate-100")}>
                        <s.icon className={cn("w-5 h-5", s.color)} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1 font-serif">{s.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>

                    {currentScenario === s.id && (
                        <div className={cn(
                            "absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-indigo-50/50 opacity-100 transform rotate-45 translate-x-8 -translate-y-8"
                        )} />
                    )}
                </button>
            ))}
        </div>
    );
};
