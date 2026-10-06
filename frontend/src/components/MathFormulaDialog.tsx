"use client";

import { useEffect, useRef, useState } from "react";
import { mdiCheck, mdiClose, mdiFunctionVariant } from "@mdi/js";
import { Icon } from "@/components/Icon";
import { PromptBlock } from "@/components/tests/PromptBlock";
import { mathFormulaTemplates, stripMathDelimiters } from "@/lib/math-snippets";

type MathFormulaDialogProps = {
  open: boolean;
  onClose: () => void;
  onInsert: (formula: string) => void;
};

type MathfieldElementLike = HTMLElement & {
  value: string;
  getValue: (format?: string) => string;
  setValue: (value: string, options?: { silenceNotifications?: boolean }) => void;
  insert: (value: string) => boolean;
  focus: () => void;
};

export function MathFormulaDialog({ open, onClose, onInsert }: MathFormulaDialogProps) {
  const mathfieldRef = useRef<MathfieldElementLike | null>(null);
  const [mathLiveReady, setMathLiveReady] = useState(false);
  const [formula, setFormula] = useState("\\frac{\\Delta y}{\\Delta x}");
  const previewFormula = formula.trim() || "x";

  useEffect(() => {
    let mounted = true;
    import("mathlive").then(() => {
      if (mounted) {
        setMathLiveReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!open || !mathLiveReady) {
      return;
    }

    requestAnimationFrame(() => {
      const mathfield = mathfieldRef.current;
      if (!mathfield) {
        return;
      }
      mathfield.setValue(formula, { silenceNotifications: true });
      mathfield.focus();
    });
  }, [mathLiveReady, open]);

  if (!open) {
    return null;
  }

  function readMathfieldValue() {
    const mathfield = mathfieldRef.current;
    if (!mathfield) {
      return formula;
    }
    return mathfield.getValue ? mathfield.getValue("latex") : mathfield.value;
  }

  function replaceFormula(value: string) {
    const nextFormula = stripMathDelimiters(value);
    const mathfield = mathfieldRef.current;
    if (mathfield?.setValue) {
      mathfield.setValue(nextFormula);
      mathfield.focus();
    }
    setFormula(nextFormula);
  }

  function insertFormula() {
    const nextFormula = readMathfieldValue().trim();
    if (!nextFormula) {
      return;
    }
    onInsert(`$$${nextFormula}$$`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/42 px-4 py-6">
      <div className="card-enter flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-mint text-moss">
              <Icon path={mdiFunctionVariant} size={0.9} />
            </span>
            <h2 className="text-lg font-black">Insert Math Formula</h2>
          </div>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white" onClick={onClose} aria-label="Close Formula Dialog">
            <Icon path={mdiClose} size={0.78} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-5">
          <div className="grid gap-3">
            <select
              className="w-full rounded-md border border-line bg-cloud px-3 py-3 text-sm font-black text-ink outline-none"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) {
                  replaceFormula(event.target.value);
                  event.target.value = "";
                }
              }}
            >
              <option value="" disabled>Formula Templates</option>
              {mathFormulaTemplates.map((template) => (
                <option key={template.label} value={template.value}>{template.label}</option>
              ))}
            </select>

          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black">Formula</span>
            {mathLiveReady ? (
              <math-field
                ref={mathfieldRef}
                className="mathlive-field"
                math-virtual-keyboard-policy="auto"
                smart-fence
                onInput={() => setFormula(readMathfieldValue())}
              />
            ) : (
              <div className="min-h-28 rounded-md border border-line bg-white px-4 py-3 text-sm font-black text-ink/58">
                Loading Formula Editor...
              </div>
            )}
          </label>

          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-sm font-black text-ink/58">Preview</p>
            <PromptBlock>{`$$${previewFormula}$$`}</PromptBlock>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-cloud px-5 py-4">
          <button type="button" className="rounded-md border border-line bg-white px-4 py-2 text-sm font-black" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" onClick={insertFormula}>
            <Icon path={mdiCheck} size={0.72} />
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
