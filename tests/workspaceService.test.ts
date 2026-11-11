import { describe, it, expect } from 'vitest';
import { WorkspaceService } from '../src/services/workspaceService';

type Call = { method: string; args: unknown[] };

const mockClient = (responses: Record<string, unknown>) => {
  const calls: Call[] = [];
  const client: any = {
    auth: {
      signInWithPassword: (creds: any) => {
        calls.push({ method: 'signIn', args: [creds] });
        return Promise.resolve(responses['signIn'] ?? { data: { user: { id: 'u1', email: creds.email } }, error: null });
      },
      signUp: (creds: any) => {
        calls.push({ method: 'signUp', args: [creds] });
        return Promise.resolve(responses['signUp'] ?? { data: { user: { id: 'u2', email: creds.email } }, error: null });
      },
      signOut: () => {
        calls.push({ method: 'signOut', args: [] });
        return Promise.resolve({ error: null });
      },
      getUser: () => {
        return Promise.resolve(responses['getUser'] ?? { data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
      },
      updateUser: (attrs: any) => {
        calls.push({ method: 'updateUser', args: [attrs] });
        return Promise.resolve(responses['updateUser'] ?? { data: { user: { id: 'u1', email: 'test@example.com' } }, error: null });
      },
      resetPasswordForEmail: (email: string, opts: any) => {
        calls.push({ method: 'resetPasswordForEmail', args: [email, opts] });
        return Promise.resolve(responses['resetPasswordForEmail'] ?? { error: null });
      }
    },
    rpc: (fnName: string, params: any) => {
      calls.push({ method: `rpc:${fnName}`, args: [params] });
      return Promise.resolve(responses[`rpc:${fnName}`] ?? { data: 'created-repo-uuid', error: null });
    },
    from: (table: string) => {
      const builder: any = {
        select: () => builder,
        order: () => builder,
        eq: () => builder,
        then: (resolve: any) => {
          calls.push({ method: `from:${table}`, args: [] });
          resolve(responses[`from:${table}`] ?? { data: [], error: null });
        }
      };
      return builder;
    }
  };
  return { client, calls };
};

describe('WorkspaceService', () => {
  it('should authenticate user and return profile', async () => {
    const { client, calls } = mockClient({});
    const service = new WorkspaceService(client);
    const user = await service.signIn('tincho@example.com', 'password123');

    expect(user.email).toBe('tincho@example.com');
    expect(calls.some(c => c.method === 'signIn')).toBe(true);
  });

  it('should create workspace via ls_create_workspace RPC with slugified name', async () => {
    const { client, calls } = mockClient({
      'rpc:ls_create_workspace': { data: 'repo-uuid-123', error: null }
    });
    const service = new WorkspaceService(client);
    const repoId = await service.createWorkspace('Linear Team Alpha', 'tincho/hyper-flow');

    expect(repoId).toBe('repo-uuid-123');
    const rpcCall = calls.find(c => c.method === 'rpc:ls_create_workspace');
    expect(rpcCall).toBeDefined();
    expect(rpcCall?.args[0]).toMatchObject({
      p_name: 'Linear Team Alpha',
      p_slug: 'linear-team-alpha',
      p_repo_full_name: 'tincho/hyper-flow'
    });
  });

  it('should invite member via ls_add_member_by_email RPC', async () => {
    const { client, calls } = mockClient({
      'rpc:ls_add_member_by_email': { data: 'member-user-uuid', error: null }
    });
    const service = new WorkspaceService(client);
    const targetUserId = await service.inviteMember('ws-uuid-1', 'elena@example.com', 'developer');

    expect(targetUserId).toBe('member-user-uuid');
    const rpcCall = calls.find(c => c.method === 'rpc:ls_add_member_by_email');
    expect(rpcCall?.args[0]).toMatchObject({
      p_workspace: 'ws-uuid-1',
      p_email: 'elena@example.com',
      p_role: 'developer'
    });
  });

  it('should update user password successfully', async () => {
    const { client, calls } = mockClient({});
    const service = new WorkspaceService(client);
    const user = await service.updatePassword('NewSecurePass2026!');

    expect(user.id).toBe('u1');
    const updateCall = calls.find(c => c.method === 'updateUser');
    expect(updateCall).toBeDefined();
    expect(updateCall?.args[0]).toEqual({ password: 'NewSecurePass2026!' });
  });

  it('should validate minimum password length before updating', async () => {
    const { client } = mockClient({});
    const service = new WorkspaceService(client);
    await expect(service.updatePassword('12345')).rejects.toThrow('al menos 6 caracteres');
  });

  it('should trigger password reset email via resetPasswordForEmail', async () => {
    const { client, calls } = mockClient({});
    const service = new WorkspaceService(client);
    await service.resetPasswordForEmail('user@linear.studio');

    const resetCall = calls.find(c => c.method === 'resetPasswordForEmail');
    expect(resetCall).toBeDefined();
    expect(resetCall?.args[0]).toBe('user@linear.studio');
  });

  it('should list workspace members via ls_list_workspace_members RPC', async () => {
    const { client, calls } = mockClient({
      'rpc:ls_list_workspace_members': {
        data: [
          { id: 'm1', user_id: 'u1', email: 'owner@test.com', name: 'Owner', role: 'owner', joined_at: '2026-11-11' },
          { id: 'm2', user_id: 'u2', email: 'dev@test.com', name: 'Dev', role: 'developer', joined_at: '2026-11-11' }
        ],
        error: null
      }
    });
    const service = new WorkspaceService(client);
    const members = await service.listWorkspaceMembers('ws-uuid-1');

    expect(members).toHaveLength(2);
    expect(members[1].email).toBe('dev@test.com');
    const rpcCall = calls.find(c => c.method === 'rpc:ls_list_workspace_members');
    expect(rpcCall?.args[0]).toEqual({ p_workspace: 'ws-uuid-1' });
  });

  it('should remove a workspace member via ls_remove_workspace_member RPC', async () => {
    const { client, calls } = mockClient({
      'rpc:ls_remove_workspace_member': { data: null, error: null }
    });
    const service = new WorkspaceService(client);
    await service.removeMember('ws-uuid-1', 'u2');

    const rpcCall = calls.find(c => c.method === 'rpc:ls_remove_workspace_member');
    expect(rpcCall).toBeDefined();
    expect(rpcCall?.args[0]).toEqual({ p_workspace: 'ws-uuid-1', p_target_user_id: 'u2' });
  });

  it('should delete a workspace via ls_delete_workspace RPC', async () => {
    const { client, calls } = mockClient({
      'rpc:ls_delete_workspace': { data: null, error: null }
    });
    const service = new WorkspaceService(client);
    await service.deleteWorkspace('ws-uuid-1');

    const rpcCall = calls.find(c => c.method === 'rpc:ls_delete_workspace');
    expect(rpcCall).toBeDefined();
    expect(rpcCall?.args[0]).toEqual({ p_workspace: 'ws-uuid-1' });
  });
});

