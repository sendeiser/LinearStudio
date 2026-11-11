import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus,
  Shield, 
  Cloud, 
  Building, 
  Layers, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  GitBranch
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { workspaceService, WorkspaceSummary, WorkspaceMemberInfo } from '../../services/workspaceService';

export const TeamWorkspaceView: React.FC = () => {
  const { 
    currentUserEmail, 
    activeRepoId,
    activeRepoFullName, 
    setIsWorkspaceModalOpen 
  } = useStore();

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWorkspacesAndSelect = async () => {
    if (!currentUserEmail) return;
    try {
      const list = await workspaceService.listWorkspaces();
      setWorkspaces(list);
      if (list.length > 0) {
        // Preferir el workspace que contiene activeRepoId
        const matchingWs = activeRepoId
          ? list.find((w) => w.repos.some((r) => r.id === activeRepoId))
          : null;
        setSelectedWsId((prev) => matchingWs?.id || (prev && list.some((w) => w.id === prev) ? prev : list[0].id));
      } else {
        setSelectedWsId(null);
        setMembers([]);
      }
    } catch (err) {
      console.warn('Error cargando workspaces:', err);
    }
  };

  const loadMembers = async (wsId: string) => {
    setLoadingMembers(true);
    try {
      const list = await workspaceService.listWorkspaceMembers(wsId);
      setMembers(list);
    } catch (err: any) {
      console.warn('Error al cargar miembros:', err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadWorkspacesAndSelect();
  }, [currentUserEmail, activeRepoId]);

  useEffect(() => {
    if (selectedWsId) {
      loadMembers(selectedWsId);
    }
  }, [selectedWsId]);

  const activeWorkspace = workspaces.find((w) => w.id === selectedWsId);
  const canManageTeam = activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedWsId) return;
    setInviting(true);
    setFeedback(null);

    try {
      await workspaceService.inviteMember(selectedWsId, inviteEmail.trim(), inviteRole);
      setFeedback({ type: 'success', text: `✓ Colaborador ${inviteEmail.trim()} agregado al workspace.` });
      setInviteEmail('');
      await loadMembers(selectedWsId);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error al invitar miembro.' });
    } finally {
      setInviting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleRemoveMember = async (member: WorkspaceMemberInfo) => {
    if (!selectedWsId) return;
    if (!window.confirm(`¿Eliminar a '${member.email}' del workspace '${activeWorkspace?.name}'?`)) {
      return;
    }

    setRemovingUserId(member.userId);
    setFeedback(null);
    try {
      await workspaceService.removeMember(selectedWsId, member.userId);
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      setFeedback({ type: 'success', text: `✓ Miembro '${member.email}' eliminado del equipo.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'No se pudo eliminar al miembro.' });
    } finally {
      setRemovingUserId(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-canvas dark:bg-dark-canvas overflow-y-auto touch-pan-y p-4 pb-16 md:pb-4 gap-4">
      {/* Workspace Banner */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand dark:bg-dark-brand text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-text-primary dark:text-dark-text">
                Equipo de {activeWorkspace?.name || activeRepoFullName}
              </h1>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1 bg-blue-100 dark:bg-blue-950/40 text-brand border-blue-300">
                <Cloud className="w-2.5 h-2.5" />
                <span>Supabase Cloud Activo</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
              Gestión de miembros por workspace/repositorio: invitar colaboradores y revocar accesos en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {workspaces.length > 0 && (
            <select
              value={selectedWsId || ''}
              onChange={(e) => setSelectedWsId(e.target.value)}
              className="bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-text-primary dark:text-dark-text outline-none focus:border-brand cursor-pointer"
              title="Seleccionar workspace / repositorio"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} {ws.repos[0] ? `(${ws.repos[0].fullName})` : ''}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            className="py-1.5 px-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle text-text-primary font-bold text-xs flex items-center gap-1.5 hover:border-brand/40 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-brand" />
            <span>Gestionar Workspaces</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Active Workspace Linked Repos Indicator */}
      {activeWorkspace && (
        <div className="flex items-center gap-2 flex-wrap px-1 text-xs text-text-secondary">
          <span className="font-semibold">Repositorios en este workspace:</span>
          {activeWorkspace.repos.length > 0 ? (
            activeWorkspace.repos.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface dark:bg-dark-surface border border-border-subtle font-mono text-[11px] text-text-primary dark:text-dark-text"
              >
                <GitBranch className="w-3 h-3 text-brand" />
                {r.fullName}
              </span>
            ))
          ) : (
            <span className="italic text-text-muted">Ningún repositorio vinculado</span>
          )}
        </div>
      )}

      {/* Invite Member Form */}
      {canManageTeam && selectedWsId && (
        <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-brand dark:text-dark-brand" />
              <span>Invitar Colaborador al Workspace ({activeWorkspace?.name})</span>
            </span>
          </div>

          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email del usuario registrado..."
              className="bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
            >
              <option value="developer">Rol: Developer (Desarrollador)</option>
              <option value="admin">Rol: Admin (Administrador)</option>
              <option value="viewer">Rol: Viewer (Solo Lectura)</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white font-bold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{inviting ? 'Agregando...' : 'Añadir al Equipo'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border-subtle dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-3 bg-surface-subtle/50 dark:bg-dark-surface-elevated/50 border-b border-border-subtle dark:border-dark-border flex items-center justify-between text-xs">
          <span className="font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand dark:text-dark-brand" />
            <span>Miembros del Equipo ({members.length})</span>
          </span>
          {loadingMembers && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />}
        </div>

        {loadingMembers && members.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted">Cargando miembros del workspace...</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted">
            No hay miembros registrados o aún no seleccionaste un workspace.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle dark:divide-dark-border">
            {members.map((member) => {
              const avatar = (member.name || member.email).slice(0, 2).toUpperCase();
              const isSelf = currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase();

              return (
                <div
                  key={member.id}
                  className="p-3.5 flex items-center justify-between hover:bg-surface-subtle/40 dark:hover:bg-dark-surface-elevated/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand/20 text-brand dark:text-dark-brand flex items-center justify-center font-bold text-xs shrink-0">
                      {avatar}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary dark:text-dark-text truncate">
                          {member.name}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-subtle border border-border-subtle text-[9px] font-mono text-text-muted">
                            TÚ
                          </span>
                        )}
                        {member.role === 'owner' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[9px] font-mono border border-amber-300">
                            OWNER
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-secondary dark:text-dark-text-muted truncate font-mono">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted">
                      {member.role.toUpperCase()}
                    </span>

                    {(canManageTeam || isSelf) && member.role !== 'owner' && (
                      <button
                        type="button"
                        disabled={removingUserId === member.userId}
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-rose-50 dark:hover:bg-rose-950/40 text-text-muted hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                        title={`Eliminar a ${member.email} del workspace`}
                      >
                        {removingUserId === member.userId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}

                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Activo" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permissions Matrix Card */}
      <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-2.5 text-xs">
        <h3 className="font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-brand dark:text-dark-brand" />
          <span>Matriz de Permisos por Rol (RLS en Supabase Cloud)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] text-text-secondary dark:text-dark-text-muted">
          <div className="p-2.5 rounded bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle">
            <span className="font-bold text-text-primary dark:text-dark-text block mb-1">👑 Owner</span>
            <span>Control total de workspace, eliminación, facturación y gestión de administradores.</span>
          </div>
          <div className="p-2.5 rounded bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle">
            <span className="font-bold text-text-primary dark:text-dark-text block mb-1">🛡️ Admin</span>
            <span>Invitar y eliminar miembros, vincular repositorios y administrar issues.</span>
          </div>
          <div className="p-2.5 rounded bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle">
            <span className="font-bold text-text-primary dark:text-dark-text block mb-1">💻 Developer</span>
            <span>Crear, editar y mover issues, marcar subtareas y sincronizar con GitHub.</span>
          </div>
          <div className="p-2.5 rounded bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle">
            <span className="font-bold text-text-primary dark:text-dark-text block mb-1">👁️ Viewer</span>
            <span>Lectura de tableros, issues y comentarios. Sin permisos de escritura ni mutación.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
