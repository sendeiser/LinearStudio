import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { FilterBar } from './components/FilterBar';
import { MobileColTabs } from './components/MobileColTabs';
import { KanbanBoard } from './components/KanbanBoard';
import { IssueDetailDrawer } from './components/IssueDetailDrawer';
import { CreateIssueModal } from './components/CreateIssueModal';
import { useStore } from './store/useStore';
import { dataService } from './services/dataService';
import { ColumnId } from './types/issue';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const { theme, isCreateModalOpen, setIsCreateModalOpen, selectedIssue, setSelectedIssue } = useStore();

  // Sync theme class on <html> on mount & theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Global keyboard shortcuts (C to create issue, Esc to close modal/drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      } else if (e.key === 'Escape') {
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
        } else if (selectedIssue) {
          setSelectedIssue(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, selectedIssue, setIsCreateModalOpen, setSelectedIssue]);

  // Fetch issues via TanStack React Query
  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => dataService.getIssues()
  });

  // Calculate counts per column for mobile tabs
  const counts: Record<ColumnId, number> = {
    backlog: issues.filter((i) => i.status === 'backlog').length,
    todo: issues.filter((i) => i.status === 'todo').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    in_review: issues.filter((i) => i.status === 'in_review').length,
    done: issues.filter((i) => i.status === 'done').length
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas dark:bg-dark-canvas text-text-primary dark:text-dark-text antialiased">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Topbar />
        <MobileColTabs counts={counts} />
        <FilterBar />

        {/* Board and Drawer Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
          <KanbanBoard issues={issues} />
          <IssueDetailDrawer />
        </div>
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['issues'] });
        }}
      />
    </div>
  );
};

export default App;

