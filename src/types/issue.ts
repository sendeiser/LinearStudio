export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type ColumnId = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: ColumnId;
  priority: Priority;
  tags: string[];
  assignee: {
    name: string;
    avatar: string;
    role: string;
  };
  branch?: string;
  prNumber?: number;
  subtasks: Subtask[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

