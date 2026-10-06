"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mdiCheckboxMarkedCircleOutline, mdiClose, mdiCodeBraces, mdiFunctionVariant, mdiPlus, mdiTrashCanOutline } from "@mdi/js";
import { ApiQuizDetail, createQuiz, QuestionType, StudentIdentityMode, updateQuiz } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { useToast } from "@/components/ToastProvider";
import { MathFormulaDialog } from "@/components/MathFormulaDialog";

type BuilderOption = {
  id?: number;
  label: string;
  correct: boolean;
};

type BuilderQuestion = {
  id?: number;
  type: QuestionType;
  prompt: string;
  points: string;
  options: BuilderOption[];
};

const blankQuestion = (): BuilderQuestion => ({
  type: "SINGLE_CHOICE",
  prompt: "",
  points: "",
  options: [
    { label: "", correct: true },
    { label: "", correct: false }
  ]
});

type TestBuilderProps = {
  initialQuiz?: ApiQuizDetail;
};

export function TestBuilder({ initialQuiz }: TestBuilderProps) {
  const router = useRouter();
  const toast = useToast();
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const editing = Boolean(initialQuiz);
  const [title, setTitle] = useState(initialQuiz?.title ?? "");
  const [exam, setExam] = useState(initialQuiz?.exam ?? false);
  const [durationMinutes, setDurationMinutes] = useState(initialQuiz?.durationMinutes ?? 30);
  const [studentIdentityMode, setStudentIdentityMode] = useState<StudentIdentityMode>(initialQuiz?.studentIdentityMode ?? "NAME_INPUT");
  const [questions, setQuestions] = useState<BuilderQuestion[]>(() => initialQuiz ? quizToBuilderQuestions(initialQuiz) : [blankQuestion()]);
  const [formulaQuestionIndex, setFormulaQuestionIndex] = useState<number | null>(null);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [pendingBody, setPendingBody] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndBuildBody() {
    setError(null);

    const firstEmptyPromptIndex = questions.findIndex((question) => question.prompt.trim().length === 0);
    if (firstEmptyPromptIndex >= 0) {
      const message = `Question ${firstEmptyPromptIndex + 1} needs a prompt before saving.`;
      setError(message);
      toast.error(message);
      return null;
    }

    const firstInvalidChoiceIndex = questions.findIndex((question) => (
      isChoice(question.type)
      && question.options.filter((option) => option.label.trim().length > 0).length < 2
    ));
    if (firstInvalidChoiceIndex >= 0) {
      const message = `Question ${firstInvalidChoiceIndex + 1} needs at least two options before saving.`;
      setError(message);
      toast.error(message);
      return null;
    }

    const firstChoiceWithoutAnswerIndex = questions.findIndex((question) => (
      isChoice(question.type)
      && !question.options.some((option) => option.correct && option.label.trim().length > 0)
    ));
    if (firstChoiceWithoutAnswerIndex >= 0) {
      const message = `Question ${firstChoiceWithoutAnswerIndex + 1} needs a correct option before saving.`;
      setError(message);
      toast.error(message);
      return null;
    }

    return {
      title,
      exam,
      durationMinutes: durationMinutes > 0 ? durationMinutes : null,
      studentIdentityMode,
      published: true,
      questions: questions.map((question, questionIndex) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        points: question.points.trim().length > 0 ? Number(question.points) : 0,
        position: questionIndex + 1,
        options: isChoice(question.type)
          ? question.options
              .filter((option) => option.label.trim().length > 0)
              .map((option, optionIndex) => ({ ...option, position: optionIndex + 1 }))
          : []
      }))
    };
  }

  function requestSaveConfirmation() {
    const body = validateAndBuildBody();
    if (!body) {
      return;
    }
    setPendingBody(body);
    setConfirmingSave(true);
  }

  async function saveConfirmed() {
    if (!pendingBody) {
      return;
    }

    setSaving(true);
    setError(null);
    setConfirmingSave(false);

    try {
      if (initialQuiz) {
        await updateQuiz(initialQuiz.id, pendingBody);
      } else {
        await createQuiz(pendingBody);
      }
      toast.success(initialQuiz ? "Test changes saved." : "Test published.");
      setPendingBody(null);
      router.refresh();
      if (!initialQuiz) {
        setTitle("");
        setExam(false);
        setStudentIdentityMode("NAME_INPUT");
        setQuestions([blankQuestion()]);
      }
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save the test. Check the questions and try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<BuilderQuestion>) {
    setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question));
  }

  function insertFormula(questionIndex: number, snippet: string) {
    const prompt = questions[questionIndex]?.prompt ?? "";
    const textarea = textareaRefs.current[questionIndex];
    if (!textarea) {
      const spacer = prompt.trim().length > 0 ? "\n\n" : "";
      updateQuestion(questionIndex, { prompt: `${prompt}${spacer}${snippet}` });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const needsLeadingBreak = start > 0 && !prompt.slice(0, start).endsWith("\n\n");
    const needsTrailingBreak = end < prompt.length && !prompt.slice(end).startsWith("\n\n");
    const prefix = needsLeadingBreak ? "\n\n" : "";
    const suffix = needsTrailingBreak ? "\n\n" : "";
    const nextPrompt = prompt.slice(0, start) + prefix + snippet + suffix + prompt.slice(end);
    const nextPosition = start + prefix.length + snippet.length;
    updateQuestion(questionIndex, { prompt: nextPrompt });
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextPosition, nextPosition);
    });
  }

  function updateOption(questionIndex: number, optionIndex: number, patch: Partial<BuilderOption>) {
    setQuestions((current) => current.map((question, itemIndex) => {
      if (itemIndex !== questionIndex) {
        return question;
      }

      const nextOptions = question.options.map((option, currentOptionIndex) => {
        if (currentOptionIndex !== optionIndex) {
          return question.type === "SINGLE_CHOICE" && patch.correct ? { ...option, correct: false } : option;
        }
        return { ...option, ...patch };
      });

      return { ...question, options: nextOptions };
    }));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setQuestions((current) => current.map((question, itemIndex) => {
      if (itemIndex !== questionIndex) {
        return question;
      }

      const nextOptions = question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex);
      if (question.type === "SINGLE_CHOICE" && nextOptions.length > 0 && !nextOptions.some((option) => option.correct)) {
        nextOptions[0] = { ...nextOptions[0], correct: true };
      }

      return {
        ...question,
        options: nextOptions
      };
    }));
  }

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, questionIndex: number) {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea = event.currentTarget;
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indent = "  ";

    if (event.shiftKey) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const selectedText = value.slice(lineStart, end);
      const nextSelectedText = selectedText.replace(/(^|\n)( {1,2}|\t)/g, "$1");
      const nextValue = value.slice(0, lineStart) + nextSelectedText + value.slice(end);
      const removedBeforeStart = selectedText.length - nextSelectedText.length;

      updateQuestion(questionIndex, { prompt: nextValue });
      requestAnimationFrame(() => {
        const nextPosition = Math.max(lineStart, start - Math.min(removedBeforeStart, start - lineStart));
        textarea.setSelectionRange(nextPosition, Math.max(nextPosition, end - removedBeforeStart));
      });
      return;
    }

    if (start === end) {
      const nextValue = value.slice(0, start) + indent + value.slice(end);
      updateQuestion(questionIndex, { prompt: nextValue });
      requestAnimationFrame(() => textarea.setSelectionRange(start + indent.length, start + indent.length));
      return;
    }

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const selectedText = value.slice(lineStart, end);
    const nextSelectedText = selectedText.replace(/^/gm, indent);
    const nextValue = value.slice(0, lineStart) + nextSelectedText + value.slice(end);
    const addedCharacters = nextSelectedText.length - selectedText.length;

    updateQuestion(questionIndex, { prompt: nextValue });
    requestAnimationFrame(() => {
      textarea.setSelectionRange(start + indent.length, end + addedCharacters);
    });
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") {
      return;
    }

    if (event.target instanceof HTMLTextAreaElement) {
      return;
    }

    event.preventDefault();
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} onKeyDown={handleFormKeyDown} className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <MathFormulaDialog
        open={formulaQuestionIndex !== null}
        onClose={() => setFormulaQuestionIndex(null)}
        onInsert={(formula) => {
          if (formulaQuestionIndex !== null) {
            insertFormula(formulaQuestionIndex, formula);
          }
        }}
      />
      {confirmingSave ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/42 px-4 py-6">
          <div className="card-enter w-full max-w-md rounded-lg border border-line bg-white shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-lg font-black">{editing ? "Save Test Changes?" : "Publish Test?"}</h2>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white" onClick={() => setConfirmingSave(false)} aria-label="Close Confirmation Dialog">
                <Icon path={mdiClose} size={0.78} />
              </button>
            </div>
            <div className="grid gap-3 px-5 py-4 text-sm font-semibold text-ink/68">
              <p>{editing ? "This will update the test students and teachers see." : "This will publish the test and make it available according to its sharing settings."}</p>
              <p className="font-black text-ink">{questions.length} questions · {questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0)} pts</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-line bg-cloud px-5 py-4">
              <button type="button" className="rounded-md border border-line bg-white px-4 py-2 text-sm font-black" onClick={() => setConfirmingSave(false)}>
                Cancel
              </button>
              <LoadingButton type="button" className="flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" loading={saving} icon={mdiCheckboxMarkedCircleOutline} onClick={saveConfirmed}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Publish Test"}
              </LoadingButton>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
          <Icon path={mdiCodeBraces} size={1} />
        </span>
        <div>
          <h2 className="text-xl font-black">{editing ? "Edit Test" : "Create Test"}</h2>
          <p className="text-sm font-semibold text-ink/58">Multiple choice, open-ended, science, math, and programming questions.</p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_minmax(120px,160px)_minmax(170px,220px)]">
        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-black">Title</span>
          <input className="min-w-0 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-black">Type</span>
          <select className="min-w-0 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={exam ? "exam" : "quiz"} onChange={(event) => setExam(event.target.value === "exam")}>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
          </select>
        </label>
        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-black">Minutes</span>
          <input className="min-w-0 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" min={1} type="number" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
        </label>
        <label className="grid min-w-0 gap-2">
          <span className="text-sm font-black">Student Identity</span>
          <select className="min-w-0 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={studentIdentityMode} onChange={(event) => setStudentIdentityMode(event.target.value as StudentIdentityMode)}>
            <option value="REQUIRE_LOGIN">Require Login</option>
            <option value="NAME_INPUT">Name Input</option>
            <option value="ANONYMOUS">Nothing</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-4">
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="card-enter min-w-0 rounded-lg border border-line bg-cloud p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <span className="rounded-md bg-moss px-3 py-1 text-sm font-black text-white">
                Question {questionIndex + 1}
              </span>
              <div className="grid grid-cols-[minmax(86px,120px)_44px] items-end gap-2">
                <label className="grid min-w-0 gap-1">
                  <span className="text-xs font-black text-ink/58">Points</span>
                  <input className="min-w-0 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold outline-none" min={0} placeholder="0" type="number" value={question.points} onChange={(event) => updateQuestion(questionIndex, { points: event.target.value })} />
                </label>
                <button type="button" className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-coral" onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== questionIndex))} aria-label={`Remove question ${questionIndex + 1}`}>
                  <Icon path={mdiTrashCanOutline} size={0.78} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-[minmax(150px,190px)_minmax(0,1fr)]">
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-black">Question Type</span>
                <select className="h-40 min-w-0 rounded-md border border-line bg-white px-3 py-3 text-sm font-semibold outline-none" value={question.type} onChange={(event) => updateQuestion(questionIndex, { type: event.target.value as QuestionType })}>
                  <option value="SINGLE_CHOICE">Single Choice</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="OPEN_ENDED">Open Ended</option>
                  <option value="CODING">Programming</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-black">Question Prompt</span>
                <button type="button" className="flex w-fit items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" onClick={() => setFormulaQuestionIndex(questionIndex)}>
                  <Icon path={mdiFunctionVariant} size={0.72} />
                  Insert Formula
                </button>
                <textarea
                  ref={(element) => {
                    textareaRefs.current[questionIndex] = element;
                  }}
                  className="min-h-40 min-w-0 resize-y rounded-md border border-line bg-[#0f172a] px-4 py-3 font-mono text-sm leading-6 text-mint outline-none placeholder:text-mint/42"
                  placeholder={"Write the question, code sample, or instructions here...\n\nExample:\n```javascript\nfunction greet(name) {\n  return `Hello ${name}`;\n}\n```\n\nWhat does this function return?"}
                  spellCheck={false}
                  value={question.prompt}
                  onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })}
                  onKeyDown={(event) => handlePromptKeyDown(event, questionIndex)}
                />
              </label>
            </div>

            {isChoice(question.type) ? (
              <div className="mt-3 grid gap-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)_40px] items-center gap-2">
                    <input className="justify-self-start" type={question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"} checked={option.correct} onChange={(event) => updateOption(questionIndex, optionIndex, { correct: event.target.checked })} aria-label={`Mark option ${optionIndex + 1} as correct`} />
                    <textarea className="min-h-10 min-w-0 resize-y rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold leading-6 outline-none" placeholder={`Option ${optionIndex + 1}`} value={option.label} onChange={(event) => updateOption(questionIndex, optionIndex, { label: event.target.value })} />
                    <button type="button" className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-coral" onClick={() => removeOption(questionIndex, optionIndex)} aria-label={`Remove option ${optionIndex + 1}`}>
                      <Icon path={mdiTrashCanOutline} size={0.72} />
                    </button>
                  </div>
                ))}
                <button type="button" className="flex items-center gap-2 text-sm font-black text-moss" onClick={() => updateQuestion(questionIndex, { options: [...question.options, { label: "", correct: false }] })}>
                  <Icon path={mdiPlus} size={0.7} />
                  Add Option
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm font-bold text-coral">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-black" onClick={() => setQuestions((current) => [...current, blankQuestion()])}>
          <Icon path={mdiPlus} size={0.72} />
          Add Question
        </button>
        <LoadingButton type="button" className="flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" loading={saving} icon={mdiCheckboxMarkedCircleOutline} onClick={requestSaveConfirmation}>
          {saving ? "Saving..." : editing ? "Save Changes" : "Publish Test"}
        </LoadingButton>
      </div>
    </form>
  );
}

function isChoice(type: QuestionType) {
  return type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
}

function quizToBuilderQuestions(quiz: ApiQuizDetail): BuilderQuestion[] {
  if (quiz.questions.length === 0) {
    return [blankQuestion()];
  }

  return quiz.questions.map((question) => ({
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    points: String(question.points),
    options: question.options.length > 0
      ? question.options.map((option) => ({
          id: option.id,
          label: option.label,
          correct: Boolean(option.correct)
        }))
      : [
          { label: "", correct: true },
          { label: "", correct: false }
        ]
  }));
}
