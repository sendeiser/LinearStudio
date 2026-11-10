import { describe, it, expect } from 'vitest';
import { antigravityService } from '../src/services/antigravityService';
import { Issue } from '../src/types/issue';

describe('Antigravity AI Agent Service', () => {
  const mockIssue: Issue = {
    id: 142,
    title: 'Implement edge function rate limiting via Redis token bucket',
    description: 'Configurar protección contra DoS',
    status: 'todo',
    priority: 'high',
    tags: ['api', 'security'],
    assignee: { name: 'Elena Kim', avatar: 'EK', role: 'Security' },
    subtasks: [],
    comments: [],
    createdAt: '2026-11-07T11:00:00Z',
    updatedAt: '2026-11-10T08:00:00Z'
  };

  it('should generate an appropriate agy CLI command line for an issue', () => {
    const cmd = antigravityService.generateAgyCommand(mockIssue);
    expect(cmd).toContain('agy');
    expect(cmd).toContain('142');
    expect(cmd).toContain('branch');
  });

  it('should generate PR metadata with branch name and commit message', () => {
    const pr = antigravityService.generatePrMetadata(mockIssue);
    expect(pr.branchName).toBe('antigravity/fix-issue-142');
    expect(pr.commitMessage).toContain('fix(issue-142)');
    expect(pr.prNumber).toBeGreaterThan(0);
  });

  it('should execute step-by-step telemetry pipeline', async () => {
    const steps: string[] = [];
    await antigravityService.runTelemetryPipeline(mockIssue, (state) => {
      steps.push(state.step);
    }, 10); // fast interval for testing

    expect(steps.length).toBeGreaterThanOrEqual(4);
    expect(steps[steps.length - 1]).toContain('Listo');
  });
});

