import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { FilterBar } from './components/FilterBar';
import { MobileColTabs } from './components/MobileColTabs';
import { KanbanBoard } from './components/KanbanBoard';
import { IssueDetailDrawer } from './components/IssueDetailDrawer';
import { CreateIssueModal } from './components/CreateIssueModal';
import { AuthModal } from './components/AuthModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { AllIssuesView } from './components/views/AllIssuesView';
import { SprintsView } from './components/views/SprintsView';
import { TeamWorkspaceView } from './components/views/TeamWorkspaceView';
import { PullRequestsView } from './components/views/PullRequestsView';
import { MultiProjectTriageView } from './components/views/MultiProjectTriageView';
import { SettingsView } from './components/views/SettingsView';
import { LandingAuthPage } from './components/views/LandingAuthPage';
import { useStore } from './store/useStore';
import { ColumnId } from './types/issue';
import { supabase } from './lib/supabase';
import { workspaceService } from './services/workspaceService';
import { IssueRepository, SupabaseIssueRepository } from './services/issueRepository';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const { 
    theme, 
    activeView,
    isCreateModalOpen, 
    setIsCreateModalOpen, 
    selectedIssue, 
    setSelectedIssue,
    activeRepoId,
    setActiveRepoId,
    setActiveRepoFullName,
    currentUserEmail,
    setCurrentUserEmail
  } = useStore();

  const [authChecked, setAuthChecked] = useState(false);

  // Sync theme class on <html> on mount & theme change
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth session bootstrap & listener
  useEffect(() => {
    workspaceService.getCurrentUser().then((user) => {
      if (user?.email) {
        setCurrentUserEmail(user.email);
        workspaceService.listWorkspaces().then((list) => {
          if (list.length > 0 && !activeRepoId && list[0].repos.length > 0) {
            setActiveRepoId(list[0].repos[0].id);
            setActiveRepoFullName(list[0].repos[0].fullName);
          }
        });
      }
      setAuthChecked(true);
    }).catch(() => {
      setAuthChecked(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email || null;
      setCurrentUserEmail(email);
      if (email) {
        workspaceService.listWorkspaces().then((list) => {
          if (list.length > 0 && !activeRepoId && list[0].repos.length > 0) {
            setActiveRepoId(list[0].repos[0].id);
            setActiveRepoFullName(list[0].repos[0].fullName);
          }
        });
      }
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [setCurrentUserEmail, activeRepoId, queryClient]);

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

  // Issue repository selection: Exclusivamente Supabase Cloud
  const getRepository = (): IssueRepository => {
    return new SupabaseIssueRepository(supabase, activeRepoId || '', {
      name: currentUserEmail ? currentUserEmail.split('@')[0] : 'Developer',
      role: 'developer'
    });
  };

  // Fetch issues via TanStack React Query from Supabase Cloud
  const { data: issues = [] } = useQuery({
    queryKey: ['issues', activeRepoId, currentUserEmail],
    queryFn: async () => {
      try {
        return await getRepository().list();
      } catch (e) {
        console.warn('Supabase fetch notice:', e);
        return [];
      }
    }
  });

  // Calculate counts per column for mobile tabs
  const counts: Record<ColumnId, number> = {
    backlog: issues.filter((i) => i.status === 'backlog').length,
    todo: issues.filter((i) => i.status === 'todo').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    in_review: issues.filter((i) => i.status === 'in_review').length,
    done: issues.filter((i) => i.status === 'done').length
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'board':
        return (
          <>
            <MobileColTabs counts={counts} />
            <FilterBar />
            <div className="flex-1 flex overflow-hidden relative">
              <KanbanBoard issues={issues} />
              <IssueDetailDrawer />
            </div>
          </>
        );
      case 'all_issues':
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <AllIssuesView issues={issues} />
            <IssueDetailDrawer />
          </div>
        );
      case 'sprints':
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <SprintsView issues={issues} />
            <IssueDetailDrawer />
          </div>
        );
      case 'team':
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <TeamWorkspaceView />
            <IssueDetailDrawer />
          </div>
        );
      case 'pull_requests':
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <PullRequestsView />
            <IssueDetailDrawer />
          </div>
        );
      case 'projects_triage':
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <MultiProjectTriageView issues={issues} />
            <IssueDetailDrawer />
          </div>
        );
      case 'settings':
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <SettingsView />
            <IssueDetailDrawer />
          </div>
        );
      default:
        return null;
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-dark-canvas flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-text-secondary">Conectando con Supabase Cloud (boxtools)...</span>
        </div>
      </div>
    );
  }

  // Página principal de Registro e Inicio de Sesión: no permite entrar al panel hasta autenticarse
  if (!currentUserEmail) {
    return <LandingAuthPage />;
  }

  // Panel principal autenticado
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas dark:bg-dark-canvas text-text-primary dark:text-dark-text antialiased">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Topbar />
        {renderActiveView()}
      </div>

      {/* Modals */}
      <CreateIssueModal
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['issues'] });
        }}
      />
      <AuthModal />
      <WorkspaceModal />
    </div>
  );
};

export default App;
