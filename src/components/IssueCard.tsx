import React from 'react';
import { MessageSquare, GitPullRequest, ChevronLeft, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnId, Issue } from '../types/issue';
import { useStore } from '../store/useStore';
import { dataService } from '../services/dataService';
import { getActiveIssueRepository } from '../services/issueRepository';

interface IssueCardProps {
  issue: Issue;
  index: number;
}

const COLUMN_ORDER: ColumnId[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

export const IssueCard: React.FC<IssueCardProps> = ({ issue, index }) => {
  const queryClient = useQueryClient();
  const { selectedIssue, setSelectedIssue, currentUserEmail, activeRepoId, userRole } = useStore();
  const isSelected = selectedIssue?.id === issue.id;

  const currentIdx = COLUMN_ORDER.indexOf(issue.status);
  const prevCol = currentIdx > 0 ? COLUMN_ORDER[currentIdx - 1] : null;
  const nextCol = currentIdx < COLUMN_ORDER.length - 1 ? COLUMN_ORDER[currentIdx + 1] : null;

  const handleMove = (e: React.MouseEvent, targetCol: ColumnId) => {
    e.stopPropagation();
    dataService.moveIssue(issue.id, targetCol);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar issue #${issue.id}?`)) return;
    const repo = getActiveIssueRepository(activeRepoId, currentUserEmail, userRole);
    try {
      await repo.delete(issue.id);
    } catch (err) {
      console.warn('Notice al eliminar issue:', err);
    }
    dataService.deleteIssue(issue.id);
    if (selectedIssue?.id === issue.id) setSelectedIssue(null);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const getPriorityBadge = () => {
    switch (issue.priority) {
      case 'urgent':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-urgent-bg dark:bg-rose-950/40 text-urgent dark:text-rose-300 border border-urgent-border dark:border-rose-800 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-urgent animate-pulse" /> Urgente
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-high-bg dark:bg-amber-950/40 text-high dark:text-amber-300 border border-high-border dark:border-amber-800 font-semibold">
            Alta
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-medium-bg dark:bg-blue-950/40 text-medium dark:text-blue-300 border border-medium-border dark:border-blue-800 font-semibold">
            Media
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-low-bg dark:bg-slate-900 text-low dark:text-slate-400 border border-border-subtle dark:border-dark-border font-semibold">
            Baja
          </span>
        );
    }
  };

  const completedCount = issue.subtasks.filter((s) => s.completed).length;

  return (
    <Draggable draggableId={String(issue.id)} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid="issue-card"
          onClick={() => setSelectedIssue(issue)}
          className={`group p-3 rounded-lg bg-surface dark:bg-dark-surface-elevated transition-all cursor-grab active:cursor-grabbing shadow-card border ${
            snapshot.isDragging
              ? 'ring-2 ring-brand shadow-2xl rotate-1 z-50 bg-surface dark:bg-dark-surface'
              : isSelected
              ? 'border-2 border-brand dark:border-dark-brand shadow-card-hover'
              : 'border-border-subtle dark:border-dark-border hover:border-brand/60 dark:hover:border-dark-brand/60 hover:shadow-card-hover'
          }`}
        >
          {/* Card Top Row */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[11px] text-brand dark:text-dark-brand font-bold">
              #{issue.id}
            </span>
            <div className="flex items-center gap-1">
              {getPriorityBadge()}
              
              {/* Quick Move & Admin Delete */}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                {prevCol && (
                  <button
                    onClick={(e) => handleMove(e, prevCol)}
                    className="p-0.5 rounded hover:bg-surface-subtle dark:hover:bg-dark-surface text-text-muted hover:text-text-primary"
                    title={`Mover a ${prevCol}`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                {nextCol && (
                  <button
                    onClick={(e) => handleMove(e, nextCol)}
                    className="p-0.5 rounded hover:bg-surface-subtle dark:hover:bg-dark-surface text-text-muted hover:text-text-primary"
                    title={`Mover a ${nextCol}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {(userRole === 'admin' || userRole === 'owner') && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIssue(issue);
                      }}
                      className="p-0.5 rounded hover:bg-brand/10 text-text-muted hover:text-brand transition-colors ml-0.5"
                      title="Editar issue (Admin)"
                      aria-label="Editar issue"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-0.5 rounded hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors ml-0.5"
                      title="Eliminar issue (Admin)"
                      aria-label="Eliminar issue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <h4 className="font-semibold text-xs text-text-primary dark:text-dark-text mb-2 leading-relaxed">
            {issue.title}
          </h4>

          {/* Tags & PR indicator */}
          <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
            {issue.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-subtle dark:bg-dark-surface text-text-secondary dark:text-dark-text-muted border border-border-subtle dark:border-dark-border"
              >
                {tag}
              </span>
            ))}
            {issue.prNumber && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pr-bg dark:bg-purple-950/40 text-pr dark:text-purple-300 border border-pr/30 dark:border-purple-800 font-semibold flex items-center gap-1">
                <GitPullRequest className="w-3 h-3" /> PR #{issue.prNumber}
              </span>
            )}
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border-muted dark:border-dark-border text-text-secondary dark:text-dark-text-muted text-[11px]">
            <span className="font-mono">
              ✓ {completedCount}/{issue.subtasks.length} tareas
            </span>
            <div className="flex items-center gap-2">
              {issue.comments.length > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="w-3.5 h-3.5" /> {issue.comments.length}
                </span>
              )}
              <div className="w-5 h-5 rounded-full bg-brand/20 text-brand dark:text-dark-brand border border-brand/30 flex items-center justify-center text-[9px] font-bold">
                {issue.assignee.avatar}
              </div>
            </div>
          </div>
        </article>
      )}
    </Draggable>
  );
};
