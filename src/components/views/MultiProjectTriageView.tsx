import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  ExternalLink,
  GitBranch,
  FolderGit2,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Check,
  FolderPlus
} from 'lucide-react';
import { Issue, ColumnId, Priority } from '../../types/issue';
import { useStore } from '../../store/useStore';
import { dataService } from '../../services/dataService';
import { workspaceService } from '../../services/workspaceService';
import { getActiveIssueRepository } from '../../services/issueRepository';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MultiProjectTriageViewProps {
  issues: Issue[];
}

interface ProjectCardData {
  id: string;
  fullName: string;
  defaultBranch: string;
  isPrivate?: boolean;
}

export const MultiProjectTriageView: React.FC<MultiProjectTriageViewProps> = ({ issues }) => {
  const queryClient = useQueryClient();
  const { 
    setSelectedIssue, 
    activeRepoId, 
    setActiveRepoId, 
    activeRepoFullName, 
    setActiveRepoFullName, 
    currentUserEmail, 
    userRole 
  } = useStore();

  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState<string>('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modals state for CRUD
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRepoFullName, setNewRepoFullName] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('main');
  const [isAddingRepo, setIsAddingRepo] = useState(false);

  const [editingProject, setEditingProject] = useState<ProjectCardData | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editBranch, setEditBranch] = useState('main');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingProject, setDeletingProject] = useState<{ id: string; fullName: string } | null>(null);
  const [isDeletingRepo, setIsDeletingRepo] = useState(false);

  // Load linked repositories from Supabase Cloud DB
  const { 
    data: dbProjects = [], 
    isLoading: loadingProjects 
  } = useQuery({
    queryKey: ['linked-repositories'],
    queryFn: async () => {
      const repos = await workspaceService.listLinkedRepositories();
      return repos;
    }
  });

  // Unified list of available projects (strictly DB repos when authenticated)
  const availableProjects: ProjectCardData[] = useMemo(() => {
    const list: ProjectCardData[] = [...dbProjects];

    // Solo crear cards virtuales si no hay sesión autenticada (modo demo local)
    if (!currentUserEmail) {
      const registeredNames = new Set(list.map((p) => p.fullName.toLowerCase()));
      issues.forEach((issue) => {
        const pName = issue.projectName;
        if (pName && !registeredNames.has(pName.toLowerCase())) {
          list.push({
            id: `virtual_${pName}`,
            fullName: pName,
            defaultBranch: 'main'
          });
          registeredNames.add(pName.toLowerCase());
        }
      });
    }

    return list;
  }, [dbProjects, issues, currentUserEmail]);

  // Default target project for new issue selector
  useEffect(() => {
    if (!newProject && availableProjects.length > 0) {
      setNewProject(availableProjects[0].fullName);
    }
  }, [availableProjects, newProject]);

  const getProjectColor = (pName?: string) => {
    if (!pName) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    const lower = pName.toLowerCase();
    if (lower.includes('boxtools')) return 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300';
    if (lower.includes('linearstudio') || lower.includes('linear-studio')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300';
    if (lower.includes('poneleplay')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-300';
    if (lower.includes('comanda')) return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300';
    if (lower.includes('hyper-flow')) return 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-300';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300';
  };

  const filteredIssues = issues.filter((i) => {
    const proj = i.projectName || (availableProjects[0]?.fullName ?? 'General');
    if (selectedProject !== 'all' && proj.toLowerCase() !== selectedProject.toLowerCase()) return false;
    if (priorityFilter !== 'all' && i.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        proj.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = async (issueId: number, newStatus: ColumnId) => {
    queryClient.setQueriesData<Issue[]>(
      { queryKey: ['issues'] },
      (old) => (old ? old.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)) : old)
    );
    dataService.moveIssue(issueId, newStatus);
    const repo = getActiveIssueRepository(activeRepoId, currentUserEmail, userRole);
    try {
      await repo.move(issueId, newStatus);
    } catch (err) {
      console.warn('Notice al mover en Supabase:', err);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }
    setFeedback(`✓ Issue #${issueId} actualizado a '${newStatus}'`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handlePriorityChange = async (issueId: number, newPriority: Priority) => {
    queryClient.setQueriesData<Issue[]>(
      { queryKey: ['issues'] },
      (old) => (old ? old.map((i) => (i.id === issueId ? { ...i, priority: newPriority } : i)) : old)
    );
    dataService.updateIssuePriority(issueId, newPriority);
    const repo = getActiveIssueRepository(activeRepoId, currentUserEmail, userRole);
    try {
      await repo.setPriority(issueId, newPriority);
    } catch (err) {
      console.warn('Notice al cambiar prioridad en Supabase:', err);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }
    setFeedback(`✓ Prioridad del Issue #${issueId} cambiada a '${newPriority}'`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetProj = newProject || (availableProjects[0]?.fullName ?? 'LinearStudio');
    dataService.createIssue({
      title: newTitle.trim(),
      description: `Issue creado desde el Triage Multi-Proyecto para ${targetProj}`,
      priority: newPriority,
      status: 'todo',
      projectName: targetProj
    });

    queryClient.invalidateQueries({ queryKey: ['issues'] });
    setFeedback(`✓ Nuevo issue creado para el proyecto '${targetProj}'`);
    setNewTitle('');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Add Project
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoFullName.trim()) return;
    setIsAddingRepo(true);
    try {
      await workspaceService.addLinkedRepository(newRepoFullName.trim(), newRepoBranch.trim() || 'main');
      await queryClient.invalidateQueries({ queryKey: ['linked-repositories'] });
      setFeedback(`✓ Repositorio '${newRepoFullName.trim()}' vinculado con éxito a las federaciones.`);
      setIsAddModalOpen(false);
      setNewRepoFullName('');
      setNewRepoBranch('main');
    } catch (err: any) {
      setFeedback(`Error al agregar repositorio: ${err.message}`);
    } finally {
      setIsAddingRepo(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Edit Project
  const handleOpenEdit = (proj: ProjectCardData) => {
    setEditingProject(proj);
    setEditFullName(proj.fullName);
    setEditBranch(proj.defaultBranch || 'main');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editFullName.trim()) return;
    setIsSavingEdit(true);
    try {
      const oldName = editingProject.fullName;
      const newName = editFullName.trim();
      const newBranch = editBranch.trim() || 'main';

      if (!editingProject.id.startsWith('virtual_')) {
        await workspaceService.updateLinkedRepository(editingProject.id, newName, newBranch);
      }
      
      dataService.renameProjectInIssues(oldName, newName);

      await queryClient.invalidateQueries({ queryKey: ['linked-repositories'] });
      await queryClient.invalidateQueries({ queryKey: ['issues'] });

      if (selectedProject.toLowerCase() === oldName.toLowerCase()) {
        setSelectedProject(newName);
      }
      if (newProject.toLowerCase() === oldName.toLowerCase()) {
        setNewProject(newName);
      }
      if (activeRepoId === editingProject.id || activeRepoFullName.toLowerCase() === oldName.toLowerCase()) {
        setActiveRepoFullName(newName);
      }

      setFeedback(`✓ Repositorio actualizado a '${newName}' (${newBranch}).`);
      setEditingProject(null);
    } catch (err: any) {
      setFeedback(`Error al actualizar proyecto: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Delete Project
  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    setIsDeletingRepo(true);
    try {
      const projName = deletingProject.fullName;
      const deletedId = deletingProject.id;
      if (!deletedId.startsWith('virtual_')) {
        await workspaceService.deleteLinkedRepository(deletedId);
      }
      dataService.deleteIssuesByProject(projName);

      // Limpiar inmediatamente en caché y actualizar repositorio activo si fue el eliminado
      queryClient.setQueriesData<Issue[]>(
        { queryKey: ['issues'] },
        (old) => (old ? old.filter((i) => (i.projectName || '').toLowerCase() !== projName.toLowerCase()) : old)
      );

      if (activeRepoId === deletedId || activeRepoFullName.toLowerCase() === projName.toLowerCase()) {
        const remainingRepos = await workspaceService.listLinkedRepositories();
        const nextRepo = remainingRepos.find((r) => r.id !== deletedId);
        if (nextRepo) {
          setActiveRepoId(nextRepo.id);
          setActiveRepoFullName(nextRepo.fullName);
        } else {
          setActiveRepoId(null);
          setActiveRepoFullName('Sin repositorio');
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['linked-repositories'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      await queryClient.invalidateQueries({ queryKey: ['issues'] });

      if (selectedProject.toLowerCase() === projName.toLowerCase()) {
        setSelectedProject('all');
      }

      setFeedback(`✓ Repositorio '${projName}' y sus issues eliminados correctamente.`);
      setDeletingProject(null);
    } catch (err: any) {
      setFeedback(`Error al eliminar proyecto: ${err.message}`);
    } finally {
      setIsDeletingRepo(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas dark:bg-dark-canvas overflow-y-auto p-4 gap-4">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand dark:bg-dark-brand text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-text-primary dark:text-dark-text">Triage Multi-Proyecto & Federaciones</h1>
              <span className="px-2 py-0.5 rounded-full bg-brand-subtle dark:bg-brand/20 text-brand font-mono text-[10px] font-bold border border-brand/30">
                {availableProjects.length} REPOS ACTIVOS
              </span>
              {loadingProjects && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-text-muted" />
              )}
            </div>
            <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
              Supervisión centralizada, priorización ágil, edición y eliminación de repositorios federados en Supabase Cloud.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {feedback && (
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-300 animate-fadeIn">
              {feedback}
            </div>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="py-1.5 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Agregar Proyecto</span>
          </button>
        </div>
      </div>

      {/* Project KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {availableProjects.map((proj) => {
          const projIssues = issues.filter((i) => {
            const iProj = i.projectName || activeRepoFullName || (availableProjects[0]?.fullName ?? '');
            return iProj.toLowerCase() === proj.fullName.toLowerCase();
          });
          const urgentCount = projIssues.filter((i) => i.priority === 'urgent' || i.priority === 'high').length;
          const inProgressCount = projIssues.filter((i) => i.status === 'in_progress').length;
          const doneCount = projIssues.filter((i) => i.status === 'done').length;
          const total = projIssues.length;
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
          const isSelected = selectedProject.toLowerCase() === proj.fullName.toLowerCase();

          return (
            <div 
              key={proj.id}
              data-testid={`project-card-${proj.fullName}`}
              onClick={() => setSelectedProject(isSelected ? 'all' : proj.fullName)}
              className={`p-4 rounded-xl bg-surface dark:bg-dark-surface border transition-all cursor-pointer shadow-sm relative group ${
                isSelected 
                  ? 'border-brand ring-1 ring-brand' 
                  : 'border-border-subtle dark:border-dark-border hover:border-brand/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5 truncate max-w-[65%]">
                  <FolderGit2 className="w-4 h-4 text-brand dark:text-dark-brand shrink-0" />
                  <span className="truncate" title={proj.fullName}>{proj.fullName}</span>
                </span>
                
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle dark:bg-dark-surface-elevated text-text-secondary flex items-center gap-1 border border-border-subtle">
                    <GitBranch className="w-2.5 h-2.5" />
                    {proj.defaultBranch || 'main'}
                  </span>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(proj);
                      }}
                      title="Modificar proyecto"
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-text-muted hover:text-brand transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProject({ id: proj.id, fullName: proj.fullName });
                      }}
                      title="Eliminar de federaciones"
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-text-muted hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs my-2.5">
                <div className="p-1.5 rounded-lg bg-surface-subtle dark:bg-dark-surface-elevated">
                  <span className="block font-bold text-text-primary dark:text-dark-text">{total}</span>
                  <span className="text-[10px] text-text-secondary">Total</span>
                </div>
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                  <span className="block font-bold">{urgentCount}</span>
                  <span className="text-[10px]">Urgente</span>
                </div>
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-brand">
                  <span className="block font-bold">{inProgressCount}</span>
                  <span className="text-[10px]">En Curso</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-secondary dark:text-dark-text-muted mt-2">
                <span>Progreso ({doneCount}/{total})</span>
                <span className="font-bold text-text-primary dark:text-dark-text">{pct}%</span>
              </div>
              <div className="w-full bg-surface-subtle dark:bg-dark-surface-elevated rounded-full h-1.5 mt-1 overflow-hidden">
                <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Issue Creator across any project */}
      <div className="p-4 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border shadow-sm">
        <form onSubmit={handleCreateIssue} className="flex flex-col sm:flex-row items-center gap-2 text-xs">
          <span className="font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5 whitespace-nowrap">
            <Plus className="w-4 h-4 text-brand dark:text-dark-brand" />
            <span>Crear Issue en Proyecto:</span>
          </span>

          <select
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            className="bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-2.5 py-1.5 text-text-primary font-bold outline-none focus:border-brand cursor-pointer"
          >
            {availableProjects.map((p) => (
              <option key={p.id} value={p.fullName}>
                📁 {p.fullName}
              </option>
            ))}
          </select>

          <input
            type="text"
            required
            placeholder="Título del nuevo issue para este proyecto..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-3 py-1.5 text-text-primary dark:text-dark-text outline-none focus:border-brand w-full"
          />

          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Priority)}
            className="bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-2.5 py-1.5 text-text-primary outline-none focus:border-brand"
          >
            <option value="urgent">🔴 Urgente</option>
            <option value="high">🟠 Alta</option>
            <option value="medium">🟡 Media</option>
            <option value="low">🟢 Baja</option>
          </select>

          <button
            type="submit"
            className="py-1.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold shadow-sm whitespace-nowrap flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enviar Issue</span>
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface dark:bg-dark-surface p-3 rounded-xl border border-border-subtle dark:border-dark-border shadow-sm text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedProject('all')}
            className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
              selectedProject === 'all'
                ? 'bg-brand text-white border-brand'
                : 'bg-canvas dark:bg-dark-canvas border-border-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            Todos ({issues.length})
          </button>
          {availableProjects.map((p) => {
            const isSel = selectedProject.toLowerCase() === p.fullName.toLowerCase();
            const displayName = p.fullName.includes('/') ? p.fullName.split('/')[1] : p.fullName;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p.fullName)}
                className={`px-3 py-1 rounded-lg font-bold border transition-colors whitespace-nowrap ${
                  isSel
                    ? 'bg-brand text-white border-brand'
                    : 'bg-canvas dark:bg-dark-canvas border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                {displayName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar en todos los proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg text-xs text-text-primary dark:text-dark-text outline-none focus:border-brand"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-2.5 py-1 text-xs text-text-primary outline-none focus:border-brand"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Unified Multi-Project Triage Table */}
      <div className="flex-1 bg-surface dark:bg-dark-surface rounded-xl border border-border-subtle dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-subtle dark:border-dark-border bg-surface-subtle/60 dark:bg-dark-surface-elevated/60 text-text-secondary dark:text-dark-text-muted font-bold font-mono">
                <th className="p-3 w-16">#ID</th>
                <th className="p-3 w-48">PROYECTO</th>
                <th className="p-3">TÍTULO & ETIQUETAS</th>
                <th className="p-3 w-36">PRIORIDAD</th>
                <th className="p-3 w-44">ESTADO</th>
                <th className="p-3 w-36">ASIGNADO</th>
                <th className="p-3 w-16 text-center">VER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle dark:divide-dark-border font-sans">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    No se encontraron issues para el filtro o proyecto seleccionado.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  const projName = issue.projectName || availableProjects[0]?.fullName || 'General';
                  return (
                    <tr
                      key={issue.id}
                      className="hover:bg-surface-subtle/50 dark:hover:bg-dark-surface-elevated/40 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-text-muted">
                        #{issue.id}
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border inline-block max-w-[170px] truncate ${getProjectColor(projName)}`}>
                          {projName}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span 
                            onClick={() => setSelectedIssue(issue)}
                            className="font-medium text-text-primary dark:text-dark-text hover:text-brand dark:hover:text-dark-brand cursor-pointer"
                          >
                            {issue.title}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {issue.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.2 rounded bg-surface-subtle dark:bg-dark-surface-elevated text-text-muted font-mono text-[10px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <select
                          value={issue.priority}
                          onChange={(e) => handlePriorityChange(issue.id, e.target.value as Priority)}
                          className={`text-[11px] font-bold rounded px-2 py-0.5 border outline-none cursor-pointer ${
                            issue.priority === 'urgent'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-300'
                              : issue.priority === 'high'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300'
                              : issue.priority === 'medium'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300'
                              : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                          }`}
                        >
                          <option value="urgent">🔴 Urgente</option>
                          <option value="high">🟠 Alta</option>
                          <option value="medium">🟡 Media</option>
                          <option value="low">🟢 Baja</option>
                        </select>
                      </td>

                      <td className="p-3">
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusChange(issue.id, e.target.value as ColumnId)}
                          className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
                            issue.status === 'done'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                              : issue.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300'
                              : issue.status === 'in_review'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300'
                              : 'bg-surface-subtle text-text-secondary border-border-subtle'
                          }`}
                        >
                          <option value="backlog">· Backlog</option>
                          <option value="todo">○ Por Hacer</option>
                          <option value="in_progress">▶ En Proceso</option>
                          <option value="in_review">👁 En Revisión</option>
                          <option value="done">✓ Completado</option>
                        </select>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand/20 text-brand text-[10px] font-bold flex items-center justify-center shrink-0">
                            {issue.assignee?.avatar || 'AI'}
                          </div>
                          <span className="text-text-secondary dark:text-dark-text-muted truncate max-w-[90px]">
                            {issue.assignee?.name || 'Antigravity'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          title="Ver detalle"
                          className="p-1.5 rounded-lg hover:bg-surface-subtle dark:hover:bg-dark-surface-elevated text-text-muted hover:text-brand"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Agregar Repositorio / Proyecto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-2xl w-full max-w-md p-6 shadow-xl animate-scaleIn flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle dark:border-dark-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary dark:text-dark-text">Agregar Nuevo Repositorio</h3>
                  <p className="text-[11px] text-text-secondary">Vincúlalo a las federaciones multi-proyecto de Supabase Cloud</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                  Nombre del Repositorio (owner/repo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: sendeiser/LinearStudio"
                  value={newRepoFullName}
                  onChange={(e) => setNewRepoFullName(e.target.value)}
                  className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-2 font-mono text-xs outline-none focus:border-brand text-text-primary dark:text-dark-text"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                  Rama Principal por Defecto
                </label>
                <input
                  type="text"
                  placeholder="main"
                  value={newRepoBranch}
                  onChange={(e) => setNewRepoBranch(e.target.value)}
                  className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-2 font-mono text-xs outline-none focus:border-brand text-text-primary dark:text-dark-text"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle dark:border-dark-border mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-1.5 px-3 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAddingRepo || !newRepoFullName.trim()}
                  className="py-1.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAddingRepo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isAddingRepo ? 'Guardando...' : 'Vincular Repositorio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Modificar / Editar Proyecto */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-2xl w-full max-w-md p-6 shadow-xl animate-scaleIn flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle dark:border-dark-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary dark:text-dark-text">Modificar Proyecto Federado</h3>
                  <p className="text-[11px] text-text-secondary">Actualiza el identificador y la rama por defecto</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                  Nombre del Repositorio (owner/repo)
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-2 font-mono text-xs outline-none focus:border-brand text-text-primary dark:text-dark-text"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary dark:text-dark-text-muted mb-1">
                  Rama Principal
                </label>
                <input
                  type="text"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className="w-full bg-canvas dark:bg-dark-canvas border border-border-subtle rounded-lg px-3 py-2 font-mono text-xs outline-none focus:border-brand text-text-primary dark:text-dark-text"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle dark:border-dark-border mt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="py-1.5 px-3 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editFullName.trim()}
                  className="py-1.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSavingEdit ? 'Actualizando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirmación de Eliminación */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border rounded-2xl w-full max-w-sm p-6 shadow-xl animate-scaleIn flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-text-primary dark:text-dark-text">¿Eliminar Proyecto?</h3>
                <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
                  Esta acción desvinculará <strong className="font-mono text-text-primary dark:text-dark-text">{deletingProject.fullName}</strong> de las federaciones de Supabase Cloud.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle dark:border-dark-border">
              <button
                type="button"
                disabled={isDeletingRepo}
                onClick={() => setDeletingProject(null)}
                className="py-1.5 px-3 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingRepo}
                onClick={handleConfirmDelete}
                className="py-1.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingRepo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeletingRepo ? 'Eliminando...' : 'Eliminar Proyecto'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
