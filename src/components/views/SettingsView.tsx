import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Cloud, 
  GitBranch, 
  Sun, 
  Moon, 
  Lock, 
  Mail, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  UserPlus,
  Shield,
  Database,
  Key,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  FolderGit2,
  GitPullRequest,
  Search,
  Globe,
  Star,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { workspaceService } from '../../services/workspaceService';
import { githubService, GitHubRepositoryItem, GitHubSyncResult } from '../../services/githubService';
import { useQueryClient } from '@tanstack/react-query';

export const SettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { 
    theme, 
    toggleTheme, 
    currentUserEmail, 
    setCurrentUserEmail,
    activeRepoFullName,
    setActiveRepoFullName,
    setActiveRepoId,
    setActiveView,
    githubToken,
    setGithubToken,
    githubUser,
    setGithubUser
  } = useStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repoInput, setRepoInput] = useState(activeRepoFullName);
  const [githubTokenInput, setGithubTokenInput] = useState(githubToken || '');
  const [showToken, setShowToken] = useState(false);
  const [validatingGh, setValidatingGh] = useState(false);
  const [syncingGh, setSyncingGh] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Repositorios de la cuenta de GitHub
  const [userRepos, setUserRepos] = useState<GitHubRepositoryItem[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [syncStats, setSyncStats] = useState<GitHubSyncResult | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);

  // Carga de repositorios desde la API de GitHub
  const loadUserRepos = async (token?: string) => {
    const tok = token || githubToken;
    if (!tok) return;
    setLoadingRepos(true);
    try {
      const repos = await githubService.getUserRepositories(tok);
      setUserRepos(repos);
      // Sugerir prioritariamente LinearStudio si está presente, o el primero de la lista
      if (repos.length > 0 && (!repoInput || repoInput === 'tincho/hyper-flow')) {
        const preferred = repos.find(r => r.full_name.toLowerCase().includes('linearstudio')) || repos[0];
        setRepoInput(preferred.full_name);
        setActiveRepoFullName(preferred.full_name);
      }
    } catch (err: any) {
      console.warn('Error al cargar repositorios de GitHub:', err);
    } finally {
      setLoadingRepos(false);
    }
  };

  // Validar y cargar repositorios en mount si el token ya está almacenado
  useEffect(() => {
    if (githubToken && !githubUser) {
      githubService.validateToken(githubToken)
        .then((user) => {
          setGithubUser(user);
          loadUserRepos(githubToken);
        })
        .catch(() => setGithubUser(null));
    } else if (githubToken && githubUser && userRepos.length === 0) {
      loadUserRepos(githubToken);
    }
  }, [githubToken, githubUser]);

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubTokenInput.trim()) {
      setFeedback({ type: 'error', text: 'Por favor ingresa un Personal Access Token (PAT) de GitHub válido.' });
      return;
    }

    setValidatingGh(true);
    setFeedback(null);
    setSyncStats(null);

    try {
      const user = await githubService.validateToken(githubTokenInput.trim());
      setGithubToken(githubTokenInput.trim());
      setGithubUser(user);
      setFeedback({ 
        type: 'success', 
        text: `✓ ¡GitHub vinculado con éxito como @${user.login} (${user.name || 'Usuario'})!` 
      });
      await loadUserRepos(githubTokenInput.trim());
    } catch (err: any) {
      setFeedback({ 
        type: 'error', 
        text: `Error al validar token de GitHub: ${err.message}` 
      });
    } finally {
      setValidatingGh(false);
    }
  };

  const handleDisconnectGithub = () => {
    setGithubToken(null);
    setGithubUser(null);
    setUserRepos([]);
    setSyncStats(null);
    setGithubTokenInput('');
    githubService.setToken('');
    setFeedback({ type: 'success', text: 'Token de GitHub desconectado.' });
  };

  const handleSyncGithubIssues = async (repoToSyncOverride?: string) => {
    const targetRepo = (repoToSyncOverride || repoInput).trim();
    if (!targetRepo.includes('/')) {
      setFeedback({ type: 'error', text: 'Especifica o selecciona un repositorio válido (owner/repo) para sincronizar.' });
      return;
    }

    setSyncingGh(true);
    setFeedback(null);
    setSyncStats(null);

    try {
      const result = await githubService.syncRepoIssuesToSupabase(targetRepo, githubToken || undefined);
      setSyncStats(result);
      setActiveRepoFullName(result.repoFullName);
      if (result.repositoryId) {
        setActiveRepoId(result.repositoryId);
      }
      queryClient.invalidateQueries({ queryKey: ['issues'] });

      if (result.syncedCount === 0) {
        setFeedback({ 
          type: 'success', 
          text: `✓ Sincronización finalizada: el repositorio ${result.repoFullName} no tiene issues en GitHub.` 
        });
      } else {
        setFeedback({ 
          type: 'success', 
          text: `✓ ¡${result.syncedCount} issues sincronizados exitosamente desde GitHub (${result.repoFullName}) a Supabase Cloud (${result.openCount} abiertos, ${result.closedCount} completados)!` 
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: `Error de sincronización con GitHub: ${err.message}` });
    } finally {
      setSyncingGh(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await workspaceService.signUp(email, password);
        setCurrentUserEmail(user.email || email);
        setFeedback({ type: 'success', text: '¡Usuario registrado e iniciado en Supabase Cloud con éxito!' });
      } else {
        const user = await workspaceService.signIn(email, password);
        setCurrentUserEmail(user.email || email);
        setFeedback({ type: 'success', text: 'Sesión iniciada correctamente en Supabase Cloud.' });
      }
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error de autenticación' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await workspaceService.signOut();
    } catch {
      // Safe fallback
    }
    setCurrentUserEmail(null);
    setFeedback({ type: 'success', text: 'Sesión cerrada en Supabase Cloud.' });
  };

  const handleSaveRepo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repoInput.includes('/')) {
      setFeedback({ type: 'error', text: 'El formato de repositorio debe ser: usuario/repositorio' });
      return;
    }
    setActiveRepoFullName(repoInput.trim());
    setFeedback({ type: 'success', text: `Repositorio activo configurado en ${repoInput.trim()}` });
  };

  // Filtrado de repositorios en el selector
  const filteredRepos = userRepos.filter((r) => 
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()))
  );

  const selectedRepoMeta = userRepos.find((r) => r.full_name.toLowerCase() === repoInput.trim().toLowerCase());

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas dark:bg-dark-canvas overflow-y-auto p-4 gap-4">
      {/* View Header */}
      <div className="p-4 bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 dark:bg-dark-brand/20 text-brand dark:text-dark-brand flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary dark:text-dark-text">Configuración del Sistema & Auth</h1>
            <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
              Administración de cuenta de Supabase, conexión de base de datos boxtools, temas y GitHub.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: User Auth & Account */}
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-dark-border pb-2.5">
            <span className="font-bold text-xs text-text-primary dark:text-dark-text flex items-center gap-2">
              <User className="w-4 h-4 text-brand dark:text-dark-brand" />
              <span>Cuenta de Usuario (Supabase Auth)</span>
            </span>
            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
              currentUserEmail ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-subtle text-text-muted'
            }`}>
              {currentUserEmail ? 'CONECTADO' : 'MODO LOCAL'}
            </span>
          </div>

          {currentUserEmail ? (
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-muted uppercase">Email Conectado</span>
                <span className="font-mono text-sm font-bold text-text-primary dark:text-dark-text truncate">
                  {currentUserEmail}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Sesión activa y sincronizada con la base de datos de boxtools.
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="py-2 px-3 rounded-lg border border-border-subtle hover:bg-surface text-urgent font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="flex flex-col gap-3 text-xs">
              <p className="text-text-secondary dark:text-dark-text-muted text-[11px] leading-relaxed">
                Inicia sesión o regístrate para sincronizar issues y colaborar en vivo con tu equipo en la base de datos de Supabase Cloud.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-brand dark:text-dark-brand hover:underline font-semibold text-[11px]"
                >
                  {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Conectando...</span>
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-3.5 h-3.5" /> Registrarse en Supabase
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión en Supabase
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Section 2: Database Connection & Mode */}
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-dark-border pb-2.5">
            <span className="font-bold text-xs text-text-primary dark:text-dark-text flex items-center gap-2">
              <Database className="w-4 h-4 text-brand dark:text-dark-brand" />
              <span>Base de Datos (Supabase Cloud — boxtools)</span>
            </span>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle flex flex-col gap-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Project Ref:</span>
                <span className="font-bold text-brand">ydoviusjpgmjsxpspexu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Host:</span>
                <span className="truncate max-w-[200px] text-text-secondary">https://ydoviusjpgmjsxpspexu.supabase.co</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Seguridad RLS:</span>
                <span className="text-emerald-600 font-bold">Activa (Prefijo ls_*)</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-text-secondary dark:text-dark-text-muted uppercase">
                Modo de Almacenamiento
              </span>
              <div className="p-2.5 rounded-lg border border-brand/30 bg-brand/5 dark:bg-dark-brand/10 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-brand dark:text-dark-brand shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-text-primary dark:text-dark-text">
                    Supabase Cloud Exclusivo (boxtools)
                  </span>
                  <span className="text-[10px] text-text-secondary dark:text-dark-text-muted">
                    Sincronización en vivo con base de datos compartida y seguridad RLS.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: GitHub Integration & API Key */}
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-dark-border pb-2.5">
            <span className="font-bold text-xs text-text-primary dark:text-dark-text flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-brand dark:text-dark-brand" />
              <span>Integración con GitHub & API Key</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              githubUser 
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
            }`}>
              {githubUser ? 'Conectado a GitHub' : 'Sin Token'}
            </span>
          </div>

          {/* Connected GitHub Profile Card */}
          {githubUser ? (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img 
                    src={githubUser.avatar_url} 
                    alt={githubUser.login} 
                    className="w-8 h-8 rounded-full border border-brand/30 shrink-0" 
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-text-primary dark:text-dark-text truncate">
                      {githubUser.name || githubUser.login}
                    </span>
                    <span className="font-mono text-[11px] text-brand truncate">
                      @{githubUser.login} • {userRepos.length > 0 ? `${userRepos.length} repos detectados` : `${githubUser.public_repos ?? 0} repos públicos`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadUserRepos()}
                    disabled={loadingRepos}
                    title="Recargar lista de repositorios desde GitHub"
                    className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface text-text-secondary hover:text-text-primary"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRepos ? 'animate-spin text-brand' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectGithub}
                    className="py-1 px-2.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold text-[11px] hover:bg-red-100"
                  >
                    Desconectar
                  </button>
                </div>
              </div>

              {/* Selector de Repositorios */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 uppercase tracking-wide">
                    <FolderGit2 className="w-3.5 h-3.5 text-brand" />
                    <span>Selector de Repositorios de GitHub</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManualInput(!isManualInput)}
                    className="text-[10px] text-brand hover:underline font-semibold"
                  >
                    {isManualInput ? '« Usar Selector de Repositorios' : 'Ingresar manual »'}
                  </button>
                </div>

                {isManualInput ? (
                  <div>
                    <input
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="usuario/repositorio (ej: sendeiser/LinearStudio)"
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:border-brand"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Búsqueda / Filtro de Repos */}
                    {userRepos.length > 5 && (
                      <div className="relative">
                        <Search className="w-3 h-3 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={repoSearch}
                          onChange={(e) => setRepoSearch(e.target.value)}
                          placeholder={`Filtrar entre tus ${userRepos.length} repositorios...`}
                          className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg pl-7 pr-3 py-1 text-xs outline-none focus:border-brand"
                        />
                      </div>
                    )}

                    {loadingRepos ? (
                      <div className="py-3 px-3 rounded-lg bg-surface-subtle border border-border-subtle flex items-center gap-2 text-xs text-text-secondary">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                        <span>Cargando tus repositorios desde la API de GitHub...</span>
                      </div>
                    ) : filteredRepos.length > 0 ? (
                      <select
                        value={repoInput}
                        onChange={(e) => {
                          setRepoInput(e.target.value);
                          setActiveRepoFullName(e.target.value);
                          setSyncStats(null);
                        }}
                        className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-2 font-mono text-xs outline-none focus:border-brand cursor-pointer text-text-primary dark:text-dark-text shadow-sm"
                      >
                        <option value="">-- Elige un repositorio de tu cuenta --</option>
                        {filteredRepos.map((r) => (
                          <option key={r.id} value={r.full_name}>
                            {r.private ? '🔒 [Privado]' : '🌐 [Público]'} {r.full_name} ({r.open_issues_count} issues abiertos)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex flex-col gap-1">
                        <span>No se encontraron repositorios con el filtro actual o tu token no tiene permisos de lectura de repositorios.</span>
                        <span className="text-[11px] opacity-80">Puedes usar la opción de ingreso manual arriba.</span>
                      </div>
                    )}

                    {/* Metadata Card del Repositorio Seleccionado */}
                    {selectedRepoMeta && (
                      <div className="p-2.5 rounded-lg border border-brand/30 bg-brand/5 dark:bg-dark-brand/10 flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold font-mono text-text-primary dark:text-dark-text truncate">
                            {selectedRepoMeta.private ? (
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="truncate">{selectedRepoMeta.full_name}</span>
                          </div>
                          <a
                            href={selectedRepoMeta.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand hover:underline flex items-center gap-0.5 text-[10px] shrink-0 font-medium"
                          >
                            <span>Abrir GitHub</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        {selectedRepoMeta.description && (
                          <p className="text-[11px] text-text-secondary dark:text-dark-text-muted line-clamp-2">
                            {selectedRepoMeta.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] font-mono text-text-secondary pt-0.5">
                          <span className="flex items-center gap-1 text-brand font-bold">
                            <GitPullRequest className="w-3 h-3" />
                            <span>{selectedRepoMeta.open_issues_count} issues en GitHub</span>
                          </span>
                          {selectedRepoMeta.stargazers_count !== undefined && selectedRepoMeta.stargazers_count > 0 && (
                            <span className="flex items-center gap-1 text-amber-500">
                              <Star className="w-3 h-3" />
                              <span>{selectedRepoMeta.stargazers_count}</span>
                            </span>
                          )}
                          <span>Rama: {selectedRepoMeta.default_branch || 'main'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Botones de Acción y Sincronización */}
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => handleSyncGithubIssues()}
                    disabled={syncingGh || !repoInput}
                    className="py-2 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingGh ? 'animate-spin' : ''}`} />
                    <span>{syncingGh ? 'Sincronizando con Supabase...' : `Sincronizar Issues de ${repoInput || 'Repositorio'}`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveRepo()}
                    className="py-2 px-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated hover:bg-surface border border-border-subtle text-text-primary dark:text-dark-text font-bold text-xs"
                  >
                    Guardar Activo
                  </button>

                  {syncStats && (
                    <button
                      type="button"
                      onClick={() => setActiveView('board')}
                      className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Ver en Tablero Activo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Formulario para vincular token si no está conectado */
            <form onSubmit={handleConnectGithub} className="flex flex-col gap-2 text-xs">
              <p className="text-text-secondary dark:text-dark-text-muted text-[11px] leading-relaxed">
                Vincula tu cuenta mediante un Personal Access Token (PAT). Una vez conectado, podrás seleccionar cualquiera de tus repositorios y sincronizar sus issues automáticamente.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-brand" />
                    <span>Personal Access Token (PAT) / API Key</span>
                  </span>
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline flex items-center gap-0.5 text-[10px]"
                  >
                    <span>Generar token</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    required
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx o github_pat_..."
                    value={githubTokenInput}
                    onChange={(e) => setGithubTokenInput(e.target.value)}
                    className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg pl-3 pr-9 py-1.5 font-mono text-xs outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={validatingGh}
                className="py-1.5 px-3 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm self-start flex items-center gap-1.5 disabled:opacity-50"
              >
                {validatingGh ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                <span>{validatingGh ? 'Validando con GitHub...' : 'Vincular API Key de GitHub'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Section 4: Visual Theme & Appearance */}
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-dark-border pb-2.5">
            <span className="font-bold text-xs text-text-primary dark:text-dark-text flex items-center gap-2">
              <Sun className="w-4 h-4 text-brand dark:text-dark-brand" />
              <span>Apariencia Visual & Tema</span>
            </span>
            <span className="font-mono text-[10px] text-text-secondary uppercase">
              {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
            </span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-text-primary dark:text-dark-text block">Alternancia de Tema Dual</span>
                <span className="text-[11px] text-text-secondary dark:text-dark-text-muted">
                  Tokens optimizados con tipografía Plus Jakarta Sans y JetBrains Mono.
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-border-subtle bg-surface-subtle dark:bg-dark-surface-elevated hover:border-brand transition-all flex items-center gap-2 font-bold text-xs"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-text-secondary" />
                    <span>Activar Oscuro</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Activar Claro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

