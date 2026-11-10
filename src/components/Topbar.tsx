import React from 'react';
import { Menu, Search, Sun, Moon, RefreshCw, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Topbar: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    setIsMobileMenuOpen, 
    setIsCreateModalOpen,
    searchQuery,
    setSearchQuery 
  } = useStore();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <header className="h-14 px-3 md:px-5 bg-surface dark:bg-dark-surface border-b border-border-subtle dark:border-dark-border flex items-center justify-between shrink-0 z-30 shadow-sm">
      {/* Left: Mobile Menu & Project Info */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-xs md:text-sm text-text-primary dark:text-dark-text truncate">
            tincho / hyper-flow
          </span>
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted">
            main
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-xs hidden sm:flex items-center ml-3">
          <Search className="w-4 h-4 absolute left-2.5 text-text-muted pointer-events-none" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar issues (Ctrl+K)..." 
            className="w-full bg-canvas dark:bg-dark-canvas text-text-primary dark:text-dark-text placeholder:text-text-muted text-xs pl-8 pr-12 py-1.5 rounded-lg border border-border-subtle dark:border-dark-border focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
          />
          <kbd className="absolute right-2 font-mono text-[9px] bg-surface dark:bg-dark-surface px-1 py-0.5 rounded border border-border-subtle dark:border-dark-border text-text-muted">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Toggle (Light ↔ Dark) */}
        <button 
          data-testid="theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border transition-all flex items-center justify-center"
          title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          aria-label="Cambiar tema"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-text-secondary" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Sync Button */}
        <button 
          onClick={handleSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border text-xs transition-all"
          title="Sincronizar con GitHub"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand' : ''}`} />
          <span className="hidden lg:inline font-mono text-[11px]">Sincronizar</span>
        </button>

        {/* New Issue Button */}
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand dark:hover:bg-dark-brand-hover text-white text-xs font-semibold shadow-sm active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Issue</span>
        </button>
      </div>
    </header>
  );
};

