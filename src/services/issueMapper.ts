import { ColumnId, Issue, Priority } from '../types/issue';

export interface SubtaskRow {
  id: string;
  issue_id: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface CommentRow {
  id: string;
  issue_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface IssueRow {
  id: string;
  repository_id: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string[] | null;
  assignee_name: string;
  assignee_role: string;
  pr_number: number | null;
  branch: string | null;
  created_at: string;
  updated_at: string;
  ls_linked_repositories?: { id?: string; full_name?: string } | Array<{ id?: string; full_name?: string }> | null;
  ls_subtasks?: SubtaskRow[] | null;
  ls_comments?: CommentRow[] | null;
}

const COLUMNS: ColumnId[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low'];

export const avatarOf = (name: string): string => {
  const clean = name.split('@')[0].trim();
  if (!clean) return '??';
  const words = clean.split(/\s+/);
  const initials = words.length > 1 ? words[0][0] + words[1][0] : clean.slice(0, 2);
  return initials.toUpperCase();
};

export const relativeTime = (iso: string, now: Date = new Date()): string => {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'justo ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
};

export const rowToIssue = (
  row: IssueRow,
  repoMapOrFallback?: Record<string, string> | string
): Issue => {
  const repoJoined = Array.isArray(row.ls_linked_repositories)
    ? row.ls_linked_repositories[0]
    : row.ls_linked_repositories;
  const repoNameFromJoin = repoJoined?.full_name;

  let resolvedProjectName: string | undefined = repoNameFromJoin;
  if (!resolvedProjectName && row.repository_id) {
    if (typeof repoMapOrFallback === 'object' && repoMapOrFallback !== null) {
      resolvedProjectName = repoMapOrFallback[row.repository_id];
    } else if (typeof repoMapOrFallback === 'string') {
      resolvedProjectName = repoMapOrFallback;
    }
  }

  return {
    id: row.number,
    repositoryId: row.repository_id,
    projectName: resolvedProjectName,
    title: row.title,
    description: row.description ?? '',
    status: COLUMNS.includes(row.status as ColumnId) ? (row.status as ColumnId) : 'backlog',
    priority: PRIORITIES.includes(row.priority as Priority) ? (row.priority as Priority) : 'medium',
    tags: row.tags ?? [],
    assignee: {
      name: row.assignee_name,
      avatar: avatarOf(row.assignee_name),
      role: row.assignee_role
    },
    branch: row.branch ?? undefined,
    prNumber: row.pr_number ?? undefined,
    subtasks: [...(row.ls_subtasks ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ id: s.id, title: s.title, completed: s.completed })),
    comments: [...(row.ls_comments ?? [])]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({
        id: c.id,
        author: c.author_name,
        avatar: avatarOf(c.author_name),
        content: c.content,
        createdAt: relativeTime(c.created_at)
      })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

