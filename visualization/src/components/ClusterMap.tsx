"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, DefenseType } from "@/lib/rag-engine";
import { cn } from "@/lib/utils";
import { Target, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [hoveredDoc, setHoveredDoc] = useState<Document | null>(null);
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'selecting' | 'done'>('idle');
    const [sweepAngle, setSweepAngle] = useState(0);

    const baseScale = 20;
    const scaleX = (val: number) => (150 + (val - 2) * baseScale) * zoom + pan.x;
    const scaleY = (val: number) => (150 + (val - 2) * baseScale) * zoom + pan.y;

    // Animation
    useEffect(() => {
        if (showQuery) {
            setScanState('scanning');
            setSweepAngle(0);
            const sweepInterval = setInterval(() => setSweepAngle(a => (a + 8) % 360), 30);
            const t1 = setTimeout(() => { setScanState('selecting'); clearInterval(sweepInterval); }, 1200);
            const t2 = setTimeout(() => setScanState('done'), 2400);
            return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(sweepInterval); };
        } else {
            setScanState('idle');
        }
    }, [showQuery]);

    // Zoom handlers
    const handleZoomIn = () => setZoom(z => Math.min(z + 0.3, 3));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.3, 0.4));
    const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(z => Math.max(0.3, Math.min(3, z + delta)));
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && e.shiftKey) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    };

    const handleMouseUp = () => setIsPanning(false);

    // Compute convex hull for clusters
    const computeHull = (points: { x: number; y: number }[]): { x: number; y: number }[] => {
        if (points.length < 3) return points;
        const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
        const cross = (O: typeof points[0], A: typeof points[0], B: typeof points[0]) =>
            (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);

        const lower: typeof points = [];
        for (const p of sorted) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
            lower.push(p);
        }
        const upper: typeof points = [];
        for (const p of sorted.reverse()) {
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
            upper.push(p);
        }
        return [...lower.slice(0, -1), ...upper.slice(0, -1)];
    };

    // Cluster hulls
    const clusterHulls: { points: string; isPoisonCluster: boolean; clusterId: number }[] = [];
    if (defenseType === 'ragDefender' || defenseType === 'ensemble') {
        const clusterMap = new Map<number, Document[]>();
        documents.forEach(d => {
            if (d.clusterId !== undefined) {
                const arr = clusterMap.get(d.clusterId) || [];
                arr.push(d);
                clusterMap.set(d.clusterId, arr);
            }
        });
        clusterMap.forEach((members, cid) => {
            if (members.length >= 2) {
                const screenPoints = members.map(d => ({ x: scaleX(d.embedding?.x || 0), y: scaleY(d.embedding?.y || 0) }));
                const hull = computeHull(screenPoints);
                // Add padding
                const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
                const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
                const padded = hull.map(p => ({
                    x: p.x + (p.x - cx) * 0.3,
                    y: p.y + (p.y - cy) * 0.3,
                }));
                const isPoisonCluster = members.filter(d => d.isPoisoned).length > members.length * 0.5;
                clusterHulls.push({
                    points: padded.map(p => `${p.x},${p.y}`).join(" "),
                    isPoisonCluster,
                    clusterId: cid,
                });
            }
        });
    }

    // Heatmap (similarity gradient from query)
    const qx = scaleX(0);
    const qy = scaleY(0);

    // Top K by score
    const sortedByScore = [...documents].sort((a, b) => b.score - a.score);
    const top5Ids = sortedByScore.slice(0, 5).map(d => d.id);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[350px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner font-sans select-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)",
                    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                    backgroundPosition: `${pan.x}px ${pan.y}px`,
                }}
            />

            {/* Heatmap gradient */}
            {showQuery && (
                <div
                    className="absolute rounded-full pointer-events-none opacity-10"
                    style={{
                        left: qx, top: qy,
                        width: 300 * zoom, height: 300 * zoom,
                        transform: "translate(-50%, -50%)",
                        background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
                    }}
                />
            )}

            {/* SVG Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* Radial sweep during scanning */}
                {showQuery && scanState === 'scanning' && (
                    <g>
                        <line
                            x1={qx} y1={qy}
                            x2={qx + Math.cos(sweepAngle * Math.PI / 180) * 200 * zoom}
                            y2={qy + Math.sin(sweepAngle * Math.PI / 180) * 200 * zoom}
                            stroke="#6366f1" strokeWidth="1.5" opacity="0.4"
                        />
                        <circle cx={qx} cy={qy} r={80 * zoom} fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.2" className="animate-pulse" />
                        <circle cx={qx} cy={qy} r={140 * zoom} fill="none" stroke="#6366f1" strokeWidth="0.5" opacity="0.1" />
                    </g>
                )}

                {/* Retrieval lines */}
                {showQuery && (scanState === 'selecting' || scanState === 'done') && documents.map(doc => {
                    const isTop = top5Ids.includes(doc.id);
                    if (!isTop) return null;
                    const x = scaleX(doc.embedding?.x || 0);
                    const y = scaleY(doc.embedding?.y || 0);
                    return (
                        <line key={doc.id} x1={qx} y1={qy} x2={x} y2={y}
                            stroke={doc.isPoisoned ? "#ef4444" : "#10b981"} strokeWidth="2" opacity="0.5"
                            strokeDasharray={doc.isPoisoned ? "4 2" : "none"}
                            className="transition-all duration-500"
                        />
                    );
                })}

                {/* Cluster hulls */}
                {clusterHulls.map((hull, i) => (
                    <polygon
                        key={i}
                        points={hull.points}
                        fill={hull.isPoisonCluster ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.06)"}
                        stroke={hull.isPoisonCluster ? "#ef4444" : "#6366f1"}
                        strokeWidth="1.5"
                        strokeDasharray={hull.isPoisonCluster ? "6 3" : "3 3"}
                        opacity="0.7"
                    />
                ))}
            </svg>

            {/* Query Point */}
            {showQuery && (
                <div
                    className="absolute z-50 flex flex-col items-center transition-all duration-500"
                    style={{ left: qx, top: qy, transform: "translate(-50%, -50%)" }}
                >
                    <div className="relative">
                        <Target className={cn("w-6 h-6 text-indigo-600", scanState === 'scanning' ? "animate-spin" : "")} />
                        {scanState === 'scanning' && <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20" />}
                    </div>
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-700 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-indigo-100 whitespace-nowrap">
                        {scanState === 'scanning' ? "Scanning..." : scanState === 'selecting' ? "Selecting Top-K..." : "User Query"}
                    </span>
                </div>
            )}

            {/* Document dots */}
            {documents.map((doc) => {
                const isNoise = doc.topic === "other";
                const isHighlighted = highlightedIds.includes(doc.id);
                const isPoisoned = doc.isPoisoned;
                const isSelected = showQuery && top5Ids.includes(doc.id) && (scanState === 'selecting' || scanState === 'done');
                const x = scaleX(doc.embedding?.x || 0);
                const y = scaleY(doc.embedding?.y || 0);
                const isHovered = hoveredDoc?.id === doc.id;

                return (
                    <div
                        key={doc.id}
                        className={cn(
                            "absolute rounded-full border transition-all duration-300 cursor-pointer group",
                            isNoise ? "bg-slate-400 border-slate-500 opacity-50 hover:opacity-100 z-0" : "z-10",
                            isSelected ? "w-4 h-4 z-20 ring-2" : (isNoise ? "w-2 h-2 hover:w-3 hover:h-3" : "w-3 h-3 hover:scale-150"),
                            isSelected && isPoisoned ? "bg-red-400 border-red-600 ring-red-200" :
                            isSelected ? "bg-emerald-400 border-emerald-600 ring-emerald-200" :
                            !isNoise && isPoisoned ? (isHighlighted ? "bg-red-500 border-red-300" : "bg-red-200 border-red-400") :
                            !isNoise ? (isHighlighted ? "bg-indigo-500 border-indigo-300" : "bg-slate-300 border-slate-400 hover:bg-indigo-400") : ""
                        )}
                        style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => { setHoveredDoc(doc); onHover?.(doc); }}
                        onMouseLeave={() => { setHoveredDoc(null); onHover?.(null); }}
                    >
                        {isSelected && (
                            <div className={cn(
                                "absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[8px] px-1 rounded opacity-0 animate-in fade-in zoom-in duration-300 fill-mode-forwards",
                                isPoisoned ? "bg-red-600" : "bg-emerald-600"
                            )} style={{ animationDelay: '500ms' }}>
                                {isPoisoned ? "POISON" : "MATCH"}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Tooltip */}
            {hoveredDoc && (
                <div
                    className="absolute z-[60] min-w-[180px] max-w-[220px] p-3 bg-white border border-slate-200 rounded-lg shadow-xl text-[10px] pointer-events-none"
                    style={{
                        left: Math.min(scaleX(hoveredDoc.embedding?.x || 0) + 12, 280),
                        top: Math.max(scaleY(hoveredDoc.embedding?.y || 0) - 30, 10),
                    }}
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{hoveredDoc.topic === "other" ? "Irrelevant" : hoveredDoc.id}</span>
                        {hoveredDoc.isPoisoned && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-bold">POISON</span>}
                    </div>
                    <p className="text-slate-500 line-clamp-3 italic leading-tight mb-1.5">{hoveredDoc.content}</p>
                    <div className="flex gap-3 text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-1">
                        <span>Score: {hoveredDoc.score.toFixed(3)}</span>
                        {hoveredDoc.source && <span>Src: {hoveredDoc.source}</span>}
                        {hoveredDoc.clusterId !== undefined && <span>C#{hoveredDoc.clusterId}</span>}
                    </div>
                </div>
            )}

            {/* Cluster hull labels */}
            {clusterHulls.map((hull, i) => {
                const pts = hull.points.split(" ").map(p => { const [x, y] = p.split(","); return { x: +x, y: +y }; });
                const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
                const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
                return (
                    <span key={`label-${i}`} className={cn(
                        "absolute z-40 text-[8px] px-1.5 py-0.5 rounded font-bold border whitespace-nowrap pointer-events-none",
                        hull.isPoisonCluster ? "bg-red-100 text-red-600 border-red-200" : "bg-indigo-50 text-indigo-600 border-indigo-200"
                    )} style={{ left: cx, top: cy - 10, transform: "translate(-50%, -50%)" }}>
                        {hull.isPoisonCluster ? "Adversarial Cluster" : `Cluster ${hull.clusterId}`}
                    </span>
                );
            })}

            {/* Zoom controls */}
            <div className="absolute bottom-2 left-2 flex gap-1 z-50">
                <button onClick={handleZoomIn} className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                    <ZoomIn className="w-3 h-3 text-slate-500" />
                </button>
                <button onClick={handleZoomOut} className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                    <ZoomOut className="w-3 h-3 text-slate-500" />
                </button>
                <button onClick={handleReset} className="w-6 h-6 bg-white border border-slate-200 rounded flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                    <Maximize2 className="w-3 h-3 text-slate-500" />
                </button>
            </div>

            {/* Status overlay */}
            {showQuery && (
                <div className="absolute top-2 right-2 bg-white/90 border border-slate-200 p-2 rounded-lg shadow-sm text-[10px] text-slate-600 font-mono w-40 z-50">
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
                            scanState === 'idle' ? "w-0" : scanState === 'scanning' ? "w-1/2" : "w-full"
                        )} />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-slate-400">
                        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
                        <span>Shift+drag to pan</span>
                    </div>
                </div>
            )}
        </div>
    );
};
