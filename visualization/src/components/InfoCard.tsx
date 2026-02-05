"use client";

import React, { useState } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    className?: string; // Positioning classes
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, children, className }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("absolute z-20", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors shadow-sm border",
                    isOpen ? "bg-white text-slate-900 border-slate-300" : "bg-white/80 text-slate-500 border-slate-200 hover:bg-white"
                )}
            >
                <Info className="w-3 h-3" />
                {title}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 p-4 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 text-left z-50">
                    <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-slate-900 font-serif">{title}</h4>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-serif">
                        {children}
                    </p>
                </div>
            )}
        </div>
    );
};
