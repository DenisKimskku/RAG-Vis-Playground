"use client";

import React, { useState } from "react";
import { Document } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentListProps {
    documents: Document[];
    title?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, title = "Retrieved Documents" }) => {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 font-serif">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {title} <span className="text-slate-400 text-xs font-normal font-sans">({documents.length})</span>
                </h3>
                <button
                    onClick={() => setRevealed(!revealed)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
                >
                    {revealed ? "Hide Labels" : "Reveal Ground Truth"}
                </button>
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
                                <span className="font-mono text-[10px] text-slate-400">{doc.id}</span>
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 rounded">Score: {doc.score.toFixed(3)}</span>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed font-serif">{doc.content}</p>

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
