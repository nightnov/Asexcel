import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { parseMarkdownTables } from "@/lib/parseMarkdownTable";
import { splitIntoSteps } from "@/lib/splitIntoSteps";
import ExportXlsxButton from "./ExportXlsxButton";

export interface ChatMessageData {
  role: "user" | "assistant";
  content: string;
  cached?: boolean;
}

/**
 * Custom renderers so the assistant's step-by-step guidance (numbered
 * lists, bold key terms, inline formulas/shortcuts) reads as structured
 * steps instead of a flat paragraph of raw markdown syntax.
 */
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
  ol: ({ children }) => (
    <ol className="mb-2.5 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
  ),
  ul: ({ children }) => (
    <ul className="mb-2.5 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
  ),
  li: ({ children }) => <li className="pl-0.5 marker:text-brand-600">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="text-slate-600">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-brand-700">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-2.5 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[13px] text-slate-100 last:mb-0">
      {children}
    </pre>
  ),
  h1: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-semibold text-slate-900 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-semibold text-slate-900 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-slate-900 first:mt-0">{children}</h4>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
  blockquote: ({ children }) => (
    <blockquote className="mb-2.5 border-l-2 border-slate-300 pl-3 text-slate-500 last:mb-0">{children}</blockquote>
  ),
};

export default function ChatMessage({ role, content, cached }: ChatMessageData) {
  const isUser = role === "user";
  const tables = isUser ? [] : parseMarkdownTables(content);
  const blocks = !isUser && content ? splitIntoSteps(content) : [];

  if (isUser) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      {content ? (
        blocks.map((block, i) => (
          <div key={i} className="flex max-w-[85%] items-start gap-2.5">
            {block.step !== null && (
              <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                {block.step}
              </span>
            )}
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-800">
              <ReactMarkdown components={markdownComponents}>{block.markdown}</ReactMarkdown>
            </div>
          </div>
        ))
      ) : (
        <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-800">
          <span className="inline-flex gap-1 text-slate-400">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse [animation-delay:150ms]">●</span>
            <span className="animate-pulse [animation-delay:300ms]">●</span>
          </span>
        </div>
      )}

      {cached && (
        <span className="text-[11px] text-slate-400">
          ⚡ Réponse servie depuis le cache — aucun appel Groq
        </span>
      )}

      {tables.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tables.map((table, i) => (
            <ExportXlsxButton key={i} table={table} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
