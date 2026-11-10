import React from 'react';
import { 
  Kanban, 
  ListTodo, 
  Flag, 
  GitPullRequest, 
  Settings, 
  Plus, 
  Bot, 
  ChevronsUpDown, 
  LogOut,
  Sparkles,
  Cloud,
  HardDrive,
  Users
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const Sidebar: React.FC = () => {
  const { 
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    setIsCreateModalOpen,
    setIsWorkspaceModalOpen,
    setIsAuthModalOpen,
    activeRepoFullName,
    dataMode,
    currentUserEmail
  } = useStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface dark:bg-dark-surface border-r border-border-subtle dark:border-dark-border flex flex-col justify-between p-3.5 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:z-20 transition-transform duration-200 ease-in-out shrink-0 shadow-lg md:shadow-none`}
      >
        <div className="flex flex-col gap-3.5">
          {/* Workspace & Repo Header */}
          <div 
            onClick={() => setIsWorkspaceModalOpen(true)}
            className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border hover:border-brand/40 transition-colors cursor-pointer group"
            title="Cambiar o crear Workspace en Supabase"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-brand dark:bg-dark-brand text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {activeRepoFullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-text-primary dark:text-dark-text truncate">
                  {activeRepoFullName}
                </span>
                <span className="font-mono text-[10px] text-text-secondary dark:text-dark-text-muted flex items-center gap-1">
                  {dataMode === 'cloud' ? (
                    <>
                      <Cloud className="w-2.5 h-2.5 text-brand" />
                      <span className="text-brand font-semibold">Supabase (boxtools)</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="w-2.5 h-2.5 text-emerald-500" />
                      <span>Modo Local</span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-text-muted group-hover:text-text-primary" />
          </div>

          {/* Quick Action Button */}
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand dark:hover:bg-dark-brand-hover text-white text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Issue</span>
            <kbd className="ml-auto font-mono text-[10px] bg-white/20 px-1 rounded text-white font-medium">C</kbd>
          </button>

          {/* Main Views Navigation */}
          <nav className="flex flex-col gap-0.5 text-xs font-medium">
            <span className="text-[10px] font-bold text-text-secondary dark:text-dark-text-muted px-2.5 py-1 uppercase tracking-wider">
              Vistas
            </span>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand/10 dark:bg-dark-brand/20 text-brand dark:text-dark-brand font-semibold">
              <Kanban className="w-4 h-4" />
              <span className="flex-1">Tablero Activo</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated transition-colors">
              <ListTodo className="w-4 h-4" />
              <span className="flex-1">Todos los Issues</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated transition-colors">
              <Flag className="w-4 h-4" />
              <span className="flex-1">Hitos & Sprints</span>
            </a>
            <a 
              onClick={(e) => { e.preventDefault(); setIsWorkspaceModalOpen(true); }}
              href="#" 
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="flex-1">Equipo & Workspaces</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated transition-colors">
              <GitPullRequest className="w-4 h-4" />
              <span className="flex-1">Pull Requests</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-done font-bold">3</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
              <Bot className="w-4 h-4" />
              <span className="flex-1">Antigravity Copilot</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">AI</span>
            </a>
            <a 
              onClick={(e) => { e.preventDefault(); setIsAuthModalOpen(true); }}
              href="#" 
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="flex-1">Configuración & Auth</span>
            </a>
          </nav>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border-subtle dark:border-dark-border text-xs">
          <div className="flex items-center justify-between px-2 py-1 text-text-secondary dark:text-dark-text-muted">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" /> AGY: Conectado
            </span>
            <kbd className="font-mono text-[10px] bg-surface-subtle dark:bg-dark-surface-elevated px-1 py-0.5 rounded border border-border-subtle dark:border-dark-border">⌘K</kbd>
          </div>
          
          {/* User Account Tile */}
          <div 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border hover:border-brand/40 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-brand/10 dark:bg-dark-brand/20 border border-brand/30 text-brand dark:text-dark-brand flex items-center justify-center font-bold text-xs">
              {currentUserEmail ? currentUserEmail.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-text-primary dark:text-dark-text truncate">
                {currentUserEmail || 'TinChoX (Local)'}
              </span>
              <span className="text-[10px] text-text-secondary dark:text-dark-text-muted truncate">
                {currentUserEmail ? 'Supabase Conectado' : 'Clic para conectar Supabase'}
              </span>
            </div>
            <button className="text-text-muted group-hover:text-text-primary" title="Gestionar cuenta">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
