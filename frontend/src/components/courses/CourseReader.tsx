"use client";

import { useMemo, useState } from "react";
import hljs from "highlight.js";
import { mdiCheck, mdiCodeBraces, mdiContentCopy, mdiFileDocumentOutline } from "@mdi/js";
import { ApiCourseDetail } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { PromptBlock } from "@/components/tests/PromptBlock";

export function CourseReader({ course }: { course: ApiCourseDetail }) {
  const [selectedModuleId, setSelectedModuleId] = useState(course.modules[0]?.id ?? null);
  const [copiedBlockId, setCopiedBlockId] = useState<number | null>(null);
  const selectedModule = useMemo(
    () => course.modules.find((module) => module.id === selectedModuleId) ?? course.modules[0],
    [course.modules, selectedModuleId]
  );

  async function copyCode(blockId: number, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedBlockId(blockId);
    window.setTimeout(() => setCopiedBlockId((current) => current === blockId ? null : current), 1600);
  }

  if (!selectedModule) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm font-bold text-ink/62 shadow-soft">
        This course does not have modules yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="h-fit rounded-lg border border-line bg-white p-4 shadow-soft lg:sticky lg:top-6">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Modules</p>
        <div className="mt-4 grid gap-2">
          {course.modules.map((module) => (
            <button
              key={module.id}
              type="button"
              className={`flex items-start gap-3 rounded-md border px-3 py-3 text-left transition ${
                module.id === selectedModule.id ? "border-moss bg-mint text-ink" : "border-line bg-white hover:border-moss"
              }`}
              onClick={() => setSelectedModuleId(module.id)}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-mint text-moss">
                {module.position}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{module.title}</span>
                <span className="mt-1 block text-xs font-semibold text-ink/58">{module.lessons.length} blocks</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-mint text-moss">
            <Icon path={mdiFileDocumentOutline} size={0.9} />
          </span>
          <div>
            <p className="text-sm font-black text-moss">Module {selectedModule.position}</p>
            <h2 className="text-2xl font-black">{selectedModule.title}</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {selectedModule.lessons.map((block) => (
            block.type === "CODE" ? (
              <article key={block.id} className="rounded-md border border-line bg-cloud p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-black text-moss">
                    <Icon path={mdiCodeBraces} size={0.72} />
                    {block.codeLanguage ?? "code"}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-black text-moss"
                    onClick={() => copyCode(block.id, block.content)}
                  >
                    <Icon path={copiedBlockId === block.id ? mdiCheck : mdiContentCopy} size={0.7} />
                    {copiedBlockId === block.id ? "Copied" : "Copy Code"}
                  </button>
                </div>
                <pre className="overflow-auto rounded-md border border-line bg-white p-4 text-sm leading-6">
                  <code
                    className={`hljs language-${block.codeLanguage ?? "text"}`}
                    dangerouslySetInnerHTML={{ __html: highlightedCode(block.content, block.codeLanguage) }}
                  />
                </pre>
              </article>
            ) : (
              <article key={block.id}>
                <PromptBlock>{block.content}</PromptBlock>
              </article>
            )
          ))}
        </div>
      </section>
    </div>
  );
}

function highlightedCode(content: string, language?: string | null) {
  const normalizedLanguage = language?.trim().toLowerCase();

  if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
    return hljs.highlight(content, { language: normalizedLanguage }).value;
  }

  return hljs.highlightAuto(content).value;
}
