import { Document, AttackConfig } from '@/lib/rag-engine';
import { cn } from '@/lib/utils';
import { FileText, Plus, ArrowDown, Sparkles } from 'lucide-react';

interface PromptAugmentationVisualizerProps {
    topic: string;
    documents: Document[];
    attackConfig?: AttackConfig;
}

export const PromptAugmentationVisualizer: React.FC<PromptAugmentationVisualizerProps> = ({
    topic,
    documents,
    attackConfig
}) => {
    // Top 5 docs are used for context
    const contextDocs = documents.slice(0, 5);

    return (
        <div className="flex flex-col gap-6 p-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Prompt Construction
            </h3>

            <div className="flex flex-col gap-2 relative">
                {/* 1. System Prompt */}
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-xs font-mono relative z-10">
                    <span className="text-slate-500 block mb-1 font-bold">SYSTEM_PROMPT</span>
                    "You are a helpful AI assistant. Answer the user question based ONLY on the provided context."
                </div>

                <div className="flex justify-center text-slate-300"><Plus className="w-4 h-4" /></div>

                {/* 2. Context (Augmentation) */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 relative z-10 shadow-sm">
                    <span className="text-indigo-500 block mb-2 font-bold text-xs uppercase tracking-wide">
                        <FileText className="w-3 h-3 inline mr-1" />
                        Retrieved Context (Injected)
                    </span>
                    <div className="space-y-2">
                        {contextDocs.map((doc, i) => (
                            <div key={i} className={cn(
                                "text-[10px] p-2 rounded border bg-white font-mono leading-tight",
                                doc.isPoisoned ? "border-red-200 text-red-700 bg-red-50" : "border-slate-200 text-slate-600"
                            )}>
                                <span className="font-bold mr-2">[{i + 1}]</span>
                                {doc.content}
                            </div>
                        ))}
                        {contextDocs.length === 0 && <span className="text-slate-400 italic text-xs">No context retrieved...</span>}
                    </div>
                </div>

                <div className="flex justify-center text-slate-300"><Plus className="w-4 h-4" /></div>

                {/* 3. User Query */}
                <div className="bg-white border-2 border-slate-800 rounded-lg p-3 text-xs font-bold text-slate-800 relative z-10 shadow-md">
                    <span className="text-slate-400 block mb-1 font-normal font-mono text-[10px]">USER_QUERY</span>
                    "{topic}"
                    {attackConfig?.attackType === 'prompt-injection' && attackConfig.promptInjection && (
                        <span className="text-red-500 ml-1 bg-red-50 px-1 rounded">
                            {attackConfig.promptInjection}
                        </span>
                    )}
                </div>

                {/* Arrow to Next Step */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 translate-y-2 text-slate-300">
                    <ArrowDown className="w-6 h-6 animate-bounce" />
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 italic mt-4">
                The Retriever's output is "Augmented" into the prompt before sending to the LLM.
            </p>
        </div>
    );
};
