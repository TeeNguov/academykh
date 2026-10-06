import { mdiArrowRight, mdiClipboardCheckOutline, mdiFileDocumentEdit } from "@mdi/js";
import { Icon } from "@/components/Icon";
import { PendingLink } from "@/components/PendingLink";

type CourseRowProps = {
  course: {
    id: string | number;
    title: string;
    language: string;
    level: string;
    progress?: number;
    icon?: string;
    modules?: number;
    lessons?: number;
    moduleCount?: number;
    lessonCount?: number;
    quizzes?: number;
    published?: boolean;
    createdById?: number | null;
  };
  manageHref?: string;
};

export function CourseRow({ course, manageHref }: CourseRowProps) {
  const progress = course.progress ?? 0;
  const moduleCount = course.moduleCount ?? course.modules ?? 0;
  const lessonCount = course.lessonCount ?? course.lessons ?? 0;

  return (
    <article className="card-enter rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-mint text-moss">
            <Icon path={course.icon ?? mdiClipboardCheckOutline} size={1.15} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black">{course.title}</h2>
              {typeof course.published === "boolean" ? (
                <span className="rounded-md bg-mint px-2 py-1 text-xs font-black text-moss">
                  {course.published ? "Published" : "Draft"}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-semibold text-ink/58">
              {course.language} subject · {course.level} · {moduleCount} modules · {lessonCount} blocks
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:w-[420px]">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{progress}% complete</span>
            <span className="flex items-center gap-1 text-moss">
              <Icon path={mdiClipboardCheckOutline} size={0.7} />
              {course.quizzes ?? 0} tests
            </span>
          </div>
          <div className="h-2 rounded-full bg-line">
            <div className="h-2 rounded-full bg-moss" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap justify-start gap-2 md:justify-end">
            <PendingLink href={`/courses/${course.id}`} className="flex shrink-0 items-center justify-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-sm font-black text-moss">
              Open Course
              <Icon path={mdiArrowRight} size={0.72} />
            </PendingLink>
            {manageHref ? (
              <PendingLink href={manageHref} className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-moss px-3 py-2 text-sm font-black text-white">
                <Icon path={mdiFileDocumentEdit} size={0.72} />
                Manage Course
              </PendingLink>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
