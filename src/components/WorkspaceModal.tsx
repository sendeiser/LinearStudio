import React, { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Users, 
  UserPlus,
  UserMinus,
  GitBranch, 
  Check, 
  AlertCircle, 
  FolderGit2,
  Trash2,
  Loader2
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { workspaceService, WorkspaceSummary, WorkspaceMemberInfo } from '../services/workspaceService';
import { githubService, GitHubRepositoryItem } from '../services/githubService';
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
    setActiveRepoFullName,
    githubToken,
    githubUser
  } = useStore();

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newRepoFullName, setNewRepoFullName] = useState('');
  const [userRepos, setUserRepos] = useState<GitHubRepositoryItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [selectedWsForInvite, setSelectedWsForInvite] = useState<string | null>(null);

  // Members panel state per workspace
  const [selectedWsForMembers, setSelectedWsForMembers] = useState<string | null>(null);
  const [membersByWs, setMembersByWs] = useState<Record<string, WorkspaceMemberInfo[]>>({});
  const [loadingMembersWs, setLoadingMembersWs] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [deletingWsId, setDeletingWsId] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWorkspaces = async () => {
    if (!currentUserEmail) return;
    setLoading(true);
    try {
      const list = await workspaceService.listWorkspaces();
      setWorkspaces(list);
      const allRepos = list.flatMap((w) => w.repos);
      const currentExists = activeRepoId && allRepos.some((r) => r.id === activeRepoId);
      if (!currentExists) {
        if (allRepos.length > 0) {
          setActiveRepoId(allRepos[0].id);
          setActiveRepoFullName(allRepos[0].fullName);
        } else {
          setActiveRepoId(null);
          setActiveRepoFullName('Sin repositorio');
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceMembers = async (wsId: string) => {
    setLoadingMembersWs(wsId);
    try {
      const members = await workspaceService.listWorkspaceMembers(wsId);
      setMembersByWs((prev) => ({ ...prev, [wsId]: members }));
    } catch (err: any) {
      console.warn('Error cargando miembros:', err);
    } finally {
      setLoadingMembersWs(null);
    }
  };

  useEffect(() => {
    if (isWorkspaceModalOpen && currentUserEmail) {
      loadWorkspaces();
      if (githubToken) {
        githubService.getUserRepositories(githubToken)
          .then((repos) => setUserRepos(repos))
          .catch(() => setUserRepos([]));
      }
    }
  }, [isWorkspaceModalOpen, currentUserEmail, githubToken]);

  if (!isWorkspaceModalOpen) return null;

  const handleToggleMembers = async (wsId: string) => {
    if (selectedWsForMembers === wsId) {
      setSelectedWsForMembers(null);
      return;
    }
    setSelectedWsForMembers(wsId);
    await loadWorkspaceMembers(wsId);
  };

  const handleRemoveMember = async (wsId: string, member: WorkspaceMemberInfo) => {
    if (!window.confirm(`¿Eliminar a '${member.email}' del equipo de este workspace?`)) return;
    setRemovingMemberId(member.userId);
    setStatusMsg(null);
    try {
      await workspaceService.removeMember(wsId, member.userId);
      setMembersByWs((prev) => ({
        ...prev,
        [wsId]: (prev[wsId] || []).filter((m) => m.userId !== member.userId)
      }));
      setStatusMsg({ type: 'success', text: `✓ Miembro '${member.email}' eliminado del workspace.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al eliminar miembro' });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleDeleteWorkspace = async (ws: WorkspaceSummary) => {
    if (!window.confirm(`¿Eliminar el workspace '${ws.name}' y sus repositorios vinculados? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingWsId(ws.id);
    setStatusMsg(null);
    try {
      await workspaceService.deleteWorkspace(ws.id);
      const remainingList = await workspaceService.listWorkspaces();
      setWorkspaces(remainingList);

      const deletedRepoIds = new Set(ws.repos.map((r) => r.id));
      if (activeRepoId && deletedRepoIds.has(activeRepoId)) {
        const nextRepo = remainingList.flatMap((w) => w.repos)[0];
        if (nextRepo) {
          setActiveRepoId(nextRepo.id);
          setActiveRepoFullName(nextRepo.fullName);
        } else {
          setActiveRepoId(null);
          setActiveRepoFullName('Sin repositorio');
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['linked-repositories'] });
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
      setStatusMsg({ type: 'success', text: `✓ Workspace '${ws.name}' eliminado de Supabase Cloud.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error al eliminar workspace' });
    } finally {
      setDeletingWsId(null);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!isValidRepoName(newRepoFullName)) {
      setStatusMsg({ type: 'error', text: 'Formato de repositorio inválido. Usa formato: usuario/repositorio' });
      return;
    }

    try {
      const createdRepoId = await workspaceService.createWorkspace(newWsName, newRepoFullName);
      setStatusMsg({ type: 'success', text: `¡Workspace y Repositorio creados en Supabase!` });
      setNewWsName('');
      setNewRepoFullName('');
      setActiveRepoId(createdRepoId);
      setActiveRepoFullName(newRepoFullName);
      await loadWorkspaces();
      queryClient.invalidateQueries({ queryKey: ['linked-repositories'] });
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
      if (selectedWsForMembers === wsId) {
        await loadWorkspaceMembers(wsId);
      }
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
                    {workspaces.map((ws) => {
                      const isOwnerOrAdmin = ws.role === 'owner' || ws.role === 'admin';
                      const wsMembers = membersByWs[ws.id] || [];
                      const isMembersOpen = selectedWsForMembers === ws.id;

                      return (
                        <div
                          key={ws.id}
                          className="p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text-primary dark:text-dark-text">{ws.name}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-brand">
                                {ws.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleMembers(ws.id)}
                                className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                                  isMembersOpen
                                    ? 'bg-brand/10 border-brand text-brand'
                                    : 'border-border-subtle text-text-secondary hover:text-brand bg-surface dark:bg-dark-surface'
                                }`}
                                title="Ver o eliminar miembros del equipo"
                              >
                                <Users className="w-3 h-3" />
                                <span>Miembros</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedWsForInvite(selectedWsForInvite === ws.id ? null : ws.id)}
                                className="text-brand dark:text-dark-brand hover:underline text-[11px] font-semibold flex items-center gap-1"
                              >
                                <UserPlus className="w-3 h-3" /> Invitar compañero
                              </button>

                              {ws.role === 'owner' && (
                                <button
                                  type="button"
                                  disabled={deletingWsId === ws.id}
                                  onClick={() => handleDeleteWorkspace(ws)}
                                  className="p-1 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                                  title={`Eliminar workspace ${ws.name}`}
                                >
                                  {deletingWsId === ws.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Linked Repos */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {ws.repos.length > 0 ? (
                              ws.repos.map((repo) => {
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
                              })
                            ) : (
                              <span className="text-[11px] text-text-muted italic">
                                Sin repositorio vinculado
                              </span>
                            )}
                          </div>

                          {/* Workspace Members List Accordion */}
                          {isMembersOpen && (
                            <div className="p-2.5 mt-1 rounded bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border flex flex-col gap-1.5 animate-in fade-in duration-150">
                              <span className="font-semibold text-[11px] text-text-primary dark:text-dark-text flex items-center justify-between">
                                <span>Equipo del Workspace ({wsMembers.length})</span>
                                {loadingMembersWs === ws.id && <Loader2 className="w-3 h-3 animate-spin text-brand" />}
                              </span>

                              {loadingMembersWs === ws.id && wsMembers.length === 0 ? (
                                <span className="text-[11px] text-text-muted">Cargando miembros...</span>
                              ) : wsMembers.length === 0 ? (
                                <span className="text-[11px] text-text-muted">No se encontraron miembros.</span>
                              ) : (
                                <div className="divide-y divide-border-subtle dark:divide-dark-border">
                                  {wsMembers.map((member) => (
                                    <div key={member.id} className="py-1.5 flex items-center justify-between gap-2">
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-text-primary dark:text-dark-text truncate">
                                          {member.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-text-muted truncate">
                                          {member.email}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-text-secondary uppercase">
                                          {member.role}
                                        </span>
                                        {isOwnerOrAdmin && member.role !== 'owner' && (
                                          <button
                                            type="button"
                                            disabled={removingMemberId === member.userId}
                                            onClick={() => handleRemoveMember(ws.id, member)}
                                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                                            title={`Eliminar a ${member.email} del workspace`}
                                          >
                                            {removingMemberId === member.userId ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <UserMinus className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

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
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Create Workspace Form */}
              <form onSubmit={handleCreateWorkspace} className="pt-2 border-t border-border-subtle dark:border-dark-border flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Crear Nuevo Workspace y Vincular Repo
                  </span>
                  {githubUser && (
                    <span className="text-[10px] text-brand font-medium flex items-center gap-1">
                      <FolderGit2 className="w-3 h-3" /> @{githubUser.login}
                    </span>
                  )}
                </div>

                {/* Quick GitHub Repositories Dropdown */}
                {userRepos.length > 0 && (
                  <div className="p-2 rounded bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-text-secondary">
                      Seleccionar de tus repositorios de GitHub:
                    </span>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setNewRepoFullName(val);
                          const repoName = val.split('/')[1] || val;
                          if (!newWsName) setNewWsName(repoName);
                        }
                      }}
                      className="bg-canvas dark:bg-dark-canvas border border-border-subtle rounded px-2 py-1 text-xs font-mono outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="">-- Elige un repositorio para autocompletar --</option>
                      {userRepos.map((r) => (
                        <option key={r.id} value={r.full_name}>
                          {r.private ? '🔒' : '🌐'} {r.full_name} ({r.open_issues_count} issues)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                      placeholder="usuario/repositorio"
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
