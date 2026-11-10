import React from 'react';
import { 
  Kanban, 
  ListTodo, 
  Flag, 
  GitPullRequest, 
  Settings, 
  Plus, 
  Layers, 
  ChevronsUpDown, 
  LogOut, 
  Sparkles, 
  Cloud, 
  Users 
} from 'lucide-react';
import { useStore, ActiveView } from '../store/useStore';
import { workspaceService } from '../services/workspaceService';

export const Sidebar: React.FC = () => {
  const { 
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    setIsCreateModalOpen,
    setIsWorkspaceModalOpen,
    setIsAuthModalOpen,
    activeRepoFullName,
    currentUserEmail,
    setCurrentUserEmail,
    activeView,
    setActiveView
  } = useStore();

  const navItems = [
    { id: 'board' as ActiveView, label: 'Tablero Activo', icon: Kanban },
    { id: 'all_issues' as ActiveView, label: 'Todos los Issues', icon: ListTodo },
    { id: 'projects_triage' as ActiveView, label: 'Proyectos & Triage Global', icon: Layers, badge: 'MULTI' },
    { id: 'sprints' as ActiveView, label: 'Hitos & Sprints', icon: Flag },
    { id: 'team' as ActiveView, label: 'Equipo & Workspaces', icon: Users },
    { id: 'pull_requests' as ActiveView, label: 'Pull Requests', icon: GitPullRequest, badge: 3 },
    { id: 'settings' as ActiveView, label: 'Configuración & Auth', icon: Settings }
  ];

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
                  <Cloud className="w-2.5 h-2.5 text-brand" />
                  <span className="text-brand font-semibold">Supabase Cloud (boxtools)</span>
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-brand/10 dark:bg-dark-brand/20 text-brand dark:text-dark-brand font-bold shadow-sm'
                      : 'text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-bold bg-surface dark:bg-dark-surface border border-border-subtle text-done">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
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
                {currentUserEmail || 'Usuario Conectado'}
              </span>
              <span className="text-[10px] text-text-secondary dark:text-dark-text-muted truncate">
                Supabase Cloud (boxtools)
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                workspaceService.signOut().then(() => setCurrentUserEmail(null));
              }}
              className="text-text-muted hover:text-urgent p-1 rounded transition-colors" 
              title="Cerrar sesión e ir a la página principal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
