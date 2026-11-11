import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  ExternalLink, 
  CheckCircle2, 
  GitCommit, 
  MessageSquare,
  RefreshCw,
  Clock,
  Check,
  XCircle,
  AlertCircle,
  GitBranch,
  FolderGit2
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { githubService } from '../../services/githubService';
import { PullRequest } from '../../types/pullRequest';

export const PullRequestsView: React.FC = () => {
  const { activeRepoFullName, githubToken, pullRequests, setPullRequests } = useStore();
  const [activeTab, setActiveTab] = useState<'open' | 'merged' | 'closed' | 'all'>('open');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncPrs = async () => {
    if (!activeRepoFullName || !activeRepoFullName.includes('/')) return;
    const tok = githubToken || githubService.getToken();
    setIsSyncing(true);
    setSyncError(null);
    try {
      const fetched = await githubService.syncPullRequests(activeRepoFullName, tok || undefined);
      setPullRequests(fetched);
    } catch (err: any) {
      console.warn('Error al sincronizar PRs de GitHub:', err);
      setSyncError(err.message || 'Error al conectar con la API de GitHub.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (activeRepoFullName && activeRepoFullName.includes('/')) {
      const tok = githubToken || githubService.getToken();
      if (tok && pullRequests.length === 0) {
        handleSyncPrs();
      }
    }
  }, [activeRepoFullName]);

  const openCount = pullRequests.filter((p) => p.status === 'open' || p.status === 'draft').length;
  const mergedCount = pullRequests.filter((p) => p.status === 'merged').length;
  const closedCount = pullRequests.filter((p) => p.status === 'closed').length;
  const totalCount = pullRequests.length;

  const filteredPrs = pullRequests.filter((pr) => {
    if (activeTab === 'open') return pr.status === 'open' || pr.status === 'draft';
    if (activeTab === 'merged') return pr.status === 'merged';
    if (activeTab === 'closed') return pr.status === 'closed';
    return true;
  });

  const getStatusBadge = (status: PullRequest['status']) => {
    switch (status) {
      case 'merged':
        return (
          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800">
            <Check className="w-3 h-3" /> MERGED
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800">
            <XCircle className="w-3 h-3" /> CERRADO
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700">
            <Clock className="w-3 h-3" /> BORRADOR
          </span>
        );
      case 'open':
      default:
        return (
          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ABIERTO
          </span>
        );
    }
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
              {openCount} Abiertos
            </span>
          </div>
          <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5 flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-brand" />
            <span>Repositorio: <strong className="text-text-primary dark:text-white font-mono">{activeRepoFullName}</strong></span>
          </p>
        </div>

        {/* Action Controls & Tab Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncPrs}
            disabled={isSyncing}
            className="py-1.5 px-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated hover:bg-surface border border-border-subtle dark:border-dark-border text-text-primary dark:text-dark-text font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            title="Sincronizar Pull Requests desde GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar PRs'}</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-surface-subtle dark:bg-dark-surface-elevated rounded-lg border border-border-subtle text-xs">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'open' ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Abiertos ({openCount})
            </button>
            <button
              onClick={() => setActiveTab('merged')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'merged' ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Merged ({mergedCount})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'closed' ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Cerrados ({closedCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeTab === 'all' ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Todos ({totalCount})
            </button>
          </div>
        </div>
      </div>

      {syncError && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{syncError}</span>
        </div>
      )}

      {/* PR Cards List */}
      <div className="flex flex-col gap-3">
        {filteredPrs.length > 0 ? (
          filteredPrs.map((pr) => (
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
                        : pr.status === 'closed'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
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
                        {pr.author.avatar.startsWith('http') ? (
                          <img src={pr.author.avatar} alt={pr.author.name} className="w-4 h-4 rounded-full" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-surface-subtle flex items-center justify-center text-[10px] font-bold">
                            {pr.author.avatar}
                          </span>
                        )}
                        <span>{pr.author.name}</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] bg-surface-subtle px-1.5 py-0.5 rounded border border-border-subtle flex items-center gap-1">
                        <GitBranch className="w-2.5 h-2.5" />
                        {pr.branch}
                      </span>
                      <span>➔</span>
                      <span className="font-mono text-[11px] bg-surface-subtle px-1.5 py-0.5 rounded border border-border-subtle">
                        {pr.baseBranch}
                      </span>
                      <span>•</span>
                      <span>{pr.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Status and GitHub link */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {getStatusBadge(pr.status)}
                  <a
                    href={pr.htmlUrl || `https://github.com/${activeRepoFullName}/pull/${pr.number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                    title="Ver Pull Request en GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Footer metrics */}
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle dark:border-dark-border text-xs text-text-secondary dark:text-dark-text-muted">
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3 h-3" /> {pr.commitsCount} commits
                  </span>
                  {(pr.additions > 0 || pr.deletions > 0) && (
                    <>
                      <span className="text-emerald-600 font-bold">+{pr.additions}</span>
                      <span className="text-rose-600 font-bold">-{pr.deletions}</span>
                    </>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {pr.commentsCount}
                  </span>
                </div>

                <a
                  href={pr.htmlUrl || `https://github.com/${activeRepoFullName}/pull/${pr.number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                >
                  <span>Revisar en GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-center flex flex-col items-center justify-center gap-2 text-text-secondary">
            <GitPullRequest className="w-8 h-8 text-text-muted mb-1" />
            <span className="font-bold text-sm text-text-primary dark:text-dark-text">
              No hay Pull Requests registrados en {activeRepoFullName}
            </span>
            <p className="text-xs text-text-secondary dark:text-dark-text-muted max-w-md">
              Haz clic en &quot;Sincronizar PRs&quot; para consultar las ramas y pull requests activos en tu repositorio de GitHub.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleSyncPrs}
                disabled={isSyncing}
                className="py-1.5 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sincronizar Ahora</span>
              </button>
              <a
                href={`https://github.com/${activeRepoFullName}/pulls`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3.5 rounded-lg border border-border-subtle hover:bg-surface-subtle text-text-primary dark:text-dark-text font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Ver en GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
