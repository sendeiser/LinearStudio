import { describe, it, expect } from 'vitest';
import { SupabaseIssueRepository, LocalIssueRepository } from '../src/services/issueRepository';

type Call = { table: string; op: string; payload?: unknown; filters: Array<[string, unknown]> };

/** Cliente falso con la misma cadena que usa supabase-js; registra llamadas y devuelve respuestas programadas. */
const fakeClient = (responses: Record<string, { data?: unknown; error?: { message: string } | null }>) => {
  const calls: Call[] = [];
  const client = {
    from(table: string) {
      const call: Call = { table, op: 'select', filters: [] };
      const result = () => responses[`${table}:${call.op}`] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        select: () => builder,
        insert: (p: unknown) => ((call.op = 'insert'), (call.payload = p), builder),
        update: (p: unknown) => ((call.op = 'update'), (call.payload = p), builder),
        delete: () => ((call.op = 'delete'), builder),
        eq: (c: string, v: unknown) => (call.filters.push([c, v]), builder),
        order: () => builder,
        single: () => ((calls.push(call)), Promise.resolve({ error: null, ...result() })),
        maybeSingle: () => ((calls.push(call)), Promise.resolve({ error: null, ...result() })),
        then: (resolve: (v: unknown) => unknown) => ((calls.push(call)), resolve({ error: null, ...result() }))
      };
      return builder;
    }
  };
  return { client: client as never, calls };
};

const actor = { name: 'TinChoX', role: 'Maintainer' };

describe('SupabaseIssueRepository', () => {
  it('lists issues of the active repository mapped to the domain model', async () => {
    const { client, calls } = fakeClient({
      'ls_issues:select': {
        data: [{
          id: 'u1', repository_id: 'r1', number: 3, title: 'T', description: '', status: 'todo', priority: 'low',
          tags: [], assignee_name: 'Ana Gil', assignee_role: '', pr_number: null, branch: null,
          created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z', ls_subtasks: [], ls_comments: []
        }]
      }
    });
    const issues = await new SupabaseIssueRepository(client, 'r1', actor).list();
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe(3);
    expect(calls[0].filters).toContainEqual(['repository_id', 'r1']);
  });

  it('creates an issue in the repository with the actor as assignee plus a default subtask', async () => {
    const { client, calls } = fakeClient({ 'ls_issues:insert': { data: { id: 'new-uuid', number: 9 } } });
    await new SupabaseIssueRepository(client, 'r1', actor).create({
      title: 'Nuevo', description: 'd', priority: 'urgent', status: 'todo'
    });
    const issueInsert = calls.find((c) => c.table === 'ls_issues' && c.op === 'insert')!;
    expect(issueInsert.payload).toMatchObject({
      repository_id: 'r1', title: 'Nuevo', priority: 'urgent', status: 'todo', assignee_name: 'TinChoX'
    });
    const subtaskInsert = calls.find((c) => c.table === 'ls_subtasks' && c.op === 'insert')!;
    expect(subtaskInsert.payload).toMatchObject({ issue_id: 'new-uuid' });
  });

  it('moves an issue scoped by repository and number', async () => {
    const { client, calls } = fakeClient({});
    await new SupabaseIssueRepository(client, 'r1', actor).move(5, 'done');
    const upd = calls.find((c) => c.op === 'update')!;
    expect(upd.payload).toEqual({ status: 'done' });
    expect(upd.filters).toEqual([['repository_id', 'r1'], ['number', 5]]);
  });

  it('adds a comment after resolving the issue uuid', async () => {
    const { client, calls } = fakeClient({ 'ls_issues:select': { data: { id: 'issue-uuid' } } });
    await new SupabaseIssueRepository(client, 'r1', actor).addComment(5, 'TinChoX', 'hola');
    const ins = calls.find((c) => c.table === 'ls_comments' && c.op === 'insert')!;
    expect(ins.payload).toEqual({ issue_id: 'issue-uuid', author_name: 'TinChoX', content: 'hola' });
  });

  it('toggles a subtask explicitly', async () => {
    const { client, calls } = fakeClient({});
    await new SupabaseIssueRepository(client, 'r1', actor).setSubtaskCompleted(5, 'sub-1', true);
    const upd = calls.find((c) => c.table === 'ls_subtasks')!;
    expect(upd.payload).toEqual({ completed: true });
    expect(upd.filters).toEqual([['id', 'sub-1']]);
  });

  it('updates an issue with title and description', async () => {
    const { client, calls } = fakeClient({});
    await new SupabaseIssueRepository(client, 'r1', actor).update(5, {
      title: 'Título Actualizado',
      description: 'Nueva descripción',
      priority: 'high'
    });
    const upd = calls.find((c) => c.op === 'update')!;
    expect(upd.payload).toEqual({
      title: 'Título Actualizado',
      description: 'Nueva descripción',
      priority: 'high'
    });
    expect(upd.filters).toEqual([['repository_id', 'r1'], ['number', 5]]);
  });

  it('deletes an issue scoped by repository and number', async () => {
    const { client, calls } = fakeClient({});
    await new SupabaseIssueRepository(client, 'r1', actor).delete(5);
    const del = calls.find((c) => c.op === 'delete')!;
    expect(del.filters).toEqual([['repository_id', 'r1'], ['number', 5]]);
  });

  it('adds a subtask and deletes a subtask', async () => {
    const { client, calls } = fakeClient({ 'ls_issues:select': { data: { id: 'issue-uuid-1' } } });
    const repo = new SupabaseIssueRepository(client, 'r1', actor);
    await repo.addSubtask(5, 'Nueva subtarea');
    const ins = calls.find((c) => c.table === 'ls_subtasks' && c.op === 'insert')!;
    expect(ins.payload).toMatchObject({ issue_id: 'issue-uuid-1', title: 'Nueva subtarea', completed: false });

    await repo.deleteSubtask(5, 'sub-to-delete');
    const del = calls.find((c) => c.table === 'ls_subtasks' && c.op === 'delete')!;
    expect(del.filters).toEqual([['id', 'sub-to-delete']]);
  });

  it('throws a readable error when Supabase rejects the operation', async () => {
    const { client } = fakeClient({ 'ls_issues:update': { error: { message: 'new row violates row-level security policy' } } });
    await expect(new SupabaseIssueRepository(client, 'r1', actor).move(5, 'done')).rejects.toThrow(/row-level security/);
  });
});

describe('LocalIssueRepository', () => {
  it('implements the same contract on top of localStorage-backed dataService', async () => {
    const repo = new LocalIssueRepository();
    const before = await repo.list();
    await repo.create({ title: 'Local nuevo', description: '', priority: 'low', status: 'backlog' });
    const after = await repo.list();
    expect(after.length).toBe(before.length + 1);
    expect(after[0].title).toBe('Local nuevo');
    await repo.setPriority(after[0].id, 'urgent');
    expect((await repo.list())[0].priority).toBe('urgent');

    await repo.update(after[0].id, { title: 'Local modificado', description: 'desc' });
    const modified = (await repo.list()).find((i) => i.id === after[0].id);
    expect(modified?.title).toBe('Local modificado');

    await repo.delete(after[0].id);
    const afterDelete = await repo.list();
    expect(afterDelete.find((i) => i.id === after[0].id)).toBeUndefined();
  });
});

