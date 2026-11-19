import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Download, FileCheck2, Loader2, MapPin, Printer, X } from "lucide-react";
import type { Application, ApplicationStatus, L, Profile } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { DocIcon, Sheet, StatusPill } from "./ui";
import { downloadDocPng, printDoc, type PrintDoc } from "../lib/document";

const CERT_SEQUENCE: ApplicationStatus[] = ["submitted", "in_review", "ready", "issued"];
const STMT_SEQUENCE: ApplicationStatus[] = ["submitted", "in_review", "approved"];

function useApplicationDoc(app: Application | null, profile: Profile, university: L) {
  const { t, pick, lang, date } = useI18n();
  return useMemo<PrintDoc | null>(() => {
    if (!app) return null;
    const isCert = app.kind === "certificate";
    const issued = app.status === "issued" ? app.updatedAt : app.createdAt;
    const purpose = app.comment ? ` ${t("detail.comment")}: ${app.comment}` : "";
    return {
      lang,
      university: pick(university),
      title: isCert ? (lang === "ru" ? "СПРАВКА" : "CERTIFICATE") : (lang === "ru" ? "ЗАЯВЛЕНИЕ" : "STATEMENT"),
      subtitle: pick(app.title),
      ref: app.reference,
      dateText: date(new Date(issued), { day: "numeric", month: "long", year: "numeric" }),
      paragraphs: isCert
        ? [
            `__NAME__${pick(profile.fullName)}`,
            lang === "ru"
              ? `Настоящая справка подтверждает, что студент(ка) обучается на ${profile.year} курсе ${pick(profile.faculty)} по программе «${pick(profile.program)}», группа ${profile.group}, форма обучения — ${pick(profile.studyForm).toLowerCase()}.`
              : `This certificate confirms that the student is enrolled in year ${profile.year} at the ${pick(profile.faculty)}, programme ${pick(profile.program)}, group ${profile.group}, ${pick(profile.studyForm).toLowerCase()}.`,
            lang === "ru"
              ? `Справка выдана для предъявления по месту требования.${purpose}`
              : `Issued for presentation at the place of request.${purpose}`,
          ]
        : [
            `__NAME__${pick(profile.fullName)}`,
            lang === "ru"
              ? `Прошу рассмотреть моё заявление: ${pick(app.title).toLowerCase()}. Студент(ка) ${profile.year} курса, группа ${profile.group}, ${pick(profile.faculty)}.`
              : `Please review my request: ${pick(app.title).toLowerCase()}. Year ${profile.year} student, group ${profile.group}, ${pick(profile.faculty)}.`,
            app.comment || (lang === "ru" ? "Обоснование приложено в электронном виде." : "Supporting details are attached electronically."),
          ],
      meta: [
        { label: lang === "ru" ? "Копии" : "Copies", value: String(app.copies) },
        { label: lang === "ru" ? "Получение" : "Delivery", value: app.delivery === "paper" ? t("new.paper") : t("new.digital") },
        { label: lang === "ru" ? "Статус" : "Status", value: t(`status.${app.status}`) },
      ],
      qrValue: `ATLAS:VERIFY:${app.reference}`,
      signer: pick(profile.curator),
      signerRole: lang === "ru" ? "Куратор образовательной программы" : "Programme curator",
      verify: lang === "ru" ? "Проверка подлинности документа по QR-коду" : "Verify this document via the QR code",
      footer: lang === "ru"
        ? `Сформировано в Atlas · ${pick(university)} · ${app.reference}`
        : `Generated in Atlas · ${pick(university)} · ${app.reference}`,
      fileBase: `atlas-${app.reference}`,
    };
  }, [app, date, lang, pick, profile, t, university]);
}

function Timeline({ app }: { app: Application }) {
  const { t, lang, date } = useI18n();
  const seq = app.kind === "certificate" ? CERT_SEQUENCE : STMT_SEQUENCE;
  const eventTimes = new Map(app.events.map((event) => [event.status, event.at]));
  const terminal = app.status === "issued" || app.status === "approved" || app.status === "cancelled" || app.status === "rejected";

  let steps: { status: ApplicationStatus; at: string | null; state: "done" | "active" | "pending" }[];
  if (app.status === "cancelled" || app.status === "rejected") {
    steps = app.events.map((event, index) => ({
      status: event.status,
      at: event.at,
      state: index === app.events.length - 1 ? "active" : "done",
    }));
  } else {
    const index = Math.max(0, seq.indexOf(app.status));
    steps = seq.slice(0, index + 1).map((status, position) => ({
      status,
      at: eventTimes.get(status) ?? null,
      state: position < index || (position === index && app.status === "issued") ? "done" : "active",
    }));
    const next = seq[index + 1];
    if (next && !terminal) steps.push({ status: next, at: null, state: "pending" });
  }

  return (
    <div className="stepper-timeline">
      {steps.map((step, index) => (
        <div key={`${step.status}-${index}`} className={`step ${step.state === "done" ? "done" : ""} ${step.state === "active" && !terminal ? "active" : ""}`}>
          <span className="step-dot">
            {step.state === "done" ? <Check size={13} strokeWidth={3} /> : step.state === "active" ? <span style={{ width: 7, height: 7, borderRadius: 99, background: "currentColor" }} /> : null}
          </span>
          <div>
            <div className="step-title">{t(`status.${step.status}`)}</div>
            <div className="step-time">
              {step.at
                ? `${date(new Date(step.at), { day: "numeric", month: "short" })}, ${new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(step.at))}`
                : t(`statusHint.${step.status}`)}
            </div>
            {step.at ? <div className="step-time" style={{ marginTop: 1 }}>{t(`statusHint.${step.status}`)}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ApplicationSheet({
  app, profile, university, open, onClose, onCancel, onCollect, busy,
}: {
  app: Application | null;
  profile: Profile;
  university: L;
  open: boolean;
  onClose: () => void;
  onCancel: (app: Application) => Promise<void>;
  onCollect: (app: Application) => Promise<void>;
  busy: boolean;
}) {
  const { t, pick, lang, date } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const doc = useApplicationDoc(app, profile, university);

  useEffect(() => { setConfirming(false); }, [app?.id]);

  if (!app) return null;
  const deliverable = app.kind === "certificate" && (app.status === "ready" || app.status === "issued");
  const done = app.status === "issued" || app.status === "approved" || app.status === "cancelled" || app.status === "rejected";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={pick(app.title)}
      eyebrow={t("detail.title")}
      foot={confirming ? (
        <>
          <button type="button" className="btn btn-ghost grow" onClick={() => setConfirming(false)}>{t("detail.keep")}</button>
          <button type="button" className="btn btn-coral grow" onClick={() => onCancel(app)} disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : <X size={15} />}
            {t("detail.cancelConfirm")}
          </button>
        </>
      ) : app.canCancel || app.canCollect || (deliverable && doc) ? (
        <>
          {app.canCancel ? (
            <button type="button" className="btn btn-ghost" style={{ color: "var(--site-coral)" }} onClick={() => setConfirming(true)}>
              {t("detail.cancel")}
            </button>
          ) : null}
          {deliverable && doc ? (
            <button type="button" className="btn btn-ghost" onClick={() => printDoc(doc)} aria-label={t("detail.print")}>
              <Printer size={16} />
            </button>
          ) : null}
          {deliverable && doc && app.delivery === "digital" ? (
            <button type="button" className="btn btn-primary grow" onClick={() => downloadDocPng(doc)}>
              <Download size={16} />
              {t("detail.download")}
            </button>
          ) : null}
          {app.canCollect ? (
            <button
              type="button"
              className={`btn grow ${app.delivery === "paper" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => onCollect(app)}
              disabled={busy}
            >
              {busy ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
              {t("detail.collect")}
            </button>
          ) : null}
        </>
      ) : undefined}
    >
      <div className="row" style={{ alignItems: "flex-start" }}>
        <span className={`icon-circle ${app.kind === "statement" ? "violet" : ""}`}><DocIcon name={app.icon} size={20} /></span>
        <div className="grow">
          <div className="row wrap" style={{ gap: 8 }}>
            <StatusPill status={app.status} label={t(`status.${app.status}`)} />
            <span className="pill">{app.reference}</span>
            {app.urgency === "urgent" ? <span className="pill pill-coral">{t("documents.urgent")}</span> : null}
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>{t(`statusHint.${app.status}`)}</p>
        </div>
      </div>

      <div className="app-steps" aria-hidden>
        {Array.from({ length: 4 }).map((_, index) => {
          const filled =
            app.status === "cancelled" || app.status === "rejected"
              ? index === 0
              : app.status === "submitted" ? index < 1
                : app.status === "in_review" ? index < 2
                  : index < 4;
          return <i key={index} className={filled ? "on" : ""} />;
        })}
      </div>

      {app.status === "ready" && app.delivery === "digital" ? (
        <div className="class-note" style={{ background: "var(--site-accent-soft)", color: "var(--site-accent)", borderRadius: 12, padding: "10px 12px" }}>
          <FileCheck2 size={15} style={{ flex: "none" }} />
          <span>{t("detail.readyHint")}</span>
        </div>
      ) : null}
      {app.status === "ready" && app.delivery === "paper" ? (
        <div className="class-note" style={{ background: "var(--site-gold-soft)", color: "var(--site-gold)", borderRadius: 12, padding: "10px 12px" }}>
          <MapPin size={15} style={{ flex: "none" }} />
          <span>{t("detail.paperHint")}</span>
        </div>
      ) : null}
      {app.status === "issued" ? (
        <div className="class-note" style={{ background: "var(--site-accent-soft)", color: "var(--site-accent)", borderRadius: 12, padding: "10px 12px" }}>
          <Check size={15} style={{ flex: "none" }} />
          <span>{t("detail.issuedHint")}</span>
        </div>
      ) : null}
      {app.status === "approved" ? (
        <div className="class-note" style={{ background: "var(--site-accent-soft)", color: "var(--site-accent)", borderRadius: 12, padding: "10px 12px" }}>
          <FileCheck2 size={15} style={{ flex: "none" }} />
          <span>{lang === "ru" ? "Заявление одобрено деканатом. Решение доступно в разделе «Уведомления»." : "The dean’s office approved your statement. The decision is available in Updates."}</span>
        </div>
      ) : null}

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{t("detail.timeline")}</div>
        <Timeline app={app} />
      </div>

      <div>
        <div className="info-row"><span>{t("detail.reference")}</span><b className="num">{app.reference}</b></div>
        <div className="info-row"><span>{t("detail.created")}</span><b>{date(new Date(app.createdAt), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</b></div>
        <div className="info-row"><span>{t("detail.copies")}</span><b>{app.copies}</b></div>
        <div className="info-row"><span>{t("detail.delivery")}</span><b>{app.delivery === "paper" ? t("new.paper") : t("new.digital")}</b></div>
        <div className="info-row"><span>{t("detail.eta")}</span><b><Clock size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{pick(app.eta)}</b></div>
        {app.comment ? <div className="info-row"><span>{t("detail.comment")}</span><b style={{ maxWidth: "62%" }}>{app.comment}</b></div> : null}
      </div>

      {confirming ? (
        <div className="stack-sm" style={{ border: "1px solid color-mix(in srgb, var(--site-coral) 30%, var(--site-border))", background: "var(--site-coral-soft)", borderRadius: 14, padding: 14 }}>
          <b style={{ fontSize: 13.5, color: "var(--site-coral)" }}>{t("detail.cancelTitle")}</b>
          <p className="small" style={{ color: "var(--site-coral)", lineHeight: 1.5 }}>{t("detail.cancelBody")}</p>
        </div>
      ) : null}

      {done && app.status === "issued" ? (
        <p className="tiny muted" style={{ textAlign: "center" }}>{t("new.demoNote")}</p>
      ) : null}
    </Sheet>
  );
}
