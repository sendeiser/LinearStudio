import { ColumnId, Issue, Priority, Subtask, Comment } from '../types/issue';

const INITIAL_ISSUES: Issue[] = [
  {
    id: 189,
    title: 'Add telemetry latency histogram widget to dashboard',
    description: 'Añadir gráfico de distribución de latencia usando buckets de Prometheus.',
    status: 'backlog',
    priority: 'medium',
    tags: ['telemetry', 'metrics'],
    assignee: { name: 'Juan Díaz', avatar: 'JD', role: 'Telemetry Eng' },
    subtasks: [
      { id: '1', title: 'Definir histogram buckets en el backend', completed: true },
      { id: '2', title: 'Crear componente SVG interactivo', completed: false },
      { id: '3', title: 'Añadir tooltip de percentiles p95 y p99', completed: false },
      { id: '4', title: 'Escribir tests unitarios', completed: false }
    ],
    comments: [
      { id: 'c1', author: 'Elena Kim', avatar: 'EK', content: '¿Consideraron usar Canvas en lugar de SVG si hay miles de data points?', createdAt: 'hace 3h' },
      { id: 'c2', author: 'Juan Díaz', avatar: 'JD', content: 'SVG es suficiente para los 50 buckets del histograma.', createdAt: 'hace 1h' }
    ],
    createdAt: '2026-11-09T10:00:00Z',
    updatedAt: '2026-11-10T12:00:00Z'
  },
  {
    id: 194,
    title: 'Refactor AST parser for JSX fragments & memo hooks',
    description: 'Optimizar el parser AST eliminando asignaciones redundantes en transformaciones.',
    status: 'backlog',
    priority: 'low',
    tags: ['compiler', 'ast'],
    assignee: { name: 'Alex Lee', avatar: 'AL', role: 'Compiler Lead' },
    subtasks: [
      { id: '1', title: 'Benchmark baseline de memoria', completed: false },
      { id: '2', title: 'Reemplazar recursión por stack iterativo', completed: false },
      { id: '3', title: 'Verificar test suite con TypeScript 5.7', completed: false }
    ],
    comments: [],
    createdAt: '2026-11-08T14:30:00Z',
    updatedAt: '2026-11-09T09:15:00Z'
  },
  {
    id: 142,
    title: 'Implement edge function rate limiting via Redis token bucket',
    description: 'Configurar protección contra DoS en endpoints críticos de autenticación y exportación.',
    status: 'todo',
    priority: 'high',
    tags: ['api', 'security'],
    assignee: { name: 'Elena Kim', avatar: 'EK', role: 'Backend Security' },
    subtasks: [
      { id: '1', title: 'Configurar cluster Upstash Redis', completed: true },
      { id: '2', title: 'Crear middleware token bucket por IP/Token', completed: true },
      { id: '3', title: 'Header de Retry-After y 429 Too Many Requests', completed: true },
      { id: '4', title: 'Simulación de carga con k6', completed: false },
      { id: '5', title: 'Documentación en OpenAPI', completed: false }
    ],
    comments: [
      { id: 'c3', author: 'Martin Tincho', avatar: 'MT', content: '¿Cuál será el límite por defecto para clientes no autenticados?', createdAt: 'hace 4h' }
    ],
    createdAt: '2026-11-07T11:00:00Z',
    updatedAt: '2026-11-10T08:00:00Z'
  },
  {
    id: 156,
    title: 'Design zero-allocation stream decoder for WebSockets',
    description: 'Evitar buffer copies repetidas durante el parsing de frames binarios de alta frecuencia.',
    status: 'todo',
    priority: 'urgent',
    tags: ['performance', 'networking'],
    assignee: { name: 'Juan Díaz', avatar: 'JD', role: 'Systems Eng' },
    subtasks: [
      { id: '1', title: 'Definir RingBuffer circular en memoria', completed: true },
      { id: '2', title: 'Zero-copy slicing con Uint8Array.subarray', completed: true },
      { id: '3', title: 'Stress test con 10,000 conexiones concurrentes', completed: false }
    ],
    comments: [],
    createdAt: '2026-11-06T15:20:00Z',
    updatedAt: '2026-11-09T18:40:00Z'
  },
  {
    id: 108,
    title: 'Fix race condition on simultaneous workspace branch switch',
    description: 'Bloquear transiciones concurrentes de worktree cuando hay un commit en progreso.',
    status: 'in_progress',
    priority: 'urgent',
    tags: ['git', 'concurrency'],
    assignee: { name: 'Martin Tincho', avatar: 'MT', role: 'Tech Lead' },
    subtasks: [
      { id: '1', title: 'Reproducir fallo con test de concurrencia', completed: true },
      { id: '2', title: 'Implementar filesystem lock con timeout', completed: true },
      { id: '3', title: 'Limpieza automática de stale lockfiles', completed: true },
      { id: '4', title: 'Verificación en Windows y Linux', completed: false }
    ],
    comments: [
      { id: 'c4', author: 'Elena Kim', avatar: 'EK', content: 'Recomiendo usar flock en POSIX y CreateFileW con exclusividad en Windows.', createdAt: 'hace 6h' }
    ],
    createdAt: '2026-11-05T09:00:00Z',
    updatedAt: '2026-11-10T14:30:00Z'
  },
  {
    id: 115,
    title: 'Support multi-repo federation queries in GraphQL gateway',
    description: 'Permitir consultas unificadas combinando repositorios de frontend y backend.',
    status: 'in_progress',
    priority: 'medium',
    tags: ['graphql', 'api'],
    assignee: { name: 'Alex Lee', avatar: 'AL', role: 'Compiler Lead' },
    subtasks: [
      { id: '1', title: 'Definir Apollo Federation v2 schema', completed: true },
      { id: '2', title: 'Integrar query plan cache con Redis', completed: false }
    ],
    comments: [],
    createdAt: '2026-11-04T12:00:00Z',
    updatedAt: '2026-11-08T16:00:00Z'
  },
  {
    id: 98,
    title: 'Add biometric auth fallback for macOS Touch ID and Windows Hello',
    description: 'Implementar autenticación WebAuthn FIDO2 para credenciales corporativas.',
    status: 'in_review',
    priority: 'high',
    tags: ['security', 'auth'],
    assignee: { name: 'Elena Kim', avatar: 'EK', role: 'Backend Security' },
    subtasks: [
      { id: '1', title: 'Integración WebAuthn API en cliente', completed: true },
      { id: '2', title: 'Validación criptográfica de challenge en backend', completed: true },
      { id: '3', title: 'Fallback a 2FA TOTP si no hay sensor', completed: true }
    ],
    comments: [
      { id: 'c5', author: 'Juan Díaz', avatar: 'JD', content: 'Probado en Windows Hello con PIN y huella digital, funciona 10/10.', createdAt: 'hace 1d' }
    ],
    createdAt: '2026-11-03T08:30:00Z',
    updatedAt: '2026-11-09T11:20:00Z'
  },
  {
    id: 84,
    title: 'Automate weekly benchmark reporting to Slack #eng-metrics',
    description: 'Cron job que compila métricas de p99 y envía resumen gráfico los lunes.',
    status: 'done',
    priority: 'low',
    tags: ['ci', 'automation'],
    assignee: { name: 'Martin Tincho', avatar: 'MT', role: 'Tech Lead' },
    subtasks: [
      { id: '1', title: 'GitHub Action scheduled workflow', completed: true },
      { id: '2', title: 'Generación de gráfico SVG en headless browser', completed: true },
      { id: '3', title: 'Webhook payload hacia Slack API', completed: true }
    ],
    comments: [],
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-05T17:00:00Z'
  }
];

class DataService {
  private issues: Issue[];

  constructor() {
    this.issues = this.loadFromStorage();
  }

  private loadFromStorage(): Issue[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem('linear_studio_issues');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Fallback to initial
      }
    }
    return [...INITIAL_ISSUES];
  }

  private persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('linear_studio_issues', JSON.stringify(this.issues));
      } catch {
        // Safe ignore
      }
    }
  }

  public getIssues(): Issue[] {
    return [...this.issues];
  }

  public getIssueById(id: number): Issue | undefined {
    return this.issues.find((i) => i.id === id);
  }

  public moveIssue(id: number, newStatus: ColumnId): Issue[] {
    this.issues = this.issues.map((issue) =>
      issue.id === id ? { ...issue, status: newStatus, updatedAt: new Date().toISOString() } : issue
    );
    this.persist();
    return [...this.issues];
  }

  public toggleSubtask(issueId: number, subtaskId: string): Issue | undefined {
    this.issues = this.issues.map((issue) => {
      if (issue.id === issueId) {
        const updatedSubtasks: Subtask[] = issue.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...issue, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
      }
      return issue;
    });
    this.persist();
    return this.getIssueById(issueId);
  }

  public addComment(issueId: number, author: string, content: string): Comment {
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      author,
      avatar: author.slice(0, 2).toUpperCase(),
      content,
      createdAt: 'justo ahora'
    };

    this.issues = this.issues.map((issue) => {
      if (issue.id === issueId) {
        return {
          ...issue,
          comments: [...issue.comments, newComment],
          updatedAt: new Date().toISOString()
        };
      }
      return issue;
    });
    this.persist();
    return newComment;
  }

  public updateIssuePriority(issueId: number, priority: Priority): Issue | undefined {
    this.issues = this.issues.map((issue) =>
      issue.id === issueId ? { ...issue, priority, updatedAt: new Date().toISOString() } : issue
    );
    this.persist();
    return this.getIssueById(issueId);
  }

  public createIssue(data: { title: string; description: string; priority: Priority; status: ColumnId }): Issue {
    const newId = Math.floor(Math.random() * 800) + 200;
    const newIssue: Issue = {
      id: newId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      tags: ['feature'],
      assignee: {
        name: 'TinChoX',
        avatar: 'TC',
        role: 'Maintainer'
      },
      subtasks: [
        { id: '1', title: 'Requerimiento inicial definido', completed: false }
      ],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.issues.unshift(newIssue);
    this.persist();
    return newIssue;
  }
}

export const dataService = new DataService();
