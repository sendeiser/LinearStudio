import { describe, it, expect } from 'vitest';
import { githubService } from '../src/services/githubService';

describe('GitHub Synchronization Service', () => {
  it('should parse repository coordinates properly', () => {
    const repo = githubService.parseRepo('tincho/hyper-flow');
    expect(repo.owner).toBe('tincho');
    expect(repo.name).toBe('hyper-flow');
  });

  it('should map GitHub API payload to local Issue domain model', () => {
    const rawGithubIssue = {
      number: 142,
      title: 'Fix edge function rate limiting',
      body: 'Details about rate limiting...',
      state: 'open',
      labels: [{ name: 'bug' }, { name: 'security' }],
      user: { login: 'elena-kim', avatar_url: 'https://github.com/avatar.png' },
      created_at: '2026-11-07T11:00:00Z',
      updated_at: '2026-11-10T08:00:00Z'
    };

    const domainIssue = githubService.mapToDomainIssue(rawGithubIssue);
    expect(domainIssue.id).toBe(142);
    expect(domainIssue.title).toBe('Fix edge function rate limiting');
    expect(domainIssue.tags).toContain('bug');
    expect(domainIssue.tags).toContain('security');
    expect(domainIssue.assignee.name).toBe('elena-kim');
  });

  it('should format issue into GitHub markdown export', () => {
    const formatted = githubService.formatForExport({
      id: 142,
      title: 'Fix issue',
      description: 'Some description',
      status: 'todo',
      priority: 'high',
      tags: ['bug'],
      assignee: { name: 'Tincho', avatar: 'TC', role: 'Lead' },
      subtasks: [{ id: '1', title: 'Step 1', completed: true }],
      comments: [],
      createdAt: '2026-11-01',
      updatedAt: '2026-11-02'
    });

    expect(formatted).toContain('### Subtareas');
    expect(formatted).toContain('- [x] Step 1');
    expect(formatted).toContain('**Prioridad:** Alta');
  });
});

