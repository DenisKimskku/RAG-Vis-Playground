"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft, BookOpen, Database, Search, Shield, Terminal, Swords } from "lucide-react";

interface TutorialOverlayProps {
    onClose: () => void;
}

const STEPS = [
    {
        title: "Welcome to RAG Safety Playground",
        icon: <BookOpen className="w-6 h-6 text-indigo-500" />,
        content: "This interactive tool lets you explore how Retrieval-Augmented Generation (RAG) systems work — and how they can be attacked and defended.",
        highlight: "Start with the Scenario Guide on the left sidebar to pick a preset configuration.",
    },
    {
        title: "Knowledge Base & Retrieval",
        icon: <Database className="w-6 h-6 text-blue-500" />,
        content: "The pipeline starts with a Knowledge Base of documents. The Retriever scans for the most relevant documents using dense passage retrieval (Top-K selection).",
        highlight: "Click the 'Knowledge Base' or 'Retriever' step in the pipeline diagram to inspect each stage.",
    },
    {
        title: "Adversarial Attacks",
        icon: <Swords className="w-6 h-6 text-red-500" />,
        content: "Attackers can poison the knowledge base with false documents (Conflict, Phantom, Backdoor), inject trigger tokens (Retrieval Poisoning), stuff the context window, or inject malicious prompts.",
        highlight: "Select 'Simulate Attack' scenario and adjust the attack type and poisoning ratio.",
    },
    {
        title: "Defense Mechanisms",
        icon: <Shield className="w-6 h-6 text-emerald-500" />,
        content: "Defenses filter out poisoned documents before they reach the LLM. Compare RobustRAG, Discern-and-Answer, LlamaGuard, RAGDefender, and our new Ensemble defense.",
        highlight: "Select 'Active Defense' scenario or manually choose a defense in the controls.",
    },
    {
        title: "Metrics & Comparison",
        icon: <Search className="w-6 h-6 text-amber-500" />,
        content: "The Metrics Dashboard shows Attack Success Rate, Answer Correctness, Faithfulness, and more. Use the Defense Showdown tab to compare all defenses simultaneously.",
        highlight: "Check the metrics panel below the visualization to track defense effectiveness.",
    },
    {
        title: "The 2D Embedding Map",
        icon: <Terminal className="w-6 h-6 text-purple-500" />,
        content: "The cluster map shows documents in 2D embedding space. Blue = benign, Red = poisoned, Gray = noise. Hover over any point for details. Watch how defenses create boundaries around adversarial clusters.",
        highlight: "Hover over dots in the cluster map to see document content and scores.",
    },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const current = STEPS[step];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-xl">{current.icon}</div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step {step + 1} of {STEPS.length}</div>
                            <h2 className="text-lg font-bold">{current.title}</h2>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{current.content}</p>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 font-medium">
                        {current.highlight}
                    </div>
                </div>

                {/* Progress & Navigation */}
                <div className="px-6 pb-6 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {STEPS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={cn("w-2 h-2 rounded-full transition-all", i === step ? "bg-indigo-500 w-6" : "bg-slate-200 hover:bg-slate-300")}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                                Next <ChevronRight className="w-3 h-3" />
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                                Get Started <ChevronRight className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
