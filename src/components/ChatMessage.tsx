import { parseMarkdownTables } from "@/lib/parseMarkdownTable";
import ExportXlsxButton from "./ExportXlsxButton";

export interface ChatMessageData {
  role: "user" | "assistant";
  content: string;
  cached?: boolean;
}

export default function ChatMessage({ role, content, cached }: ChatMessageData) {
  const isUser = role === "user";
  const tables = isUser ? [] : parseMarkdownTables(content);

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-600 text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {content || (
          <span className="inline-flex gap-1 text-slate-400">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse [animation-delay:150ms]">●</span>
            <span className="animate-pulse [animation-delay:300ms]">●</span>
          </span>
        )}
      </div>

      {cached && (
        <span className="mt-1 text-[11px] text-slate-400">
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
