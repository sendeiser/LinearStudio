export type PullRequestStatus = 'open' | 'merged' | 'closed' | 'draft';
export type CiStatus = 'passing' | 'running' | 'failed' | 'pending';

export interface PullRequest {
  number: number;
  title: string;
  body?: string;
  author: {
    name: string;
    avatar: string;
    isAi?: boolean;
  };
  branch: string;
  baseBranch: string;
  status: PullRequestStatus;
  ciStatus: CiStatus;
  additions: number;
  deletions: number;
  commitsCount: number;
  commentsCount: number;
  createdAt: string;
  htmlUrl: string;
  aiReview?: string;
}
