import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Cloud, 
  HardDrive, 
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
  Database
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { workspaceService } from '../../services/workspaceService';

export const SettingsView: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    dataMode, 
    setDataMode, 
    currentUserEmail, 
    setCurrentUserEmail,
    activeRepoFullName,
    setActiveRepoFullName
  } = useStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repoInput, setRepoInput] = useState(activeRepoFullName);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await workspaceService.signUp(email, password);
        setCurrentUserEmail(user.email || email);
        setDataMode('cloud');
        setFeedback({ type: 'success', text: '¡Usuario registrado e iniciado en Supabase Cloud con éxito!' });
      } else {
        const user = await workspaceService.signIn(email, password);
        setCurrentUserEmail(user.email || email);
        setDataMode('cloud');
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
    setDataMode('local');
    setFeedback({ type: 'success', text: 'Sesión cerrada. Has regresado al Modo Local / Offline.' });
  };

  const handleSaveRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.includes('/')) {
      setFeedback({ type: 'error', text: 'El formato de repositorio debe ser: usuario/repositorio' });
      return;
    }
    setActiveRepoFullName(repoInput.trim());
    setFeedback({ type: 'success', text: `Repositorio actualizado a ${repoInput.trim()}` });
  };

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
                Conmutar Modo de Almacenamiento
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDataMode('local')}
                  className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                    dataMode === 'local'
                      ? 'border-brand bg-brand text-white shadow-sm'
                      : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Modo Local</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDataMode('cloud')}
                  className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-bold text-xs transition-all ${
                    dataMode === 'cloud'
                      ? 'border-brand bg-brand text-white shadow-sm'
                      : 'border-border-subtle bg-surface text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Supabase Cloud</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: GitHub Integration */}
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-dark-border pb-2.5">
            <span className="font-bold text-xs text-text-primary dark:text-dark-text flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-brand dark:text-dark-brand" />
              <span>Repositorio Vinculado de GitHub</span>
            </span>
          </div>

          <form onSubmit={handleSaveRepo} className="flex flex-col gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                Coordenadas del Repositorio (owner/repo)
              </label>
              <input
                type="text"
                required
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:border-brand"
              />
            </div>

            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated hover:bg-surface border border-border-subtle text-text-primary font-bold text-xs self-start"
            >
              Guardar Repositorio
            </button>
          </form>
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

