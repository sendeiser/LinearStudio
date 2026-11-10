import { ColumnId, Issue } from '../types/issue';

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
    id: 177,
    title: 'OAuth2 token refresh race condition on mobile reconnect',
    description: 'En reconexiones rápidas de red móvil, múltiples requests paralelos provocan refresh redundante.',
    status: 'todo',
    priority: 'urgent',
    tags: ['bug', 'auth'],
    assignee: { name: 'Martin Tincho', avatar: 'MT', role: 'Lead Architect' },
    subtasks: [
      { id: '1', title: 'Reproducir con Network Throttling en DevTools', completed: true },
      { id: '2', title: 'Implementar deduplicación de Promises de refresh', completed: true }
    ],
    comments: [],
    createdAt: '2026-11-09T18:00:00Z',
    updatedAt: '2026-11-10T11:30:00Z'
  },
  {
    id: 104,
    title: 'Optimize WebGL canvas render loop for 60fps',
    description: 'Detectada caída de frames en escenas complejas por reallocación continua de buffers en el loop de requestAnimationFrame.',
    status: 'in_progress',
    priority: 'urgent',
    tags: ['performance', 'frontend'],
    assignee: { name: 'Martin Tincho', avatar: 'MT', role: 'Lead Graphics Eng' },
    branch: 'perf/webgl-loop-opt',
    subtasks: [
      { id: '1', title: 'Perfilar eventos de frame dropped en DevTools', completed: true },
      { id: '2', title: 'Pool de buffers estáticos para eliminar GC spikes', completed: true },
      { id: '3', title: 'Debounce en triggers del ResizeObserver', completed: false },
      { id: '4', title: 'Fallback de telemetría FPS para dispositivos de baja potencia', completed: false }
    ],
    comments: [
      { id: 'c4', author: 'Elena Kim', avatar: 'EK', content: 'Probé el nuevo shader uniform branch y el frametime bajó de 28ms a 14.2ms. ¡Excelente avance! 🚀', createdAt: 'hace 2h' }
    ],
    createdAt: '2026-11-06T09:00:00Z',
    updatedAt: '2026-11-10T14:00:00Z'
  },
  {
    id: 118,
    title: 'Migrate schema migrations pipeline to native binary',
    description: 'Reemplazar el runner Node.js antiguo por el CLI nativo compilado para builds más rápidos.',
    status: 'in_progress',
    priority: 'high',
    tags: ['backend', 'rust'],
    assignee: { name: 'Sam Lee', avatar: 'SL', role: 'DevOps Eng' },
    subtasks: [
      { id: '1', title: 'Escribir script de integración', completed: true },
      { id: '2', title: 'Probar en GitHub Actions CI', completed: false }
    ],
    comments: [],
    createdAt: '2026-11-05T15:00:00Z',
    updatedAt: '2026-11-09T16:00:00Z'
  },
  {
    id: 102,
    title: 'Multi-tenant isolation barrier verification test suite',
    description: 'Suite de tests automatizados que asegura que las políticas RLS de Supabase aíslen completamente datos entre organizaciones.',
    status: 'in_review',
    priority: 'high',
    tags: ['security', 'tests'],
    prNumber: 108,
    assignee: { name: 'Rita Silva', avatar: 'RS', role: 'QA Lead' },
    subtasks: [
      { id: '1', title: 'Test lectura cruzada de issues entre tenants', completed: true },
      { id: '2', title: 'Test escritura no autorizada en kanban_columns', completed: true },
      { id: '3', title: 'Verificar error 403 en JWT caducado', completed: true },
      { id: '4', title: 'Reporte de cobertura en Playwright', completed: true }
    ],
    comments: [
      { id: 'c5', author: 'Martin Tincho', avatar: 'MT', content: 'Revisé los tests de RLS en el PR #108. Todos pasando en verde.', createdAt: 'hace 5h' }
    ],
    createdAt: '2026-11-04T12:00:00Z',
    updatedAt: '2026-11-10T13:00:00Z'
  },
  {
    id: 97,
    title: 'Implement zstandard decompression in worker threads',
    description: 'Descomprimir respuestas de API grandes en background sin bloquear el hilo principal de render.',
    status: 'done',
    priority: 'low',
    tags: ['performance'],
    assignee: { name: 'Martin Tincho', avatar: 'MT', role: 'Lead Architect' },
    subtasks: [
      { id: '1', title: 'WebWorker wrapper', completed: true },
      { id: '2', title: 'Memory transfer buffer', completed: true },
      { id: '3', title: 'Benchmark en Chrome y Safari', completed: true }
    ],
    comments: [],
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-05T17:00:00Z'
  }
];

class DataService {
  private issues: Issue[];

  constructor() {
    const cached = localStorage.getItem('linear_studio_issues');
    if (cached) {
      try {
        this.issues = JSON.parse(cached);
      } catch {
        this.issues = INITIAL_ISSUES;
      }
    } else {
      this.issues = INITIAL_ISSUES;
    }
  }

  private persist() {
    localStorage.setItem('linear_studio_issues', JSON.stringify(this.issues));
  }

  public getIssues(): Issue[] {
    return [...this.issues];
  }

  public moveIssue(id: number, newStatus: ColumnId): Issue[] {
    this.issues = this.issues.map((issue) =>
      issue.id === id ? { ...issue, status: newStatus, updatedAt: new Date().toISOString() } : issue
    );
    this.persist();
    return [...this.issues];
  }

  public createIssue(data: { title: string; description: string; priority: Issue['priority']; status: ColumnId }): Issue {
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

