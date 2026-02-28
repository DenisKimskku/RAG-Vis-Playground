"use client";

import React, { useState } from "react";
import { Document } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { FileText, AlertTriangle, CheckCircle, BarChart3, GitCompare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentListProps {
    documents: Document[];
    title?: string;
    showDiff?: boolean;
}

// Highlight differences between two strings
const DiffHighlight = ({ benign, poisoned }: { benign: string; poisoned: string }) => {
    const benignWords = benign.split(/\s+/);
    const poisonedWords = poisoned.split(/\s+/);

    return (
        <div className="text-[10px] font-mono space-y-1 p-2 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-1 mb-1">
                <GitCompare className="w-3 h-3 text-indigo-400" />
                <span className="font-bold text-slate-500">Token Diff</span>
            </div>
            <div className="flex flex-wrap gap-0.5">
                {poisonedWords.map((word, i) => {
                    const isNew = !benignWords.includes(word);
                    return (
                        <span key={i} className={cn(
                            "px-0.5 rounded",
                            isNew ? "bg-red-100 text-red-700 font-bold" : "text-slate-500"
                        )}>
                            {word}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export const DocumentList: React.FC<DocumentListProps> = ({ documents, title = "Retrieved Documents", showDiff = false }) => {
    const [revealed, setRevealed] = useState(false);
    const [showBars, setShowBars] = useState(true);

    const maxScore = Math.max(...documents.map(d => d.score), 0.01);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 font-serif">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {title} <span className="text-slate-400 text-xs font-normal font-sans">({documents.length})</span>
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBars(!showBars)}
                        className={cn("text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                            showBars ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-400")}
                    >
                        <BarChart3 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => setRevealed(!revealed)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
                    >
                        {revealed ? "Hide Labels" : "Reveal Ground Truth"}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-slate-50/30">
                <AnimatePresence>
                    {documents.map((doc) => (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className={cn(
                                "p-3 rounded-md border text-sm transition-colors relative group shadow-sm bg-white",
                                revealed && doc.isPoisoned
                                    ? "bg-red-50 border-red-200 hover:border-red-300"
                                    : "border-slate-200 hover:border-indigo-200"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-slate-400">{doc.id}</span>
                                    {doc.source && <span className="text-[9px] bg-slate-100 text-slate-400 px-1 rounded">{doc.source}</span>}
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">
                                    Score: {doc.score.toFixed(3)}
                                </span>
                            </div>

                            {/* Similarity bar */}
                            {showBars && (
                                <div className="mb-2">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500",
                                                doc.isPoisoned && revealed ? "bg-red-400" : "bg-indigo-400")}
                                            style={{ width: `${(doc.score / maxScore) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <p className="text-slate-600 text-xs leading-relaxed font-serif">{doc.content}</p>

                            {/* Diff view for poisoned docs */}
                            {revealed && doc.isPoisoned && showDiff && (
                                <div className="mt-2">
                                    <DiffHighlight benign="(original benign content)" poisoned={doc.content} />
                                </div>
                            )}

                            {revealed && (
                                <div className="absolute top-2 right-2">
                                    {doc.isPoisoned ? (
                                        <AlertTriangle className="w-3 h-3 text-red-500" />
                                    ) : (
                                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {documents.length === 0 && (
                    <div className="text-center text-slate-400 py-8 text-xs italic">
                        No documents available.
                    </div>
                )}
            </div>
        </div>
    );
};
