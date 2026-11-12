import type { SupabaseClient, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { slugify, friendlyAuthError } from './authHelpers';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
  repos: Array<{
    id: string;
    fullName: string;
    defaultBranch: string;
  }>;
}

export interface WorkspaceMemberInfo {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  joinedAt: string;
}

export interface RegisteredUserOption {
  id: string;
  email: string;
  name: string;
  alreadyMember: boolean;
}

export class WorkspaceService {
  constructor(private readonly client: SupabaseClient = supabase) {}

  public async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(friendlyAuthError(error.message));
    }
    if (!data.user) {
      throw new Error('No se pudo obtener la información del usuario tras iniciar sesión.');
    }
    return data.user;
  }

  public async signUp(email: string, password: string, name?: string): Promise<User> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0]
        }
      }
    });
    if (error) {
      throw new Error(friendlyAuthError(error.message));
    }
    if (!data.user) {
      throw new Error('No se pudo registrar el usuario.');
    }
    return data.user;
  }

  public async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  }

  public async updatePassword(newPassword: string): Promise<User> {
    const cleanPassword = newPassword.trim();
    if (cleanPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const { data, error } = await this.client.auth.updateUser({
      password: cleanPassword
    });

    if (error) {
      throw new Error(friendlyAuthError(error.message));
    }

    if (!data.user) {
      throw new Error('No se pudo actualizar la contraseña del usuario.');
    }

    return data.user;
  }

  public async resetPasswordForEmail(email: string): Promise<void> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Ingresa un correo electrónico válido.');
    }

    const { error } = await this.client.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#recovery` : undefined
    });

    if (error) {
      throw new Error(friendlyAuthError(error.message));
    }
  }

  public async createWorkspace(name: string, repoFullName: string): Promise<string> {
    const cleanName = name.trim();
    const slug = slugify(cleanName);
    if (!slug) {
      throw new Error('El nombre del workspace debe contener caracteres válidos.');
    }

    const { data, error } = await this.client.rpc('ls_create_workspace', {
      p_name: cleanName,
      p_slug: slug,
      p_repo_full_name: repoFullName.trim()
    });

    if (error) {
      throw new Error(error.message);
    }
    return data as string; // returns created repo UUID
  }

  public async listWorkspaces(): Promise<WorkspaceSummary[]> {
    // Queries workspaces and linked repositories via membership
    const { data, error } = await this.client
      .from('ls_workspaces')
      .select(`
        id,
        name,
        slug,
        ls_workspace_members (
          role,
          user_id
        ),
        ls_linked_repositories (
          id,
          full_name,
          default_branch
        )
      `);

    if (error) {
      throw new Error(error.message);
    }

    const user = await this.getCurrentUser();
    const userId = user?.id;

    return (data || []).map((ws: any) => {
      const myMembership = (ws.ls_workspace_members || []).find((m: any) => m.user_id === userId);
      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        role: myMembership?.role || 'member',
        repos: (ws.ls_linked_repositories || []).map((r: any) => ({
          id: r.id,
          fullName: r.full_name,
          defaultBranch: r.default_branch
        }))
      };
    });
  }

  public async inviteMember(workspaceId: string, email: string, role: string = 'developer'): Promise<string> {
    const { data, error } = await this.client.rpc('ls_add_member_by_email', {
      p_workspace: workspaceId,
      p_email: email.trim(),
      p_role: role
    });

    if (error) {
      throw new Error(error.message);
    }
    return data as string;
  }

  public async listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberInfo[]> {
    const { data, error } = await this.client.rpc('ls_list_workspace_members', {
      p_workspace: workspaceId
    });

    if (error || !data) {
      if (error) console.warn('Error al listar miembros:', error.message);
      return [];
    }

    return (data as any[]).map((m) => ({
      id: m.id,
      userId: m.user_id,
      email: m.email,
      name: m.name,
      role: m.role,
      joinedAt: m.joined_at
    }));
  }

  public async listRegisteredUsers(workspaceId?: string | null): Promise<RegisteredUserOption[]> {
    const { data, error } = await this.client.rpc('ls_list_registered_users', {
      p_workspace: workspaceId || null
    });

    if (error || !data) {
      if (error) console.warn('Error al listar usuarios registrados:', error.message);
      return [];
    }

    return (data as any[]).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      alreadyMember: Boolean(u.already_member)
    }));
  }

  public async removeMember(workspaceId: string, targetUserId: string): Promise<void> {
    const { error } = await this.client.rpc('ls_remove_workspace_member', {
      p_workspace: workspaceId,
      p_target_user_id: targetUserId
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  public async deleteWorkspace(workspaceId: string): Promise<void> {
    const { error } = await this.client.rpc('ls_delete_workspace', {
      p_workspace: workspaceId
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // --- GitHub Integrations (Per-User in Supabase DB) ---
  public async getUserGitHubIntegration(): Promise<{ token: string | null; user: any | null }> {
    const user = await this.getCurrentUser();
    if (!user) return { token: null, user: null };

    const { data, error } = await this.client
      .from('ls_user_integrations')
      .select('github_token, github_user')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return { token: null, user: null };
    }

    return {
      token: data.github_token || null,
      user: data.github_user || null
    };
  }

  public async saveUserGitHubIntegration(token: string | null, githubUser: any | null): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado.');

    const { error } = await this.client
      .from('ls_user_integrations')
      .upsert({
        user_id: user.id,
        github_token: token,
        github_user: githubUser,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Error al guardar integración en Supabase: ${error.message}`);
    }
  }

  public async clearUserGitHubIntegration(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;

    await this.client
      .from('ls_user_integrations')
      .delete()
      .eq('user_id', user.id);
  }

  // --- Linked Repositories CRUD (For Triage Multi-Proyecto) ---
  public async listLinkedRepositories(): Promise<Array<{
    id: string;
    workspaceId: string;
    fullName: string;
    defaultBranch: string;
    isPrivate: boolean;
  }>> {
    const { data, error } = await this.client
      .from('ls_linked_repositories')
      .select('id, workspace_id, full_name, default_branch, is_private')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      workspaceId: r.workspace_id,
      fullName: r.full_name,
      defaultBranch: r.default_branch || 'main',
      isPrivate: Boolean(r.is_private)
    }));
  }

  public async updateLinkedRepository(repoId: string, fullName: string, defaultBranch: string = 'main'): Promise<void> {
    const { error } = await this.client
      .from('ls_linked_repositories')
      .update({
        full_name: fullName.trim(),
        default_branch: defaultBranch.trim() || 'main'
      })
      .eq('id', repoId);

    if (error) {
      throw new Error(`Error al actualizar repositorio: ${error.message}`);
    }
  }

  public async deleteLinkedRepository(repoId: string): Promise<void> {
    // 1. Obtener workspace_id antes de eliminar el repo
    const { data: repoRow } = await this.client
      .from('ls_linked_repositories')
      .select('workspace_id')
      .eq('id', repoId)
      .maybeSingle();

    const { error } = await this.client
      .from('ls_linked_repositories')
      .delete()
      .eq('id', repoId);

    if (error) {
      throw new Error(`Error al eliminar repositorio: ${error.message}`);
    }

    // 2. Si el workspace padre quedó sin repositorios, limpiarlo automáticamente
    if (repoRow?.workspace_id) {
      const { data: remaining } = await this.client
        .from('ls_linked_repositories')
        .select('id')
        .eq('workspace_id', repoRow.workspace_id)
        .limit(1);

      if (!remaining || remaining.length === 0) {
        await this.deleteWorkspace(repoRow.workspace_id).catch(() => {});
      }
    }
  }

  public async addLinkedRepository(fullName: string, defaultBranch: string = 'main'): Promise<string> {
    const cleanName = fullName.trim();
    if (!cleanName.includes('/')) {
      throw new Error('El nombre del repositorio debe tener formato owner/repo (ej: sendeiser/LinearStudio)');
    }

    let wsId: string | null = null;
    const workspaces = await this.listWorkspaces();
    if (workspaces.length > 0) {
      wsId = workspaces[0].id;
    } else {
      const repoBase = cleanName.split('/')[1] || cleanName;
      return await this.createWorkspace(repoBase, cleanName);
    }

    const { data, error } = await this.client
      .from('ls_linked_repositories')
      .insert({
        workspace_id: wsId,
        github_repo_id: Math.floor(Math.random() * 100000000) + 1,
        full_name: cleanName,
        default_branch: defaultBranch.trim() || 'main',
        is_private: false
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Error al vincular repositorio: ${error.message}`);
    }

    return data.id;
  }
}

export const workspaceService = new WorkspaceService();

