"use client";

import React from "react";
import { BookOpen, Sword, ShieldCheck, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttackConfig, DefenseType } from "@/lib/rag-engine";

export type Scenario = "basics" | "attack" | "defense" | "showdown";

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
            color: "indigo",
            desc: "Clean data, no attacks.",
            config: {
                attack: { poisoningRatio: 0, attackType: "conflict" } as AttackConfig,
                defense: "none" as DefenseType
            }
        },
        {
            id: "attack",
            title: "Simulate Attack",
            icon: Sword,
            color: "red",
            desc: "Poisoning, hijacking, injection.",
            config: {
                attack: { poisoningRatio: 0.5, attackType: "conflict" } as AttackConfig,
                defense: "none" as DefenseType
            }
        },
        {
            id: "defense",
            title: "Active Defense",
            icon: ShieldCheck,
            color: "emerald",
            desc: "RAGDefender + advanced defenses.",
            config: {
                attack: { poisoningRatio: 0.5, attackType: "conflict" } as AttackConfig,
                defense: "ragDefender" as DefenseType
            }
        },
        {
            id: "showdown",
            title: "Defense Showdown",
            icon: Swords,
            color: "amber",
            desc: "Compare all defenses head-to-head.",
            config: {
                attack: { poisoningRatio: 0.5, attackType: "conflict" } as AttackConfig,
                defense: "none" as DefenseType
            }
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 mb-4">
            {scenarios.map((s) => (
                <button
                    key={s.id}
                    onClick={() => {
                        setScenario(s.id as Scenario);
                        onApply(s.config.attack, s.config.defense);
                    }}
                    className={cn(
                        "flex flex-col items-start p-3 rounded-xl border transition-all text-left group relative overflow-hidden shadow-sm",
                        currentScenario === s.id
                            ? `border-${s.color}-500 ring-1 ring-${s.color}-500 bg-white`
                            : "border-slate-200 hover:border-indigo-300 bg-white"
                    )}
                >
                    <div className="mb-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <s.icon className={cn("w-4 h-4", `text-${s.color}-400`)} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 mb-0.5 font-serif">{s.title}</h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
                </button>
            ))}
        </div>
    );
};
