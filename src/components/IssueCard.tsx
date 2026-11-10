import React from 'react';
import { MessageSquare, GitPullRequest } from 'lucide-react';
import { Issue } from '../types/issue';
import { useStore } from '../store/useStore';

interface IssueCardProps {
  issue: Issue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const { selectedIssue, setSelectedIssue } = useStore();
  const isSelected = selectedIssue?.id === issue.id;

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
    <article
      data-testid="issue-card"
      onClick={() => setSelectedIssue(issue)}
      className={`p-3 rounded-lg bg-surface dark:bg-dark-surface-elevated transition-all cursor-pointer shadow-card ${
        isSelected
          ? 'border-2 border-brand dark:border-dark-brand shadow-card-hover'
          : 'border border-border-subtle dark:border-dark-border hover:border-brand dark:hover:border-dark-brand hover:shadow-card-hover'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] text-brand dark:text-dark-brand font-bold">
          #{issue.id}
        </span>
        {getPriorityBadge()}
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
  );
};

