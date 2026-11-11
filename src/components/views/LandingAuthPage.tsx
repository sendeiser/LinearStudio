import React, { useState, useEffect } from 'react';
import { 
  Kanban, 
  Lock, 
  Mail, 
  User, 
  UserPlus, 
  LogIn, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  GitBranch, 
  Cloud, 
  Sun, 
  Moon,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { workspaceService } from '../../services/workspaceService';
import { supabase } from '../../lib/supabase';

export const LandingAuthPage: React.FC = () => {
  const { theme, toggleTheme, setCurrentUserEmail } = useStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'forgot' | 'new_password'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Escuchar eventos de recuperación de contraseña de Supabase Auth
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setActiveTab('new_password');
        setSuccessMsg('✓ Enlace de recuperación verificado. Establece tu nueva contraseña.');
      }
    });

    if (typeof window !== 'undefined' && (window.location.hash.includes('recovery') || window.location.hash.includes('type=recovery'))) {
      setActiveTab('new_password');
      setSuccessMsg('✓ Enlace de recuperación detectado. Establece tu nueva contraseña.');
    }

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    try {
      await workspaceService.resetPasswordForEmail(email.trim());
      setSuccessMsg('✓ Se ha enviado el enlace de recuperación a tu correo. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al solicitar recuperación de contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);
    try {
      const user = await workspaceService.updatePassword(password);
      setSuccessMsg('✓ ¡Contraseña actualizada con éxito! Ingresando al panel...');
      setTimeout(() => {
        setCurrentUserEmail(user.email || email.trim());
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const user = await workspaceService.signIn(email.trim(), password);
      setSuccessMsg('✓ Credenciales correctas. Ingresando al panel...');
      setTimeout(() => {
        setCurrentUserEmail(user.email || email.trim());
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    try {
      const user = await workspaceService.signUp(email.trim(), password, name.trim());
      setSuccessMsg('✓ ¡Cuenta creada con éxito! Ingresando al panel...');
      setTimeout(() => {
        setCurrentUserEmail(user.email || email.trim());
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-dark-canvas text-text-primary dark:text-dark-text flex flex-col justify-between selection:bg-brand selection:text-white">
      {/* Top Navbar */}
      <header className="w-full border-b border-border-subtle dark:border-dark-border bg-surface/80 dark:bg-dark-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand dark:bg-dark-brand text-white flex items-center justify-center font-bold shadow-sm">
              <Kanban className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight">Linear Studio</span>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-brand/10 dark:bg-dark-brand/20 text-brand dark:text-dark-brand border border-brand/20">
                Cloud
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-text-secondary dark:text-dark-text-muted">
              <Cloud className="w-3.5 h-3.5 text-brand" />
              <span>Base de Datos: boxtools (Supabase)</span>
            </span>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border-subtle dark:border-dark-border bg-surface dark:bg-dark-surface hover:bg-surface-subtle transition-colors text-text-secondary dark:text-dark-text-muted"
              title="Cambiar tema claro/oscuro"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Split */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left: Value Proposition */}
        <div className="flex-1 flex flex-col gap-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 dark:bg-dark-brand/20 border border-brand/20 text-brand dark:text-dark-brand text-xs font-semibold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plataforma Federada de Gestión & Automatización</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Control de Issues y Repositorios con{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand via-blue-600 to-indigo-500">
              Supabase Cloud
            </span>{' '}
            & IA.
          </h1>

          <p className="text-sm sm:text-base text-text-secondary dark:text-dark-text-muted leading-relaxed">
            Inicia sesión o regístrate para acceder a tu panel de control Kanban, sincronizar issues con GitHub y colaborar en tiempo real sobre la base de datos compartida de <strong className="text-text-primary dark:text-white">boxtools</strong>.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-brand">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">Triage Multi-Proyecto</span>
                <span className="text-[11px] text-text-secondary dark:text-dark-text-muted">
                  Gestiona boxtools, hyper-flow y repositorios cruzados.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">Sincronización GitHub</span>
                <span className="text-[11px] text-text-secondary dark:text-dark-text-muted">
                  API Key PAT, checklists y actualización bidireccional.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">Seguridad RLS Total</span>
                <span className="text-[11px] text-text-secondary dark:text-dark-text-muted">
                  Permisos por rol (Owner, Admin, Dev) en PostgreSQL.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs">Antigravity AI Bridge</span>
                <span className="text-[11px] text-text-secondary dark:text-dark-text-muted">
                  Skill oficial para resolver issues y crear PRs automáticos.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Auth Card (Login & Register Tabs) */}
        <div className="w-full max-w-md bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header Tabs */}
          <div className="grid grid-cols-2 border-b border-border-subtle dark:border-dark-border bg-surface-subtle/50 dark:bg-dark-surface-elevated/50 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'register'
                  ? 'bg-surface dark:bg-dark-surface text-brand dark:text-dark-brand shadow-sm border border-border-subtle'
                  : 'text-text-secondary dark:text-dark-text-muted hover:text-text-primary'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrarse</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'signin'
                  ? 'bg-surface dark:bg-dark-surface text-brand dark:text-dark-brand shadow-sm border border-border-subtle'
                  : 'text-text-secondary dark:text-dark-text-muted hover:text-text-primary'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
          </div>

          <div className="p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold">
                {activeTab === 'register' && 'Crear Cuenta en Supabase'}
                {activeTab === 'signin' && 'Bienvenido de nuevo'}
                {activeTab === 'forgot' && 'Recuperar Contraseña'}
                {activeTab === 'new_password' && 'Establecer Nueva Contraseña'}
              </h2>
              <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
                {activeTab === 'register' && 'Regístrate para colaborar de inmediato sin esperas de correo.'}
                {activeTab === 'signin' && 'Ingresa tus credenciales para acceder a tus tableros y proyectos.'}
                {activeTab === 'forgot' && 'Ingresa tu correo para recibir un enlace de restablecimiento de contraseña.'}
                {activeTab === 'new_password' && 'Define tu nueva contraseña segura para acceder a Linear Studio.'}
              </p>
            </div>

            {/* Error & Success Feedback */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      required
                      placeholder="ej: Martin Tincho"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="usuario@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-9 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Creando cuenta en Supabase...</span>
                  ) : (
                    <>
                      <span>Registrarse y Entrar al Panel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* SIGN IN FORM */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="usuario@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Tu contraseña registrada"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-9 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-brand hover:underline font-semibold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verificando credenciales...</span>
                  ) : (
                    <>
                      <span>Iniciar Sesión en Supabase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleResetRequest} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Correo Electrónico Registrado
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="usuario@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Enviando enlace...</span>
                  ) : (
                    <>
                      <span>Enviar Enlace de Recuperación</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-brand hover:underline font-semibold"
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </div>
              </form>
            )}

            {/* SET NEW PASSWORD FORM (Recovery Flow) */}
            {activeTab === 'new_password' && (
              <form onSubmit={handleSetNewPassword} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-9 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl pl-9 pr-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Guardando nueva contraseña...</span>
                  ) : (
                    <>
                      <span>Guardar Nueva Contraseña y Entrar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Toggle Helper text */}
            <div className="text-center pt-2 border-t border-border-subtle dark:border-dark-border text-xs text-text-secondary dark:text-dark-text-muted">
              {activeTab === 'register' ? (
                <span>
                  ¿Ya tienes una cuenta registrada?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-brand font-bold hover:underline"
                  >
                    Inicia Sesión aquí
                  </button>
                </span>
              ) : activeTab === 'signin' ? (
                <span>
                  ¿No tienes una cuenta aún?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-brand font-bold hover:underline"
                  >
                    Regístrate gratis
                  </button>
                </span>
              ) : (
                <span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-brand font-bold hover:underline"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border-subtle dark:border-dark-border py-4 text-center text-xs text-text-secondary dark:text-dark-text-muted">
        <p>
          Linear Studio • Conectado a Supabase Cloud (boxtools)
        </p>
      </footer>
    </div>
  );
};

