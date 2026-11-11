import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ColumnId, Priority } from '../types/issue';
import { dataService } from '../services/dataService';
import { getActiveIssueRepository } from '../services/issueRepository';

export const CreateIssueModal: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const { isCreateModalOpen, setIsCreateModalOpen, activeRepoId, currentUserEmail, userRole } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<ColumnId>('todo');

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const repo = getActiveIssueRepository(activeRepoId, currentUserEmail, userRole);
    try {
      await repo.create({
        title,
        description,
        priority,
        status
      });
    } catch (err) {
      console.warn('Notice al crear issue en Supabase:', err);
    }

    dataService.createIssue({
      title,
      description,
      priority,
      status
    });

    setTitle('');
    setDescription('');
    setIsCreateModalOpen(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-xl shadow-flyout overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 bg-surface-subtle dark:bg-dark-surface-elevated border-b border-border-subtle dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-brand dark:text-dark-brand" />
            <span className="font-bold text-xs text-text-primary dark:text-dark-text">
              Crear Nuevo Issue
            </span>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
              Título del Issue *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Corregir memory leak en conexión websocket"
              className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-3 py-2 text-text-primary dark:text-dark-text placeholder:text-text-muted focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-3 py-2 text-text-primary dark:text-dark-text focus:border-brand outline-none"
              >
                <option value="urgent">🔥 Urgente</option>
                <option value="high">⚠️ Alta</option>
                <option value="medium">🔹 Media</option>
                <option value="low">▫️ Baja</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                Columna Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ColumnId)}
                className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-3 py-2 text-text-primary dark:text-dark-text focus:border-brand outline-none"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">Por Hacer</option>
                <option value="in_progress">En Progreso</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
              Descripción (Markdown)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe los pasos para reproducir o los requerimientos técnicos..."
              className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg p-3 text-text-primary dark:text-dark-text placeholder:text-text-muted focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle dark:border-dark-border">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted hover:text-text-primary hover:bg-surface-subtle font-medium"
            >
              Cancelar (Esc)
            </button>
            <button
              data-testid="submit-issue-btn"
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white font-bold shadow-sm"
            >
              Crear Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

