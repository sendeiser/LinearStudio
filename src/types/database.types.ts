export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer';
export type AgentExecutionStatus = 'idle' | 'running' | 'pr_ready' | 'error';

export interface Database {
  public: {
    Tables: {
      ls_workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ls_workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: UserRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: UserRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: UserRole;
          joined_at?: string;
        };
      };
      ls_linked_repositories: {
        Row: {
          id: string;
          workspace_id: string;
          github_repo_id: number;
          full_name: string;
          default_branch: string;
          is_private: boolean;
          ai_settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          github_repo_id: number;
          full_name: string;
          default_branch?: string;
          is_private?: boolean;
          ai_settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          github_repo_id?: number;
          full_name?: string;
          default_branch?: string;
          is_private?: boolean;
          ai_settings?: Json;
          created_at?: string;
        };
      };
      ls_kanban_columns: {
        Row: {
          id: string;
          repository_id: string;
          name: string;
          position: number;
          github_state: string;
          filter_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          repository_id: string;
          name: string;
          position?: number;
          github_state?: string;
          filter_label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          repository_id?: string;
          name?: string;
          position?: number;
          github_state?: string;
          filter_label?: string | null;
          created_at?: string;
        };
      };
      ls_issue_team_metadata: {
        Row: {
          id: string;
          github_repo_id: number;
          issue_number: number;
          story_points: number | null;
          internal_notes: string;
          ai_summary: string | null;
          antigravity_task_id: string | null;
          antigravity_status: AgentExecutionStatus;
          updated_at: string;
        };
        Insert: {
          id?: string;
          github_repo_id: number;
          issue_number: number;
          story_points?: number | null;
          internal_notes?: string;
          ai_summary?: string | null;
          antigravity_task_id?: string | null;
          antigravity_status?: AgentExecutionStatus;
          updated_at?: string;
        };
        Update: {
          id?: string;
          github_repo_id?: number;
          issue_number?: number;
          story_points?: number | null;
          internal_notes?: string;
          ai_summary?: string | null;
          antigravity_task_id?: string | null;
          antigravity_status?: AgentExecutionStatus;
          updated_at?: string;
        };
      };
      ls_ai_agent_logs: {
        Row: {
          id: string;
          issue_number: number;
          github_repo_id: number;
          prompt: string;
          response: string;
          agent_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_number: number;
          github_repo_id: number;
          prompt: string;
          response: string;
          agent_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_number?: number;
          github_repo_id?: number;
          prompt?: string;
          response?: string;
          agent_type?: string;
          created_at?: string;
        };
      };
    };
  };
}


