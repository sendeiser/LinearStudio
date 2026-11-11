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
}

export const workspaceService = new WorkspaceService();

