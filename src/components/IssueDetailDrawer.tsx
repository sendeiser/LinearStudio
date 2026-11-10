import React from 'react';
import { 
  X, 
  ExternalLink, 
  User, 
  Flag, 
  Tag, 
  GitBranch, 
  Sparkles, 
  Play, 
  Brain, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const IssueDetailDrawer: React.FC = () => {
  const { selectedIssue, setSelectedIssue, antigravityState, dispatchAntigravity } = useStore();

  if (!selectedIssue) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-surface dark:bg-dark-surface border-l border-border-subtle dark:border-dark-border flex flex-col shadow-flyout transform translate-x-0 md:static md:z-20 transition-transform duration-200 ease-in-out shrink-0">
      {/* Header */}
      <div className="h-14 px-4 bg-surface-subtle dark:bg-dark-surface-elevated border-b border-border-subtle dark:border-dark-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-text-secondary dark:text-dark-text-muted truncate">
            tincho/hyper-flow
          </span>
          <span className="text-text-muted">/</span>
          <span className="font-mono text-xs text-brand dark:text-dark-brand font-bold">
            #{selectedIssue.id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-done-bg dark:bg-emerald-950/50 border border-done-border dark:border-emerald-800 text-done dark:text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-done" /> Abierto
          </span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface dark:hover:bg-dark-surface transition-colors"
            title="Ver en GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => setSelectedIssue(null)}
            className="p-1.5 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated transition-colors"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Antigravity AI Agent Section */}
      <div className="p-3 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-b border-purple-200 dark:border-purple-900/50 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-bold text-xs text-purple-900 dark:text-purple-200">
              Antigravity Coding Agent
            </span>
          </div>
          <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-semibold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/60 rounded-full">
            v1.4.9
          </span>
        </div>
        <p className="text-[11px] text-text-secondary dark:text-dark-text-muted leading-tight">
          Delega este issue para que un agente Antigravity cree el branch, ejecute TDD con Playwright y genere el Pull Request automáticamente.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            disabled={antigravityState.isRunning}
            onClick={() => dispatchAntigravity(selectedIssue)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-98 transition-all disabled:opacity-75"
          >
            {antigravityState.isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Despachando a Antigravity...</span>
              </>
            ) : antigravityState.prReady ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>PR Generado por Antigravity</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>✦ Resolver con Antigravity</span>
              </>
            )}
          </button>
          <button
            onClick={() => alert('✦ AI Triage completado:\n- Prioridad confirmada: ' + selectedIssue.priority + '\n- Estimación recomendada: 5 Story Points')}
            className="py-1.5 px-2.5 rounded-lg border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-semibold"
            title="Auto-triage con IA"
          >
            <Brain className="w-4 h-4" />
          </button>
        </div>

        {/* Live Telemetry Progress Card */}
        {antigravityState.isRunning && (
          <div className="p-2.5 rounded-lg bg-purple-950/20 dark:bg-purple-950/60 border border-purple-500/30 flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center justify-between text-purple-300 font-mono">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                Agente en Ejecución...
              </span>
              <span>{antigravityState.step}</span>
            </div>
            <div className="w-full bg-purple-900/40 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-400 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${antigravityState.progress}%` }}
              />
            </div>
            <code className="font-mono text-[10px] text-purple-200/80 bg-black/30 p-1.5 rounded truncate">
              {antigravityState.log}
            </code>
          </div>
        )}
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {/* Title */}
        <h2 className="text-base font-bold text-text-primary dark:text-dark-text leading-snug">
          {selectedIssue.title}
        </h2>

        {/* Property Grid */}
        <div className="p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5" /> Asignado
            </span>
            <div className="flex items-center gap-1.5 font-bold text-text-primary dark:text-dark-text">
              <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-bold">
                {selectedIssue.assignee.avatar}
              </div>
              <span>{selectedIssue.assignee.name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
              <Flag className="w-3.5 h-3.5 text-urgent" /> Prioridad
            </span>
            <span className="px-2 py-0.5 rounded bg-urgent-bg dark:bg-rose-950/40 border border-urgent-border dark:border-rose-800 text-urgent dark:text-rose-300 font-mono text-[10px] font-bold">
              {selectedIssue.priority.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
              <Tag className="w-3.5 h-3.5" /> Etiquetas
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {selectedIssue.tags.map((t) => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-done-bg dark:bg-emerald-950/40 text-done dark:text-emerald-300 font-mono text-[10px] border border-done-border dark:border-emerald-800 font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {selectedIssue.branch && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
                <GitBranch className="w-3.5 h-3.5" /> Branch
              </span>
              <code className="font-mono text-[11px] text-brand dark:text-dark-brand bg-surface dark:bg-dark-surface px-1.5 py-0.5 rounded border border-border-subtle dark:border-dark-border font-semibold">
                {selectedIssue.branch}
              </code>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider">
            Descripción
          </span>
          <div className="p-3 rounded-lg bg-surface dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border text-text-primary dark:text-dark-text leading-relaxed space-y-2 shadow-sm">
            <p>{selectedIssue.description}</p>
          </div>
        </div>

        {/* Checklist Subtasks */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider">
              Subtareas (Checklist)
            </span>
            <span className="font-mono text-[11px] text-brand dark:text-dark-brand font-bold">
              {selectedIssue.subtasks.filter((s) => s.completed).length} de {selectedIssue.subtasks.length} completadas
            </span>
          </div>
          <div className="space-y-1.5">
            {selectedIssue.subtasks.map((st) => (
              <label 
                key={st.id} 
                className="flex items-center gap-2.5 p-2 rounded-lg bg-surface dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border hover:bg-surface-subtle dark:hover:bg-dark-surface cursor-pointer shadow-sm"
              >
                <input 
                  type="checkbox" 
                  defaultChecked={st.completed} 
                  className="rounded border-border-subtle text-brand focus:ring-brand" 
                />
                <span className={st.completed ? 'line-through text-text-muted' : 'text-text-primary dark:text-dark-text font-medium'}>
                  {st.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

