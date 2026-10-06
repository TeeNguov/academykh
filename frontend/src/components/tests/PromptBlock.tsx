import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export function PromptBlock({ children }: { children: string }) {
  return (
    <div className="prompt-block mt-3 w-full max-w-full rounded-md border border-line bg-white p-4 text-sm leading-7 text-ink">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
