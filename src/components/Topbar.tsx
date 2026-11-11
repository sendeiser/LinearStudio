import React, { useEffect, useRef } from 'react';
import { Menu, Search, Sun, Moon, RefreshCw, Plus, Cloud, HardDrive } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { githubService } from '../services/githubService';

export const Topbar: React.FC = () => {
  const queryClient = useQueryClient();
  const { 
    theme, 
    toggleTheme, 
    setIsMobileMenuOpen, 
    setIsCreateModalOpen,
    setIsAuthModalOpen,
    setIsWorkspaceModalOpen,
    searchQuery,
    setSearchQuery,
    activeRepoFullName,
    dataMode,
    githubToken
  } = useStore();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSync = async () => {
    const tok = githubToken || githubService.getToken();
    if (!tok) {
      alert('Para sincronizar con GitHub, ingresa tu GitHub PAT en "Configuración & Auth".');
      return;
    }
    if (!activeRepoFullName || !activeRepoFullName.includes('/')) {
      alert('Selecciona un repositorio válido en formato owner/repo para sincronizar.');
      return;
    }
    setIsSyncing(true);
    try {
      await githubService.syncRepoIssuesToSupabase(activeRepoFullName, tok);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (err: any) {
      console.error('Error al sincronizar issues:', err);
      alert(`Error al sincronizar con GitHub: ${err.message || 'Verifica tu conexión y permisos del token'}`);
    } finally {
      setIsSyncing(false);
    }
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
          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            className="font-bold text-xs md:text-sm text-text-primary dark:text-dark-text hover:text-brand dark:hover:text-dark-brand truncate transition-colors text-left"
            title="Cambiar repositorio o workspace"
          >
            {activeRepoFullName}
          </button>
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted">
            main
          </span>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
              dataMode === 'cloud'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-brand dark:text-dark-brand border-blue-200 dark:border-blue-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
            title="Clic para cambiar entre Modo Local y Supabase Cloud"
          >
            {dataMode === 'cloud' ? (
              <>
                <Cloud className="w-3 h-3 text-brand" /> boxtools Cloud
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3 text-emerald-500" /> Modo Local
              </>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-xs hidden sm:flex items-center ml-3">
          <Search className="w-4 h-4 absolute left-2.5 text-text-muted pointer-events-none" />
          <input 
            ref={searchInputRef}
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
