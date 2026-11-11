import React from 'react';
import { Filter } from 'lucide-react';
import { useStore } from '../store/useStore';

export const FilterBar: React.FC = () => {
  const { activeFilter, setActiveFilter } = useStore();

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'urgent', label: '🔥 Urgentes' },
    { id: 'bug', label: '🐞 Bugs' },
    { id: 'frontend', label: '💻 Frontend' },
    { id: 'security', label: '🛡️ Seguridad' }
  ];

  return (
    <div className="h-10 px-3 md:px-5 bg-surface/70 dark:bg-dark-surface/70 border-b border-border-subtle dark:border-dark-border flex items-center justify-between shrink-0 text-xs overflow-x-auto no-scrollbar gap-3">
      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-text-muted flex items-center gap-1 text-[11px] font-semibold mr-1">
          <Filter className="w-3.5 h-3.5" /> Filtros:
        </span>
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-0.5 rounded-md border text-[11px] font-semibold transition-colors ${
                isActive
                  ? 'border-border-subtle dark:border-dark-border text-white bg-brand dark:bg-dark-brand shadow-sm'
                  : 'border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted hover:text-text-primary hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

