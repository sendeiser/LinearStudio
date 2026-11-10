import { create } from 'zustand';
import { ColumnId, Issue } from '../types/issue';
import { antigravityService, AntigravityProgressState } from '../services/antigravityService';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
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
  dataMode: 'local' | 'cloud';
  setDataMode: (mode: 'local' | 'cloud') => void;
  currentUserEmail: string | null;
  setCurrentUserEmail: (email: string | null) => void;
  activeRepoFullName: string;
  setActiveRepoFullName: (name: string) => void;
  activeRepoId: string | null;
  setActiveRepoId: (id: string | null) => void;
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
  dataMode: (typeof window !== 'undefined' && (localStorage.getItem('data_mode') as 'local' | 'cloud')) || 'local',
  setDataMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('data_mode', mode);
    }
    set({ dataMode: mode });
  },
  currentUserEmail: null,
  setCurrentUserEmail: (email) => set({ currentUserEmail: email }),
  activeRepoFullName: 'tincho/hyper-flow',
  setActiveRepoFullName: (name) => set({ activeRepoFullName: name }),
  activeRepoId: null,
  setActiveRepoId: (id) => set({ activeRepoId: id }),
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
