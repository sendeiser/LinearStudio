import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Users, GitBranch, Check, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { workspaceService, WorkspaceSummary } from '../services/workspaceService';
import { isValidRepoName } from '../services/authHelpers';

export const WorkspaceModal: React.FC = () => {
  const queryClient = useQueryClient();
  const { 
    isWorkspaceModalOpen, 
    setIsWorkspaceModalOpen, 
    currentUserEmail, 
    setIsAuthModalOpen,
    activeRepoId,
    setActiveRepoId,
    setActiveRepoFullName
  } = useStore();

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newRepoFullName, setNewRepoFullName] = useState('tincho/hyper-flow');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [selectedWsForInvite, setSelectedWsForInvite] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWorkspaces = async () => {
    if (!currentUserEmail) return;
    setLoading(true);
    try {
      const list = await workspaceService.listWorkspaces();
      setWorkspaces(list);
      if (list.length > 0 && !activeRepoId && list[0].repos.length > 0) {
        setActiveRepoId(list[0].repos[0].id);
        setActiveRepoFullName(list[0].repos[0].fullName);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWorkspaceModalOpen && currentUserEmail) {
      loadWorkspaces();
    }
  }, [isWorkspaceModalOpen, currentUserEmail]);

  if (!isWorkspaceModalOpen) return null;

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!isValidRepoName(newRepoFullName)) {
      setStatusMsg({ type: 'error', text: 'Formato de repositorio inválido. Usa formato: usuario/repositorio' });
      return;
    }

    try {
      const createdRepoId = await workspaceService.createWorkspace(newWsName, newRepoFullName);
      setStatusMsg({ type: 'success', text: `¡Workspace y Repositorio creados en la BD de boxtools!` });
      setNewWsName('');
      setActiveRepoId(createdRepoId);
      setActiveRepoFullName(newRepoFullName);
      await loadWorkspaces();
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al crear workspace' });
    }
  };

  const handleInvite = async (e: React.FormEvent, wsId: string) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setStatusMsg(null);

    try {
      await workspaceService.inviteMember(wsId, inviteEmail, inviteRole);
      setStatusMsg({ type: 'success', text: `¡Invitación enviada a ${inviteEmail} con rol ${inviteRole}!` });
      setInviteEmail('');
      setSelectedWsForInvite(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al invitar miembro' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-xl shadow-flyout overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-12 px-4 bg-surface-subtle dark:bg-dark-surface-elevated border-b border-border-subtle dark:border-dark-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand dark:text-dark-brand" />
            <span className="font-bold text-xs text-text-primary dark:text-dark-text">
              Workspaces de Equipo (Supabase Cloud — boxtools)
            </span>
          </div>
          <button
            onClick={() => setIsWorkspaceModalOpen(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {!currentUserEmail ? (
            <div className="p-4 text-center flex flex-col items-center gap-3 bg-surface-subtle dark:bg-dark-surface-elevated rounded-lg border border-border-subtle dark:border-dark-border">
              <Users className="w-8 h-8 text-text-muted" />
              <p className="text-text-secondary dark:text-dark-text-muted">
                Debes iniciar sesión con Supabase Auth para gestionar workspaces y colaborar con tu equipo en la base de datos de boxtools.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsWorkspaceModalOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="py-1.5 px-3 rounded-lg bg-brand text-white font-bold text-xs shadow-sm"
              >
                Iniciar Sesión / Registrarse
              </button>
            </div>
          ) : (
            <>
              {statusMsg && (
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Workspaces List */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider">
                  Tus Workspaces Activos ({workspaces.length})
                </span>

                {loading ? (
                  <div className="p-3 text-center text-text-muted">Cargando workspaces...</div>
                ) : workspaces.length === 0 ? (
                  <div className="p-3 text-center text-text-muted border border-dashed border-border-subtle rounded-lg">
                    No tienes workspaces creados todavía. Crea uno a continuación.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workspaces.map((ws) => (
                      <div
                        key={ws.id}
                        className="p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary dark:text-dark-text">{ws.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-brand">
                              {ws.role}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedWsForInvite(selectedWsForInvite === ws.id ? null : ws.id)}
                            className="text-brand dark:text-dark-brand hover:underline text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" /> Invitar compañero
                          </button>
                        </div>

                        {/* Linked Repos */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {ws.repos.map((repo) => {
                            const isSelected = activeRepoId === repo.id;
                            return (
                              <button
                                key={repo.id}
                                type="button"
                                onClick={() => {
                                  setActiveRepoId(repo.id);
                                  setActiveRepoFullName(repo.fullName);
                                  queryClient.invalidateQueries({ queryKey: ['issues'] });
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 border transition-all ${
                                  isSelected
                                    ? 'bg-brand text-white border-brand shadow-sm font-bold'
                                    : 'bg-surface dark:bg-dark-surface border-border-subtle text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                <GitBranch className="w-3 h-3" />
                                <span>{repo.fullName}</span>
                                {isSelected && <Check className="w-3 h-3" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Invite Form Accordion */}
                        {selectedWsForInvite === ws.id && (
                          <form
                            onSubmit={(e) => handleInvite(e, ws.id)}
                            className="p-2.5 mt-1 rounded bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border flex flex-col gap-2 animate-in fade-in duration-150"
                          >
                            <span className="font-semibold text-[11px] text-text-primary dark:text-dark-text">
                              Invitar a un colaborador al workspace
                            </span>
                            <div className="flex gap-2">
                              <input
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="companero@ejemplo.com"
                                className="flex-1 bg-surface dark:bg-dark-surface border border-border-subtle rounded px-2.5 py-1 text-xs outline-none focus:border-brand"
                              />
                              <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as any)}
                                className="bg-surface dark:bg-dark-surface border border-border-subtle rounded px-2 py-1 text-xs outline-none focus:border-brand"
                              >
                                <option value="developer">Developer</option>
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <button
                                type="submit"
                                className="px-3 py-1 rounded bg-brand text-white font-bold text-xs shadow-sm hover:bg-brand-hover"
                              >
                                Invitar
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Workspace Form */}
              <form onSubmit={handleCreateWorkspace} className="pt-2 border-t border-border-subtle dark:border-dark-border flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Crear Nuevo Workspace y Vincular Repo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-0.5">
                      Nombre del Workspace *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="Ej: Core Team"
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-0.5">
                      Repositorio GitHub (owner/repo) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newRepoFullName}
                      onChange={(e) => setNewRepoFullName(e.target.value)}
                      placeholder="tincho/hyper-flow"
                      className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded px-2.5 py-1.5 text-xs outline-none focus:border-brand font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-1.5 px-3 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all self-end"
                >
                  <Plus className="w-3.5 h-3.5" /> Crear Workspace en Supabase
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

