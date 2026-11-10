import React, { useState } from 'react';
import { X, Lock, Mail, UserPlus, LogIn, LogOut, Cloud, HardDrive, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { workspaceService } from '../services/workspaceService';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    currentUserEmail, 
    setCurrentUserEmail,
    dataMode,
    setDataMode,
    setIsWorkspaceModalOpen
  } = useStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await workspaceService.signUp(email, password);
        setCurrentUserEmail(user.email || email);
        setDataMode('cloud');
        setSuccessMsg('¡Usuario registrado con éxito! Sesión iniciada en Supabase Cloud.');
      } else {
        const user = await workspaceService.signIn(email, password);
        setCurrentUserEmail(user.email || email);
        setDataMode('cloud');
        setSuccessMsg('Sesión iniciada correctamente.');
      }
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de autenticación');
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
    setSuccessMsg('Sesión cerrada. Has vuelto al Modo Local / Offline.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-xl shadow-flyout overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 bg-surface-subtle dark:bg-dark-surface-elevated border-b border-border-subtle dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand dark:text-dark-brand" />
            <span className="font-bold text-xs text-text-primary dark:text-dark-text">
              Autenticación & Almacenamiento (Supabase Cloud)
            </span>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Data Mode Switcher */}
        <div className="p-4 border-b border-border-subtle dark:border-dark-border bg-canvas dark:bg-dark-canvas/50 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider">
            Modo de Datos Activo
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDataMode('local')}
              className={`p-2.5 rounded-lg border flex flex-col items-start gap-1 transition-all ${
                dataMode === 'local'
                  ? 'border-brand bg-brand-subtle/30 dark:bg-dark-brand/20 ring-1 ring-brand'
                  : 'border-border-subtle dark:border-dark-border bg-surface dark:bg-dark-surface hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-text-primary dark:text-dark-text">
                <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Modo Local</span>
              </div>
              <span className="text-[10px] text-text-secondary dark:text-dark-text-muted leading-tight">
                Offline, sin login requerido.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDataMode('cloud')}
              className={`p-2.5 rounded-lg border flex flex-col items-start gap-1 transition-all ${
                dataMode === 'cloud'
                  ? 'border-brand bg-brand-subtle/30 dark:bg-dark-brand/20 ring-1 ring-brand'
                  : 'border-border-subtle dark:border-dark-border bg-surface dark:bg-dark-surface hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-text-primary dark:text-dark-text">
                <Cloud className="w-3.5 h-3.5 text-brand dark:text-dark-brand" />
                <span>Supabase Cloud</span>
              </div>
              <span className="text-[10px] text-text-secondary dark:text-dark-text-muted leading-tight">
                BD compartida con boxtools.
              </span>
            </button>
          </div>
        </div>

        {/* Form Body or Active Session View */}
        <div className="p-4 flex flex-col gap-3.5 text-xs">
          {currentUserEmail ? (
            <div className="flex flex-col gap-3 p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-secondary dark:text-dark-text-muted">
                  Usuario Autenticado:
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold">
                  Conectado
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-text-primary dark:text-dark-text truncate">
                {currentUserEmail}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border-subtle dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setIsWorkspaceModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs"
                >
                  Gestionar Workspaces
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="py-1.5 px-3 rounded-lg border border-border-subtle hover:bg-surface text-urgent font-bold text-xs flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Salir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {successMsg}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
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
                    className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-text-primary dark:text-dark-text focus:border-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-text-primary dark:text-dark-text focus:border-brand outline-none"
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
                className="w-full py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span>Procesando...</span>
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
      </div>
    </div>
  );
};

