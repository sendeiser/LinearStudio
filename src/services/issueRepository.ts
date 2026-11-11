import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ColumnId, Issue, Priority } from '../types/issue';
import { dataService } from './dataService';
import { IssueRow, rowToIssue } from './issueMapper';

export interface NewIssueInput {
  title: string;
  description: string;
  priority: Priority;
  status: ColumnId;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: ColumnId;
  tags?: string[];
  assigneeName?: string;
  assigneeRole?: string;
}

/** Contrato unico de datos: la UI no sabe si habla con localStorage o con Supabase. */
export interface IssueRepository {
  list(): Promise<Issue[]>;
  create(input: NewIssueInput): Promise<void>;
  update(issueId: number, input: UpdateIssueInput): Promise<void>;
  delete(issueId: number): Promise<void>;
  move(issueId: number, status: ColumnId): Promise<void>;
  setSubtaskCompleted(issueId: number, subtaskId: string, completed: boolean): Promise<void>;
  addSubtask(issueId: number, title: string): Promise<void>;
  deleteSubtask(issueId: number, subtaskId: string): Promise<void>;
  addComment(issueId: number, author: string, content: string): Promise<void>;
  setPriority(issueId: number, priority: Priority): Promise<void>;
}

export interface Actor {
  name: string;
  role: string;
}

/** Modo demo: persiste en el navegador (sin login ni red). */
export class LocalIssueRepository implements IssueRepository {
  async list(): Promise<Issue[]> {
    return dataService.getIssues();
  }
  async create(input: NewIssueInput): Promise<void> {
    dataService.createIssue(input);
  }
  async update(issueId: number, input: UpdateIssueInput): Promise<void> {
    dataService.updateIssue(issueId, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      tags: input.tags,
      assignee: input.assigneeName ? {
        name: input.assigneeName,
        avatar: input.assigneeName.slice(0, 2).toUpperCase(),
        role: input.assigneeRole || 'Maintainer'
      } : undefined
    });
  }
  async delete(issueId: number): Promise<void> {
    dataService.deleteIssue(issueId);
  }
  async move(issueId: number, status: ColumnId): Promise<void> {
    dataService.moveIssue(issueId, status);
  }
  async setSubtaskCompleted(issueId: number, subtaskId: string, completed: boolean): Promise<void> {
    const current = dataService.getIssueById(issueId)?.subtasks.find((s) => s.id === subtaskId);
    if (current && current.completed !== completed) dataService.toggleSubtask(issueId, subtaskId);
  }
  async addSubtask(issueId: number, title: string): Promise<void> {
    dataService.addSubtask(issueId, title);
  }
  async deleteSubtask(issueId: number, subtaskId: string): Promise<void> {
    dataService.deleteSubtask(issueId, subtaskId);
  }
  async addComment(issueId: number, author: string, content: string): Promise<void> {
    dataService.addComment(issueId, author, content);
  }
  async setPriority(issueId: number, priority: Priority): Promise<void> {
    dataService.updateIssuePriority(issueId, priority);
  }
}

const unwrap = <T>(res: { data?: T | null; error?: { message: string } | null }): T | null => {
  if (res.error) throw new Error(res.error.message);
  return res.data ?? null;
};

/** Modo equipo: datos compartidos en la BD de boxtools, protegidos por RLS por workspace. */
export class SupabaseIssueRepository implements IssueRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly repositoryId: string,
    private readonly actor: Actor
  ) {}

  async list(): Promise<Issue[]> {
    let query = this.client
      .from('ls_issues')
      .select('*, ls_subtasks(*), ls_comments(*)')
      .order('number', { ascending: false });

    if (this.repositoryId && this.repositoryId.trim() !== '' && this.repositoryId !== 'all') {
      query = query.eq('repository_id', this.repositoryId);
    }

    const rows = unwrap<IssueRow[]>(await query);
    return (rows ?? []).map(rowToIssue);
  }

  async create(input: NewIssueInput): Promise<void> {
    let targetRepoId = this.repositoryId;
    if (!targetRepoId || targetRepoId === 'all') {
      const repos = unwrap<Array<{ id: string }>>(
        await this.client.from('ls_linked_repositories').select('id').limit(1)
      );
      if (repos && repos.length > 0) {
        targetRepoId = repos[0].id;
      }
    }
    if (!targetRepoId) {
      throw new Error('No se encontró ningún repositorio vinculado en Supabase Cloud.');
    }

    const created = unwrap<{ id: string; number: number }>(
      await this.client
        .from('ls_issues')
        .insert({
          repository_id: targetRepoId,
          title: input.title.trim(),
          description: input.description,
          priority: input.priority,
          status: input.status,
          tags: ['feature'],
          assignee_name: this.actor.name,
          assignee_role: this.actor.role
        })
        .select('id, number')
        .single()
    );
    if (created) {
      unwrap(
        await this.client
          .from('ls_subtasks')
          .insert({ issue_id: created.id, title: 'Requerimiento inicial definido', position: 0 })
      );
    }
  }

  async update(issueId: number, input: UpdateIssueInput): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.description !== undefined) payload.description = input.description;
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.status !== undefined) payload.status = input.status;
    if (input.tags !== undefined) payload.tags = input.tags;
    if (input.assigneeName !== undefined) payload.assignee_name = input.assigneeName;
    if (input.assigneeRole !== undefined) payload.assignee_role = input.assigneeRole;

    let q = this.client.from('ls_issues').update(payload);
    if (this.repositoryId && this.repositoryId !== 'all') {
      q = q.eq('repository_id', this.repositoryId);
    }
    q = q.eq('number', issueId);
    unwrap(await q);
  }

  async delete(issueId: number): Promise<void> {
    let q = this.client.from('ls_issues').delete();
    if (this.repositoryId && this.repositoryId !== 'all') {
      q = q.eq('repository_id', this.repositoryId);
    }
    q = q.eq('number', issueId);
    unwrap(await q);
  }

  async addSubtask(issueId: number, title: string): Promise<void> {
    let q = this.client.from('ls_issues').select('id');
    if (this.repositoryId && this.repositoryId !== 'all') {
      q = q.eq('repository_id', this.repositoryId);
    }
    q = q.eq('number', issueId);
    const issue = unwrap<{ id: string }>(await q.maybeSingle());
    if (!issue) throw new Error(`Issue #${issueId} no encontrado`);

    unwrap(
      await this.client.from('ls_subtasks').insert({
        issue_id: issue.id,
        title: title.trim(),
        completed: false
      })
    );
  }

  async deleteSubtask(_issueId: number, subtaskId: string): Promise<void> {
    unwrap(await this.client.from('ls_subtasks').delete().eq('id', subtaskId));
  }

  async move(issueId: number, status: ColumnId): Promise<void> {
    let q = this.client.from('ls_issues').update({ status });
    if (this.repositoryId && this.repositoryId !== 'all') {
      q = q.eq('repository_id', this.repositoryId);
    }
    q = q.eq('number', issueId);
    unwrap(await q);
  }

  async setSubtaskCompleted(_issueId: number, subtaskId: string, completed: boolean): Promise<void> {
    unwrap(await this.client.from('ls_subtasks').update({ completed }).eq('id', subtaskId));
  }

  async addComment(issueId: number, author: string, content: string): Promise<void> {
    let q = this.client.from('ls_issues').select('id');
    if (this.repositoryId && this.repositoryId !== 'all') {
      q = q.eq('repository_id', this.repositoryId);
    }
    q = q.eq('number', issueId);
    const issue = unwrap<{ id: string }>(await q.maybeSingle());
    if (!issue) throw new Error(`Issue #${issueId} no encontrado`);
    unwrap(await this.client.from('ls_comments').insert({ issue_id: issue.id, author_name: author, content }));
  }

  async setPriority(issueId: number, priority: Priority): Promise<void> {
    let q = this.client.from('ls_issues').update({ priority });
    if (this.repositoryId && this.repositoryId !== 'all') {
      q = q.eq('repository_id', this.repositoryId);
    }
    q = q.eq('number', issueId);
    unwrap(await q);
  }
}

export const getActiveIssueRepository = (
  repoId?: string | null,
  email?: string | null,
  role: string = 'admin'
): IssueRepository => {
  return new SupabaseIssueRepository(supabase, repoId || '', {
    name: email ? email.split('@')[0] : 'Admin',
    role: role || 'admin'
  });
};

