import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, Loader2, Minus, Plus, Send, ArrowRight } from "lucide-react";
import type { Application, DocType } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { ApiError } from "../lib/api";
import { DocIcon, Sheet } from "./ui";

type Props = {
  open: boolean;
  catalog: DocType[];
  initialCode?: string | null;
  onClose: () => void;
  onSubmit: (body: { typeCode: string; copies: number; delivery: string; urgency: string; comment: string }) => Promise<Application>;
  onOpenCreated: (app: Application) => void;
};

export function NewRequestSheet({ open, catalog, initialCode, onClose, onSubmit, onOpenCreated }: Props) {
  const { t, pick, lang } = useI18n();
  const [phase, setPhase] = useState<"choose" | "details" | "success">("choose");
  const [code, setCode] = useState<string | null>(null);
  const [copies, setCopies] = useState(1);
  const [delivery, setDelivery] = useState("digital");
  const [urgency, setUrgency] = useState("normal");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Application | null>(null);

  useEffect(() => {
    if (!open) return;
    setCode(initialCode ?? null);
    setPhase(initialCode ? "details" : "choose");
    setCopies(1);
    setDelivery("digital");
    setUrgency("normal");
    setComment("");
    setError(null);
    setBusy(false);
    setCreated(null);
  }, [open, initialCode]);

  const type = useMemo(() => catalog.find((item) => item.code === code) ?? null, [catalog, code]);
  const certificates = catalog.filter((item) => item.kind === "certificate");
  const statements = catalog.filter((item) => item.kind === "statement");
  const commentRequired = type?.kind === "statement";
  const commentValid = !commentRequired || comment.trim().length >= 10;

  const start = (next: DocType) => {
    setCode(next.code);
    setError(null);
    setPhase("details");
  };

  const submit = async () => {
    if (!type || busy) return;
    if (!commentValid) {
      setError(t("new.commentRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const app = await onSubmit({
        typeCode: type.code,
        copies,
        delivery,
        urgency,
        comment: comment.trim(),
      });
      setCreated(app);
      setPhase("success");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "duplicate_request") setError(t("new.duplicate"));
        else if (err.code === "too_many_requests") setError(t("new.tooMany"));
        else if (err.code === "comment_required") setError(t("new.commentRequired"));
        else setError(t("new.error"));
      } else setError(t("new.error"));
    } finally {
      setBusy(false);
    }
  };

  const title = phase === "success" ? t("new.successTitle") : phase === "choose" ? t("new.title") : t("new.details");
  const copyLabel = copies === 1 ? t("new.copyForms", { n: copies }) : t("new.copyFormsPlural", { n: copies });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      eyebrow={phase === "choose" ? undefined : type ? pick(type.title) : undefined}
      foot={phase === "choose" ? undefined : phase === "details" ? (
        <>
          {!initialCode ? (
            <button type="button" className="btn btn-ghost" onClick={() => { setPhase("choose"); setError(null); }}>
              <ArrowLeft size={16} />
              {t("common.back")}
            </button>
          ) : null}
          <button type="button" className="btn btn-primary grow" onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            {busy ? t("new.submitting") : t("new.submit")}
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t("new.done")}</button>
          <button type="button" className="btn btn-primary grow" onClick={() => created && onOpenCreated(created)}>
            {t("new.openRequest")}
            <ArrowRight size={16} />
          </button>
        </>
      )}
    >
      {phase === "choose" ? (
        <div className="stack">
          <p className="muted small" style={{ marginTop: -4 }}>{t("new.choose")}</p>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t("documents.certificates")}</div>
            <div className="stack-sm">
              {certificates.map((item) => (
                <button key={item.code} type="button" className="option-card" onClick={() => start(item)}>
                  <span className="icon-circle sm"><DocIcon name={item.icon} size={17} /></span>
                  <span className="grow">
                    <span style={{ display: "block", fontWeight: 650, fontSize: 13.5 }}>{pick(item.title)}</span>
                    <span className="tiny muted">{pick(item.eta)}</span>
                  </span>
                  <ArrowRight size={16} style={{ color: "var(--site-muted)", flex: "none" }} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t("documents.statements")}</div>
            <div className="stack-sm">
              {statements.map((item) => (
                <button key={item.code} type="button" className="option-card" onClick={() => start(item)}>
                  <span className="icon-circle sm violet"><DocIcon name={item.icon} size={17} /></span>
                  <span className="grow">
                    <span style={{ display: "block", fontWeight: 650, fontSize: 13.5 }}>{pick(item.title)}</span>
                    <span className="tiny muted">{pick(item.eta)}</span>
                  </span>
                  <ArrowRight size={16} style={{ color: "var(--site-muted)", flex: "none" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {phase === "details" && type ? (
        <div className="stack">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span className={`icon-circle ${type.kind === "statement" ? "violet" : ""}`}><DocIcon name={type.icon} size={20} /></span>
            <div className="grow">
              <div style={{ fontWeight: 650 }}>{pick(type.title)}</div>
              <p className="tiny muted" style={{ lineHeight: 1.5, marginTop: 3 }}>{pick(type.description)}</p>
            </div>
          </div>

          {type.fields.includes("copies") ? (
            <div className="row-between">
              <span className="small" style={{ fontWeight: 600 }}>{t("new.copies")}</span>
              <span className="stepper">
                <button type="button" onClick={() => setCopies((value) => Math.max(1, value - 1))} aria-label="-"><Minus size={15} /></button>
                <b>{copies}</b>
                <button type="button" onClick={() => setCopies((value) => Math.min(5, value + 1))} aria-label="+"><Plus size={15} /></button>
              </span>
            </div>
          ) : null}

          {type.fields.includes("delivery") ? (
            <div className="stack-sm">
              <span className="small" style={{ fontWeight: 600 }}>{t("new.delivery")}</span>
              <button type="button" className={`option-card ${delivery === "digital" ? "selected" : ""}`} onClick={() => setDelivery("digital")}>
                <span className="icon-circle sm"><DocIcon name="scroll" size={16} /></span>
                <span className="grow">
                  <span style={{ display: "block", fontWeight: 650, fontSize: 13.5 }}>{t("new.digital")}</span>
                  <span className="tiny muted">{t("new.digitalHint")}</span>
                </span>
                {delivery === "digital" ? <Check size={17} className="tick" /> : null}
              </button>
              <button type="button" className={`option-card ${delivery === "paper" ? "selected" : ""}`} onClick={() => setDelivery("paper")}>
                <span className="icon-circle sm gold"><DocIcon name="file-badge" size={16} /></span>
                <span className="grow">
                  <span style={{ display: "block", fontWeight: 650, fontSize: 13.5 }}>{t("new.paper")}</span>
                  <span className="tiny muted">{t("new.paperHint")}</span>
                </span>
                {delivery === "paper" ? <Check size={17} className="tick" /> : null}
              </button>
            </div>
          ) : null}

          {type.fields.includes("urgency") ? (
            <div className="stack-sm">
              <span className="small" style={{ fontWeight: 600 }}>{t("new.urgency")}</span>
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className={`option-card ${urgency === "normal" ? "selected" : ""}`} onClick={() => setUrgency("normal")}>
                  <span className="grow" style={{ fontWeight: 650, fontSize: 13 }}>{t("new.normal")}</span>
                  {urgency === "normal" ? <Check size={16} className="tick" /> : null}
                </button>
                <button type="button" className={`option-card ${urgency === "urgent" ? "selected" : ""}`} onClick={() => setUrgency("urgent")}>
                  <span className="grow" style={{ fontWeight: 650, fontSize: 13 }}>{t("new.urgent")}</span>
                  {urgency === "urgent" ? <Check size={16} className="tick" /> : null}
                </button>
              </div>
              <p className="tiny muted">{t("new.urgentHint")}</p>
            </div>
          ) : null}

          {type.fields.includes("comment") ? (
            <div className="field">
              <label htmlFor="comment">{t("new.comment")}{commentRequired ? " *" : ""}</label>
              <textarea
                id="comment"
                className="input"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t("new.commentPlaceholder")}
                maxLength={1000}
              />
              <span className="tiny muted" style={{ textAlign: "right" }}>{comment.length}/1000</span>
            </div>
          ) : null}

          <div style={{ borderTop: "1px solid var(--site-border)", paddingTop: 10 }}>
            <div className="summary-line"><span>{t("new.summaryType")}</span><b>{pick(type.title)}</b></div>
            {type.fields.includes("copies") ? <div className="summary-line"><span>{t("new.summaryCopies")}</span><b>{copyLabel}</b></div> : null}
            {type.fields.includes("delivery") ? <div className="summary-line"><span>{t("new.summaryDelivery")}</span><b>{delivery === "paper" ? t("new.paper") : t("new.digital")}</b></div> : null}
            {type.fields.includes("urgency") ? <div className="summary-line"><span>{t("new.summaryUrgency")}</span><b>{urgency === "urgent" ? t("new.urgent") : t("new.normal")}</b></div> : null}
            <div className="summary-line"><span>{t("new.summaryEta")}</span><b><Clock size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{pick(type.eta)}</b></div>
          </div>

          {error ? <div className="form-error" role="alert">{error}</div> : null}
          <p className="tiny muted">{t("new.demoNote")}</p>
        </div>
      ) : null}

      {phase === "success" && created ? (
        <div className="stack">
          <div className="success-state">
            <span className="success-badge"><CheckCircle2 size={32} /></span>
            <h3 className="h2">{t("new.successTitle")}</h3>
            <p className="muted small" style={{ maxWidth: 360 }}>{t("new.successSub")}</p>
            <span className="ref-code">{created.reference}</span>
            <span className="pill pill-gold"><Clock size={12} /> {pick(created.eta)}</span>
          </div>
          <div className="summary-line"><span>{t("new.summaryType")}</span><b>{pick(created.title)}</b></div>
          <div className="summary-line"><span>{t("detail.created")}</span><b>{new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(created.createdAt))}</b></div>
        </div>
      ) : null}
    </Sheet>
  );
}
