import { AsyncLocalStorage } from 'node:async_hooks';

export interface ToolContext {
  toolName: string;
  simplifyHtml: boolean;
  readOnlyMode: boolean;
  toonMode: boolean;
}

export const toolContext = new AsyncLocalStorage<ToolContext>();

const ONENOTE_TOOLS = new Set([
  'list-onenote-notebooks',
  'list-onenote-notebook-sections',
  'list-onenote-section-pages',
  'get-onenote-page-content',
  'create-onenote-page',
]);

export function shouldSimplifyHtml(): boolean {
  const ctx = toolContext.getStore();
  if (!ctx) return false;
  if (ONENOTE_TOOLS.has(ctx.toolName)) return false;
  // ctx.simplifyHtml already has the correct default computed in graph-tools.ts
  // (defaults to readOnly mode value, but user can explicitly override)
  return ctx.simplifyHtml;
}

export { ONENOTE_TOOLS };
