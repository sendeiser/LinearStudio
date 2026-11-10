import { create } from 'zustand';
import { ColumnId, Issue } from '../types/issue';

interface AntigravityState {
  isRunning: boolean;
  step: string;
  progress: number;
  log: string;
  prReady: boolean;
}

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
  antigravityState: AntigravityState;
  dispatchAntigravity: (issue: Issue) => void;
}

export const useStore = create<AppState>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
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
    set({
      antigravityState: {
        isRunning: true,
        step: 'Analizando AST & Dependencias (1/3)',
        progress: 35,
        log: `$ agy inspect --target issue/#${issue.id}`,
        prReady: false
      }
    });

    setTimeout(() => {
      set({
        antigravityState: {
          isRunning: true,
          step: 'Ejecutando suite TDD Playwright (2/3)',
          progress: 70,
          log: `$ npx playwright test tests/issue-${issue.id}.spec.ts`,
          prReady: false
        }
      });
    }, 1200);

    setTimeout(() => {
      set({
        antigravityState: {
          isRunning: false,
          step: `✓ Pull Request #${issue.id + 10} Creado`,
          progress: 100,
          log: `$ git push origin branch-${issue.id} && gh pr create --fill`,
          prReady: true
        }
      });
    }, 2400);
  }
}));

