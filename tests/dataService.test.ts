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

  it('should update and delete an issue cleanly', () => {
    const issue = dataService.createIssue({
      title: 'Issue to update',
      description: 'Original description',
      priority: 'low',
      status: 'backlog'
    });

    const updated = dataService.updateIssue(issue.id, {
      title: 'Issue title modified',
      description: 'New desc',
      priority: 'urgent'
    });

    expect(updated?.title).toBe('Issue title modified');
    expect(updated?.priority).toBe('urgent');

    const deleted = dataService.deleteIssue(issue.id);
    expect(deleted).toBe(true);
    expect(dataService.getIssueById(issue.id)).toBeUndefined();
  });

  it('should add and delete subtasks', () => {
    const issue = dataService.createIssue({
      title: 'Issue with subtasks',
      description: 'desc',
      priority: 'medium',
      status: 'todo'
    });

    const subtask = dataService.addSubtask(issue.id, 'Nueva subtarea creada');
    expect(subtask?.title).toBe('Nueva subtarea creada');
    expect(subtask?.completed).toBe(false);

    const reloaded = dataService.getIssueById(issue.id);
    expect(reloaded?.subtasks.some((s) => s.id === subtask?.id)).toBe(true);

    const removed = dataService.deleteSubtask(issue.id, subtask!.id);
    expect(removed).toBe(true);
    const afterDelete = dataService.getIssueById(issue.id);
    expect(afterDelete?.subtasks.some((s) => s.id === subtask?.id)).toBe(false);
  });

  it('should rename project in all matching issues', () => {
    const issue1 = dataService.createIssue({
      title: 'Issue Alpha',
      description: 'd1',
      priority: 'low',
      status: 'todo',
      projectName: 'old-owner/repo-old'
    });
    const issue2 = dataService.createIssue({
      title: 'Issue Beta',
      description: 'd2',
      priority: 'high',
      status: 'todo',
      projectName: 'old-owner/repo-old'
    });

    const count = dataService.renameProjectInIssues('old-owner/repo-old', 'new-owner/repo-new');
    expect(count).toBeGreaterThanOrEqual(2);

    expect(dataService.getIssueById(issue1.id)?.projectName).toBe('new-owner/repo-new');
    expect(dataService.getIssueById(issue2.id)?.projectName).toBe('new-owner/repo-new');
  });

  it('should delete all issues associated with a project', () => {
    dataService.createIssue({
      title: 'To be deleted issue 1',
      description: 'd',
      priority: 'low',
      status: 'todo',
      projectName: 'doomed-project/test'
    });
    dataService.createIssue({
      title: 'To be deleted issue 2',
      description: 'd',
      priority: 'low',
      status: 'todo',
      projectName: 'doomed-project/test'
    });

    const deletedCount = dataService.deleteIssuesByProject('doomed-project/test');
    expect(deletedCount).toBe(2);

    const remaining = dataService.getIssues().filter(i => i.projectName === 'doomed-project/test');
    expect(remaining.length).toBe(0);
  });
});

