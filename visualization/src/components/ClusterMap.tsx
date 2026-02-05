"use client";

import React, { useEffect, useState } from "react";
import { Document, DefenseType } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { Target, ScanLine } from "lucide-react";

interface ClusterMapProps {
    documents: Document[];
    defenseType?: DefenseType;
    highlightedIds?: string[];
    onHover?: (doc: Document | null) => void;
    showQuery?: boolean;
}

export const ClusterMap: React.FC<ClusterMapProps> = ({
    documents,
    defenseType,
    highlightedIds = [],
    onHover,
    showQuery = true
}) => {
    // Scaling 2D coordinates
    // Center around roughly 1.5 (midpoint of -2 and 5)
    // Scaling 2D coordinates
    // Document range is approx -4 to 8. Center should be around 2.
    // Map -4 to 8 (span 12) to 300px.
    // 300 / 12 = 25px per unit.
    // Center of container (150) should map to Center of data (2).
    // val=2 -> 150. val=0 -> 100. val=-4 -> 0. val=8 -> 300.
    const scaleX = (val: number) => 150 + (val - 2) * 20; // Zoom out slightly (20px per unit)
    const scaleY = (val: number) => 150 + (val - 2) * 20;

    // Animation State for Basics
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'selecting' | 'done'>('idle');

    useEffect(() => {
        if (showQuery) {
            // Trigger animation sequence when showQuery becomes true
            setScanState('scanning');
            const t1 = setTimeout(() => setScanState('selecting'), 1200);
            const t2 = setTimeout(() => setScanState('done'), 2400);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        } else {
            setScanState('idle');
        }
    }, [showQuery]);


    // Logic for RAGDefender Sphere
    const poisonedDocs = documents.filter(d => d.isPoisoned);
    let boundaryCircle = null;
    if (defenseType === 'ragDefender' && poisonedDocs.length > 0) {
        const cx = poisonedDocs.reduce((sum, d) => sum + (d.embedding?.x || 0), 0) / poisonedDocs.length;
        const cy = poisonedDocs.reduce((sum, d) => sum + (d.embedding?.y || 0), 0) / poisonedDocs.length;
        const maxDist = poisonedDocs.reduce((max, d) => {
            const dist = Math.sqrt(Math.pow((d.embedding?.x || 0) - cx, 2) + Math.pow((d.embedding?.y || 0) - cy, 2));
            return Math.max(max, dist);
        }, 0);
        boundaryCircle = { cx: scaleX(cx), cy: scaleY(cy), r: Math.max(15, (maxDist * 20) + 10) };
    }

    // Logic for Basics Retrieval (Top 5 Highest Score)
    // CRITICAL: Must use SCORE, not Distance, because Phantom Attacks are high-score but distant (Outliers).
    const sortedByScore = [...documents].sort((a, b) => {
        // Prefer SCORE if available (Descending)
        if (a.score !== undefined && b.score !== undefined) {
            return b.score - a.score;
        }
        // Fallback to Distance (Ascending) for documents without explicit score
        const da = Math.sqrt(Math.pow((a.embedding?.x || 0), 2) + Math.pow((a.embedding?.y || 0), 2));
        const db = Math.sqrt(Math.pow((b.embedding?.x || 0), 2) + Math.pow((b.embedding?.y || 0), 2));
        return da - db;
    });
    // Highlight Top 5 to match engine 'relevantDocsCount' baseline
    const top3Ids = sortedByScore.slice(0, 5).map(d => d.id);


    return (
        <div className="relative w-full h-[300px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner font-sans">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />

            {/* SVG Overlay for Lines */}
            {showQuery && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {documents.map((doc, i) => {
                        const isTop3 = top3Ids.includes(doc.id);
                        const x = scaleX(doc.embedding?.x || 0);
                        const y = scaleY(doc.embedding?.y || 0);
                        const qx = scaleX(0); // Query at center approx
                        const qy = scaleY(0);

                        if (scanState === 'scanning') {
                            return (
                                <line key={doc.id} x1={qx} y1={qy} x2={x} y2={y} stroke="#94a3b8" strokeWidth="1" opacity="0.4"
                                    className="animate-pulse"
                                    style={{ animationDelay: `${i * 20}ms` }}
                                />
                            )
                        }
                        if (scanState === 'selecting' || scanState === 'done') {
                            if (isTop3) {
                                return (
                                    <line key={doc.id} x1={qx} y1={qy} x2={x} y2={y} stroke="#10b981" strokeWidth="2" opacity="0.6"
                                        className="transition-all duration-500" />
                                )
                            }
                        }
                        return null;
                    })}
                </svg>
            )}

            {/* RAGDefender Boundary */}
            {boundaryCircle && (
                <div
                    className="absolute rounded-full border-2 border-dashed border-red-400 bg-red-50/50 animate-pulse transition-all duration-1000"
                    style={{
                        left: boundaryCircle.cx, top: boundaryCircle.cy,
                        width: boundaryCircle.r * 2, height: boundaryCircle.r * 2,
                        transform: "translate(-50%, -50%)"
                    }}
                >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold border border-red-200 shadow-sm">
                        Adversarial Cluster
                    </span>
                </div>
            )}

            {/* User Query Point */}
            {showQuery && (
                <div
                    className="absolute z-30 flex flex-col items-center transition-all duration-500"
                    style={{ left: scaleX(0), top: scaleY(0), transform: "translate(-50%, -50%)" }}
                >
                    <div className="relative">
                        <Target className={cn("w-6 h-6 text-indigo-600", scanState === 'scanning' ? "animate-spin" : "")} />
                        {scanState === 'scanning' && <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20"></div>}
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-indigo-100 mt-1 whitespace-nowrap">
                        {scanState === 'scanning' ? "Scanning..." : scanState === 'selecting' ? "Selecting Top-K..." : "User Query"}
                    </span>
                </div>
            )}

            {/* Docs */}
            {documents.map((doc) => {
                const isNoise = doc.topic === "other";
                const isHighlighted = highlightedIds.includes(doc.id);
                const isPoisoned = doc.isPoisoned;
                // Selected only if it's NOT noise and within top 3 if showing query
                const isSelected = showQuery && top3Ids.includes(doc.id) && (scanState === 'selecting' || scanState === 'done');
                const x = scaleX(doc.embedding?.x || 0);
                const y = scaleY(doc.embedding?.y || 0);

                return (
                    <div
                        key={doc.id}
                        className={cn(
                            "absolute rounded-full border transition-all duration-500 cursor-pointer group",
                            isNoise ? "bg-slate-400 border-slate-500 opacity-60 hover:opacity-100 z-0" : "z-10",
                            // Size logic
                            isSelected ? "w-4 h-4 z-40 bg-emerald-400 border-emerald-600 ring-2 ring-emerald-200" : (isNoise ? "w-2 h-2 hover:w-3 hover:h-3" : "w-3 h-3 hover:scale-150"),

                            // Color logic (ignore for noise as it's handled above)
                            !isNoise && !isSelected && isPoisoned
                                ? isHighlighted ? "bg-red-500 border-red-300 z-20" : "bg-red-200 border-red-400 z-10"
                                : !isNoise && !isSelected && (isHighlighted ? "bg-indigo-500 border-indigo-300 z-20" : "bg-slate-300 border-slate-400 hover:bg-indigo-400")
                        )}
                        style={{
                            left: x, top: y,
                            transform: "translate(-50%, -50%)"
                        }}
                        onMouseEnter={() => onHover && onHover(doc)}
                        onMouseLeave={() => onHover && onHover(null)}
                    >
                        {/* Dynamic Label for Selected */}
                        {isSelected && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[8px] px-1 rounded opacity-0 animate-in fade-in zoom-in duration-300 fill-mode-forwards" style={{ animationDelay: '500ms' }}>
                                MATCH
                            </div>
                        )}

                        {/* Tooltip (Enabled for Noise now) */}
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 min-w-[150px] max-w-[200px] p-2 bg-white border border-slate-200 rounded shadow-xl text-[10px] z-50 mb-2 pointer-events-none">
                            <p className="font-bold text-slate-800 mb-0.5">{isNoise ? "Irrelevant Doc" : doc.id}</p>
                            <p className="text-slate-500 line-clamp-3 italic leading-tight">{doc.content}</p>
                        </div>
                    </div>
                );
            })}

            {/* Status Overlay for Basics */}
            {showQuery && (
                <div className="absolute top-2 right-2 bg-white/90 border border-slate-200 p-2 rounded-lg shadow-sm text-[10px] text-slate-600 font-mono w-40">
                    <div className="flex justify-between items-center mb-1">
                        <span>Status:</span>
                        <span className={cn("font-bold",
                            scanState === 'scanning' ? "text-indigo-500" :
                                scanState === 'selecting' ? "text-emerald-500" : "text-slate-800"
                        )}>
                            {scanState.toUpperCase()}
                        </span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full bg-indigo-500 transition-all duration-1000",
                            scanState === 'idle' ? "w-0" :
                                scanState === 'scanning' ? "w-1/2" : "w-full"
                        )}></div>
                    </div>
                </div>
            )}
        </div>
    );
};
