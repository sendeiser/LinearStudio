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

class GitHubService {
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

