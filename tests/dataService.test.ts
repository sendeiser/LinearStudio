import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../src/services/dataService';

describe('DataService Functional Core', () => {
  beforeEach(() => {
    // Reset service state if needed
  });

  it('should retrieve initial issues with required fields', () => {
    const issues = dataService.getIssues();
    expect(issues.length).toBeGreaterThan(0);
    const first = issues[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('status');
    expect(first).toHaveProperty('subtasks');
  });

  it('should move an issue to a new column', () => {
    const issues = dataService.getIssues();
    const issueToMove = issues[0];
    const newStatus = issueToMove.status === 'done' ? 'todo' : 'done';
    
    dataService.moveIssue(issueToMove.id, newStatus);
    const updated = dataService.getIssues().find((i) => i.id === issueToMove.id);
    expect(updated?.status).toBe(newStatus);
  });

  it('should toggle a subtask completion status', () => {
    const issues = dataService.getIssues();
    const issueWithSubtasks = issues.find((i) => i.subtasks.length > 0);
    expect(issueWithSubtasks).toBeDefined();

    const subtask = issueWithSubtasks!.subtasks[0];
    const initialCompleted = subtask.completed;

    dataService.toggleSubtask(issueWithSubtasks!.id, subtask.id);
    const updatedIssue = dataService.getIssues().find((i) => i.id === issueWithSubtasks!.id);
    const updatedSubtask = updatedIssue?.subtasks.find((s) => s.id === subtask.id);

    expect(updatedSubtask?.completed).toBe(!initialCompleted);
  });

  it('should add a comment to an issue', () => {
    const issues = dataService.getIssues();
    const targetIssue = issues[0];
    const commentContent = 'Testing comment insertion via TDD';

    dataService.addComment(targetIssue.id, 'Tester', commentContent);
    const updatedIssue = dataService.getIssues().find((i) => i.id === targetIssue.id);
    const added = updatedIssue?.comments.find((c) => c.content === commentContent);

    expect(added).toBeDefined();
    expect(added?.author).toBe('Tester');
  });

  it('should create a new issue and prepend it to the list', () => {
    const newIssue = dataService.createIssue({
      title: 'TDD Test Issue Creation',
      description: 'Verifying issue creation via DataService',
      priority: 'urgent',
      status: 'todo'
    });

    expect(newIssue.id).toBeDefined();
    expect(newIssue.title).toBe('TDD Test Issue Creation');
    expect(newIssue.priority).toBe('urgent');

    const issues = dataService.getIssues();
    expect(issues[0].title).toBe('TDD Test Issue Creation');
  });
});

