import { create } from 'zustand';
import { ColumnId, Issue } from '../types/issue';
import { antigravityService, AntigravityProgressState } from '../services/antigravityService';

export type ActiveView = 'board' | 'all_issues' | 'sprints' | 'team' | 'pull_requests' | 'projects_triage' | 'settings';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedIssue: Issue | null;
  setSelectedIssue: (issue: Issue | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;
  activeMobileCol: ColumnId;
  setActiveMobileCol: (col: ColumnId) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  dataMode: 'cloud';
  setDataMode: (mode: 'cloud') => void;
  currentUserEmail: string | null;
  setCurrentUserEmail: (email: string | null) => void;
  userRole: 'owner' | 'admin' | 'developer' | 'viewer';
  setUserRole: (role: 'owner' | 'admin' | 'developer' | 'viewer') => void;
  activeRepoFullName: string;
  setActiveRepoFullName: (name: string) => void;
  activeRepoId: string | null;
  setActiveRepoId: (id: string | null) => void;
  githubToken: string | null;
  setGithubToken: (token: string | null) => void;
  githubUser: { login: string; avatar_url: string; name?: string | null; public_repos?: number } | null;
  setGithubUser: (user: { login: string; avatar_url: string; name?: string | null; public_repos?: number } | null) => void;
  antigravityState: AntigravityProgressState;
  dispatchAntigravity: (issue: Issue) => void;
}

export const useStore = create<AppState>((set) => ({
  theme: (typeof window !== 'undefined' && (localStorage.getItem('theme') as 'light' | 'dark')) || 'light',
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: next };
    });
  },
  activeView: 'board',
  setActiveView: (view) => set({ activeView: view }),
  selectedIssue: null,
  setSelectedIssue: (issue) => set({ selectedIssue: issue }),
  isCreateModalOpen: false,
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  isAuthModalOpen: false,
  setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  isWorkspaceModalOpen: false,
  setIsWorkspaceModalOpen: (open) => set({ isWorkspaceModalOpen: open }),
  activeMobileCol: 'backlog',
  setActiveMobileCol: (col: ColumnId) => set({ activeMobileCol: col }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  activeFilter: 'all',
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  dataMode: 'cloud' as const,
  setDataMode: (_mode: 'cloud') => set({ dataMode: 'cloud' }),
  currentUserEmail: null,
  setCurrentUserEmail: (email) => set({ currentUserEmail: email }),
  userRole: 'admin',
  setUserRole: (role) => set({ userRole: role }),
  activeRepoFullName: 'tincho/hyper-flow',
  setActiveRepoFullName: (name) => set({ activeRepoFullName: name }),
  activeRepoId: null,
  setActiveRepoId: (id) => set({ activeRepoId: id }),
  githubToken: (typeof window !== 'undefined' && localStorage.getItem('github_token')) || null,
  setGithubToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('github_token', token);
      else localStorage.removeItem('github_token');
    }
    set({ githubToken: token });
  },
  githubUser: null,
  setGithubUser: (user) => set({ githubUser: user }),
  antigravityState: {
    isRunning: false,
    step: 'Idle',
    progress: 0,
    log: '',
    prReady: false
  },
  dispatchAntigravity: (issue) => {
    antigravityService.runTelemetryPipeline(issue, (progressState) => {
      set({ antigravityState: progressState });
    });
  }
}));
