"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { mdiAccountSchoolOutline, mdiArrowRight, mdiBookOpenPageVariant, mdiClipboardTextClock, mdiFileDocumentCheckOutline, mdiTrophyVariant } from "@mdi/js";
import { CourseRow } from "@/components/CourseRow";
import { Icon } from "@/components/Icon";
import { Metric } from "@/components/Metric";
import { ApiCourse } from "@/lib/api";
import { testLabel, titleCase } from "@/lib/format";
import { ApiDashboardAttempt, ApiDashboardSharedTest, ApiStudentDashboard } from "@/lib/student-dashboard";

type DashboardView = "overview" | "courses";

const views: Array<{ id: DashboardView; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses" }
];

export function DashboardWorkspace({ dashboard }: { dashboard: ApiStudentDashboard }) {
  const [view, setView] = useState<DashboardView>("overview");

  const metrics = [
    { label: "Courses", value: String(dashboard.stats.enrolledCourses), icon: mdiBookOpenPageVariant },
    { label: "Shared Tests", value: String(dashboard.stats.sharedTests), icon: mdiFileDocumentCheckOutline },
    { label: "Attempts", value: String(dashboard.stats.attempts), icon: mdiClipboardTextClock },
    { label: "Average Score", value: `${dashboard.stats.averageScore}%`, icon: mdiTrophyVariant }
  ];

  const unlinkedCourseTests = useMemo(() => dashboard.sharedTests.filter((test) => test.courseId == null), [dashboard.sharedTests]);
  const unlinkedCourseAttempts = useMemo(() => dashboard.attempts.filter((attempt) => attempt.courseId == null), [dashboard.attempts]);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Learning Workspace</p>
          <h1 className="text-3xl font-black">Welcome, {dashboard.user.name}</h1>
        </div>
        <div className="flex w-full rounded-lg border border-line bg-white p-1 shadow-soft md:w-auto">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`min-h-10 flex-1 rounded-md px-4 text-sm font-black transition md:flex-none ${view === item.id ? "bg-moss text-white" : "text-ink/62 hover:bg-cloud"}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {view === "overview" ? (
        <OverviewView dashboard={dashboard} metrics={metrics} />
      ) : (
        <CourseView dashboard={dashboard} unlinkedTests={unlinkedCourseTests} unlinkedAttempts={unlinkedCourseAttempts} />
      )}
    </>
  );
}

function OverviewView({ dashboard, metrics }: { dashboard: ApiStudentDashboard; metrics: Array<{ label: string; value: string; icon: string }> }) {
  return (
    <>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.78fr]">
        <Panel eyebrow="To Do" title="Available Tests">
          <div className="grid gap-4">
            {dashboard.sharedTests.length > 0 ? dashboard.sharedTests.slice(0, 4).map((test) => (
              <TestCard key={test.id} test={test} />
            )) : (
              <EmptyState icon={mdiFileDocumentCheckOutline} title="No Shared Tests Right Now" text="Tests shared with your account will appear here while their links are open." />
            )}
          </div>
        </Panel>

        <Panel eyebrow="Recent Work" title="Scores And Feedback">
          <div className="grid gap-4">
            {dashboard.attempts.length > 0 ? dashboard.attempts.slice(0, 4).map((attempt) => (
              <AttemptCard key={attempt.id} attempt={attempt} compact />
            )) : (
              <EmptyState icon={mdiClipboardTextClock} title="No Attempts Yet" text="Your submitted tests and scores will appear here." />
            )}
          </div>
        </Panel>
      </section>

      <Panel className="mt-8" eyebrow="Courses" title="Study Courses">
        <div className="grid gap-4">
          {dashboard.enrolledCourses.length > 0 ? dashboard.enrolledCourses.map((course) => (
            <CourseRow key={course.id} course={course} />
          )) : (
            <EmptyState icon={mdiAccountSchoolOutline} title="No Courses Yet" text="Courses you are enrolled in or invited to will appear here." />
          )}
        </div>
      </Panel>
    </>
  );
}

function CourseView({ dashboard, unlinkedTests, unlinkedAttempts }: { dashboard: ApiStudentDashboard; unlinkedTests: ApiDashboardSharedTest[]; unlinkedAttempts: ApiDashboardAttempt[] }) {
  return (
    <section className="mt-8 grid gap-5">
      {dashboard.enrolledCourses.length > 0 ? dashboard.enrolledCourses.map((course) => {
        const tests = dashboard.sharedTests.filter((test) => test.courseId === course.id);
        const attempts = dashboard.attempts.filter((attempt) => attempt.courseId === course.id);

        return (
          <article key={course.id} className="rounded-lg border border-line bg-white p-5 shadow-soft">
            <CourseSummaryHeader course={course} />
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <MiniList title="Available Tests">
                {tests.length > 0 ? tests.map((test) => <TestCard key={test.id} test={test} compact />) : <EmptyInline text="No open tests for this course." />}
              </MiniList>
              <MiniList title="Recent Attempts">
                {attempts.length > 0 ? attempts.map((attempt) => <AttemptCard key={attempt.id} attempt={attempt} compact />) : <EmptyInline text="No attempts for this course yet." />}
              </MiniList>
            </div>
          </article>
        );
      }) : (
        <EmptyState icon={mdiBookOpenPageVariant} title="No Courses Yet" text="Courses you are enrolled in or invited to will appear in this view." />
      )}

      {unlinkedTests.length > 0 || unlinkedAttempts.length > 0 ? (
        <Panel eyebrow="General" title="Tests Without A Course">
          <div className="grid gap-5 lg:grid-cols-2">
            <MiniList title="Available Tests">
              {unlinkedTests.length > 0 ? unlinkedTests.map((test) => <TestCard key={test.id} test={test} compact />) : <EmptyInline text="No available general tests." />}
            </MiniList>
            <MiniList title="Recent Attempts">
              {unlinkedAttempts.length > 0 ? unlinkedAttempts.map((attempt) => <AttemptCard key={attempt.id} attempt={attempt} compact />) : <EmptyInline text="No general attempts yet." />}
            </MiniList>
          </div>
        </Panel>
      ) : null}
    </section>
  );
}

function CourseSummaryHeader({ course }: { course: ApiCourse }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-mint text-moss">
          <Icon path={mdiBookOpenPageVariant} size={1.1} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-black">{course.title}</h2>
          <p className="mt-1 text-sm font-semibold text-ink/58">
            {course.language} subject · {course.level} · {course.moduleCount ?? 0} modules · {course.lessonCount ?? 0} blocks
          </p>
        </div>
      </div>
      <Link href={`/courses/${course.id}`} className="flex w-fit items-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-sm font-black text-moss">
        Open Course
        <Icon path={mdiArrowRight} size={0.72} />
      </Link>
    </div>
  );
}

function Panel({ eyebrow, title, className = "", children }: { eyebrow: string; title: string; className?: string; children: ReactNode }) {
  return (
    <section className={className}>
      <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-ink/48">{title}</h3>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function TestCard({ test, compact = false }: { test: ApiDashboardSharedTest; compact?: boolean }) {
  return (
    <article className={`card-enter rounded-lg border border-line bg-white shadow-soft ${compact ? "p-4" : "p-5"}`}>
      <h3 className="text-lg font-black">{testLabel(test.testTitle, test.testId)}</h3>
      <p className="mt-1 text-sm font-semibold text-ink/58">{test.label}</p>
      <p className="mt-3 text-sm font-bold text-ink/62">
        {test.courseTitle ? `${test.courseTitle} · ` : ""}{test.questionCount} questions · {test.durationMinutes ?? 30} min
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-ink/54">Expires {formatDateTime(test.expiresAt)}</span>
        <Link href={`/tests/take/${test.token}`} className="flex items-center gap-1 rounded-md bg-moss px-4 py-2 text-sm font-black text-white">
          Start
          <Icon path={mdiArrowRight} size={0.7} />
        </Link>
      </div>
    </article>
  );
}

function AttemptCard({ attempt, compact = false }: { attempt: ApiDashboardAttempt; compact?: boolean }) {
  return (
    <article className={`card-enter rounded-lg border border-line bg-white shadow-soft ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black">{testLabel(attempt.testTitle, attempt.testId)}</h3>
          <p className="mt-1 text-sm font-semibold text-ink/58">
            {attempt.courseTitle ? `${attempt.courseTitle} · ` : ""}{titleCase(attempt.status)} · Started {formatDateTime(attempt.startedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-mint px-3 py-2 text-sm font-black text-moss">
            {attempt.scorePercent == null ? "Waiting For Grade" : `${attempt.scorePercent}%`}
          </span>
          <Link href={`/scores/${attempt.id}`} className="flex items-center gap-1 text-sm font-black text-moss">
            View
            <Icon path={mdiArrowRight} size={0.7} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="card-enter rounded-lg border border-dashed border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
          <Icon path={icon} size={1} />
        </span>
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm font-semibold text-ink/58">{text}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyInline({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line bg-cloud p-4 text-sm font-black text-ink/54">{text}</p>;
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}
