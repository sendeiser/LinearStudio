import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  User, 
  Flag, 
  Tag, 
  GitBranch, 
  Loader2,
  Send,
  MessageSquare,
  CheckSquare,
  Edit3,
  Trash2,
  Save,
  Plus,
  Shield,
  ChevronDown
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { dataService } from '../services/dataService';
import { getActiveIssueRepository } from '../services/issueRepository';
import { githubService } from '../services/githubService';
import { ColumnId, Issue, Priority } from '../types/issue';

export const IssueDetailDrawer: React.FC = () => {
  const queryClient = useQueryClient();
  const { 
    selectedIssue, 
    setSelectedIssue, 
    currentUserEmail,
    userRole,
    activeRepoId,
    activeRepoFullName,
    githubToken
  } = useStore();

  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editStatus, setEditStatus] = useState<ColumnId>('todo');
  const [editTags, setEditTags] = useState('');
  const [editAssignee, setEditAssignee] = useState('');

  // Subtask creation state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Synchronize edit fields when selectedIssue changes
  useEffect(() => {
    if (selectedIssue) {
      setEditTitle(selectedIssue.title);
      setEditDescription(selectedIssue.description || '');
      setEditPriority(selectedIssue.priority);
      setEditStatus(selectedIssue.status);
      setEditTags((selectedIssue.tags || []).join(', '));
      setEditAssignee(selectedIssue.assignee.name || '');
      setIsEditing(false);
      setConfirmDelete(false);
    }
  }, [selectedIssue]);

  if (!selectedIssue) return null;

  const isAdmin = userRole === 'owner' || userRole === 'admin' || userRole === 'developer';
  const repo = getActiveIssueRepository(activeRepoId, currentUserEmail, userRole);

  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    try {
      await repo.setSubtaskCompleted(selectedIssue.id, subtaskId, !currentCompleted);
    } catch (e) {
      console.warn('Notice al actualizar subtarea en Supabase:', e);
    }
    const updated = dataService.toggleSubtask(selectedIssue.id, subtaskId);
    if (updated) setSelectedIssue(updated);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setIsAddingSubtask(true);
    try {
      await repo.addSubtask(selectedIssue.id, newSubtaskTitle.trim());
    } catch (e) {
      console.warn('Notice al agregar subtarea en Supabase:', e);
    }
    dataService.addSubtask(selectedIssue.id, newSubtaskTitle.trim());
    const updated = dataService.getIssueById(selectedIssue.id);
    if (updated) setSelectedIssue(updated);
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await repo.deleteSubtask(selectedIssue.id, subtaskId);
    } catch (e) {
      console.warn('Notice al eliminar subtarea en Supabase:', e);
    }
    dataService.deleteSubtask(selectedIssue.id, subtaskId);
    const updated = dataService.getIssueById(selectedIssue.id);
    if (updated) setSelectedIssue(updated);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const handlePriorityChange = async (priority: Priority) => {
    try {
      await repo.setPriority(selectedIssue.id, priority);
    } catch (e) {
      console.warn('Notice al cambiar prioridad en Supabase:', e);
    }
    const updated = dataService.updateIssuePriority(selectedIssue.id, priority);
    if (updated) setSelectedIssue(updated);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const author = currentUserEmail ? currentUserEmail.split('@')[0] : 'TinChoX';

    try {
      await repo.addComment(selectedIssue.id, author, newComment.trim());
    } catch (e) {
      console.warn('Notice al agregar comentario en Supabase:', e);
    }
    dataService.addComment(selectedIssue.id, author, newComment.trim());
    const updated = dataService.getIssueById(selectedIssue.id);
    if (updated) setSelectedIssue(updated);
    setNewComment('');
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  // Cambiar directamente de columna / estado desde el drawer
  const handleDirectStatusChange = async (newStatus: ColumnId) => {
    if (!selectedIssue || selectedIssue.status === newStatus) return;

    // 1. Actualización optimista inmediata en React Query, drawer y dataService
    queryClient.setQueriesData<Issue[]>(
      { queryKey: ['issues'] },
      (old) => (old ? old.map((i) => (i.id === selectedIssue.id ? { ...i, status: newStatus } : i)) : old)
    );
    dataService.moveIssue(selectedIssue.id, newStatus);
    setSelectedIssue({ ...selectedIssue, status: newStatus });

    // 2. Supabase Cloud DB
    try {
      await repo.move(selectedIssue.id, newStatus);
    } catch (err) {
      console.warn('Notice al mover issue en Supabase desde Drawer:', err);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }

    // 3. Sincronizar estado a GitHub
    const targetRepo = selectedIssue.projectName || activeRepoFullName;
    const tok = githubToken || githubService.getToken();
    if (tok && targetRepo && targetRepo.includes('/')) {
      try {
        await githubService.updateGitHubIssue(
          targetRepo,
          selectedIssue.id,
          {
            state: newStatus === 'done' ? 'closed' : 'open',
            state_reason: newStatus === 'done' ? 'completed' : undefined
          },
          tok
        );
      } catch (ghErr) {
        console.warn('Notice al sincronizar cambio de columna a GitHub desde Drawer:', ghErr);
      }
    }
  };

  // Guardar edición del issue (CRUD Update)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsSaving(true);
    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // 1. Supabase Cloud DB
    try {
      await repo.update(selectedIssue.id, {
        title: editTitle.trim(),
        description: editDescription,
        priority: editPriority,
        status: editStatus,
        tags: parsedTags,
        assigneeName: editAssignee.trim() || selectedIssue.assignee.name
      });
    } catch (err: any) {
      console.warn('Notice al actualizar issue en Supabase:', err);
    }

    // 2. Local dataService
    const updated = dataService.updateIssue(selectedIssue.id, {
      title: editTitle.trim(),
      description: editDescription,
      priority: editPriority,
      status: editStatus,
      tags: parsedTags.length > 0 ? parsedTags : selectedIssue.tags,
      assignee: {
        ...selectedIssue.assignee,
        name: editAssignee.trim() || selectedIssue.assignee.name,
        avatar: (editAssignee.trim() || selectedIssue.assignee.name).slice(0, 2).toUpperCase()
      }
    });

    if (updated) setSelectedIssue(updated);

    // 3. GitHub Issue Update (bidirectional)
    const targetRepo = selectedIssue.projectName || activeRepoFullName;
    const tok = githubToken || githubService.getToken();
    if (tok && targetRepo && targetRepo.includes('/')) {
      try {
        await githubService.updateGitHubIssue(
          targetRepo,
          selectedIssue.id,
          {
            title: editTitle.trim(),
            body: editDescription.trim(),
            state: editStatus === 'done' ? 'closed' : 'open',
            state_reason: editStatus === 'done' ? 'completed' : undefined,
            labels: [editPriority, editStatus, ...parsedTags]
          },
          tok
        );
      } catch (ghErr) {
        console.warn('Notice al actualizar issue en GitHub desde Drawer:', ghErr);
      }
    }

    setIsSaving(false);
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  // Eliminar el issue (CRUD Delete)
  const handleDeleteIssue = async () => {
    setIsDeleting(true);

    // 1. Supabase Cloud DB
    try {
      await repo.delete(selectedIssue.id);
    } catch (err: any) {
      console.warn('Notice al eliminar issue en Supabase:', err);
    }

    // 2. Local dataService
    dataService.deleteIssue(selectedIssue.id);

    // 3. GitHub Issue Delete / Close (bidirectional)
    const targetRepo = selectedIssue.projectName || activeRepoFullName;
    const tok = githubToken || githubService.getToken();
    if (tok && targetRepo && targetRepo.includes('/')) {
      try {
        await githubService.closeOrDeleteGitHubIssue(targetRepo, selectedIssue.id, tok);
      } catch (ghErr) {
        console.warn('Notice al cerrar/eliminar issue en GitHub desde Drawer:', ghErr);
      }
    }

    setIsDeleting(false);
    setSelectedIssue(null);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
  };

  const completedSubtasks = selectedIssue.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = selectedIssue.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <aside 
      data-testid="issue-detail-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-surface dark:bg-dark-surface border-l border-border-subtle dark:border-dark-border flex flex-col shadow-flyout transform translate-x-0 md:static md:z-20 transition-transform duration-200 ease-in-out shrink-0"
    >
      {/* Header */}
      <div className="h-14 px-4 bg-surface-subtle dark:bg-dark-surface-elevated border-b border-border-subtle dark:border-dark-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-text-secondary dark:text-dark-text-muted truncate max-w-[140px]">
            {activeRepoFullName || 'repositorio'}
          </span>
          <span className="text-text-muted">/</span>
          <span className="font-mono text-xs text-brand dark:text-dark-brand font-bold">
            #{selectedIssue.id}
          </span>
          {isAdmin && (
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono text-[9px] font-bold border border-purple-200 dark:border-purple-800 items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> ADMIN
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {isAdmin && !isEditing && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface text-text-secondary hover:text-brand transition-colors"
                title="Editar este issue (CRUD)"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg border border-border-subtle hover:bg-rose-50 dark:hover:bg-rose-950/30 text-text-secondary hover:text-rose-600 transition-colors"
                title="Eliminar este issue (CRUD)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="relative inline-flex items-center">
            <select
              value={selectedIssue.status}
              onChange={(e) => handleDirectStatusChange(e.target.value as ColumnId)}
              className="appearance-none pl-2.5 pr-6 py-0.5 rounded-full bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border text-text-primary dark:text-dark-text font-mono text-[10px] font-bold uppercase cursor-pointer hover:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-xs"
              title="Cambiar estado / columna del issue"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-1.5 pointer-events-none text-text-muted" />
          </div>

          <a
            href={`https://github.com/${activeRepoFullName}/issues/${selectedIssue.id}`}
            target="_blank"
            rel="noreferrer"
            className="p-1 rounded text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface dark:hover:bg-dark-surface transition-colors"
            title="Ver en GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => setSelectedIssue(null)}
            className="p-1.5 rounded-lg text-text-secondary dark:text-dark-text-muted hover:text-text-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated transition-colors"
            title="Cerrar panel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Banner for Deletion */}
      {confirmDelete && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-300 dark:border-rose-900 flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs">
            <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
            <span>¿Confirmas eliminar el Issue #{selectedIssue.id}?</span>
          </div>
          <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-tight">
            Esta acción eliminará permanentemente este issue, sus subtareas y comentarios en Supabase Cloud.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleDeleteIssue}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar issue'}</span>
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg bg-surface dark:bg-dark-surface border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Drawer Body: Modo Edición vs Modo Vista */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle dark:border-dark-border">
            <span className="font-bold text-xs text-brand dark:text-dark-brand flex items-center gap-1.5">
              <Edit3 className="w-4 h-4" /> Modificar Issue #{selectedIssue.id}
            </span>
            <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
              MODO ADMIN
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
              Título del Issue *
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título descriptivo..."
              className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-brand text-text-primary dark:text-dark-text"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
              Descripción detallada
            </label>
            <textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Explica los requerimientos o pasos para reproducir..."
              className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg p-2.5 text-xs outline-none focus:border-brand resize-none text-text-primary dark:text-dark-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                Columna / Estado
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ColumnId)}
                className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand cursor-pointer text-text-primary dark:text-dark-text"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">Por Hacer</option>
                <option value="in_progress">En Progreso</option>
                <option value="in_review">En Revisión</option>
                <option value="done">Completado</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                Prioridad
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
                className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand cursor-pointer text-text-primary dark:text-dark-text"
              >
                <option value="urgent">🔥 Urgente</option>
                <option value="high">⚠️ Alta</option>
                <option value="medium">🔹 Media</option>
                <option value="low">☕ Baja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
              Etiquetas (separadas por comas)
            </label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="ej: bug, frontend, security"
              className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand font-mono text-text-primary dark:text-dark-text"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
              Responsable / Asignado
            </label>
            <input
              type="text"
              value={editAssignee}
              onChange={(e) => setEditAssignee(e.target.value)}
              placeholder="Nombre del desarrollador asignado"
              className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand text-text-primary dark:text-dark-text"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle dark:border-dark-border mt-auto">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-2 rounded-lg border border-border-subtle hover:bg-surface text-text-secondary text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Guardando en Supabase...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* Modo Vista Normal */
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
          {/* Title */}
          <h2 className="text-base font-bold text-text-primary dark:text-dark-text leading-snug">
            {selectedIssue.title}
          </h2>

          {/* Property Grid */}
          <div className="p-3 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5" /> Asignado
              </span>
              <div className="flex items-center gap-1.5 font-bold text-text-primary dark:text-dark-text">
                <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-bold">
                  {selectedIssue.assignee.avatar}
                </div>
                <span>{selectedIssue.assignee.name}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
                <Flag className="w-3.5 h-3.5 text-urgent" /> Prioridad
              </span>
              <select
                value={selectedIssue.priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                className="bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-text-primary dark:text-dark-text text-[11px] font-bold rounded px-2 py-0.5 outline-none focus:border-brand cursor-pointer"
              >
                <option value="urgent">🔥 Urgente</option>
                <option value="high">⚠️ Alta</option>
                <option value="medium">🔹 Media</option>
                <option value="low">☕ Baja</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
                <Tag className="w-3.5 h-3.5" /> Etiquetas
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {selectedIssue.tags.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-done-bg dark:bg-emerald-950/40 text-done dark:text-emerald-300 font-mono text-[10px] border border-done-border dark:border-emerald-800 font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {selectedIssue.branch && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary dark:text-dark-text-muted flex items-center gap-1.5 font-medium">
                  <GitBranch className="w-3.5 h-3.5" /> Branch
                </span>
                <code className="font-mono text-[11px] text-brand dark:text-dark-brand bg-surface dark:bg-dark-surface px-1.5 py-0.5 rounded border border-border-subtle dark:border-dark-border font-semibold">
                  {selectedIssue.branch}
                </code>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider">
              Descripción
            </span>
            <div className="p-3 rounded-lg bg-surface dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border text-text-primary dark:text-dark-text leading-relaxed shadow-sm">
              <p>{selectedIssue.description || 'Sin descripción adicional para este issue.'}</p>
            </div>
          </div>

          {/* Checklist Subtasks with Add & Delete */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" /> Subtareas ({completedSubtasks}/{totalSubtasks})
              </span>
              <span className="font-mono text-[11px] text-brand dark:text-dark-brand font-bold">
                {subtaskProgress}%
              </span>
            </div>

            {/* Subtasks Progress Bar */}
            <div className="w-full bg-surface-subtle dark:bg-dark-surface-elevated rounded-full h-1.5 overflow-hidden border border-border-subtle dark:border-dark-border">
              <div 
                className="bg-brand dark:bg-dark-brand h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              {selectedIssue.subtasks.map((st) => (
                <div 
                  key={st.id} 
                  className="group flex items-center justify-between p-2 rounded-lg bg-surface dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border hover:bg-surface-subtle dark:hover:bg-dark-surface shadow-sm transition-colors"
                >
                  <label 
                    onClick={() => handleToggleSubtask(st.id, st.completed)}
                    className="flex items-center gap-2.5 flex-1 cursor-pointer select-none min-w-0"
                  >
                    <input 
                      type="checkbox" 
                      checked={st.completed}
                      onChange={() => {}} 
                      className="rounded border-border-subtle text-brand focus:ring-brand cursor-pointer shrink-0" 
                    />
                    <span className={`truncate ${st.completed ? 'line-through text-text-muted font-normal' : 'text-text-primary dark:text-dark-text font-medium'}`}>
                      {st.title}
                    </span>
                  </label>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-muted hover:text-rose-600 transition-all ml-1.5 shrink-0"
                      title="Eliminar subtarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Subtask Form */}
            {isAdmin && (
              <form onSubmit={handleAddSubtask} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="+ Añadir subtarea al issue..."
                  className="flex-1 bg-surface dark:bg-dark-surface-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand text-text-primary dark:text-dark-text"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                  className="px-2.5 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir</span>
                </button>
              </form>
            )}
          </div>

          {/* Discussion / Comments Stream */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-border-subtle dark:border-dark-border">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary dark:text-dark-text-muted uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5" /> Discusión ({selectedIssue.comments.length})
            </div>

            {/* Existing Comments */}
            <div className="space-y-2">
              {selectedIssue.comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="p-2.5 rounded-lg bg-surface dark:bg-dark-surface-elevated border border-border-subtle dark:border-dark-border flex flex-col gap-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-text-primary dark:text-dark-text">
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px]">
                        {comment.avatar}
                      </span>
                      <span>{comment.author}</span>
                    </div>
                    <span className="font-mono text-[9px] text-text-muted">{comment.createdAt}</span>
                  </div>
                  <p className="text-text-secondary dark:text-dark-text-muted text-[11px] leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario o actualización..."
                className="flex-1 bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary dark:text-dark-text placeholder:text-text-muted focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand dark:hover:bg-dark-brand-hover text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
