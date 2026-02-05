"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Controls } from "@/components/Controls";
import { ClusterMap } from "@/components/ClusterMap";
import { DocumentList } from "@/components/DocumentList";
import { ScenarioGuide, Scenario } from "@/components/ScenarioGuide";
import { InfoCard } from "@/components/InfoCard";
import {
  AttackConfig,
  DefenseType,
  runPipeline,
  TOPICS,
  Document
} from "@/lib/rag-engine";
import { ArrowRight, Database, Search, ShieldCheck, BrainCircuit, Terminal, Shield, ShieldAlert, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsensusVisualizer } from "@/components/ConsensusVisualizer";
import { InspectionVisualizer } from "@/components/InspectionVisualizer";
import { RetrievalPoisoningVisualizer } from "@/components/RetrievalPoisoningVisualizer";
import { PromptInjectionVisualizer } from "@/components/PromptInjectionVisualizer";
import { PromptAugmentationVisualizer } from "@/components/PromptAugmentationVisualizer";

export default function Home() {
  // --- State ---
  const [topic, setTopic] = useState<keyof typeof TOPICS>("french-capital");
  const [attackConfig, setAttackConfig] = useState<AttackConfig>({
    poisoningRatio: 0.0,
    attackType: "conflict",
    promptInjection: ""
  });
  const [defenseType, setDefenseType] = useState<DefenseType>("none");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scenario, setScenario] = useState<Scenario | null>("basics");
  const [activeStep, setActiveStep] = useState<'kb' | 'retriever' | 'defense' | 'generator'>('kb');

  // Hydration Fix: Documents must be generated on client to match
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [retrievedDocs, setRetrievedDocs] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [answer, setAnswer] = useState<string>("Loading...");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [logs, setLogs] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const fetchData = async () => {
      setAnswer("Processing...");
      try {
        const data = await runPipeline(topic, attackConfig, defenseType);
        setAllDocs(data.allDocs);
        setRetrievedDocs(data.retrievedDocs);
        setFilteredDocs(data.filteredDocs);
        setAnswer(data.answer);
        setLogs(data.logs);
      } catch {
        setAnswer("Error.");
      }
    };

    fetchData();
  }, [topic, attackConfig, defenseType]);

  // Derived state (no longer calculating logic here)
  // const logs = []; // Logs are now from backend

  // Handle Scenario Change
  const applyScenario = (newAttack: AttackConfig, newDefense: DefenseType) => {
    setAttackConfig(newAttack);
    setDefenseType(newDefense);
    if (newAttack.attackType === 'conflict') setActiveStep('kb'); // Default to KB for basics/attack
    if (newDefense !== 'none') setActiveStep('defense'); // Jump to defense if activated
  };

  // Handle Attack Change with Defense Reset
  const handleAttackChange = (newConfig: AttackConfig) => {
    // Only reset scenario if the actual ATTACK TYPE changes, not just corpus counts
    if (newConfig.attackType !== attackConfig.attackType) {
      setScenario(null);
    }
    setAttackConfig(newConfig);

    // Auto-reset defense if incompatible
    const isPrompt = newConfig.attackType === 'prompt-injection';
    const isRetrieval = newConfig.attackType === 'retrieval-poisoning';

    if ((isPrompt || isRetrieval) && defenseType !== 'none' && defenseType !== 'llamaGuard') {
      setDefenseType('none');
    }
  };

  if (!isClient) return null; // Prevent hydration mismatch

  // --- Render ---
  return (
    <main className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar - Wider */}
      <div className="w-[400px] border-r border-slate-200 bg-white flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            RAG Safety Playground
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-serif italic">
            &quot;Visualizing RAG Security: Basics, Attacks, and Defenses&quot;
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <ScenarioGuide
            currentScenario={scenario}
            onApply={applyScenario}
            setScenario={setScenario}
          />

          <div className="border-t border-slate-100 pt-4">
            <details className="group" open>
              <summary className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 cursor-pointer list-none flex items-center gap-2 hover:text-slate-600">
                <span>Manual Controls</span>
                <span className="text-[10px] bg-slate-100 px-1 rounded group-open:hidden">+</span>
                <span className="text-[10px] bg-slate-100 px-1 rounded hidden group-open:inline">-</span>
              </summary>
              <div className="pt-2">
                <Controls
                  topic={topic}
                  setTopic={setTopic}
                  attackConfig={attackConfig}
                  setAttackConfig={handleAttackChange}
                  defenseType={defenseType}
                  setDefenseType={(d) => { setDefenseType(d); setScenario(null); }}
                  scenario={scenario}
                />
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-lg font-serif font-semibold text-slate-800">
            Experiment Dashboard
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
            <Database className="w-3 h-3" />
            <span>Pool: {allDocs.length} Docs</span>
            <span className="text-slate-300">|</span>
            <span>Model: GPT-4-Sim</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">

          {/* Pipeline Diagram (Academic Style) */}
          <div className="max-w-5xl mx-auto mb-12">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> System Architecture (Click to Inspect)
            </h3>

            <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-8 min-h-[200px] flex items-center justify-between gap-4">

              {/* Step 1: KB */}
              <button
                onClick={() => setActiveStep('kb')}
                className={cn(
                  "flex flex-col items-center gap-3 relative group w-1/4 transition-transform hover:scale-105",
                  activeStep === 'kb' ? "opacity-100" : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-lg border-2 flex items-center justify-center bg-slate-50 transition-colors relative",
                  attackConfig.poisoningRatio > 0 ? "border-red-400 bg-red-50" : "border-slate-300",
                  activeStep === 'kb' ? "ring-4 ring-indigo-100 border-indigo-500" : ""
                )}>
                  <Database className={cn("w-8 h-8", attackConfig.poisoningRatio > 0 ? "text-red-500" : "text-slate-600")} />
                  {/* Attack Indicator */}
                  {scenario === 'attack' && (
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-white animate-bounce">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <span className="font-serif font-bold text-sm text-slate-700">Knowledge Base</span>
                <span className="text-[10px] text-center text-slate-500 px-2 leading-tight">
                  Corpus injected with <br /> adversarial passages
                </span>
              </button>

              <ArrowRight className={cn("w-6 h-6 transition-colors", activeStep === 'kb' ? "text-indigo-400" : "text-slate-300")} />

              {/* Step 2: Retriever */}
              <button
                onClick={() => setActiveStep('retriever')}
                className={cn(
                  "flex flex-col items-center gap-3 relative group w-1/4 transition-transform hover:scale-105",
                  activeStep === 'retriever' ? "opacity-100" : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-lg border-2 border-slate-300 flex items-center justify-center bg-slate-50 relative",
                  activeStep === 'retriever' ? "ring-4 ring-indigo-100 border-indigo-500" : ""
                )}>
                  <Search className="w-8 h-8 text-slate-600" />
                  {scenario === 'attack' && (
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white border-2 border-white animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <span className="font-serif font-bold text-sm text-slate-700">Retriever</span>
                <span className="text-[10px] text-center text-slate-500 px-2 leading-tight">
                  Dense Passage Retrieval <br /> (Top-K Selection)
                </span>
              </button>

              <ArrowRight className={cn("w-6 h-6 transition-colors", activeStep === 'retriever' ? "text-indigo-400" : "text-slate-300")} />

              {/* Step 3: Defense Middleware */}
              <button
                onClick={() => setActiveStep('defense')}
                className={cn(
                  "flex flex-col items-center gap-3 relative group w-1/4 transition-transform hover:scale-105",
                  activeStep === 'defense' ? "opacity-100" : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all",
                  defenseType !== 'none' ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50",
                  activeStep === 'defense' ? "ring-4 ring-indigo-100 border-indigo-500" : ""
                )}>
                  {defenseType === 'ragDefender' ? <BrainCircuit className="w-8 h-8 text-blue-600" /> :
                    defenseType === 'robustRag' ? <ShieldCheck className="w-8 h-8 text-blue-600" /> :
                      defenseType === 'discern' ? <Sparkles className="w-8 h-8 text-blue-600" /> :
                        defenseType === 'paraphrase' ? <Shield className="w-8 h-8 text-blue-600" /> :
                          defenseType === 'llamaGuard' ? <ShieldAlert className="w-8 h-8 text-blue-600" /> :
                            <BrainCircuit className="w-8 h-8 text-slate-400" />}
                </div>
                <span className="font-serif font-bold text-sm text-slate-700">
                  {defenseType === 'none' ? "Prompting" :
                    defenseType === 'robustRag' ? "RobustRAG" :
                      defenseType === 'discern' ? "Discern-and-Answer" :
                        defenseType === 'ragDefender' ? "RAGDefender" :
                          defenseType === 'paraphrase' ? "Paraphrase" :
                            defenseType === 'llamaGuard' ? "LlamaGuard" : defenseType}
                </span>
                <span className="text-[10px] text-center text-slate-500 px-2 leading-tight">
                  {defenseType === 'ragDefender' ? "Cluster-based Filtering" :
                    defenseType === 'robustRag' ? "Passage Inspection" :
                      defenseType === 'discern' ? "Generative Consensus" :
                        defenseType === 'paraphrase' ? "Input Sanitization" :
                          defenseType === 'llamaGuard' ? "Guardrail System" :
                            "Context Integration"}
                </span>
              </button>

              <ArrowRight className={cn("w-6 h-6 transition-colors", activeStep === 'defense' ? "text-indigo-400" : "text-slate-300")} />

              {/* Step 4: Generator */}
              <button
                onClick={() => setActiveStep('generator')}
                className={cn(
                  "flex flex-col items-center gap-3 relative group w-1/4 transition-transform hover:scale-105",
                  activeStep === 'generator' ? "opacity-100" : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-lg border-2 border-slate-300 flex items-center justify-center bg-slate-50 relative",
                  activeStep === 'generator' ? "ring-4 ring-indigo-100 border-indigo-500" : ""
                )}>
                  <Terminal className="w-8 h-8 text-slate-600" />
                  {scenario === 'attack' && (
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                      <AlertTriangle className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <span className="font-serif font-bold text-sm text-slate-700">LLM Generator</span>
                <span className="text-[10px] text-center text-slate-500 px-2 leading-tight">
                  Context-Aware <br /> Text Synthesis
                </span>
              </button>

            </div>
          </div>

          {/* Visualization Grid */}
          <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Left: 3D Cluster Interaction */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h4 className="font-serif font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <span>
                    {activeStep === 'kb' ? "Knowledge Base Overview" :
                      activeStep === 'retriever' ? "Retriever Scanning" :
                        activeStep === 'defense' ? (defenseType === 'none' ? "Prompt Assembly" : "Defense Inspection") : "Embedding Space"}
                  </span>
                  <span className="text-[10px] font-sans font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded">2D Projection</span>
                </h4>
                <div className="flex justify-center py-4">
                  {/* Reuse ClusterMap for KB, Retriever, Defense steps */}
                  <ClusterMap
                    documents={
                      (activeStep === 'defense' || activeStep === 'generator')
                        ? [...filteredDocs, ...allDocs.filter(doc => !filteredDocs.some(f => f.id === doc.id))]
                        : allDocs
                    }
                    highlightedIds={activeStep === 'retriever' ? retrievedDocs.map(d => d.id) : []}
                    defenseType={activeStep === 'defense' ? defenseType : undefined}
                    showQuery={activeStep === 'retriever' || activeStep === 'defense'}
                  />
                </div>
                <div className="text-center mt-4 text-xs text-slate-400 italic">
                  {activeStep === 'kb' && "The 'Sea of Documents' before retrieval."}
                  {activeStep === 'retriever' && "Scanning for nearest neighbors (Cosine Similarity)..."}
                  {activeStep === 'defense' && "Isolating clusters or filtering documents..."}
                </div>
              </div>

              {/* Simple Output Box (Hidden unless in Generator step) */}
              {(activeStep === 'generator') && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-sm text-slate-300">
                  <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 mb-2">
                    <Terminal className="w-3 h-3" /> Model Output
                  </h4>
                  <div className="font-mono text-xs leading-relaxed">
                    <p className="mb-1 text-green-400">User: {TOPICS[topic]}</p>
                    <p className={cn(answer.includes("Incorrect") ? "text-red-400" : "text-white")}>
                      AI: {answer}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Outputs & Analysis */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">

              {/* Dynamic Component Switching based on Active Step */}
              {activeStep === 'generator' ? (
                /* Generator Step View */
                <div className="flex flex-col gap-6">
                  {/* 1. Final Prompt Display */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 opacity-75 hover:opacity-100 transition-opacity">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-600" /> Final Prompt (Sent to LLM)
                    </h3>
                    <div className="bg-slate-50 p-4 rounded border border-slate-200 text-[10px] font-mono text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      <span className="font-bold text-slate-400">SYSTEM:</span> You are a helpful assistant. Answer based on context.<br />
                      <span className="font-bold text-indigo-500">USER:</span> {TOPICS[topic]}
                      {attackConfig.attackType === 'prompt-injection' && attackConfig.promptInjection && (
                        <span className="text-red-500 font-bold ml-1">
                          {attackConfig.promptInjection}
                        </span>
                      )}<br />
                      <span className="font-bold text-slate-400">CONTEXT:</span><br />
                      {filteredDocs.slice(0, 5).map((d, i) => (
                        <span key={i} className={cn(d.isPoisoned ? "text-red-600" : "text-slate-600")}>
                          [{i + 1}] {d.content}<br />
                        </span>
                      ))}
                    </div>
                  </div>

                  <ArrowRight className="w-8 h-8 text-slate-300 mx-auto rotate-90 lg:rotate-0" />

                  {/* 2. Model Output */}
                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Generated Answer
                    </h3>
                    <p className="text-lg text-white font-serif leading-relaxed">
                      {answer}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono mt-2 border-t border-slate-800 pt-2">
                      Latency: 624ms | Model: GPT-4-Simulated
                    </div>
                  </div>
                </div>
              ) : activeStep === 'defense' && defenseType === 'none' ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <PromptAugmentationVisualizer topic={TOPICS[topic]} documents={retrievedDocs} attackConfig={attackConfig} />
                </div>
              ) : activeStep === 'defense' && defenseType === 'robustRag' ? (
                /* Special Defense View (RobustRAG) */
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <InspectionVisualizer documents={retrievedDocs} />
                </div>
              ) : activeStep === 'defense' && defenseType === 'discern' ? (
                /* Special Defense View (Discern) */
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <ConsensusVisualizer documents={retrievedDocs} />
                </div>
              ) : activeStep === 'defense' && defenseType === 'paraphrase' ? (
                /* Paraphrase Defense View - Shows FILTERED/MODIFIED docs */
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <PromptAugmentationVisualizer topic={TOPICS[topic]} documents={filteredDocs} attackConfig={attackConfig} />
                </div>
              ) : (
                /* Default / KB / Retriever View */
                <div className="max-h-[600px] flex flex-col">
                  <DocumentList
                    documents={activeStep === 'kb' ? allDocs : (activeStep === 'retriever' ? retrievedDocs : filteredDocs)}
                    title={activeStep === 'kb' ? "All Documents (Knowledge Base)" : "Passed to Generator"}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
