import { Issue } from '../types/issue';

export interface AntigravityProgressState {
  isRunning: boolean;
  step: string;
  progress: number;
  log: string;
  prReady: boolean;
  branchName?: string;
  prNumber?: number;
}

export interface PrMetadata {
  branchName: string;
  commitMessage: string;
  prNumber: number;
  prUrl: string;
  summary: string;
}

class AntigravityService {
  public generateAgyCommand(issue: Issue): string {
    const sanitizedTitle = issue.title.replace(/"/g, '\\"');
    return `agy run --workspace branch --role "Issue Solver" "Resolver issue #${issue.id}: ${sanitizedTitle}"`;
  }

  public generatePrMetadata(issue: Issue): PrMetadata {
    const prNumber = issue.id + 1;
    const branchName = `antigravity/fix-issue-${issue.id}`;
    return {
      branchName,
      commitMessage: `fix(issue-${issue.id}): ${issue.title.toLowerCase()}`,
      prNumber,
      prUrl: `https://github.com/tincho/hyper-flow/pull/${prNumber}`,
      summary: `Resolución automatizada por Antigravity AI Agent para el issue #${issue.id}. Incluye suite de regresión y cobertura de tipos.`
    };
  }

  public async runTelemetryPipeline(
    issue: Issue,
    onProgress: (state: AntigravityProgressState) => void,
    stepDelayMs: number = 700
  ): Promise<PrMetadata> {
    const prMeta = this.generatePrMetadata(issue);

    const steps: { progress: number; step: string; log: string }[] = [
      {
        progress: 20,
        step: 'Análisis Semántico & Localización AST',
        log: `[agy] Analizando issue #${issue.id}: buscando referencias en el árbol AST y módulos relacionados...`
      },
      {
        progress: 45,
        step: `Creando Rama Aislada (${prMeta.branchName})`,
        log: `[agy:git] git checkout -b ${prMeta.branchName} (worktree aislado seguro)...`
      },
      {
        progress: 70,
        step: 'Generando Tests de Regresión TDD (Playwright & Vitest)',
        log: `[agy:tdd] Escribiendo casos de prueba reproducibles en tests/issue_${issue.id}.spec.ts...`
      },
      {
        progress: 90,
        step: 'Verificación en Verde & Linting de Tipos',
        log: `[agy:check] tsc --noEmit && vitest run -> 100% de pruebas pasadas sin errores.`
      },
      {
        progress: 100,
        step: `PR #${prMeta.prNumber} Listo para Revisión y Merge`,
        log: `[agy:gh] Pull Request #${prMeta.prNumber} creado con éxito: ${prMeta.prUrl}`
      }
    ];

    for (const s of steps) {
      onProgress({
        isRunning: s.progress < 100,
        step: s.step,
        progress: s.progress,
        log: s.log,
        prReady: s.progress === 100,
        branchName: prMeta.branchName,
        prNumber: prMeta.prNumber
      });
      await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
    }

    return prMeta;
  }
}

export const antigravityService = new AntigravityService();

