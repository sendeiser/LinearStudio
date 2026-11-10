import React, { useState } from 'react';
import { Users, UserPlus, Shield, Cloud, HardDrive, Building, Layers } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { workspaceService } from '../../services/workspaceService';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  avatar: string;
  status: 'active' | 'invited';
}

const DEFAULT_MEMBERS: Member[] = [
  { id: '1', name: 'Martin Tincho', email: 'tincho@hyperflow.dev', role: 'owner', avatar: 'MT', status: 'active' },
  { id: '2', name: 'Elena Kim', email: 'elena@hyperflow.dev', role: 'admin', avatar: 'EK', status: 'active' },
  { id: '3', name: 'Juan Díaz', email: 'juan@hyperflow.dev', role: 'developer', avatar: 'JD', status: 'active' },
  { id: '4', name: 'Alex Lee', email: 'alex@hyperflow.dev', role: 'developer', avatar: 'AL', status: 'active' }
];

export const TeamWorkspaceView: React.FC = () => {
  const { 
    currentUserEmail, 
    dataMode, 
    activeRepoFullName, 
    setIsAuthModalOpen,
    setIsWorkspaceModalOpen 
  } = useStore();

  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'developer' | 'viewer'>('developer');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    if (dataMode === 'cloud' && currentUserEmail) {
      try {
        await workspaceService.inviteMember('default-ws', inviteEmail, inviteRole);
        setFeedback(`✓ Invitación enviada con éxito a ${inviteEmail} en Supabase Cloud.`);
      } catch (err: any) {
        setFeedback(`Error: ${err.message}`);
      }
    } else {
      // Local addition
      const newMember: Member = {
        id: `mem_${Date.now()}`,
        name: inviteName.trim() || inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        avatar: (inviteName.trim() || inviteEmail).slice(0, 2).toUpperCase(),
        status: 'active'
      };
      setMembers([...members, newMember]);
      setFeedback(`✓ Miembro ${newMember.name} añadido al equipo.`);
    }

    setInviteName('');
    setInviteEmail('');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas dark:bg-dark-canvas overflow-y-auto p-4 gap-4">
      {/* Workspace Banner */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand dark:bg-dark-brand text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-text-primary dark:text-dark-text">Workspace: {activeRepoFullName}</h1>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1 ${
                dataMode === 'cloud'
                  ? 'bg-blue-100 dark:bg-blue-950/40 text-brand border-blue-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 border-emerald-300'
              }`}>
                {dataMode === 'cloud' ? <Cloud className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}
                {dataMode === 'cloud' ? 'Supabase Cloud (boxtools)' : 'Modo Local Activo'}
              </span>
            </div>
            <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
              Gestión de colaboradores, roles de acceso y vinculación de repositorios de GitHub.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dataMode === 'local' ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Conectar Supabase Cloud</span>
            </button>
          ) : (
            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle text-text-primary font-bold text-xs flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span>Cambiar Workspace</span>
            </button>
          )}
        </div>
      </div>

      {/* Invite Member Form */}
      <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-brand dark:text-dark-brand" />
            <span>Invitar Colaborador al Equipo</span>
          </span>
          {feedback && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded border border-emerald-200">
              {feedback}
            </span>
          )}
        </div>

        <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Nombre completo (ej: Laura Vega)"
            className="bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-3 py-2 text-text-primary dark:text-dark-text outline-none focus:border-brand"
          />
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="correo@hyperflow.dev"
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
            className="py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white font-bold shadow-sm flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Añadir al Equipo</span>
          </button>
        </form>
      </div>

      {/* Team Members List */}
      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border-subtle dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-3 bg-surface-subtle/50 dark:bg-dark-surface-elevated/50 border-b border-border-subtle dark:border-dark-border flex items-center justify-between text-xs">
          <span className="font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand dark:text-dark-brand" />
            <span>Miembros del Equipo ({members.length})</span>
          </span>
        </div>

        <div className="divide-y divide-border-subtle dark:divide-dark-border">
          {members.map((member) => (
            <div key={member.id} className="p-3.5 flex items-center justify-between hover:bg-surface-subtle/40 dark:hover:bg-dark-surface-elevated/40 transition-colors text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-brand/20 text-brand dark:text-dark-brand flex items-center justify-center font-bold text-xs shrink-0">
                  {member.avatar}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary dark:text-dark-text truncate">{member.name}</span>
                    {member.role === 'owner' && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[9px] font-mono border border-amber-300">
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
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted">
                  {member.role.toUpperCase()}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Activo" />
              </div>
            </div>
          ))}
        </div>
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
            <span>Invitar y remover miembros, vincular nuevos repositorios y cambiar configuraciones de IA.</span>
          </div>
          <div className="p-2.5 rounded bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle">
            <span className="font-bold text-text-primary dark:text-dark-text block mb-1">💻 Developer</span>
            <span>Crear y mover issues, marcar subtareas, comentar y despachar agentes Antigravity.</span>
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
