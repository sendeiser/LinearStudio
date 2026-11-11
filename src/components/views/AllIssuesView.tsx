import React, { useState } from 'react';
import { 
  Plus, 
  Sparkles, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  Circle, 
  Eye, 
  TrendingUp,
  GitPullRequest,
  Edit3,
  Trash2
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Issue, ColumnId, Priority } from '../../types/issue';
import { useStore } from '../../store/useStore';
import { dataService } from '../../services/dataService';
import { getActiveIssueRepository } from '../../services/issueRepository';

export const AllIssuesView: React.FC<{ issues: Issue[] }> = ({ issues }) => {
  const queryClient = useQueryClient();
  const { 
    setSelectedIssue, 
    setIsCreateModalOpen, 
    dispatchAntigravity,
    searchQuery,
    activeFilter,
    currentUserEmail,
    activeRepoId,
    userRole
  } = useStore();

  const [sortField, setSortField] = useState<'id' | 'priority' | 'updatedAt'>('id');
  const [sortAsc, setSortAsc] = useState(false);

  const priorityWeight: Record<Priority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const filtered = issues.filter((issue) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchId = issue.id.toString().includes(q);
      const matchDesc = issue.description.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchDesc) return false;
    }

    if (activeFilter === 'urgent') return issue.priority === 'urgent';
    if (activeFilter === 'bug') return issue.tags.includes('bug');
    if (activeFilter === 'frontend') return issue.tags.includes('frontend');
    if (activeFilter === 'security') return issue.tags.includes('security');

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'id') {
      cmp = a.id - b.id;
    } else if (sortField === 'priority') {
      cmp = priorityWeight[a.priority] - priorityWeight[b.priority];
    } else {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleStatusChange = (e: React.MouseEvent, issueId: number, newStatus: ColumnId) => {
    e.stopPropagation();
    dataService.moveIssue(issueId, newStatus);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const handleDeleteIssue = async (e: React.MouseEvent, issueId: number) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el Issue #${issueId}?`)) {
      return;
    }
    const repo = getActiveIssueRepository(activeRepoId, currentUserEmail, userRole);
    try {
      await repo.delete(issueId);
    } catch (err) {
      console.warn('Notice al eliminar issue en Supabase:', err);
    }
    dataService.deleteIssue(issueId);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const getStatusIcon = (status: ColumnId) => {
    switch (status) {
      case 'backlog':
        return <Circle className="w-3.5 h-3.5 text-text-muted" />;
      case 'todo':
        return <Clock className="w-3.5 h-3.5 text-brand dark:text-dark-brand" />;
      case 'in_progress':
        return <TrendingUp className="w-3.5 h-3.5 text-brand dark:text-dark-brand" />;
      case 'in_review':
        return <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-done" />;
    }
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-canvas dark:bg-dark-canvas overflow-hidden">
      {/* View Header & Action Bar */}
      <div className="p-4 bg-surface dark:bg-dark-surface border-b border-border-subtle dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-base font-bold text-text-primary dark:text-dark-text flex items-center gap-2">
            <span>Todos los Issues</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-surface-subtle dark:bg-dark-surface-elevated text-text-secondary border border-border-subtle">
              {filtered.length} issues
            </span>
          </h1>
          <p className="text-xs text-text-secondary dark:text-dark-text-muted">
            Lista completa y tabular con clasificación, estado y delegación de agentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Issue</span>
          </button>
        </div>
      </div>

      {/* Issues Table Container */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border-subtle dark:border-dark-border shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle dark:border-dark-border bg-surface-subtle/60 dark:bg-dark-surface-elevated/60 text-text-secondary dark:text-dark-text-muted font-bold text-[11px]">
                <th className="py-2.5 px-3 cursor-pointer select-none" onClick={() => { setSortField('id'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Título & Etiquetas</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 cursor-pointer select-none" onClick={() => { setSortField('priority'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1">
                    <span>Prioridad</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 hidden md:table-cell">Subtareas</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">Asignado</th>
                <th className="py-2.5 px-3 text-right">Acción IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted dark:divide-dark-border">
              {sorted.map((issue) => {
                const completedTasks = issue.subtasks.filter((s) => s.completed).length;
                return (
                  <tr
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className="hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-brand dark:text-dark-brand">
                      #{issue.id}
                    </td>

                    <td className="py-3 px-3 max-w-md">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-text-primary dark:text-dark-text group-hover:text-brand transition-colors line-clamp-1">
                          {issue.title}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {issue.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-canvas dark:bg-dark-canvas text-text-secondary dark:text-dark-text-muted border border-border-subtle"
                            >
                              {t}
                            </span>
                          ))}
                          {issue.prNumber && (
                            <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold flex items-center gap-0.5 border border-purple-300">
                              <GitPullRequest className="w-2.5 h-2.5" /> PR #{issue.prNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {getStatusIcon(issue.status)}
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusChange(e as any, issue.id, e.target.value as ColumnId)}
                          className="bg-transparent border-none text-text-primary dark:text-dark-text font-medium text-xs outline-none cursor-pointer hover:underline"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">Por Hacer</option>
                          <option value="in_progress">En Progreso</option>
                          <option value="in_review">En Revisión</option>
                          <option value="done">Completado</option>
                        </select>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                        issue.priority === 'urgent'
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300'
                          : issue.priority === 'high'
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300'
                          : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300'
                      }`}>
                        {issue.priority.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap hidden md:table-cell text-text-secondary font-mono text-[11px]">
                      ✓ {completedTasks}/{issue.subtasks.length}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold text-[9px]">
                          {issue.assignee.avatar}
                        </div>
                        <span className="font-medium text-text-primary dark:text-dark-text truncate max-w-[120px]">
                          {issue.assignee.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(issue);
                          }}
                          className="p-1 rounded hover:bg-surface-subtle text-text-muted hover:text-brand transition-colors"
                          title="Editar issue (CRUD)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteIssue(e, issue.id)}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-text-muted hover:text-rose-600 transition-colors"
                          title="Eliminar issue (CRUD)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIssue(issue);
                            dispatchAntigravity(issue);
                          }}
                          className="py-1 px-2.5 rounded-md bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="Resolver con Antigravity AI Agent"
                        >
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>Resolver</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
