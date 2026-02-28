"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Controls } from "@/components/Controls";
import { ClusterMap } from "@/components/ClusterMap";
import { DocumentList } from "@/components/DocumentList";
import { ScenarioGuide, Scenario } from "@/components/ScenarioGuide";
import {
  AttackConfig,
  DefenseType,
  runPipeline,
  TOPICS,
  Document,
  AttackMetrics,
  DefenseLog,
  DefenseStep,
  DEFENSE_LABELS,
  ATTACK_LABELS,
} from "@/lib/rag-engine";
import { ArrowRight, Database, Search, ShieldCheck, BrainCircuit, Terminal, Shield, ShieldAlert, AlertTriangle, Sparkles, Sun, Moon, Download, HelpCircle, Menu, X, Columns2, BarChart3, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsensusVisualizer } from "@/components/ConsensusVisualizer";
import { InspectionVisualizer } from "@/components/InspectionVisualizer";
import { PromptAugmentationVisualizer } from "@/components/PromptAugmentationVisualizer";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { DefenseComparisonPanel } from "@/components/DefenseComparisonPanel";
import { DefenseRadarChart } from "@/components/DefenseRadarChart";
import { DefenseLogPanel } from "@/components/DefenseLogPanel";
import { DefenseWalkthrough } from "@/components/DefenseWalkthrough";
import { BeforeAfterView } from "@/components/BeforeAfterView";
import { TutorialOverlay } from "@/components/TutorialOverlay";

type ViewTab = "pipeline" | "showdown" | "compare";

export default function Home() {
  // State
  const [topic, setTopic] = useState<keyof typeof TOPICS>("french-capital");
  const [attackConfig, setAttackConfig] = useState<AttackConfig>({
    poisoningRatio: 0.0,
    attackType: "conflict",
    promptInjection: "",
    attackStrength: 0.5,
  });
  const [defenseType, setDefenseType] = useState<DefenseType>("none");
  const [scenario, setScenario] = useState<Scenario | null>("basics");
  const [activeStep, setActiveStep] = useState<'kb' | 'retriever' | 'defense' | 'generator'>('kb');

  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [retrievedDocs, setRetrievedDocs] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [answer, setAnswer] = useState<string>("Loading...");
  const [logs, setLogs] = useState<string[]>([]);
  const [defenseLogs, setDefenseLogs] = useState<DefenseLog[]>([]);
  const [metrics, setMetrics] = useState<AttackMetrics | null>(null);
  const [latency, setLatency] = useState<{ retrieval: number; defense: number; generation: number; total: number } | null>(null);
  const [defenseSteps, setDefenseSteps] = useState<DefenseStep[]>([]);
  const [isClient, setIsClient] = useState(false);

  // UI state
  const [darkMode, setDarkMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("pipeline");

  // URL state sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('topic')) setTopic(params.get('topic') as keyof typeof TOPICS);
    if (params.get('attack')) setAttackConfig(prev => ({ ...prev, attackType: params.get('attack') as AttackConfig['attackType'] }));
    if (params.get('defense')) setDefenseType(params.get('defense') as DefenseType);
    if (params.get('ratio')) setAttackConfig(prev => ({ ...prev, poisoningRatio: parseFloat(params.get('ratio')!) }));
    if (params.get('scenario')) {
      const s = params.get('scenario') as Scenario;
      setScenario(s);
      if (s === 'showdown') setActiveTab('showdown');
    }

    // Show tutorial on first visit
    if (!localStorage.getItem('rag-tutorial-seen')) {
      setShowTutorial(true);
      localStorage.setItem('rag-tutorial-seen', 'true');
    }
  }, []);

  // Update URL
  const updateUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('topic', topic);
    params.set('attack', attackConfig.attackType);
    params.set('defense', defenseType);
    params.set('ratio', String(attackConfig.poisoningRatio));
    if (scenario) params.set('scenario', scenario);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, [topic, attackConfig, defenseType, scenario]);

  useEffect(() => { if (isClient) updateUrl(); }, [updateUrl, isClient]);

  // Pipeline execution
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
        setDefenseLogs(data.defenseLogs);
        setMetrics(data.metrics);
        setLatency(data.latency);
        setDefenseSteps(data.defenseSteps || []);
      } catch {
        setAnswer("Error.");
      }
    };

    fetchData();
  }, [topic, attackConfig, defenseType]);

  // Scenario handling
  const applyScenario = (newAttack: AttackConfig, newDefense: DefenseType) => {
    setAttackConfig(newAttack);
    setDefenseType(newDefense);
    if (newAttack.attackType === 'conflict') setActiveStep('kb');
    if (newDefense !== 'none') setActiveStep('defense');
  };

  const handleAttackChange = (newConfig: AttackConfig) => {
    if (newConfig.attackType !== attackConfig.attackType) setScenario(null);
    setAttackConfig(newConfig);

    const isPrompt = newConfig.attackType === 'prompt-injection';
    const isRetrieval = newConfig.attackType === 'retrieval-poisoning';
    if ((isPrompt || isRetrieval) && defenseType !== 'none' && defenseType !== 'llamaGuard' && defenseType !== 'ensemble') {
      setDefenseType('none');
    }
  };

  const handleScenarioChange = (s: Scenario) => {
    setScenario(s);
    if (s === 'showdown') setActiveTab('showdown');
    else setActiveTab('pipeline');
  };

  // Export
  const handleExport = () => {
    const data = {
      topic, attackConfig, defenseType, answer, metrics, latency,
      retrievedDocs: retrievedDocs.map(d => ({ id: d.id, content: d.content, isPoisoned: d.isPoisoned, score: d.score })),
      filteredDocs: filteredDocs.map(d => ({ id: d.id, content: d.content, isPoisoned: d.isPoisoned, score: d.score })),
      logs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-experiment-${topic}-${attackConfig.attackType}-${defenseType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isClient) return null;

  const themeClass = darkMode ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900";
  const cardClass = darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200";

  return (
    <main className={cn("flex h-screen font-sans transition-colors duration-300", themeClass)}>
      {/* Tutorial */}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "border-r flex flex-col shadow-sm z-20 transition-all duration-300",
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
        sidebarOpen ? "w-[380px]" : "w-0 overflow-hidden",
        "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40"
      )}>
        <div className={cn("p-5 border-b", darkMode ? "border-slate-700" : "border-slate-100")}>
          <h2 className={cn("text-lg font-serif font-bold tracking-tight flex items-center gap-2", darkMode ? "text-white" : "text-slate-900")}>
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            RAG Safety Playground
          </h2>
          <p className={cn("text-[10px] mt-1 font-serif italic", darkMode ? "text-slate-400" : "text-slate-500")}>
            &quot;Visualizing RAG Security: Attacks &amp; Defenses&quot;
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <ScenarioGuide
            currentScenario={scenario}
            onApply={applyScenario}
            setScenario={handleScenarioChange}
          />

          <div className={cn("border-t pt-4", darkMode ? "border-slate-700" : "border-slate-100")}>
            <details className="group" open>
              <summary className={cn("text-xs font-bold uppercase tracking-wider mb-2 px-2 cursor-pointer list-none flex items-center gap-2 hover:text-slate-600", darkMode ? "text-slate-500" : "text-slate-400")}>
                <span>Manual Controls</span>
                <span className={cn("text-[10px] px-1 rounded group-open:hidden", darkMode ? "bg-slate-700" : "bg-slate-100")}>+</span>
                <span className={cn("text-[10px] px-1 rounded hidden group-open:inline", darkMode ? "bg-slate-700" : "bg-slate-100")}>-</span>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={cn("h-14 border-b flex items-center justify-between px-6 shadow-sm shrink-0", darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
          <div className="flex items-center gap-4">
            <h1 className={cn("text-base font-serif font-semibold hidden sm:block", darkMode ? "text-slate-200" : "text-slate-800")}>
              Experiment Dashboard
            </h1>
            {/* Tab switcher */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              {([
                { id: "pipeline", label: "Pipeline", icon: Terminal },
                { id: "showdown", label: "Showdown", icon: Swords },
                { id: "compare", label: "Compare", icon: Columns2 },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all",
                    activeTab === tab.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn("hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-md border", darkMode ? "bg-slate-700 border-slate-600 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500")}>
              <Database className="w-3 h-3" />
              <span>{allDocs.length} Docs</span>
              <span className="text-slate-300">|</span>
              <span>{ATTACK_LABELS[attackConfig.attackType]}</span>
              <span className="text-slate-300">|</span>
              <span>{DEFENSE_LABELS[defenseType]}</span>
            </div>

            <button onClick={handleExport} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Export results as JSON">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Toggle theme">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowTutorial(true)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Tutorial">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "pipeline" && (
            <PipelineView
              topic={topic}
              attackConfig={attackConfig}
              defenseType={defenseType}
              scenario={scenario}
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              allDocs={allDocs}
              retrievedDocs={retrievedDocs}
              filteredDocs={filteredDocs}
              answer={answer}
              logs={logs}
              defenseLogs={defenseLogs}
              metrics={metrics}
              latency={latency}
              defenseSteps={defenseSteps}
              darkMode={darkMode}
              cardClass={cardClass}
            />
          )}

          {activeTab === "showdown" && (
            <ShowdownView
              topic={topic}
              attackConfig={attackConfig}
              cardClass={cardClass}
            />
          )}

          {activeTab === "compare" && (
            <CompareView
              topic={topic}
              attackConfig={attackConfig}
              defenseType={defenseType}
              cardClass={cardClass}
            />
          )}
        </div>
      </div>
    </main>
  );
}

// ---- Pipeline View ----
function PipelineView({
  topic, attackConfig, defenseType, scenario, activeStep, setActiveStep,
  allDocs, retrievedDocs, filteredDocs, answer, logs, defenseLogs, metrics, latency, defenseSteps,
  darkMode, cardClass,
}: {
  topic: keyof typeof TOPICS;
  attackConfig: AttackConfig;
  defenseType: DefenseType;
  scenario: Scenario | null;
  activeStep: 'kb' | 'retriever' | 'defense' | 'generator';
  setActiveStep: (s: 'kb' | 'retriever' | 'defense' | 'generator') => void;
  allDocs: Document[];
  retrievedDocs: Document[];
  filteredDocs: Document[];
  answer: string;
  logs: string[];
  defenseLogs: DefenseLog[];
  metrics: AttackMetrics | null;
  latency: { retrieval: number; defense: number; generation: number; total: number } | null;
  defenseSteps: DefenseStep[];
  darkMode: boolean;
  cardClass: string;
}) {
  const steps = [
    { id: 'kb' as const, label: 'Knowledge Base', sub: 'Adversarial Corpus', icon: Database, hasAttack: attackConfig.poisoningRatio > 0 },
    { id: 'retriever' as const, label: 'Retriever', sub: 'Dense Passage (Top-K)', icon: Search, hasAttack: attackConfig.poisoningRatio > 0 },
    { id: 'defense' as const, label: defenseType === 'none' ? 'Prompting' : DEFENSE_LABELS[defenseType], sub: defenseType === 'none' ? 'Context Integration' : 'Active Filtering', icon: defenseType === 'ragDefender' ? BrainCircuit : defenseType === 'robustRag' ? ShieldCheck : defenseType === 'ensemble' ? Shield : ShieldAlert, hasAttack: false },
    { id: 'generator' as const, label: 'LLM Generator', sub: 'Text Synthesis', icon: Terminal, hasAttack: false },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Pipeline Diagram */}
      <div>
        <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2", darkMode ? "text-slate-500" : "text-slate-500")}>
          <Terminal className="w-3.5 h-3.5" /> System Architecture (Click to Inspect)
        </h3>

        <div className={cn("relative rounded-xl border shadow-sm p-6 flex items-center justify-between gap-2", cardClass)}>
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex flex-col items-center gap-2 relative group w-1/4 transition-transform hover:scale-105",
                  activeStep === step.id ? "opacity-100" : "opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-lg border-2 flex items-center justify-center relative transition-colors",
                  step.id === 'defense' ? "rounded-full border-dashed" : "",
                  step.hasAttack && scenario !== 'basics' ? "border-red-400 bg-red-50" :
                  defenseType !== 'none' && step.id === 'defense' ? "border-blue-500 bg-blue-50" :
                  darkMode ? "border-slate-600 bg-slate-700" : "border-slate-300 bg-slate-50",
                  activeStep === step.id ? "ring-4 ring-indigo-100 border-indigo-500" : ""
                )}>
                  <step.icon className={cn("w-7 h-7", step.hasAttack && scenario !== 'basics' ? "text-red-500" : defenseType !== 'none' && step.id === 'defense' ? "text-blue-600" : darkMode ? "text-slate-400" : "text-slate-600")} />
                  {step.hasAttack && scenario === 'attack' && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-white animate-bounce">
                      <AlertTriangle className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <span className={cn("font-serif font-bold text-xs", darkMode ? "text-slate-300" : "text-slate-700")}>{step.label}</span>
                <span className={cn("text-[9px] text-center px-1 leading-tight", darkMode ? "text-slate-500" : "text-slate-500")}>{step.sub}</span>

                {/* Latency annotation */}
                {latency && (
                  <span className="text-[8px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                    {step.id === 'kb' ? '' : step.id === 'retriever' ? `${latency.retrieval}ms` : step.id === 'defense' ? `${latency.defense}ms` : `${latency.generation}ms`}
                  </span>
                )}
              </button>
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center gap-0.5">
                  <ArrowRight className={cn("w-5 h-5 transition-colors", activeStep === step.id ? "text-indigo-400" : darkMode ? "text-slate-600" : "text-slate-300")} />
                  {/* Animated data flow dot */}
                  <div className="relative w-8 h-0.5">
                    <div className={cn("absolute inset-y-0 left-0 w-2 h-0.5 rounded-full animate-progress-line",
                      attackConfig.poisoningRatio > 0 && i === 0 ? "bg-red-400" : "bg-indigo-400"
                    )} />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Visualization Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Cluster Map + Output */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <div className={cn("rounded-xl border shadow-sm p-5", cardClass)}>
            <h4 className={cn("font-serif font-bold mb-3 flex items-center justify-between text-sm", darkMode ? "text-slate-200" : "text-slate-800")}>
              <span>
                {activeStep === 'kb' ? "Knowledge Base Overview" :
                 activeStep === 'retriever' ? "Retriever Scanning" :
                 activeStep === 'defense' ? (defenseType === 'none' ? "Prompt Assembly" : "Defense Inspection") :
                 "Embedding Space"}
              </span>
              <span className="text-[9px] font-sans font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">2D Projection</span>
            </h4>
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
            <div className={cn("text-center mt-3 text-[10px] italic", darkMode ? "text-slate-500" : "text-slate-400")}>
              {activeStep === 'kb' && "The 'Sea of Documents' before retrieval. Zoom with scroll, shift+drag to pan."}
              {activeStep === 'retriever' && "Scanning for nearest neighbors (Cosine Similarity)..."}
              {activeStep === 'defense' && "Convex hulls show detected clusters. Red = adversarial."}
              {activeStep === 'generator' && "Final document set sent to LLM."}
            </div>
          </div>

          {/* Output Box (Generator step) */}
          {activeStep === 'generator' && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-sm">
              <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500 mb-2">
                <Terminal className="w-3 h-3" /> Model Output
              </h4>
              <div className="font-mono text-xs leading-relaxed">
                <p className="mb-1 text-green-400">User: {TOPICS[topic]}</p>
                <p className={cn(answer.includes("Incorrect") || answer.includes("cannot") || answer.includes("faked") || answer.includes("London") || answer.includes("removed") ? "text-red-400" : "text-white")}>
                  AI: {answer}
                </p>
              </div>
            </div>
          )}

          {/* Metrics Dashboard */}
          {metrics && <MetricsDashboard metrics={metrics} latency={latency || undefined} />}
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          {/* Step-specific views */}
          {activeStep === 'generator' ? (
            <div className="flex flex-col gap-4">
              <div className={cn("p-5 rounded-xl border shadow-sm flex flex-col gap-3 opacity-80 hover:opacity-100 transition-opacity", cardClass)}>
                <h3 className={cn("text-sm font-bold flex items-center gap-2", darkMode ? "text-slate-200" : "text-slate-800")}>
                  <Terminal className="w-4 h-4 text-purple-600" /> Final Prompt (Sent to LLM)
                </h3>
                <div className={cn("p-3 rounded border text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar", darkMode ? "bg-slate-700 border-slate-600 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700")}>
                  <span className="font-bold text-slate-400">SYSTEM:</span> You are a helpful assistant. Answer based on context.<br />
                  <span className="font-bold text-indigo-500">USER:</span> {TOPICS[topic]}
                  {attackConfig.attackType === 'prompt-injection' && attackConfig.promptInjection && (
                    <span className="text-red-500 font-bold ml-1">{attackConfig.promptInjection}</span>
                  )}<br />
                  <span className="font-bold text-slate-400">CONTEXT:</span><br />
                  {filteredDocs.slice(0, 5).map((d, i) => (
                    <span key={i} className={cn(d.isPoisoned ? "text-red-600" : darkMode ? "text-slate-400" : "text-slate-600")}>
                      [{i + 1}] {d.content}<br />
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg">
                <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Generated Answer
                </h3>
                <p className="text-lg text-white font-serif leading-relaxed mt-2">{answer}</p>
                {latency && (
                  <div className="text-[10px] text-slate-500 font-mono mt-3 border-t border-slate-800 pt-2">
                    Latency: {latency.total}ms | Retrieval: {latency.retrieval}ms | Defense: {latency.defense}ms | Generation: {latency.generation}ms
                  </div>
                )}
              </div>
            </div>
          ) : activeStep === 'defense' && defenseType === 'none' ? (
            <div className={cn("p-5 rounded-xl border shadow-sm", cardClass)}>
              <PromptAugmentationVisualizer topic={TOPICS[topic]} documents={retrievedDocs} attackConfig={attackConfig} />
            </div>
          ) : activeStep === 'defense' && defenseType === 'robustRag' ? (
            <div className="flex flex-col gap-4">
              <div className={cn("p-5 rounded-xl border shadow-sm", cardClass)}>
                <InspectionVisualizer documents={retrievedDocs} />
              </div>
              {defenseSteps.length > 0 && <DefenseWalkthrough steps={defenseSteps} defenseType={defenseType} />}
            </div>
          ) : activeStep === 'defense' && defenseType === 'discern' ? (
            <div className="flex flex-col gap-4">
              <div className={cn("p-5 rounded-xl border shadow-sm", cardClass)}>
                <ConsensusVisualizer documents={retrievedDocs} />
              </div>
              {defenseSteps.length > 0 && <DefenseWalkthrough steps={defenseSteps} defenseType={defenseType} />}
            </div>
          ) : activeStep === 'defense' && defenseType === 'paraphrase' ? (
            <div className={cn("p-5 rounded-xl border shadow-sm", cardClass)}>
              <PromptAugmentationVisualizer topic={TOPICS[topic]} documents={filteredDocs} attackConfig={attackConfig} />
            </div>
          ) : activeStep === 'defense' && (defenseType === 'ragDefender' || defenseType === 'ensemble') ? (
            <div className="flex flex-col gap-4">
              {defenseSteps.length > 0 && <DefenseWalkthrough steps={defenseSteps} defenseType={defenseType} />}
              <div className="max-h-[400px] flex flex-col">
                <DocumentList documents={filteredDocs} title="Survived Defense Filter" showDiff />
              </div>
            </div>
          ) : (
            <div className="max-h-[600px] flex flex-col">
              <DocumentList
                documents={activeStep === 'kb' ? allDocs : (activeStep === 'retriever' ? retrievedDocs : filteredDocs)}
                title={activeStep === 'kb' ? "All Documents (Knowledge Base)" : "Retrieved Documents"}
                showDiff={activeStep === 'retriever'}
              />
            </div>
          )}

          {/* Defense Log Panel */}
          {defenseLogs.length > 0 && activeStep !== 'kb' && (
            <DefenseLogPanel logs={defenseLogs} plainLogs={logs} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Showdown View ----
function ShowdownView({ topic, attackConfig, cardClass }: { topic: string; attackConfig: AttackConfig; cardClass: string }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center justify-center gap-2">
          <Swords className="w-5 h-5 text-indigo-500" />
          Defense Showdown
        </h2>
        <p className="text-xs text-slate-500 mt-1">All 7 defenses running simultaneously against {ATTACK_LABELS[attackConfig.attackType]}</p>
      </div>

      <DefenseComparisonPanel topic={topic} attackConfig={attackConfig} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DefenseRadarChart topic={topic} attackConfig={attackConfig} />
        <div className={cn("rounded-xl border shadow-sm p-5", cardClass)}>
          <h4 className="font-serif font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Attack Configuration
          </h4>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span>Topic</span><span className="font-bold">{TOPICS[topic as keyof typeof TOPICS]}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span>Attack Type</span><span className="font-bold text-red-600">{ATTACK_LABELS[attackConfig.attackType]}</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span>Poisoning Ratio</span><span className="font-bold">{Math.round(attackConfig.poisoningRatio * 100)}%</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span>Attack Strength</span><span className="font-bold">{Math.round((attackConfig.attackStrength ?? 0.5) * 100)}%</span>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded">
              <span>Corpus Size</span><span className="font-bold">{(attackConfig.irrelevantDocsCount ?? 40) + (attackConfig.relevantDocsCount ?? 5)} docs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Compare View ----
function CompareView({ topic, attackConfig, defenseType, cardClass }: { topic: string; attackConfig: AttackConfig; defenseType: DefenseType; cardClass: string }) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center justify-center gap-2">
          <Columns2 className="w-5 h-5 text-indigo-500" />
          Before / After Analysis
        </h2>
        <p className="text-xs text-slate-500 mt-1">Side-by-side: clean pipeline vs. attack + defense</p>
      </div>

      <BeforeAfterView topic={topic} attackConfig={attackConfig} defenseType={defenseType} />
    </div>
  );
}
