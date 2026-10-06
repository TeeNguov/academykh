"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  mdiArrowDown,
  mdiArrowUp,
  mdiCodeBraces,
  mdiCodeTags,
  mdiContentSaveOutline,
  mdiFileDocumentEdit,
  mdiFormatBold,
  mdiFormatHeader1,
  mdiFormatHeader2,
  mdiFormatIndentDecrease,
  mdiFormatIndentIncrease,
  mdiFormatListBulleted,
  mdiFormatListNumbered,
  mdiFormatQuoteClose,
  mdiFunctionVariant,
  mdiLinkVariant,
  mdiPlus,
  mdiTrashCanOutline
} from "@mdi/js";
import { ApiCourseDetail, ApiCourseModule, createCourseModule, LessonType, reorderCourseModules, updateCourseModule } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { MathFormulaDialog } from "@/components/MathFormulaDialog";
import { useToast } from "@/components/ToastProvider";
import { PromptBlock } from "@/components/tests/PromptBlock";

type BlockEditorMode = "RICH_TEXT" | "RICH_TEXT_WITH_MATH" | "CODE";

type BuilderBlock = {
  id?: number;
  type: LessonType;
  editorMode: BlockEditorMode;
  content: string;
  codeLanguage: string;
};

const blankBlock = (editorMode: BlockEditorMode = "RICH_TEXT"): BuilderBlock => ({
  type: editorMode === "CODE" ? "CODE" : "RICH_TEXT",
  editorMode,
  content: "",
  codeLanguage: editorMode === "CODE" ? "java" : ""
});

type RichTextActionKind = "h1" | "h2" | "bullet" | "numbered" | "quote" | "bold" | "link" | "code" | "indent" | "outdent";

const richTextActions: { label: string; icon: string; kind: RichTextActionKind }[] = [
  { label: "Title", icon: mdiFormatHeader1, kind: "h1" },
  { label: "Section", icon: mdiFormatHeader2, kind: "h2" },
  { label: "Bullet List", icon: mdiFormatListBulleted, kind: "bullet" },
  { label: "Numbered List", icon: mdiFormatListNumbered, kind: "numbered" },
  { label: "Indent", icon: mdiFormatIndentIncrease, kind: "indent" },
  { label: "Outdent", icon: mdiFormatIndentDecrease, kind: "outdent" },
  { label: "Quote", icon: mdiFormatQuoteClose, kind: "quote" },
  { label: "Bold", icon: mdiFormatBold, kind: "bold" },
  { label: "Link", icon: mdiLinkVariant, kind: "link" },
  { label: "Inline Code", icon: mdiCodeTags, kind: "code" }
];

export function ModuleEditor({ course }: { course: ApiCourseDetail }) {
  const router = useRouter();
  const toast = useToast();
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [editingModule, setEditingModule] = useState<ApiCourseModule | null>(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<BuilderBlock[]>([blankBlock()]);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formulaBlockIndex, setFormulaBlockIndex] = useState<number | null>(null);

  function editModule(module: ApiCourseModule) {
    setEditingModule(module);
    setTitle(module.title);
    setBlocks(module.lessons.length > 0
      ? module.lessons.map((lesson) => ({
          id: lesson.id,
          type: lesson.type,
          editorMode: lesson.type === "CODE" ? "CODE" : hasMathMarkup(lesson.content) ? "RICH_TEXT_WITH_MATH" : "RICH_TEXT",
          content: lesson.content,
          codeLanguage: lesson.codeLanguage ?? "java"
        }))
      : [blankBlock()]
    );
  }

  function resetForm() {
    setEditingModule(null);
    setTitle("");
    setBlocks([blankBlock()]);
    setError(null);
  }

  function updateBlock(index: number, patch: Partial<BuilderBlock>) {
    setBlocks((current) => current.map((block, itemIndex) => itemIndex === index ? { ...block, ...patch } : block));
  }

  function updateBlockMode(index: number, editorMode: BlockEditorMode) {
    updateBlock(index, {
      editorMode,
      type: editorMode === "CODE" ? "CODE" : "RICH_TEXT",
      codeLanguage: editorMode === "CODE" ? blocks[index]?.codeLanguage || "java" : ""
    });
  }

  function insertMathSnippet(index: number, snippet: string) {
    insertTextAtCursor(index, snippet, true);
  }

  function replaceText(index: number, content: string, selectionStart: number, selectionEnd = selectionStart) {
    updateBlock(index, { content });
    requestAnimationFrame(() => {
      const textarea = textareaRefs.current[index];
      textarea?.focus();
      textarea?.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function insertTextAtCursor(index: number, snippet: string, blockSpacing = false) {
    const content = blocks[index]?.content ?? "";
    const textarea = textareaRefs.current[index];
    if (!textarea) {
      const spacer = content.trim().length > 0 && blockSpacing ? "\n\n" : "";
      updateBlock(index, { content: `${content}${spacer}${snippet}` });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const needsLeadingBreak = blockSpacing && start > 0 && !content.slice(0, start).endsWith("\n\n");
    const needsTrailingBreak = blockSpacing && end < content.length && !content.slice(end).startsWith("\n\n");
    const prefix = needsLeadingBreak ? "\n\n" : "";
    const suffix = needsTrailingBreak ? "\n\n" : "";
    const nextContent = content.slice(0, start) + prefix + snippet + suffix + content.slice(end);
    const nextPosition = start + prefix.length + snippet.length;
    replaceText(index, nextContent, nextPosition);
  }

  function changeLineIndent(index: number, direction: 1 | -1) {
    const content = blocks[index]?.content ?? "";
    const textarea = textareaRefs.current[index];
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const lineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEnd = content.indexOf("\n", end);
    const selectedEnd = lineEnd === -1 ? content.length : lineEnd;
    const selectedText = content.slice(lineStart, selectedEnd);
    const lines = selectedText.split("\n");
    let startDelta = 0;
    let endDelta = 0;

    const nextLines = lines.map((line, lineIndex) => {
      if (!line.trim()) {
        return line;
      }
      if (direction === 1) {
        if (lineIndex === 0 && start > lineStart) {
          startDelta += 2;
        }
        endDelta += 2;
        return `  ${line}`;
      }

      const removable = line.startsWith("  ") ? 2 : line.startsWith(" ") ? 1 : 0;
      if (lineIndex === 0 && start > lineStart) {
        startDelta -= Math.min(removable, start - lineStart);
      }
      endDelta -= removable;
      return line.slice(removable);
    });

    const replacement = nextLines.join("\n");
    const nextContent = content.slice(0, lineStart) + replacement + content.slice(selectedEnd);
    replaceText(index, nextContent, Math.max(lineStart, start + startDelta), Math.max(lineStart, end + endDelta));
  }

  function applyRichTextAction(index: number, kind: RichTextActionKind) {
    const content = blocks[index]?.content ?? "";
    const textarea = textareaRefs.current[index];
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const selectedText = content.slice(start, end);

    if (kind === "indent" || kind === "outdent") {
      changeLineIndent(index, kind === "indent" ? 1 : -1);
      return;
    }

    if (kind === "bold" || kind === "code" || kind === "link") {
      const text = selectedText;
      const nextSnippet = kind === "bold"
        ? `**${text}**`
        : kind === "code"
          ? `\`${text}\``
          : `[${text}]()`;
      const nextContent = content.slice(0, start) + nextSnippet + content.slice(end);
      const cursorOffset = kind === "bold" ? 2 : kind === "code" ? 1 : 1;
      const selectionStart = selectedText ? start : start + cursorOffset;
      const selectionEnd = selectedText ? start + nextSnippet.length : selectionStart;
      replaceText(index, nextContent, selectionStart, selectionEnd);
      return;
    }

    if (start === end) {
      const before = content.slice(0, start);
      const after = content.slice(start);
      const prefix = before.length === 0 || before.endsWith("\n") ? "" : "\n";
      const marker = kind === "h1"
        ? "# "
        : kind === "h2"
          ? "## "
          : kind === "bullet"
            ? "- "
            : kind === "numbered"
              ? "1. "
              : "> ";
      const suffix = kind === "quote" ? "\n\n" : "";
      const nextContent = `${before}${prefix}${marker}${suffix}${after}`;
      const nextPosition = before.length + prefix.length + marker.length;
      replaceText(index, nextContent, nextPosition);
      return;
    }

    const lineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEnd = content.indexOf("\n", end);
    const selectedEnd = lineEnd === -1 ? content.length : lineEnd;
    const selectedLines = content.slice(lineStart, selectedEnd);
    const lines = selectedLines.split("\n");
    let numberedIndex = 0;
    const nextLines = lines.map((line) => {
      if (!line.trim()) {
        return line;
      }
      const cleanLine = line.replace(/^(\s*)(#{1,6}\s+|[-*]\s+|>\s+|\d+\.\s+)/, "$1");
      if (kind === "h1") {
        return `# ${cleanLine}`;
      }
      if (kind === "h2") {
        return `## ${cleanLine}`;
      }
      if (kind === "bullet") {
        return `- ${cleanLine}`;
      }
      if (kind === "numbered") {
        numberedIndex += 1;
        return `${numberedIndex}. ${cleanLine}`;
      }
      return `> ${cleanLine}`;
    });
    const replacement = nextLines.join("\n");
    const quoteSuffix = kind === "quote" && selectedEnd < content.length && !content.slice(selectedEnd).startsWith("\n\n") ? "\n" : "";
    const nextContent = content.slice(0, lineStart) + replacement + quoteSuffix + content.slice(selectedEnd);
    replaceText(index, nextContent, lineStart, lineStart + replacement.length);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  async function moveModule(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= course.modules.length || reordering) {
      return;
    }

    const nextModules = [...course.modules];
    const [module] = nextModules.splice(index, 1);
    nextModules.splice(nextIndex, 0, module);

    setReordering(true);
    try {
      await reorderCourseModules(course.id, nextModules.map((item) => item.id));
      toast.success("Module order saved.");
      router.refresh();
    } catch (reorderError) {
      toast.error(reorderError instanceof Error ? reorderError.message : "Could not reorder modules.");
    } finally {
      setReordering(false);
    }
  }

  function handleTab(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    changeLineIndent(index, event.shiftKey ? -1 : 1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const firstEmptyBlock = blocks.findIndex((block) => block.content.trim().length === 0);
    if (!title.trim()) {
      setError("Module title is required.");
      toast.error("Module title is required.");
      return;
    }
    if (firstEmptyBlock >= 0) {
      const message = `Block ${firstEmptyBlock + 1} needs content before saving.`;
      setError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        position: editingModule?.position ?? course.modules.length + 1,
        lessons: blocks.map((block, index) => ({
          id: block.id,
          title: block.type === "CODE" ? "Code Snippet" : "Rich Text",
          type: block.type,
          codeLanguage: block.type === "CODE" ? block.codeLanguage || "text" : null,
          content: block.content,
          position: index + 1,
          published: true
        }))
      };

      if (editingModule) {
        await updateCourseModule(course.id, editingModule.id, body);
      } else {
        await createCourseModule(course.id, body);
      }
      toast.success(editingModule ? "Module updated." : "Module added.");
      resetForm();
      router.refresh();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save this module.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <MathFormulaDialog
        open={formulaBlockIndex !== null}
        onClose={() => setFormulaBlockIndex(null)}
        onInsert={(formula) => {
          if (formulaBlockIndex !== null) {
            insertMathSnippet(formulaBlockIndex, formula);
          }
        }}
      />
      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Course Modules</h2>
          <button type="button" className="flex items-center gap-2 rounded-md bg-moss px-3 py-2 text-sm font-black text-white" onClick={resetForm}>
            <Icon path={mdiPlus} size={0.72} />
            Add Module
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {course.modules.length > 0 ? course.modules.map((module, moduleIndex) => (
            <article key={module.id} className="rounded-lg border border-line bg-cloud p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-moss">Module {module.position}</p>
                  <h3 className="mt-1 font-black">{module.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-ink/58">{module.lessons.length} blocks</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white disabled:opacity-45" disabled={moduleIndex === 0 || reordering} onClick={() => moveModule(moduleIndex, -1)} aria-label={`Move ${module.title} up`}>
                    <Icon path={mdiArrowUp} size={0.72} />
                  </button>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white disabled:opacity-45" disabled={moduleIndex === course.modules.length - 1 || reordering} onClick={() => moveModule(moduleIndex, 1)} aria-label={`Move ${module.title} down`}>
                    <Icon path={mdiArrowDown} size={0.72} />
                  </button>
                  <button type="button" className="flex items-center gap-2 rounded-md bg-moss px-3 py-2 text-sm font-black text-white" onClick={() => editModule(module)}>
                    <Icon path={mdiFileDocumentEdit} size={0.72} />
                    Edit
                  </button>
                </div>
              </div>
            </article>
          )) : (
            <div className="rounded-lg border border-dashed border-line bg-cloud p-5">
              <p className="text-sm font-black text-ink/62">No Modules Yet</p>
              <button type="button" className="mt-4 flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" onClick={resetForm}>
                <Icon path={mdiPlus} size={0.72} />
                Add First Module
              </button>
            </div>
          )}
        </div>
      </section>

      <form onSubmit={onSubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">{editingModule ? "Edit Module" : "New Module"}</p>
            <h2 className="mt-1 text-xl font-black">{editingModule ? editingModule.title : "Add Module"}</h2>
          </div>
        </div>

        <label className="mt-5 grid gap-2">
          <span className="text-sm font-black">Module Title</span>
          <input className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none focus:border-moss" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <div className="mt-5 grid gap-4">
          {blocks.map((block, index) => (
            <section key={index} className="rounded-lg border border-line bg-cloud p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <span className="rounded-md bg-moss px-3 py-1 text-sm font-black text-white">Block {index + 1}</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white" onClick={() => moveBlock(index, -1)} aria-label={`Move block ${index + 1} up`}>
                    <Icon path={mdiArrowUp} size={0.72} />
                  </button>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white" onClick={() => moveBlock(index, 1)} aria-label={`Move block ${index + 1} down`}>
                    <Icon path={mdiArrowDown} size={0.72} />
                  </button>
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-coral" onClick={() => setBlocks((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove block ${index + 1}`}>
                    <Icon path={mdiTrashCanOutline} size={0.72} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(170px,220px)_minmax(0,1fr)] md:items-end">
                <label className="grid gap-2">
                  <span className="text-sm font-black">Block Type</span>
                  <select className="rounded-md border border-line bg-white px-3 py-3 text-sm font-semibold outline-none" value={block.editorMode} onChange={(event) => updateBlockMode(index, event.target.value as BlockEditorMode)}>
                    <option value="RICH_TEXT">Rich Text</option>
                    <option value="RICH_TEXT_WITH_MATH">Rich Text With Math</option>
                    <option value="CODE">Code</option>
                  </select>
                </label>
                {block.type === "CODE" ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-black">Code Language</span>
                    <input className="rounded-md border border-line bg-white px-3 py-3 text-sm font-semibold outline-none" value={block.codeLanguage} onChange={(event) => updateBlock(index, { codeLanguage: event.target.value })} placeholder="java, javascript, python..." />
                  </label>
                ) : block.editorMode === "RICH_TEXT_WITH_MATH" ? (
                  <button type="button" className="flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-3 text-sm font-black text-white" onClick={() => setFormulaBlockIndex(index)}>
                    <Icon path={mdiFunctionVariant} size={0.72} />
                    Insert Formula
                  </button>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>

              <div className="mt-3 grid gap-2">
                <span className="text-sm font-black">{block.type === "CODE" ? "Code Snippet" : block.editorMode === "RICH_TEXT_WITH_MATH" ? "Rich Text With Math" : "Rich Text"}</span>
                {block.type === "RICH_TEXT" ? (
                  <div className="flex flex-wrap gap-2 rounded-md border border-line bg-white p-2">
                    {richTextActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-md border border-line bg-cloud text-moss outline-none hover:border-moss hover:bg-mint focus:border-line focus:bg-cloud focus-visible:border-moss focus-visible:ring-2 focus-visible:ring-moss/20 active:bg-cloud"
                        title={action.label}
                        aria-label={action.label}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyRichTextAction(index, action.kind)}
                      >
                        <Icon path={action.icon} size={0.72} />
                      </button>
                    ))}
                  </div>
                ) : null}
                <textarea
                  ref={(element) => {
                    textareaRefs.current[index] = element;
                  }}
                  className={block.type === "CODE"
                    ? "min-h-56 resize-y rounded-md border border-line bg-[#0f172a] px-4 py-3 font-mono text-sm leading-6 text-mint outline-none"
                    : "min-h-56 resize-y rounded-md border border-line bg-white px-4 py-3 text-sm font-semibold leading-7 outline-none"}
                  value={block.content}
                  onChange={(event) => updateBlock(index, { content: event.target.value })}
                  onKeyDown={(event) => handleTab(event, index)}
                  placeholder={block.type === "CODE" ? "Paste or write code here..." : block.editorMode === "RICH_TEXT_WITH_MATH" ? "Write text and insert formulas from the formula menu..." : "Write rich text with Markdown. You can use headings, lists, links, and inline code."}
                />
              </div>

              {block.type === "RICH_TEXT" && block.content.trim() ? (
                <div className="mt-3">
                  <PromptBlock>{block.content}</PromptBlock>
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-black" onClick={() => setBlocks((current) => [...current, blankBlock("RICH_TEXT")])}>
            <Icon path={mdiPlus} size={0.72} />
            Add Text
          </button>
          <button type="button" className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-black" onClick={() => setBlocks((current) => [...current, blankBlock("RICH_TEXT_WITH_MATH")])}>
            <Icon path={mdiPlus} size={0.72} />
            Add Math Text
          </button>
          <button type="button" className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-black" onClick={() => setBlocks((current) => [...current, blankBlock("CODE")])}>
            <Icon path={mdiCodeBraces} size={0.72} />
            Add Code
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-bold text-coral">{error}</p> : null}

        <LoadingButton className="mt-5 flex items-center gap-2 rounded-md bg-moss px-5 py-3 text-sm font-black text-white" loading={saving} icon={mdiContentSaveOutline}>
          {saving ? "Saving..." : editingModule ? "Save Module" : "Add Module"}
        </LoadingButton>
      </form>
    </div>
  );
}

function hasMathMarkup(content: string) {
  return /(^|[^\\])\$\$?/.test(content) || /\\(int|sum|frac|sqrt|lim|theta|Delta|pi|rightarrow)\b/.test(content);
}
