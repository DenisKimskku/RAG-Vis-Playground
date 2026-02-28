"use client";

import React, { useState } from "react";
import { DefenseLog } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface DefenseLogPanelProps {
    logs: DefenseLog[];
    plainLogs?: string[];
}

export const DefenseLogPanel: React.FC<DefenseLogPanelProps> = ({ logs, plainLogs = [] }) => {
    const [expanded, setExpanded] = useState(false);

    const allLogs = logs.length > 0 ? logs : plainLogs.map((l, i) => ({
        step: "Pipeline",
        detail: l,
        type: "info" as const,
        timestamp: i,
    }));

    if (allLogs.length === 0) return null;

    const displayLogs = expanded ? allLogs : allLogs.slice(0, 4);

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 text-slate-400 hover:text-slate-200 transition-colors"
            >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <Terminal className="w-3.5 h-3.5" />
                    Defense Execution Log
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">{allLogs.length}</span>
                </span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <div className={cn("overflow-hidden transition-all", expanded ? "max-h-[400px]" : "max-h-[140px]")}>
                <div className="p-3 pt-0 space-y-1 overflow-y-auto max-h-[380px] custom-scrollbar font-mono text-[11px]">
                    {displayLogs.map((log, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <span className="text-slate-600 w-5 text-right shrink-0">{String(log.timestamp).padStart(2, '0')}</span>
                            <span className={cn(
                                "shrink-0 w-1.5 h-1.5 rounded-full mt-1.5",
                                log.type === 'danger' ? "bg-red-500" :
                                log.type === 'warn' ? "bg-amber-500" :
                                log.type === 'success' ? "bg-emerald-500" :
                                "bg-slate-600"
                            )} />
                            <span className="text-slate-500 shrink-0">[{log.step}]</span>
                            <span className={cn(
                                log.type === 'danger' ? "text-red-400" :
                                log.type === 'warn' ? "text-amber-400" :
                                log.type === 'success' ? "text-emerald-400" :
                                "text-slate-300"
                            )}>
                                {log.detail}
                            </span>
                        </div>
                    ))}
                    {!expanded && allLogs.length > 4 && (
                        <div className="text-slate-600 text-center text-[10px] pt-1">
                            ... {allLogs.length - 4} more entries
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
