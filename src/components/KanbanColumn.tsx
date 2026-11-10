import React from 'react';
import { Plus, Circle, Clock, TrendingUp, Eye, CheckCircle2 } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';
import { ColumnId, Issue } from '../types/issue';
import { IssueCard } from './IssueCard';
import { useStore } from '../store/useStore';

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  issues: Issue[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, issues }) => {
  const { activeMobileCol, setIsCreateModalOpen } = useStore();

  const getIcon = () => {
    switch (id) {
      case 'backlog':
        return <Circle className="w-4 h-4 text-text-muted" />;
      case 'todo':
        return <Clock className="w-4 h-4 text-brand dark:text-dark-brand" />;
      case 'in_progress':
        return <TrendingUp className="w-4 h-4 text-brand dark:text-dark-brand" />;
      case 'in_review':
        return <Eye className="w-4 h-4 text-pr" />;
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-done" />;
    }
  };

  const isHiddenOnMobile = activeMobileCol !== id;

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <section 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`kanban-col w-full md:w-72 shrink-0 flex flex-col max-h-full rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-card transition-colors ${
            snapshot.isDraggingOver ? 'ring-2 ring-brand/40 bg-brand-subtle/20 dark:bg-dark-surface-elevated' : ''
          } ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Column Header */}
          <div className="p-3 flex items-center justify-between border-b border-border-subtle dark:border-dark-border bg-surface-subtle/50 dark:bg-dark-surface-elevated/50 rounded-t-xl shrink-0">
            <div className="flex items-center gap-2">
              {getIcon()}
              <span className="font-bold text-xs text-text-primary dark:text-dark-text">{title}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted font-semibold">
                {issues.length}
              </span>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 rounded hover:bg-surface dark:hover:bg-dark-surface text-text-muted hover:text-text-primary transition-colors"
              title="Añadir issue"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Cards Area */}
          <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 min-h-[120px]">
            {issues.map((issue, index) => (
              <IssueCard key={issue.id} issue={issue} index={index} />
            ))}
            {provided.placeholder}
            {issues.length === 0 && !snapshot.isDraggingOver && (
              <div className="p-4 text-center text-text-muted text-xs border border-dashed border-border-subtle dark:border-dark-border rounded-lg my-auto">
                No hay tareas en esta columna
              </div>
            )}
          </div>
        </section>
      )}
    </Droppable>
  );
};
