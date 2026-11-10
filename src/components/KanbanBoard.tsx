import React from 'react';
import { ColumnId, Issue } from '../types/issue';
import { KanbanColumn } from './KanbanColumn';
import { useStore } from '../store/useStore';

interface KanbanBoardProps {
  issues: Issue[];
}

const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'Por Hacer' },
  { id: 'in_progress', title: 'En Progreso' },
  { id: 'in_review', title: 'En Revisión' },
  { id: 'done', title: 'Completado' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ issues }) => {
  const { searchQuery, activeFilter } = useStore();

  // Filter issues based on search & active filter chip
  const filteredIssues = issues.filter((issue) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchId = issue.id.toString().includes(q);
      const matchDesc = issue.description.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchDesc) return false;
    }

    // Filter Chips
    if (activeFilter === 'urgent') return issue.priority === 'urgent';
    if (activeFilter === 'bug') return issue.tags.includes('bug');
    if (activeFilter === 'frontend') return issue.tags.includes('frontend');
    if (activeFilter === 'security') return issue.tags.includes('security');

    return true;
  });

  return (
    <main 
      id="board-container" 
      className="flex-1 overflow-x-auto overflow-y-hidden p-3 md:p-4 flex flex-col md:flex-row gap-3.5 bg-canvas dark:bg-dark-canvas"
    >
      {COLUMNS.map((col) => {
        const colIssues = filteredIssues.filter((i) => i.status === col.id);
        return (
          <KanbanColumn 
            key={col.id} 
            id={col.id} 
            title={col.title} 
            issues={colIssues} 
          />
        );
      })}
    </main>
  );
};

