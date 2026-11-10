import type { SupabaseClient } from '@supabase/supabase-js';
import { ColumnId, Issue, Priority } from '../types/issue';
import { dataService } from './dataService';
import { IssueRow, rowToIssue } from './issueMapper';

export interface NewIssueInput {
  title: string;
  description: string;
  priority: Priority;
  status: ColumnId;
}

/** Contrato unico de datos: la UI no sabe si habla con localStorage o con Supabase. */
export interface IssueRepository {
  list(): Promise<Issue[]>;
  create(input: NewIssueInput): Promise<void>;
  move(issueId: number, status: ColumnId): Promise<void>;
  setSubtaskCompleted(issueId: number, subtaskId: string, completed: boolean): Promise<void>;
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
  async move(issueId: number, status: ColumnId): Promise<void> {
    dataService.moveIssue(issueId, status);
  }
  async setSubtaskCompleted(issueId: number, subtaskId: string, completed: boolean): Promise<void> {
    const current = dataService.getIssueById(issueId)?.subtasks.find((s) => s.id === subtaskId);
    if (current && current.completed !== completed) dataService.toggleSubtask(issueId, subtaskId);
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
    const rows = unwrap<IssueRow[]>(
      await this.client
        .from('ls_issues')
        .select('*, ls_subtasks(*), ls_comments(*)')
        .eq('repository_id', this.repositoryId)
        .order('number', { ascending: false })
    );
    return (rows ?? []).map(rowToIssue);
  }

  async create(input: NewIssueInput): Promise<void> {
    const created = unwrap<{ id: string; number: number }>(
      await this.client
        .from('ls_issues')
        .insert({
          repository_id: this.repositoryId,
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

  async move(issueId: number, status: ColumnId): Promise<void> {
    unwrap(
      await this.client.from('ls_issues').update({ status }).eq('repository_id', this.repositoryId).eq('number', issueId)
    );
  }

  async setSubtaskCompleted(_issueId: number, subtaskId: string, completed: boolean): Promise<void> {
    unwrap(await this.client.from('ls_subtasks').update({ completed }).eq('id', subtaskId));
  }

  async addComment(issueId: number, author: string, content: string): Promise<void> {
    const issue = unwrap<{ id: string }>(
      await this.client
        .from('ls_issues')
        .select('id')
        .eq('repository_id', this.repositoryId)
        .eq('number', issueId)
        .maybeSingle()
    );
    if (!issue) throw new Error(`Issue #${issueId} no encontrado`);
    unwrap(await this.client.from('ls_comments').insert({ issue_id: issue.id, author_name: author, content }));
  }

  async setPriority(issueId: number, priority: Priority): Promise<void> {
    unwrap(
      await this.client
        .from('ls_issues')
        .update({ priority })
        .eq('repository_id', this.repositoryId)
        .eq('number', issueId)
    );
  }
}

