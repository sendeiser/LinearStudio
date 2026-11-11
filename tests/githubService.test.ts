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
      body: 'Details about rate limiting...\n\n### Tasks\n- [ ] Setup Redis token bucket\n- [x] Configure 429 Retry-After header',
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
    expect(domainIssue.subtasks.length).toBe(2);
    expect(domainIssue.subtasks[0].title).toBe('Setup Redis token bucket');
    expect(domainIssue.subtasks[0].completed).toBe(false);
    expect(domainIssue.subtasks[1].title).toBe('Configure 429 Retry-After header');
    expect(domainIssue.subtasks[1].completed).toBe(true);
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

  it('should fetch and map user repositories from GitHub API', async () => {
    const mockReposPayload = [
      {
        id: 101,
        name: 'LinearStudio',
        full_name: 'sendeiser/LinearStudio',
        private: false,
        description: 'Federated issue tracker with Supabase Cloud',
        html_url: 'https://github.com/sendeiser/LinearStudio',
        open_issues_count: 5,
        stargazers_count: 12,
        default_branch: 'main',
        updated_at: '2026-11-10T20:00:00Z',
        owner: { login: 'sendeiser', avatar_url: 'https://github.com/avatar.png' }
      },
      {
        id: 102,
        name: 'private-tool',
        full_name: 'sendeiser/private-tool',
        private: true,
        description: 'Internal private tool',
        html_url: 'https://github.com/sendeiser/private-tool',
        open_issues_count: 2,
        stargazers_count: 1,
        default_branch: 'master',
        updated_at: '2026-11-09T18:00:00Z',
        owner: { login: 'sendeiser', avatar_url: 'https://github.com/avatar.png' }
      }
    ];

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      if (url.includes('/user/repos')) {
        return {
          ok: true,
          status: 200,
          json: async () => mockReposPayload
        } as any;
      }
      return { ok: false, status: 404 } as any;
    }) as any;

    try {
      const repos = await githubService.getUserRepositories('ghp_test_token_123');
      expect(repos.length).toBe(2);
      expect(repos[0].full_name).toBe('sendeiser/LinearStudio');
      expect(repos[0].private).toBe(false);
      expect(repos[0].open_issues_count).toBe(5);
      expect(repos[1].full_name).toBe('sendeiser/private-tool');
      expect(repos[1].private).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

