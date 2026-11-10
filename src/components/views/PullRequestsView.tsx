import React, { useState } from 'react';
import { 
  GitPullRequest, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  GitCommit, 
  MessageSquare,
  Bot
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface PullRequest {
  number: number;
  title: string;
  author: { name: string; avatar: string; isAi?: boolean };
  branch: string;
  baseBranch: string;
  status: 'open' | 'merged' | 'draft';
  ciStatus: 'passing' | 'running' | 'failed';
  additions: number;
  deletions: number;
  commitsCount: number;
  commentsCount: number;
  createdAt: string;
  aiReview?: string;
}

const INITIAL_PRS: PullRequest[] = [
  {
    number: 143,
    title: 'fix(issue-142): implement edge function rate limiting via redis token bucket',
    author: { name: 'Antigravity AI Agent', avatar: '🤖', isAi: true },
    branch: 'antigravity/fix-issue-142',
    baseBranch: 'main',
    status: 'open',
    ciStatus: 'passing',
    additions: 145,
    deletions: 32,
    commitsCount: 3,
    commentsCount: 2,
    createdAt: 'hace 25min',
    aiReview: '✓ Cobertura TDD del 100% alcanzada. Sin regresiones de latencia ni fugas de memoria en tokens.'
  },
  {
    number: 140,
    title: 'feat(telemetry): latency histogram prometheus buckets widget',
    author: { name: 'Juan Díaz', avatar: 'JD' },
    branch: 'feature/telemetry-histogram',
    baseBranch: 'main',
    status: 'open',
    ciStatus: 'passing',
    additions: 88,
    deletions: 12,
    commitsCount: 2,
    commentsCount: 4,
    createdAt: 'hace 3h'
  },
  {
    number: 138,
    title: 'refactor(ast): memoized fragment parser for JSX hooks',
    author: { name: 'Alex Lee', avatar: 'AL' },
    branch: 'refactor/ast-memo',
    baseBranch: 'main',
    status: 'merged',
    ciStatus: 'passing',
    additions: 45,
    deletions: 89,
    commitsCount: 4,
    commentsCount: 1,
    createdAt: 'hace 2d'
  }
];

export const PullRequestsView: React.FC = () => {
  const { activeRepoFullName } = useStore();
  const [prs, setPrs] = useState<PullRequest[]>(INITIAL_PRS);
  const [activeTab, setActiveTab] = useState<'open' | 'merged' | 'all'>('open');
  const [reviewingPr, setReviewingPr] = useState<number | null>(null);

  const filteredPrs = prs.filter((pr) => {
    if (activeTab === 'open') return pr.status === 'open';
    if (activeTab === 'merged') return pr.status === 'merged';
    return true;
  });

  const handleAiAudit = (prNum: number) => {
    setReviewingPr(prNum);
    setTimeout(() => {
      setPrs((prev) =>
        prev.map((p) =>
          p.number === prNum
            ? {
                ...p,
                aiReview: '✦ Antigravity Code Review: Código limpio, sin vulnerabilidades OWASP y tiempos de ejecución dentro de SLA.'
              }
            : p
        )
      );
      setReviewingPr(null);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas dark:bg-dark-canvas overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div className="p-4 bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-text-primary dark:text-dark-text flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-brand dark:text-dark-brand" />
              <span>Pull Requests de GitHub</span>
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-surface-subtle border border-border-subtle text-text-secondary">
              {prs.filter((p) => p.status === 'open').length} Abiertos
            </span>
          </div>
          <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
            Sincronización en vivo de ramas, estados de CI y auditorías de código autónomas de Antigravity.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-subtle dark:bg-dark-surface-elevated rounded-lg border border-border-subtle text-xs">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              activeTab === 'open' ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Abiertos (2)
          </button>
          <button
            onClick={() => setActiveTab('merged')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              activeTab === 'merged' ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Merged (1)
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              activeTab === 'all' ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Todos ({prs.length})
          </button>
        </div>
      </div>

      {/* PR Cards List */}
      <div className="flex flex-col gap-3">
        {filteredPrs.map((pr) => (
          <div
            key={pr.number}
            className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3 hover:border-brand/40 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    pr.status === 'merged'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  <GitPullRequest className="w-4 h-4" />
                </div>

                <div className="flex flex-col min-w-0 gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-text-primary dark:text-dark-text leading-snug">
                      {pr.title}
                    </span>
                    <span className="font-mono text-xs font-bold text-brand dark:text-dark-brand">
                      #{pr.number}
                    </span>
                  </div>

                  {/* Branch and Author metadata */}
                  <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-dark-text-muted flex-wrap">
                    <span className="font-medium text-text-primary dark:text-dark-text flex items-center gap-1">
                      {pr.author.avatar} {pr.author.name}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] bg-surface-subtle px-1.5 py-0.2 rounded border border-border-subtle">
                      {pr.branch}
                    </span>
                    <span>➔</span>
                    <span className="font-mono text-[11px] bg-surface-subtle px-1.5 py-0.2 rounded border border-border-subtle">
                      {pr.baseBranch}
                    </span>
                    <span>•</span>
                    <span>{pr.createdAt}</span>
                  </div>
                </div>
              </div>

              {/* Status and GitHub link */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CI Passing
                </span>
                <a
                  href={`https://github.com/${activeRepoFullName}/pull/${pr.number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
                  title="Ver en GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* AI Review Banner if available */}
            {pr.aiReview && (
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{pr.aiReview}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 font-bold shrink-0">
                  AGY Verified
                </span>
              </div>
            )}

            {/* Footer metrics & Action */}
            <div className="flex items-center justify-between pt-2 border-t border-border-muted dark:border-dark-border text-xs text-text-secondary dark:text-dark-text-muted">
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1">
                  <GitCommit className="w-3 h-3" /> {pr.commitsCount} commits
                </span>
                <span className="text-emerald-600 font-bold">+{pr.additions}</span>
                <span className="text-rose-600 font-bold">-{pr.deletions}</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {pr.commentsCount}
                </span>
              </div>

              <button
                onClick={() => handleAiAudit(pr.number)}
                disabled={reviewingPr === pr.number}
                className="py-1 px-2.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{reviewingPr === pr.number ? 'Analizando...' : '✦ Auditar con Antigravity'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
