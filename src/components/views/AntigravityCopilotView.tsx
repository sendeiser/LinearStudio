import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Terminal, 
  Copy, 
  Check
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../store/useStore';
import { dataService } from '../../services/dataService';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  command?: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'assistant',
    content: '¡Hola Martin! Soy **Antigravity Coding Copilot**. Tengo acceso directo a tus repositorios, árbol AST, tableros de issues y suites de prueba Playwright. ¿En qué puedo asistirte hoy?',
    timestamp: '19:40'
  }
];

export const AntigravityCopilotView: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeRepoFullName } = useStore();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const prompts = [
    '✦ Analizar los issues urgentes y sugerir orden de resolución',
    '✦ Generar suite de pruebas Playwright para el rate limiter #142',
    '✦ Crear nuevo issue para optimización de bundle Vite',
    '✦ Explicar políticas RLS de Supabase en boxtools'
  ];

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let replyContent = '';
      let command: string | undefined = undefined;

      if (query.includes('urgente') || query.includes('orden')) {
        replyContent = `Analicé los issues en **${activeRepoFullName}**:\n\n1. **#156 (Zero-allocation stream decoder)**: Crítico por riesgo de buffer overflow en WebSockets. Resolver primero.\n2. **#142 (Rate limiting con Redis)**: Alto impacto en seguridad perimetral. PR #143 ya está generado y verificado con CI passing.\n3. **#108 (Race condition en worktrees)**: Ocurre solo en transiciones concurrentes de rama.`;
        command = `agy run --role "Tech Lead" "Resolver issue #156: implement circular ring buffer for websockets"`;
      } else if (query.includes('Playwright') || query.includes('142')) {
        replyContent = `Generé la suite de regresión E2E en Playwright para validar el middleware de token bucket en \`tests/issue_142.spec.ts\`:\n\n\`\`\`typescript\ntest('Rate limit: 10 req/min returns 429 Too Many Requests', async ({ request }) => {\n  for (let i = 0; i < 10; i++) {\n    const res = await request.get('/api/telemetry');\n    expect(res.status()).toBe(200);\n  }\n  const blocked = await request.get('/api/telemetry');\n  expect(blocked.status()).toBe(429);\n});\n\`\`\``;
        command = `npx playwright test tests/issue_142.spec.ts`;
      } else if (query.includes('bundle') || query.includes('optimización')) {
        dataService.createIssue({
          title: 'Optimizar bundle Vite con manualChunks y dynamic import',
          description: 'Dividir chunks de proveedores pesados (lucide, supabase, tanstack) para reducir bundle inicial a menos de 300kB.',
          priority: 'high',
          status: 'todo'
        });
        queryClient.invalidateQueries({ queryKey: ['issues'] });
        replyContent = `✓ **¡Nuevo issue creado automáticamente!**\n\n- **Título:** Optimizar bundle Vite con manualChunks y dynamic import\n- **Prioridad:** Alta\n- **Estado:** Por Hacer\n- **Añadido al Tablero Kanban y a la base de datos.**`;
      } else {
        replyContent = `Las políticas RLS aplicadas en la base de datos compartida de **boxtools** (\`ydoviusjpgmjsxpspexu\`) aseguran aislamiento total mediante las funciones \`ls_can_access_repo\` y \`ls_can_access_issue\`. Aunque otros usuarios tengan cuentas en boxtools, solo los miembros registrados en tu workspace pueden consultar o modificar issues de Linear Studio.`;
      }

      const botMsg: Message = {
        id: `b_${Date.now()}`,
        sender: 'assistant',
        content: replyContent,
        command,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas dark:bg-dark-canvas overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-surface dark:bg-dark-surface border-b border-border-subtle dark:border-dark-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-text-primary dark:text-dark-text">Antigravity Coding Copilot</h1>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-300">
                AI Engine v2.0
              </span>
            </div>
            <p className="text-xs text-text-secondary dark:text-dark-text-muted mt-0.5">
              Asistente autónomo de ingeniería para análisis de código, tests TDD y automatización de PRs.
            </p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-1.5 max-w-2xl ${
              m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-brand text-white rounded-br-sm'
                  : 'bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-text-primary dark:text-dark-text rounded-bl-sm shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {m.command && (
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] flex items-center justify-between gap-2 border border-slate-700">
                  <div className="flex items-center gap-2 truncate">
                    <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{m.command}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(m.command!)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    title="Copiar comando"
                  >
                    {copiedCmd === m.command ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
            <span className="font-mono text-[10px] text-text-muted px-1">{m.timestamp}</span>
          </div>
        ))}

        {isTyping && (
          <div className="self-start flex items-center gap-2 p-3 rounded-xl bg-surface dark:bg-dark-surface border border-border-subtle text-xs text-purple-600 font-medium animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Antigravity está analizando el repositorio...</span>
          </div>
        )}
      </div>

      {/* Suggestion Prompts */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-surface/50 dark:bg-dark-surface/50 border-t border-border-subtle/50">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 rounded-full bg-surface dark:bg-dark-surface border border-border-subtle dark:border-dark-border text-text-secondary dark:text-dark-text-muted hover:text-text-primary hover:border-brand text-[11px] font-semibold shrink-0 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-surface dark:bg-dark-surface border-t border-border-subtle dark:border-dark-border flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregúntale a Antigravity sobre este repo, issues, bugs o comandos..."
          className="flex-1 bg-canvas dark:bg-dark-canvas border border-border-subtle dark:border-dark-border rounded-xl px-3.5 py-2 text-xs text-text-primary dark:text-dark-text placeholder:text-text-muted focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover dark:bg-dark-brand text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
};
