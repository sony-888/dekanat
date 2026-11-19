import { useState } from "react";
import { ArrowRight, ChevronRight, Clock, FilePlus2, Inbox, MapPin } from "lucide-react";
import type { Application, ApplicationStatus, DocType, Payload } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { DocIcon, StatusPill } from "../components/ui";

function activeStep(status: ApplicationStatus): number {
  if (status === "submitted") return 1;
  if (status === "in_review") return 2;
  if (status === "ready" || status === "approved") return 3;
  if (status === "issued") return 4;
  return 0;
}

export function DocumentsView({
  data, onNewRequest, onOpenApp,
}: {
  data: Payload;
  onNewRequest: (code?: string) => void;
  onOpenApp: (app: Application) => void;
}) {
  const { t, pick, lang, date } = useI18n();
  const [filter, setFilter] = useState<"all" | "active" | "ready">("all");
  const apps = data.applications;
  const active = apps.filter((app) => app.status === "submitted" || app.status === "in_review");
  const ready = apps.filter((app) => app.status === "ready" || app.status === "approved" || app.status === "issued");
  const filtered = filter === "active" ? active : filter === "ready" ? ready : apps;

  const certificates = data.catalog.filter((item) => item.kind === "certificate");
  const statements = data.catalog.filter((item) => item.kind === "statement");

  return (
    <div className="page-enter stack">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="eyebrow">{t("nav.documents")}</p>
          <h1 className="h1" style={{ marginTop: 6 }}>{t("documents.title")}</h1>
          <p className="page-sub">{t("documents.subtitle")}</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => onNewRequest()}>
            <FilePlus2 size={16} />
            <span className="long">{t("documents.new")}</span>
          </button>
        </div>
      </div>

      <section className="card card-pad">
        <div className="section-head" style={{ flexWrap: "wrap" }}>
          <h2 className="h2">{t("documents.myRequests")}</h2>
          <div className="tabs-scroll" role="tablist" aria-label={t("documents.myRequests")}>
            <button type="button" role="tab" aria-selected={filter === "all"} className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              {t("documents.filters.all")} <span className="count">{apps.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={filter === "active"} className={`filter-chip ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>
              {t("documents.filters.active")} <span className="count">{active.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={filter === "ready"} className={`filter-chip ${filter === "ready" ? "active" : ""}`} onClick={() => setFilter("ready")}>
              {t("documents.filters.ready")} <span className="count">{ready.length}</span>
            </button>
          </div>
        </div>

        {filtered.length ? (
          <div className="stack-sm">
            {filtered.map((app) => (
              <button key={app.id} type="button" className="app-row" onClick={() => onOpenApp(app)}>
                <span className={`icon-circle ${app.kind === "statement" ? "violet" : ""}`}>
                  <DocIcon name={app.icon} size={19} />
                </span>
                <span className="grow">
                  <span className="row-between" style={{ gap: 8 }}>
                    <span className="app-title">{pick(app.title)}</span>
                    <StatusPill status={app.status} label={t(`status.${app.status}`)} />
                  </span>
                  <span className="app-meta">
                    <span className="num">{app.reference}</span>
                    <span>{date(new Date(app.createdAt), { day: "numeric", month: "short" })}</span>
                    <span>{app.copies} {lang === "ru" ? "экз." : app.copies === 1 ? "copy" : "copies"}</span>
                  </span>
                  {app.status !== "cancelled" && app.status !== "rejected" ? (
                    <span className="app-steps" aria-hidden>
                      {Array.from({ length: 4 }).map((_, index) => <i key={index} className={index < activeStep(app.status) ? "on" : ""} />)}
                    </span>
                  ) : null}
                </span>
                <ChevronRight size={17} style={{ color: "var(--site-muted)", flex: "none" }} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="icon-circle teal"><Inbox size={22} /></span>
            <div className="h3">{t("documents.empty")}</div>
            <p className="muted small" style={{ maxWidth: 340 }}>{t("documents.emptySub")}</p>
          </div>
        )}
      </section>

      <section>
        <div className="section-head">
          <div>
            <h2 className="h2">{t("documents.catalog")}</h2>
            <p className="page-sub" style={{ marginTop: 4 }}>{t("documents.catalogSub")}</p>
          </div>
        </div>
        <p className="tiny muted" style={{ display: "flex", gap: 5, alignItems: "center", marginTop: -6, marginBottom: 12, flexWrap: "wrap" }}>
          <MapPin size={12} /> {t("documents.office")}
        </p>

        <div className="eyebrow" style={{ margin: "4px 0 8px" }}>{t("documents.certificates")}</div>
        <div className="catalog-grid">
          {certificates.map((item) => <CatalogTile key={item.code} item={item} onPick={onNewRequest} />)}
        </div>

        <div className="eyebrow" style={{ margin: "18px 0 8px" }}>{t("documents.statements")}</div>
        <div className="catalog-grid">
          {statements.map((item) => <CatalogTile key={item.code} item={item} onPick={onNewRequest} />)}
        </div>
      </section>
    </div>
  );
}

function CatalogTile({ item, onPick }: { item: DocType; onPick: (code: string) => void }) {
  const { t, pick } = useI18n();
  return (
    <button type="button" className="doc-tile" onClick={() => onPick(item.code)}>
      <div className="row-between" style={{ alignItems: "flex-start" }}>
        <span className={`icon-circle ${item.kind === "statement" ? "violet" : ""}`}>
          <DocIcon name={item.icon} size={19} />
        </span>
        {item.popular ? <span className="pill pill-accent" style={{ height: 21, fontSize: 10 }}>{t("documents.popular")}</span> : null}
      </div>
      <div>
        <div style={{ fontWeight: 650, fontSize: 14, lineHeight: 1.3 }}>{pick(item.title)}</div>
        <p className="doc-desc" style={{ marginTop: 5 }}>{pick(item.description)}</p>
      </div>
      <div className="row-between">
        <span className="doc-eta"><Clock size={12} /> {pick(item.eta)}</span>
        <span className="doc-go">{t("documents.order")} <ArrowRight size={13} /></span>
      </div>
    </button>
  );
}
