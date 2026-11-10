import { Issue, Priority } from '../types/issue';

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
      subtasks: [],
      comments: [],
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
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

