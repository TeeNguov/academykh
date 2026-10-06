import type { DetailedHTMLProps, HTMLAttributes } from "react";

type MathfieldElementLike = HTMLElement & {
  value: string;
  getValue: (format?: string) => string;
  setValue: (value: string, options?: { silenceNotifications?: boolean }) => void;
  insert: (value: string) => boolean;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": DetailedHTMLProps<HTMLAttributes<MathfieldElementLike>, MathfieldElementLike> & {
        value?: string;
        "math-virtual-keyboard-policy"?: "auto" | "manual" | "sandboxed";
        "smart-fence"?: boolean | "";
      };
    }
  }
}
