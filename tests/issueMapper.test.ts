import { describe, it, expect } from 'vitest';
import { rowToIssue, avatarOf, relativeTime } from '../src/services/issueMapper';

const baseRow = {
  id: 'uuid-1',
  repository_id: 'repo-1',
  number: 7,
  title: 'Fix login',
  description: 'desc',
  status: 'in_progress',
  priority: 'high',
  tags: ['bug', 'auth'],
  assignee_name: 'Elena Kim',
  assignee_role: 'Backend',
  pr_number: 12,
  branch: 'fix/login',
  created_at: '2026-11-09T10:00:00Z',
  updated_at: '2026-11-10T10:00:00Z',
  ls_subtasks: [
    { id: 's2', issue_id: 'uuid-1', title: 'B', completed: true, position: 1 },
    { id: 's1', issue_id: 'uuid-1', title: 'A', completed: false, position: 0 }
  ],
  ls_comments: [
    { id: 'c2', issue_id: 'uuid-1', author_name: 'Juan Diaz', content: 'segundo', created_at: '2026-11-10T11:00:00Z' },
    { id: 'c1', issue_id: 'uuid-1', author_name: 'Elena Kim', content: 'primero', created_at: '2026-11-10T09:00:00Z' }
  ]
};

describe('issueMapper', () => {
  it('maps a database row to the Issue domain model using the per-repo number as id', () => {
    const issue = rowToIssue(baseRow);
    expect(issue.id).toBe(7);
    expect(issue.title).toBe('Fix login');
    expect(issue.status).toBe('in_progress');
    expect(issue.priority).toBe('high');
    expect(issue.tags).toEqual(['bug', 'auth']);
    expect(issue.prNumber).toBe(12);
    expect(issue.branch).toBe('fix/login');
    expect(issue.assignee).toEqual({ name: 'Elena Kim', avatar: 'EK', role: 'Backend' });
  });

  it('orders subtasks by position and comments chronologically', () => {
    const issue = rowToIssue(baseRow);
    expect(issue.subtasks.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(issue.comments.map((c) => c.content)).toEqual(['primero', 'segundo']);
    expect(issue.comments[0].avatar).toBe('EK');
  });

  it('tolerates missing relations and nullable columns', () => {
    const issue = rowToIssue({ ...baseRow, pr_number: null, branch: null, ls_subtasks: undefined, ls_comments: null });
    expect(issue.subtasks).toEqual([]);
    expect(issue.comments).toEqual([]);
    expect(issue.prNumber).toBeUndefined();
    expect(issue.branch).toBeUndefined();
  });

  it('falls back to safe defaults for unknown enum values', () => {
    const issue = rowToIssue({ ...baseRow, status: 'weird', priority: 'weird' });
    expect(issue.status).toBe('backlog');
    expect(issue.priority).toBe('medium');
  });

  it('builds avatars from names or emails', () => {
    expect(avatarOf('Martin Tincho')).toBe('MT');
    expect(avatarOf('tincho')).toBe('TI');
    expect(avatarOf('')).toBe('??');
  });

  it('formats relative time in Spanish', () => {
    const now = new Date('2026-11-10T12:00:00Z');
    expect(relativeTime('2026-11-10T11:59:40Z', now)).toBe('justo ahora');
    expect(relativeTime('2026-11-10T09:00:00Z', now)).toBe('hace 3h');
    expect(relativeTime('2026-11-08T12:00:00Z', now)).toBe('hace 2d');
  });
});

