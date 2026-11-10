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
  activeMobileCol: ColumnId;
  setActiveMobileCol: (col: ColumnId) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
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
  activeMobileCol: 'backlog',
  setActiveMobileCol: (col) => set({ activeMobileCol: col }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  activeFilter: 'all',
  setActiveFilter: (filter) => set({ activeFilter: filter }),
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

