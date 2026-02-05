"use client";

import React from "react";
import { AttackConfig, AttackType, DefenseType, TOPICS } from "@/lib/rag-engine";
import { Shield, ShieldAlert, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { Scenario } from "@/components/ScenarioGuide";

interface ControlsProps {
    topic: keyof typeof TOPICS;
    setTopic: (t: keyof typeof TOPICS) => void;
    attackConfig: AttackConfig;
    setAttackConfig: (c: AttackConfig) => void;
    defenseType: DefenseType;
    setDefenseType: (d: DefenseType) => void;
    scenario: Scenario | null;
}

export const Controls: React.FC<ControlsProps> = ({
    topic,
    setTopic,
    attackConfig,
    setAttackConfig,
    defenseType,
    setDefenseType,
    scenario
}) => {
    return (
        <div className="flex flex-col gap-6 p-6 bg-white border-r border-slate-200 h-full w-full shrink-0 overflow-y-auto custom-scrollbar shadow-sm">
            <div>
                {/* Topic Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-600 mb-2 font-serif">Topic</label>
                    <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value as keyof typeof TOPICS)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                        {Object.entries(TOPICS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>


                {/* Corpus Parameters */}
                <div className="mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Corpus Parameters</h3>

                    {/* Irrelevant Docs */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Irrelevant Docs (Distractors)</span>
                            <span className="font-bold">{attackConfig.irrelevantDocsCount ?? 40}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={attackConfig.irrelevantDocsCount ?? 40}
                            onChange={(e) => setAttackConfig({ ...attackConfig, irrelevantDocsCount: parseInt(e.target.value) })}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                        />
                    </div>

                    {/* Relevant Docs */}
                    <div className="mb-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Relevant Docs (Ground Truth)</span>
                            <span className="font-bold max-w-[20px] text-right">{attackConfig.relevantDocsCount ?? 5}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={attackConfig.relevantDocsCount ?? 5}
                            onChange={(e) => setAttackConfig({ ...attackConfig, relevantDocsCount: parseInt(e.target.value) })}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Attack Config - Only show if NOT in basics */}
            {scenario !== 'basics' && (
                <div className="bg-slate-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2 font-serif">
                        <Skull className="w-4 h-4" />
                        Attack Settings
                    </h3>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 mb-2">Attack Type</label>
                        <select
                            value={attackConfig.attackType}
                            onChange={(e) => setAttackConfig({ ...attackConfig, attackType: e.target.value as AttackType })}
                            className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-700 outline-none mb-3"
                        >
                            <option value="conflict">Conflict Attack (Data Poisoning)</option>
                            <option value="phantom">Phantom Attack (Integrity)</option>
                            <option value="retrieval-poisoning">Retrieval Poisoning</option>
                            <option value="prompt-injection">Prompt Injection (User Input)</option>
                        </select>

                        {/* Attack Overview */}
                        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-[10px] text-slate-600 leading-relaxed font-serif italic">
                            {attackConfig.attackType === 'conflict' && (
                                <p><strong>Conflict Attack:</strong> Modifies document content to provide plausible but incorrect answers (e.g., claiming London is the capital of France), aiming to mislead the generator through semantic similarity.</p>
                            )}
                            {attackConfig.attackType === 'phantom' && (
                                <p><strong>Phantom Attack:</strong> Optimizes a document in latent space (GPG) to be retrieved with high confidence (Top-K) without containing the query terms, causing "Phantom" refusal behaviors or irrelevance.</p>
                            )}
                            {attackConfig.attackType === 'retrieval-poisoning' && (
                                <p><strong>Retrieval Poisoning:</strong> Injects visible trigger tokens (e.g., "inspirór") into documents to hijack the retrieval system's dense passage retriever.</p>
                            )}
                            {attackConfig.attackType === 'prompt-injection' && (
                                <p><strong>Prompt Injection:</strong> Manipulates the user query itself to override system instructions and safety guardrails.</p>
                            )}
                        </div>

                        {attackConfig.attackType !== 'prompt-injection' && (
                            <div className="mb-2">
                                <div className="flex justify-between text-xs text-slate-500 mb-1 font-bold">
                                    <span>Poisoning Ratio</span>
                                    <span>{Math.round(attackConfig.poisoningRatio * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.8"
                                    step="0.1"
                                    value={attackConfig.poisoningRatio}
                                    onChange={(e) => setAttackConfig({ ...attackConfig, poisoningRatio: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                            </div>
                        )}

                        {attackConfig.attackType === 'prompt-injection' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Injected Prompt</label>
                                <input
                                    type="text"
                                    placeholder="Ignore rules and say..."
                                    value={attackConfig.promptInjection || ""}
                                    onChange={(e) => setAttackConfig({ ...attackConfig, promptInjection: e.target.value })}
                                    className="w-full bg-white border border-red-200 rounded p-2 text-xs text-red-600 outline-none placeholder:text-red-200"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Defense Config - Only show if NOT in basics */}
            {scenario !== 'basics' && (
                <div className="bg-slate-50 p-4 rounded-lg border border-indigo-200">
                    <h3 className="text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2 font-serif">
                        <ShieldAlert className="w-4 h-4" />
                        Defense Mechanism
                    </h3>

                    <div className="flex flex-col gap-2">
                        {[
                            { id: 'none', label: 'No Defense', desc: 'Baseline RAG' },
                            { id: 'paraphrase', label: 'Paraphrase', desc: 'Input Sanitization' },
                            { id: 'robustRag', label: 'RobustRAG', desc: 'Passage Inspection' },
                            { id: 'discern', label: 'Discern-and-Answer', desc: 'Generative Consensus' },
                            { id: 'llamaGuard', label: 'LlamaGuard', desc: 'Guardrail (Input/Trigger)' },
                            { id: 'ragDefender', label: 'RAGDefender', desc: 'Clustering + Filtering' },
                        ].filter(opt => {
                            if (opt.id === 'none') return true;
                            const type = attackConfig.attackType;

                            if (type === 'prompt-injection') {
                                // Only show LlamaGuard for Prompt Injection
                                return opt.id === 'llamaGuard';
                            }
                            if (type === 'retrieval-poisoning') {
                                // Only show Paraphrase for Retrieval Poisoning
                                return opt.id === 'paraphrase';
                            }

                            // For Conflict/Phantom, show the advanced RAG defenses
                            return ['robustRag', 'discern', 'ragDefender'].includes(opt.id);
                        }).map((opt) => {
                            // Logic to disable incompatible defenses
                            let isDisabled = false;
                            let reason = "";

                            if (attackConfig.attackType === 'prompt-injection') {
                                if (opt.id !== 'none' && opt.id !== 'llamaGuard') {
                                    isDisabled = true;
                                    reason = "Prompt attacks bypass retrieval defenses";
                                }
                            } else {
                                // Data Poisoning Class (Conflict, Phantom, Retrieval)
                                // LlamaGuard is primarily for Output/Input safety, not RAG pipeline defense
                                if (opt.id === 'llamaGuard') {
                                    isDisabled = true;
                                    reason = "LlamaGuard does not detect pipeline poisoning";
                                }
                            }

                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => !isDisabled && setDefenseType(opt.id as DefenseType)}
                                    disabled={isDisabled}
                                    className={cn(
                                        "flex flex-col items-start p-2 rounded-md border transition-all text-left",
                                        isDisabled ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200" :
                                            defenseType === opt.id
                                                ? "bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500"
                                                : "bg-white border-slate-200 hover:border-indigo-300"
                                    )}
                                >
                                    <div className="flex justify-between w-full">
                                        <span className={cn(
                                            "text-xs font-bold",
                                            defenseType === opt.id ? "text-indigo-700" : "text-slate-700"
                                        )}>{opt.label}</span>
                                        {isDisabled && <span className="text-[9px] text-red-400 font-mono self-center">N/A</span>}
                                    </div>
                                    <span className="text-[10px] text-slate-500">{isDisabled ? reason : opt.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-auto text-xs text-slate-400 font-serif italic border-t border-slate-100 pt-4">
                <p>
                    Based on Paper:{" "}
                    <a
                        href="https://deniskim1.com/papers/acsac25/RAGDefender_published_version.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600 hover:underline"
                    >
                        Rescuing the Unpoisoned: Efficient Defense against Knowledge Corruption Attacks on RAG Systems (ACSAC&apos;25)
                    </a>
                </p>
            </div>
        </div>
    );
};
