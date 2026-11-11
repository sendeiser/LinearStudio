import { Issue, Priority } from '../types/issue';
import { supabase } from '../lib/supabase';
import { workspaceService } from './workspaceService';
import { dataService } from './dataService';

export interface GitHubRepoCoordinates {
  owner: string;
  name: string;
}

export interface RawGitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels?: Array<{ name: string } | string>;
  user?: { login: string; avatar_url?: string };
  assignee?: { login: string; avatar_url?: string };
  created_at: string;
  updated_at: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  html_url: string;
}

export interface GitHubRepositoryItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  open_issues_count: number;
  stargazers_count?: number;
  default_branch?: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubSyncResult {
  repositoryId: string;
  repoFullName: string;
  syncedCount: number;
  openCount: number;
  closedCount: number;
}

class GitHubService {
  public getToken(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('github_token') || (import.meta as any).env?.VITE_GITHUB_TOKEN || '';
    }
    return '';
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('github_token', token.trim());
      } else {
        localStorage.removeItem('github_token');
      }
    }
  }

  public async validateToken(token?: string): Promise<GitHubUser> {
    const tok = token || this.getToken();
    if (!tok) {
      throw new Error('No se proporcionó ningún token de GitHub.');
    }

    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tok}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'LinearStudio-Client'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token de GitHub inválido o expirado (401 Unauthorized).');
      }
      throw new Error(`Error de GitHub API (${response.status}): ${response.statusText}`);
    }

    return await response.json();
  }

  public async getUserRepositories(token?: string): Promise<GitHubRepositoryItem[]> {
    const tok = token || this.getToken();
    if (!tok) {
      throw new Error('No se proporcionó ningún token de GitHub para listar repositorios.');
    }

    const response = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
      {
        headers: {
          Authorization: `Bearer ${tok}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'LinearStudio-Client'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token de GitHub no autorizado al listar repositorios (401).');
      }
      throw new Error(`Error al listar repositorios de GitHub (${response.status}): ${response.statusText}`);
    }

    const rawRepos = await response.json();
    return (rawRepos || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: Boolean(r.private),
      description: r.description || null,
      html_url: r.html_url,
      open_issues_count: r.open_issues_count ?? 0,
      stargazers_count: r.stargazers_count ?? 0,
      default_branch: r.default_branch || 'main',
      updated_at: r.updated_at,
      owner: {
        login: r.owner?.login || '',
        avatar_url: r.owner?.avatar_url || ''
      }
    }));
  }

  public async syncRepoIssuesToSupabase(
    fullRepo: string,
    token?: string
  ): Promise<GitHubSyncResult> {
    const tok = token || this.getToken();
    const remoteIssues = await this.fetchRepoIssues(fullRepo, tok);

    // 1. Resolver workspace y repositorio vinculado en Supabase Cloud
    let repoId: string | null = null;
    try {
      const workspaces = await workspaceService.listWorkspaces();
      for (const ws of workspaces) {
        const found = ws.repos.find((r) => r.fullName.toLowerCase() === fullRepo.toLowerCase());
        if (found) {
          repoId = found.id;
          break;
        }
      }
      if (!repoId) {
        const repoName = fullRepo.split('/')[1] || fullRepo;
        repoId = await workspaceService.createWorkspace(repoName, fullRepo);
      }
    } catch (e) {
      console.warn('Notice al resolver o crear workspace en Supabase:', e);
    }

    // 2. Persistir issues y subtareas en Supabase Cloud (ls_issues y ls_subtasks)
    let openCount = 0;
    let closedCount = 0;

    if (repoId) {
      for (const issue of remoteIssues) {
        if (issue.status === 'done') closedCount++;
        else openCount++;

        try {
          const { data: existing } = await supabase
            .from('ls_issues')
            .select('id')
            .eq('repository_id', repoId)
            .eq('number', issue.id)
            .maybeSingle();

          let issueUuid = existing?.id;
          if (existing) {
            await supabase
              .from('ls_issues')
              .update({
                title: issue.title,
                description: issue.description,
                status: issue.status,
                priority: issue.priority,
                tags: issue.tags,
                assignee_name: issue.assignee.name,
                assignee_role: issue.assignee.role,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } else {
            const { data: created, error } = await supabase
              .from('ls_issues')
              .insert({
                repository_id: repoId,
                number: issue.id,
                title: issue.title,
                description: issue.description,
                status: issue.status,
                priority: issue.priority,
                tags: issue.tags,
                assignee_name: issue.assignee.name,
                assignee_role: issue.assignee.role
              })
              .select('id')
              .single();

            if (!error && created) {
              issueUuid = created.id;
            }
          }

          if (issueUuid && issue.subtasks && issue.subtasks.length > 0) {
            await supabase.from('ls_subtasks').delete().eq('issue_id', issueUuid);
            await supabase.from('ls_subtasks').insert(
              issue.subtasks.map((st, idx) => ({
                issue_id: issueUuid,
                title: st.title,
                completed: st.completed,
                position: idx
              }))
            );
          }
        } catch (err) {
          console.warn(`Error al sincronizar issue #${issue.id} en Supabase:`, err);
        }
      }
    }

    // 3. Sincronizar en dataService para reactividad inmediata
    for (const r of remoteIssues) {
      dataService.createIssue({
        title: r.title,
        description: r.description,
        priority: r.priority,
        status: r.status,
        projectName: fullRepo
      });
    }

    return {
      repositoryId: repoId || '',
      repoFullName: fullRepo,
      syncedCount: remoteIssues.length,
      openCount,
      closedCount
    };
  }

  public async fetchRepoIssues(fullRepo: string, token?: string): Promise<Issue[]> {
    const { owner, name } = this.parseRepo(fullRepo);
    const tok = token || this.getToken();

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'LinearStudio-Client'
    };
    if (tok) {
      headers['Authorization'] = `Bearer ${tok}`;
    }

    const url = `https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=30`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`No se pudieron obtener los issues de GitHub (${response.status}): ${response.statusText}`);
    }

    const rawList: (RawGitHubIssue & { pull_request?: any })[] = await response.json();
    return rawList
      .filter((r) => !r.pull_request)
      .map((r) => {
        const issue = this.mapToDomainIssue(r);
        issue.projectName = fullRepo;
        return issue;
      });
  }

  public async createGitHubIssue(
    fullRepo: string,
    issueData: { title: string; body?: string; labels?: string[] },
    token?: string
  ): Promise<{ number: number; html_url: string }> {
    const { owner, name } = this.parseRepo(fullRepo);
    const tok = token || this.getToken();
    if (!tok) {
      throw new Error('Se requiere un Token de GitHub con permisos de escritura (repo scope) para crear issues.');
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${name}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tok}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'LinearStudio-Client'
      },
      body: JSON.stringify({
        title: issueData.title,
        body: issueData.body || '',
        labels: issueData.labels || ['linear-studio']
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Error al crear issue en GitHub (${response.status}): ${err.message || response.statusText}`);
    }

    return await response.json();
  }

  public parseRepo(fullRepo: string): GitHubRepoCoordinates {
    const parts = fullRepo.split('/');
    if (parts.length === 2) {
      return { owner: parts[0], name: parts[1] };
    }
    return { owner: 'tincho', name: 'hyper-flow' };
  }

  public mapToDomainIssue(raw: RawGitHubIssue): Issue {
    const labels = (raw.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
    
    // Infer priority from labels
    let priority: Priority = 'medium';
    if (labels.some((l) => l.toLowerCase().includes('urgent') || l.toLowerCase().includes('critical'))) {
      priority = 'urgent';
    } else if (labels.some((l) => l.toLowerCase().includes('high') || l.toLowerCase().includes('p1'))) {
      priority = 'high';
    } else if (labels.some((l) => l.toLowerCase().includes('low') || l.toLowerCase().includes('p3'))) {
      priority = 'low';
    }

    const assignedUser = raw.assignee || raw.user || { login: 'Tincho' };

    // Extraer subtareas automáticas de checklists markdown de GitHub (- [ ] o - [x])
    const subtasks = [];
    if (raw.body) {
      const taskRegex = /^\s*-\s*\[([ xX])\]\s+(.+)$/gm;
      let match;
      let idx = 1;
      while ((match = taskRegex.exec(raw.body)) !== null) {
        subtasks.push({
          id: `st_${idx++}`,
          title: match[2].trim(),
          completed: match[1].toLowerCase() === 'x'
        });
      }
    }

    return {
      id: raw.number,
      title: raw.title,
      description: raw.body || '',
      status: raw.state === 'closed' ? 'done' : 'todo',
      priority,
      tags: labels.length > 0 ? labels : ['general'],
      assignee: {
        name: assignedUser.login,
        avatar: assignedUser.login.slice(0, 2).toUpperCase(),
        role: 'Collaborator'
      },
      subtasks,
      comments: [],
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }

  public async fetchIssueComments(fullRepo: string, issueNumber: number, token?: string): Promise<any[]> {
    const { owner, name } = this.parseRepo(fullRepo);
    const tok = token || this.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'LinearStudio-Client'
    };
    if (tok) headers['Authorization'] = `Bearer ${tok}`;

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}/comments`, { headers });
      if (!res.ok) return [];
      const rawComments = await res.json();
      return rawComments.map((c: any) => ({
        id: String(c.id),
        author: c.user?.login || 'GitHub User',
        avatar: (c.user?.login || 'GH').slice(0, 2).toUpperCase(),
        content: c.body || '',
        createdAt: new Date(c.created_at).toLocaleDateString()
      }));
    } catch {
      return [];
    }
  }

  public async updateGitHubIssue(
    fullRepo: string,
    issueNumber: number,
    updates: { state?: 'open' | 'closed'; title?: string; body?: string; labels?: string[] },
    token?: string
  ): Promise<any> {
    const { owner, name } = this.parseRepo(fullRepo);
    const tok = token || this.getToken();
    if (!tok) throw new Error('Se requiere un Token de GitHub para actualizar issues.');

    const res = await fetch(`https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tok}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'LinearStudio-Client'
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      throw new Error(`Error al actualizar issue #${issueNumber} en GitHub.`);
    }
    return await res.json();
  }

  public formatForExport(issue: Issue): string {
    const priorityLabels: Record<Priority, string> = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };

    const subtasksList = issue.subtasks.length > 0
      ? issue.subtasks.map((s) => `- [${s.completed ? 'x' : ' '}] ${s.title}`).join('\n')
      : '_Sin subtareas registradas_';

    return `## Issue #${issue.id}: ${issue.title}

**Prioridad:** ${priorityLabels[issue.priority]}  
**Estado:** ${issue.status}  
**Asignado:** ${issue.assignee.name}  
**Etiquetas:** ${issue.tags.map((t) => `\`${t}\``).join(', ')}

### Descripción
${issue.description || '_Sin descripción_'}

### Subtareas
${subtasksList}
`;
  }
}

export const githubService = new GitHubService();

