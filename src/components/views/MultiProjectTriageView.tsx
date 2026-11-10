import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  ExternalLink,
  GitBranch,
  FolderGit2
} from 'lucide-react';
import { Issue, ColumnId, Priority } from '../../types/issue';
import { useStore } from '../../store/useStore';
import { dataService } from '../../services/dataService';
import { useQueryClient } from '@tanstack/react-query';

interface MultiProjectTriageViewProps {
  issues: Issue[];
}

export const MultiProjectTriageView: React.FC<MultiProjectTriageViewProps> = ({ issues }) => {
  const queryClient = useQueryClient();
  const { setSelectedIssue } = useStore();

  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('boxtools');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Distinct list of projects
  const availableProjects = [
    { name: 'tincho/hyper-flow', branch: 'main', color: 'blue' },
    { name: 'boxtools', branch: 'main', color: 'purple' },
    { name: 'tincho/linear-studio-github', branch: 'main', color: 'emerald' }
  ];

  const getProjectColor = (pName?: string) => {
    if (!pName) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    if (pName.includes('boxtools')) return 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300';
    if (pName.includes('linear-studio')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300';
  };

  const filteredIssues = issues.filter((i) => {
    const proj = i.projectName || 'tincho/hyper-flow';
    if (selectedProject !== 'all' && proj !== selectedProject) return false;
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

  const handleStatusChange = (issueId: number, newStatus: ColumnId) => {
    dataService.moveIssue(issueId, newStatus);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
    setFeedback(`✓ Issue #${issueId} actualizado a '${newStatus}'`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handlePriorityChange = (issueId: number, newPriority: Priority) => {
    dataService.updateIssuePriority(issueId, newPriority);
    queryClient.invalidateQueries({ queryKey: ['issues'] });
    setFeedback(`✓ Prioridad del Issue #${issueId} cambiada a '${newPriority}'`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    dataService.createIssue({
      title: newTitle.trim(),
      description: `Issue creado desde el Triage Multi-Proyecto para ${newProject}`,
      priority: newPriority,
      status: 'todo',
      projectName: newProject
    });

    queryClient.invalidateQueries({ queryKey: ['issues'] });
    setFeedback(`✓ Nuevo issue creado para el proyecto '${newProject}'`);
    setNewTitle('');
    setTimeout(() => setFeedback(null), 4000);
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
            </div>
            <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
              Supervisión centralizada, priorización ágil y cambio de estados para todos tus repositorios en Supabase Cloud.
            </p>
          </div>
        </div>

        {feedback && (
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-300 animate-fadeIn">
            {feedback}
          </div>
        )}
      </div>

      {/* Project KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {availableProjects.map((proj) => {
          const projIssues = issues.filter((i) => (i.projectName || 'tincho/hyper-flow') === proj.name);
          const urgentCount = projIssues.filter((i) => i.priority === 'urgent' || i.priority === 'high').length;
          const inProgressCount = projIssues.filter((i) => i.status === 'in_progress').length;
          const doneCount = projIssues.filter((i) => i.status === 'done').length;
          const total = projIssues.length;
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          return (
            <div 
              key={proj.name}
              onClick={() => setSelectedProject(selectedProject === proj.name ? 'all' : proj.name)}
              className={`p-4 rounded-xl bg-surface dark:bg-dark-surface border transition-all cursor-pointer shadow-sm ${
                selectedProject === proj.name 
                  ? 'border-brand ring-1 ring-brand' 
                  : 'border-border-subtle dark:border-dark-border hover:border-brand/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-primary dark:text-dark-text flex items-center gap-1.5 truncate">
                  <FolderGit2 className="w-4 h-4 text-brand dark:text-dark-brand shrink-0" />
                  <span className="truncate">{proj.name}</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle dark:bg-dark-surface-elevated text-text-secondary flex items-center gap-1 border border-border-subtle">
                  <GitBranch className="w-2.5 h-2.5" />
                  {proj.branch}
                </span>
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
                <div className="bg-brand h-1.5 rounded-full" style={{ width: `${pct}%` }} />
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
            className="bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-lg px-2.5 py-1.5 text-text-primary font-bold outline-none focus:border-brand"
          >
            {availableProjects.map((p) => (
              <option key={p.name} value={p.name}>
                📁 {p.name}
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
            className="py-1.5 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white font-bold shadow-sm whitespace-nowrap flex items-center gap-1"
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
          {availableProjects.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedProject(p.name)}
              className={`px-3 py-1 rounded-lg font-bold border transition-colors whitespace-nowrap ${
                selectedProject === p.name
                  ? 'bg-brand text-white border-brand'
                  : 'bg-canvas dark:bg-dark-canvas border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.name.split('/')[1] || p.name}
            </button>
          ))}
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
                <th className="p-3 w-44">PROYECTO</th>
                <th className="p-3">TÍTULO & ETIQUETAS</th>
                <th className="p-3 w-36">PRIORIDAD</th>
                <th className="p-3 w-44">ESTADO</th>
                <th className="p-3 w-36">ASIGNADO</th>
                <th className="p-3 w-16 text-center">VER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle dark:divide-dark-border font-sans">
              {filteredIssues.map((issue) => {
                const projName = issue.projectName || 'tincho/hyper-flow';
                return (
                  <tr
                    key={issue.id}
                    className="hover:bg-surface-subtle/50 dark:hover:bg-dark-surface-elevated/40 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-text-muted">
                      #{issue.id}
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${getProjectColor(projName)}`}>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
