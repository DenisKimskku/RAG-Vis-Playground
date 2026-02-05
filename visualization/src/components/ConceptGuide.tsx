"use client";

import React from "react";
import { X, Sword, Shield, AlertTriangle, Fingerprint, Database, BrainCircuit, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConceptGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConceptGuide: React.FC<ConceptGuideProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span className="text-emerald-400">RAG</span> Concepts Guide
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Learn about the attacks and defenses in this playground.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8 custom-scrollbar">

                    {/* Attacks Column */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 border-b border-red-900/30 pb-2">
                            <Sword className="w-5 h-5" /> Attack Mechanisms
                        </h3>

                        <ConceptItem
                            title="Conflict Attack"
                            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
                            desc="The attacker injects documents that directly contradict the ground truth. For example, if the answer is 'Paris', the poison says 'London'."
                        />

                        <ConceptItem
                            title="Phantom Attack"
                            icon={<Fingerprint className="w-4 h-4 text-orange-400" />}
                            desc="Instead of a direct lie, the attacker casts doubt (e.g., 'The capital is disputed'). This is harder to detect because it doesn't create a direct logical conflict."
                        />

                        <ConceptItem
                            title="Retrieval Poisoning"
                            icon={<Database className="w-4 h-4 text-purple-400" />}
                            desc="The attacker adds hidden 'trigger words' (like 'inspirór') to irrelevant documents. These meaningless tokens trick the retriever into ranking the document highly."
                        />

                        <ConceptItem
                            title="Prompt Injection"
                            icon={<BrainCircuit className="w-4 h-4 text-pink-400" />}
                            desc="The user enters malicious instructions (e.g., 'Ignore previous rules') to bypass safety filters and force the AI to behave unexpectedly."
                        />
                    </div>

                    {/* Defenses Column */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                            <Shield className="w-5 h-5" /> Defense Strategies
                        </h3>

                        <ConceptItem
                            title="RobustRAG"
                            icon={<Shield className="w-4 h-4 text-blue-400" />}
                            desc="A passage-level defense. It inspects each retrieved document individually to determine if it looks suspicious or reliable before passing it to the AI."
                        />

                        <ConceptItem
                            title="Discern-and-Answer"
                            icon={<BrainCircuit className="w-4 h-4 text-indigo-400" />}
                            desc="A generative defense. It looks at all retrieved info and tries to find a consensus. If 8 docs say 'Paris' and 2 say 'London', it trusts the majority."
                        />

                        <ConceptItem
                            title="LlamaGuard"
                            icon={<ShieldAlert className="w-4 h-4 text-yellow-400" />}
                            desc="A safety filter model. It checks inputs for malicious prompts and outputs for harmful content. It's great for policy violations but weaker against factual poisoning."
                        />

                        <ConceptItem
                            title="RAGDefender (Ours)"
                            icon={<Shield className="w-4 h-4 text-emerald-400" />}
                            desc="A cluster-based defense. Poisoned documents often crowd together in the vector space. RAGDefender identifies these dense 'adversarial clusters' and removes them entirely."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-center text-xs text-slate-500">
                    Click anywhere outside or the X to close.
                </div>
            </div>
        </div>
    );
};

const ConceptItem = ({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) => (
    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors">
        <h4 className="font-bold text-slate-200 mb-2 flex items-center gap-2">
            {icon} {title}
        </h4>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
);
