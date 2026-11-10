import React from 'react';
import { Flag, Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Issue } from '../../types/issue';
import { useStore } from '../../store/useStore';

export const SprintsView: React.FC<{ issues: Issue[] }> = ({ issues }) => {
  const { setSelectedIssue } = useStore();

  const totalIssues = issues.length;
  const completedIssues = issues.filter((i) => i.status === 'done').length;
  const inProgressIssues = issues.filter((i) => i.status === 'in_progress' || i.status === 'in_review').length;
  const todoIssues = issues.filter((i) => i.status === 'todo' || i.status === 'backlog').length;

  const progressPct = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  const milestones = [
    {
      id: 'm1',
      title: '🚀 v1.0 Public Release & Multi-Repo Federation',
      dueDate: '17 Nov 2026',
      progress: progressPct,
      description: 'Lanzamiento oficial con tablero Kanban interactivo y sincronización de GitHub.',
      issues: issues.slice(0, 4)
    },
    {
      id: 'm2',
      title: '🛡️ High-Throughput & Rate Limiting (Redis Bucket)',
      dueDate: '24 Nov 2026',
      progress: 65,
      description: 'Defensa perimetral contra saturación de API con cluster Redis y tokens distribuidos.',
      issues: issues.filter((i) => i.tags.includes('security') || i.tags.includes('performance'))
    },
    {
      id: 'm3',
      title: '🤖 Antigravity AI Agent Autonomous PR Bridge',
      dueDate: '01 Dic 2026',
      progress: 90,
      description: 'Orquestación de agentes con branching aislado, ejecución TDD y creación de PRs.',
      issues: issues.filter((i) => i.tags.includes('metrics') || i.tags.includes('compiler'))
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas dark:bg-dark-canvas overflow-y-auto p-4 gap-4">
      {/* Active Sprint Banner */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/10 dark:bg-dark-brand/20 text-brand dark:text-dark-brand flex items-center justify-center font-bold">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-text-primary dark:text-dark-text">Sprint 24: Core Foundation & AI Automation</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono border border-emerald-300">
                  ACTIVO
                </span>
              </div>
              <p className="text-xs text-text-secondary dark:text-dark-text-muted flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 03 Nov - 17 Nov 2026</span>
                <span>•</span>
                <span>7 días restantes</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-brand dark:text-dark-brand bg-brand-subtle/50 px-2.5 py-1 rounded-lg border border-brand/20">
              {completedIssues} de {totalIssues} issues completados ({progressPct}%)
            </span>
          </div>
        </div>

        {/* Sprint Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="w-full bg-surface-subtle dark:bg-dark-surface-elevated rounded-full h-2.5 overflow-hidden border border-border-subtle dark:border-dark-border">
            <div
              className="bg-gradient-to-r from-brand to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-secondary dark:text-dark-text-muted font-mono">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-done" /> {completedIssues} Hechos</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-brand" /> {inProgressIssues} En Progreso</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> {todoIssues} Pendientes</span>
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-text-primary dark:text-dark-text flex items-center gap-2">
          <span>Hitos del Proyecto (Roadmap & Milestones)</span>
          <span className="text-xs text-text-muted font-normal">• 3 Hitos planificados</span>
        </h2>

        <div className="grid grid-cols-1 gap-3.5">
          {milestones.map((ms) => (
            <div
              key={ms.id}
              className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-sm text-text-primary dark:text-dark-text">{ms.title}</h3>
                  <p className="text-xs text-text-secondary dark:text-dark-text-muted">{ms.description}</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="font-mono text-xs text-text-secondary dark:text-dark-text-muted flex items-center gap-1 bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle">
                    <Calendar className="w-3 h-3" /> Meta: {ms.dueDate}
                  </span>
                  <span className="font-mono text-xs font-bold text-brand dark:text-dark-brand">
                    {ms.progress}%
                  </span>
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-surface-subtle dark:bg-dark-surface-elevated rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand h-1.5 rounded-full" style={{ width: `${ms.progress}%` }} />
              </div>

              {/* Issues in milestone */}
              <div className="divide-y divide-border-subtle/50 dark:divide-dark-border/50 border border-border-subtle/50 dark:border-dark-border/50 rounded-lg overflow-hidden bg-canvas/30 dark:bg-dark-canvas/30">
                {ms.issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="p-2.5 flex items-center justify-between hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-brand dark:text-dark-brand">#{issue.id}</span>
                      <span className="font-medium text-text-primary dark:text-dark-text truncate">{issue.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-surface dark:bg-dark-surface border border-border-subtle">
                        {issue.status}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
