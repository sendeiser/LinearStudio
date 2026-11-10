import React from 'react';
import { ColumnId } from '../types/issue';
import { useStore } from '../store/useStore';

interface ColumnMeta {
  id: ColumnId;
  label: string;
}

const COLUMNS: ColumnMeta[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'Por Hacer' },
  { id: 'in_progress', label: 'En Progreso' },
  { id: 'in_review', label: 'En Revisión' },
  { id: 'done', label: 'Completado' }
];

export const MobileColTabs: React.FC<{ counts: Record<ColumnId, number> }> = ({ counts }) => {
  const { activeMobileCol, setActiveMobileCol } = useStore();

  return (
    <div className="md:hidden bg-surface dark:bg-dark-surface border-b border-border-subtle dark:border-dark-border px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 shadow-sm">
      {COLUMNS.map((col) => {
        const isActive = activeMobileCol === col.id;
        return (
          <button
            key={col.id}
            onClick={() => setActiveMobileCol(col.id)}
            className={`px-3 py-1.5 rounded-md text-xs shrink-0 transition-colors ${
              isActive
                ? 'font-bold bg-brand dark:bg-dark-brand text-white shadow-sm'
                : 'font-medium bg-surface-subtle dark:bg-dark-surface-elevated text-text-secondary dark:text-dark-text-muted hover:text-text-primary border border-border-subtle dark:border-dark-border'
            }`}
          >
            {col.label} <span className="ml-1 opacity-80 font-mono text-[10px]">{counts[col.id] || 0}</span>
          </button>
        );
      })}
    </div>
  );
};

