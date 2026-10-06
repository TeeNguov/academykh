"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mdiClipboardTextClock, mdiContentCopy, mdiLinkOff, mdiLinkVariant, mdiPlus } from "@mdi/js";
import { ApiQuizSummary, ApiShareLink, ApiStudentGroup, createShareLink, revokeShareLink } from "@/lib/api";
import { EmptyList } from "@/components/EmptyList";
import { Icon } from "@/components/Icon";
import { LoadingButton } from "@/components/LoadingButton";
import { PendingLink } from "@/components/PendingLink";
import { useToast } from "@/components/ToastProvider";
import { testLabel } from "@/lib/format";

type ShareLinkManagerProps = {
  quizzes: ApiQuizSummary[];
  links: ApiShareLink[];
  groups?: ApiStudentGroup[];
  initialTestId?: string;
};

export function ShareLinkManager({ quizzes, links, groups = [], initialTestId }: ShareLinkManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const defaultTestId = initialTestId ?? String(quizzes[0]?.id ?? "");
  const [testId, setTestId] = useState(defaultTestId);
  const [label, setLabel] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [allowStudentReview, setAllowStudentReview] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState("");
  const [invitedGroupIds, setInvitedGroupIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [linkTestFilter, setLinkTestFilter] = useState(initialTestId ?? "all");
  const [origin, setOrigin] = useState("");

  const filteredLinks = useMemo(() => {
    if (linkTestFilter === "all") {
      return links;
    }
    return links.filter((link) => String(link.testId) === linkTestFilter);
  }, [links, linkTestFilter]);

  const selectedFilterLabel = linkTestFilter === "all"
    ? "All Tests"
    : (() => {
        const quiz = quizzes.find((item) => String(item.id) === linkTestFilter);
        return quiz ? testLabel(quiz.title, quiz.id) : "Selected Test";
      })();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      if (!expiresAt) {
        toast.error("Expiration date and time is required.");
        return;
      }

      await createShareLink(testId, {
        label,
        availableFrom: availableFrom ? new Date(availableFrom).toISOString() : null,
        expiresAt: new Date(expiresAt).toISOString(),
        active: true,
        allowStudentReview,
        simpleMode,
        invitedEmails,
        invitedGroupIds: invitedGroupIds.map(Number)
      });
      setLabel("");
      setAvailableFrom("");
      setExpiresAt("");
      setAllowStudentReview(false);
      setSimpleMode(false);
      setInvitedEmails("");
      setInvitedGroupIds([]);
      setLinkTestFilter(testId);
      router.refresh();
      toast.success("Share link created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create link.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(linkHref(token));
      setCopiedToken(token);
      toast.success("Link copied.");
      window.setTimeout(() => {
        setCopiedToken((current) => current === token ? null : current);
      }, 1800);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  async function onRevokeLink(linkId: number) {
    setRevokingId(linkId);

    try {
      await revokeShareLink(linkId);
      router.refresh();
      toast.success("Share link revoked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke link.");
    } finally {
      setRevokingId(null);
    }
  }

  function linkHref(token: string) {
    return origin ? `${origin}/tests/take/${token}` : `/tests/take/${token}`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-moss">
            <Icon path={mdiLinkVariant} size={1} />
          </span>
          <div>
            <h2 className="text-xl font-black">Create Share Link</h2>
            <p className="text-sm font-semibold text-ink/58">Reuse any published test with a new time window.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-black">Test</span>
            <select className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={testId} onChange={(event) => setTestId(event.target.value)}>
              {quizzes.length > 0 ? quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{testLabel(quiz.title, quiz.id)}</option>
              )) : (
                <option value="">No tests available</option>
              )}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black">Label</span>
            <input className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Batch A final exam" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black">Open From</span>
            <input className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" type="datetime-local" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black">Expires At</span>
            <input required className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black">Invite Student Emails</span>
            <span className="text-xs font-semibold text-ink/58">Optional. Leave blank for anyone with the link; add emails or groups to restrict a login-required test.</span>
            <textarea className="min-h-28 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={invitedEmails} onChange={(event) => setInvitedEmails(event.target.value)} placeholder="student1@email.com, student2@email.com" />
          </label>
          {groups.length > 0 ? (
            <label className="grid gap-2">
              <span className="text-sm font-black">Invite Groups</span>
              <select multiple className="min-h-28 rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={invitedGroupIds} onChange={(event) => setInvitedGroupIds(Array.from(event.target.selectedOptions).map((option) => option.value))}>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name} ({group.studentCount})</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex items-center justify-between gap-4 rounded-lg border border-line bg-cloud px-4 py-3">
            <span>
              <span className="block text-sm font-black">Allow Review After Attempt</span>
              <span className="mt-1 block text-xs font-semibold text-ink/58">Students can see question and answer details after submitting.</span>
            </span>
            <input className="h-5 w-5 accent-moss" type="checkbox" checked={allowStudentReview} onChange={(event) => setAllowStudentReview(event.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-line bg-cloud px-4 py-3">
            <span>
              <span className="block text-sm font-black">Simple Shared Test Page</span>
              <span className="mt-1 block text-xs font-semibold text-ink/58">Use a clean standalone test page with a small Academy Kh footer.</span>
            </span>
            <input className="h-5 w-5 accent-moss" type="checkbox" checked={simpleMode} onChange={(event) => setSimpleMode(event.target.checked)} />
          </label>
        </div>

        <LoadingButton className="mt-5 flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-black text-white" loading={saving} disabled={quizzes.length === 0} icon={mdiPlus}>
          {saving ? "Creating..." : "Create Link"}
        </LoadingButton>
      </form>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Generated Links</h2>
            <p className="mt-1 text-sm font-semibold text-ink/58">
              Showing {filteredLinks.length} of {links.length} links for {selectedFilterLabel}.
            </p>
          </div>
          <label className="grid gap-2 sm:min-w-56">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-ink/52">View By Test</span>
            <select className="rounded-md border border-line bg-cloud px-3 py-3 text-sm font-semibold outline-none" value={linkTestFilter} onChange={(event) => setLinkTestFilter(event.target.value)}>
              <option value="all">All tests</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>{testLabel(quiz.title, quiz.id)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3">
          {filteredLinks.length > 0 ? filteredLinks.map((link) => (
            <article key={link.id} className="card-enter rounded-lg border border-line bg-cloud p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="font-black">{link.label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink/58">{testLabel(link.testTitle, link.testId)}</p>
                  <p className="mt-2 break-all text-xs font-bold text-moss">{linkHref(link.token)}</p>
                </div>
                <span className={`rounded-md px-3 py-1 text-xs font-black ${!link.active || link.expired ? "bg-coral text-white" : "bg-mint text-moss"}`}>
                  {!link.active ? "Revoked" : link.expired ? "Expired" : "Active"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-ink/58">
                <span>Open: {link.availableFrom ? formatDateTime(link.availableFrom) : "Immediately"}</span>
                <span>Expires: {formatDateTime(link.expiresAt)}</span>
                {link.simpleMode ? <span>Simple page</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-black" onClick={() => copyLink(link.token)}>
                  <Icon path={mdiContentCopy} size={0.7} />
                  {copiedToken === link.token ? "Copied" : "Copy Link"}
                </button>
                <PendingLink href={`/admin/share/links/${link.id}/responses`} className="flex items-center gap-2 rounded-md bg-moss px-3 py-2 text-sm font-black text-white">
                  <Icon path={mdiClipboardTextClock} size={0.7} />
                  Responses
                </PendingLink>
                {link.active ? (
                  <LoadingButton type="button" className="flex items-center gap-2 rounded-md border border-coral bg-white px-3 py-2 text-sm font-black text-coral" loading={revokingId === link.id} icon={mdiLinkOff} onClick={() => onRevokeLink(link.id)}>
                    {revokingId === link.id ? "Revoking..." : "Revoke"}
                  </LoadingButton>
                ) : null}
              </div>
            </article>
          )) : (
            <EmptyList title="No Share Links Yet" text={links.length > 0 ? "No links match this test filter." : "Create a share link and it will appear here."} />
          )}
        </div>
      </section>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ");
}
