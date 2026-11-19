import { useState } from "react";
import { Check, Inbox, Loader2, PencilLine, X } from "lucide-react";
import { api } from "../lib/api";
import type { DeanData } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { Avatar, Seg, Sheet, StatusPill, useToast } from "../components/ui";
import { DeanSchedule } from "./DeanSchedule";

type Filter = "all" | "new" | "review" | "ready" | "done";
type Tab = "requests" | "schedule";

const hueOf = (key: string) => {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
};

function bucketOf(status: string): Exclude<Filter, "all"> {
  if (status === "submitted") return "new";
  if (status === "in_review") return "review";
  if (status === "ready") return "ready";
  return "done";
}

export function DeanView({ data, onRefresh }: { data: DeanData; onRefresh: () => Promise<void> }) {
  const { t, pick, date, relTime } = useI18n();
  const { notify } = useToast();
  const [tab, setTab] = useState<Tab>("requests");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [revising, setRevising] = useState(false);

  const counts = { all: data.applications.length, new: 0, review: 0, ready: 0, done: 0 };
  for (const app of data.applications) counts[bucketOf(app.status)] += 1;

  const list = filter === "all" ? data.applications : data.applications.filter((app) => bucketOf(app.status) === filter);
  const app = data.applications.find((item) => item.id === openId) ?? null;

  const close = () => {
    setOpenId(null);
    setConfirming(false);
    setRevising(false);
  };

  const open = (id: string) => {
    setConfirming(false);
    setRevising(false);
    setOpenId(id);
  };

  const act = async (status: string) => {
    if (!app || busy) return;
    setBusy(true);
    try {
      await api.setApplicationStatus(app.id, status);
      await onRefresh();
      setConfirming(false);
      setRevising(false);
      notify(t("dean.updated"));
    } catch {
      notify(t("dean.error"));
    } finally {
      setBusy(false);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("dean.filterAll") },
    { key: "new", label: t("dean.statNew") },
    { key: "review", label: t("dean.statReview") },
    { key: "ready", label: t("dean.statReady") },
    { key: "done", label: t("dean.statDone") },
  ];

  const canReject = app !== null && (app.status === "submitted" || app.status === "in_review");
  const primary = app === null ? null
    : app.status === "submitted" ? { status: "in_review", label: t("dean.take") }
      : app.status === "in_review"
        ? (app.kind === "certificate" ? { status: "ready", label: t("dean.ready") } : { status: "approved", label: t("dean.approve") })
        : app.status === "ready" ? { status: "issued", label: t("dean.issue") }
          : null;

  const revisable = app !== null && ["ready", "issued", "approved", "rejected"].includes(app.status);
  const reviseOptions: { status: string; label: string }[] = app === null ? []
    : app.status === "rejected"
      ? [
        { status: "in_review", label: t("dean.reopen") },
        app.kind === "certificate"
          ? { status: "ready", label: t("dean.ready") }
          : { status: "approved", label: t("dean.approve") },
      ]
      : [
        { status: "in_review", label: t("dean.reopen") },
        { status: "rejected", label: t("dean.reject") },
      ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t("dean.eyebrow")}</p>
          <h1 className="h1">{t("dean.workspaceTitle")}</h1>
          <p className="muted small">{pick(data.dean.fullName)} · {pick(data.dean.title)}</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Seg
          value={tab}
          options={[
            { value: "requests", label: `${t("dean.tabRequests")} · ${counts.all}` },
            { value: "schedule", label: t("dean.tabSchedule") },
          ]}
          onChange={setTab}
          label={t("dean.workspaceSubtitle")}
        />
      </div>

      {tab === "schedule" ? <DeanSchedule /> : (
        <>
      <div className="staff-stats four">
        <div className="stat-tile"><b>{counts.new}</b><span>{t("dean.statNew")}</span></div>
        <div className="stat-tile"><b>{counts.review}</b><span>{t("dean.statReview")}</span></div>
        <div className="stat-tile"><b>{counts.ready}</b><span>{t("dean.statReady")}</span></div>
        <div className="stat-tile"><b>{counts.done}</b><span>{t("dean.statDone")}</span></div>
      </div>

      <div className="tabs-scroll" style={{ marginBottom: 14 }}>
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`filter-chip ${filter === item.key ? "active" : ""}`}
            onClick={() => setFilter(item.key)}
            aria-pressed={filter === item.key}
          >
            {item.label} <span className="count">{counts[item.key]}</span>
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="queue-list">
          {list.map((item) => (
            <button key={item.id} type="button" className="queue-row" onClick={() => open(item.id)}>
              <Avatar name={item.student ? pick(item.student.fullName) : "—"} hue={item.student ? hueOf(item.student.id) : 200} />
              <span className="queue-main">
                <span className="queue-title">{pick(item.title)}</span>
                <span className="queue-sub">
                  {item.student ? pick(item.student.fullName) : "—"}
                  {item.student ? ` · ${item.student.group}` : ""} · {item.reference}
                </span>
              </span>
              <span className="queue-side">
                <StatusPill status={item.status} label={pick(item.statusLabel)} />
                <span className="tiny muted">{relTime(item.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="card card-pad empty-state">
          <span className="icon-circle"><Inbox size={20} /></span>
          <p className="h3" style={{ margin: 0 }}>{t("dean.empty")}</p>
          <p className="small muted" style={{ margin: 0 }}>{t("dean.emptySub")}</p>
        </div>
      )}
        </>
      )}

      <Sheet
        open={app !== null}
        onClose={close}
        title={app ? pick(app.title) : ""}
        eyebrow={app ? `${app.kind === "certificate" ? t("documents.certificates") : t("documents.statements")} · ${app.reference}` : undefined}
        wide
        foot={app ? (
          <div className="stack-sm" style={{ width: "100%" }}>
            {confirming ? (
              <div className="stack-sm" style={{ border: "1px solid color-mix(in srgb, var(--site-coral) 30%, var(--site-border))", background: "var(--site-coral-soft)", borderRadius: 14, padding: 14 }}>
                <b style={{ fontSize: 13.5, color: "var(--site-coral)" }}>{t("dean.rejectTitle")}</b>
                <p className="small" style={{ color: "var(--site-coral)", lineHeight: 1.5 }}>{t("dean.rejectBody")}</p>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn btn-coral grow" disabled={busy} onClick={() => act("rejected")}>
                    {busy ? <Loader2 size={15} className="spin" /> : <X size={15} />} {t("dean.rejectYes")}
                  </button>
                  <button type="button" className="btn btn-ghost grow" disabled={busy} onClick={() => setConfirming(false)}>
                    {t("dean.keep")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {primary ? (
                  <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => act(primary.status)}>
                    {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                    {primary.label}
                  </button>
                ) : null}
                {canReject ? (
                  <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => setConfirming(true)}>
                    <X size={15} /> {t("dean.reject")}
                  </button>
                ) : null}
                {revisable ? (
                  revising ? (
                    <div className="stack-sm" style={{ border: "1px solid var(--site-border)", background: "var(--site-surface-2)", borderRadius: 14, padding: 14 }}>
                      <b style={{ fontSize: 13.5 }}>{t("dean.reviseTitle")}</b>
                      <p className="tiny muted" style={{ margin: 0, lineHeight: 1.5 }}>{t("dean.reviseHint")}</p>
                      {reviseOptions.map((option) => (
                        <button
                          key={option.status}
                          type="button"
                          className={`btn btn-block ${option.status === "rejected" ? "btn-coral" : "btn-ghost"}`}
                          disabled={busy}
                          onClick={() => (option.status === "rejected" ? setConfirming(true) : act(option.status))}
                        >
                          {option.status === "rejected" ? <X size={15} /> : <Check size={15} />}
                          {option.label}
                        </button>
                      ))}
                      <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => setRevising(false)}>
                        {t("dean.keep")}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => setRevising(true)}>
                      <PencilLine size={15} /> {t("dean.revise")}
                    </button>
                  )
                ) : null}
              </>
            )}
          </div>
        ) : undefined}
      >
        {app ? (
          <>
            <div className="dean-student">
              <Avatar name={app.student ? pick(app.student.fullName) : "—"} hue={app.student ? hueOf(app.student.id) : 200} size="lg" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="dean-student-name">{app.student ? pick(app.student.fullName) : "—"}</div>
                <div className="small muted">
                  {app.student ? `${app.student.group} · ${t("dean.year", { n: app.student.year })} · ${pick(app.student.program)}` : ""}
                </div>
                <div className="tiny muted">{app.student ? `${app.student.email} · ${app.student.login}` : ""}</div>
              </div>
              <StatusPill status={app.status} label={pick(app.statusLabel)} />
            </div>

            <div>
              <div className="info-row"><span>{t("dean.reference")}</span><b className="num">{app.reference}</b></div>
              <div className="info-row"><span>{t("dean.created")}</span><b>{date(new Date(app.createdAt), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</b></div>
              <div className="info-row"><span>{t("dean.copies")}</span><b>{app.copies}</b></div>
              <div className="info-row"><span>{t("dean.delivery")}</span><b>{app.delivery === "paper" ? t("dean.paper") : t("dean.digital")}</b></div>
              <div className="info-row"><span>{t("dean.urgency")}</span><b>{app.urgency === "urgent" ? t("dean.urgent") : t("dean.normal")}</b></div>
            </div>

            <div className={`dean-comment ${app.comment ? "" : "empty"}`}>
              <span className="eyebrow">{t("dean.comment")}</span>
              <p className="small" style={{ margin: 0 }}>{app.comment || t("dean.noComment")}</p>
            </div>

            <div>
              <div className="section-head" style={{ marginBottom: 10 }}>
                <h3 className="h3">{t("dean.timeline")}</h3>
              </div>
              <div className="stepper-timeline">
                {app.events.map((event) => {
                  const current = event.status === app.status;
                  return (
                    <div key={`${event.status}-${event.at}`} className={`step ${current ? "active" : "done"}`}>
                      <span className="step-dot">
                        {current
                          ? <span style={{ width: 7, height: 7, borderRadius: 99, background: "currentColor" }} />
                          : <Check size={13} strokeWidth={3} />}
                      </span>
                      <div>
                        <div className="step-title">{t(`status.${event.status}`)}</div>
                        <div className="step-time">{date(new Date(event.at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  );
}
