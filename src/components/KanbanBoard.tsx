import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnId, Issue } from '../types/issue';
import { KanbanColumn } from './KanbanColumn';
import { useStore } from '../store/useStore';
import { dataService } from '../services/dataService';
import { getActiveIssueRepository } from '../services/issueRepository';
import { githubService } from '../services/githubService';

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
  const queryClient = useQueryClient();
  const { 
    searchQuery, 
    activeFilter, 
    activeRepoId, 
    activeRepoFullName, 
    currentUserEmail, 
    userRole, 
    githubToken,
    selectedIssue,
    setSelectedIssue
  } = useStore();

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const issueId = Number(draggableId);
    const newStatus = destination.droppableId as ColumnId;
    const targetIssue = issues.find((i) => i.id === issueId);

    // 1. Actualización optimista SINCRÓNICA en React Query cache (0ms, sin parpadeo ni retorno)
    queryClient.setQueriesData<Issue[]>(
      { queryKey: ['issues'] },
      (old) => {
        if (!old) return old;
        const movingItem = old.find((i) => i.id === issueId);
        if (!movingItem) return old;
        const updatedItem = { ...movingItem, status: newStatus };
        const withoutMoving = old.filter((i) => i.id !== issueId);
        // Reinsertar preservando orden relativo al destino
        const destItems = withoutMoving.filter((i) => i.status === newStatus);
        const otherItems = withoutMoving.filter((i) => i.status !== newStatus);
        const clampedIdx = Math.min(Math.max(0, destination.index), destItems.length);
        destItems.splice(clampedIdx, 0, updatedItem);
        return [...otherItems, ...destItems];
      }
    );
    dataService.moveIssue(issueId, newStatus);
    if (selectedIssue?.id === issueId) {
      setSelectedIssue({ ...selectedIssue, status: newStatus });
    }

    // 2. Persistencia en base de datos Supabase Cloud en segundo plano
    const repo = getActiveIssueRepository(activeRepoId, currentUserEmail, userRole);
    try {
      await repo.move(issueId, newStatus);
    } catch (err) {
      console.warn('Notice al mover issue en Supabase:', err);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }

    // 3. Sincronización bidireccional con GitHub
    const targetRepo = targetIssue?.projectName || activeRepoFullName;
    const tok = githubToken || githubService.getToken();
    if (tok && targetRepo && targetRepo.includes('/')) {
      try {
        await githubService.updateGitHubIssue(
          targetRepo,
          issueId,
          {
            state: newStatus === 'done' ? 'closed' : 'open',
            state_reason: newStatus === 'done' ? 'completed' : undefined
          },
          tok
        );
      } catch (ghErr) {
        console.warn('Notice al sincronizar cambio de columna a GitHub:', ghErr);
      }
    }
  };

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
    <DragDropContext onDragEnd={handleDragEnd}>
      <main 
        id="board-container" 
        className="flex-1 min-h-0 overflow-y-auto md:overflow-y-hidden overflow-x-hidden md:overflow-x-auto p-3 pb-16 md:p-4 flex flex-col md:flex-row gap-3.5 bg-canvas dark:bg-dark-canvas touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
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
    </DragDropContext>
  );
};
