import {
  ArrowRight, ArrowRightLeft, CalendarDays, CalendarX2, Clock, FilePlus2, FileText, GraduationCap, MapPin, Plus,
  UserRound,
} from "lucide-react";
import type { Payload } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { durationLabel, greetingKey, minutesToClock, timeAgo } from "../lib/format";
import { CategoryIcon, Ring } from "../components/ui";

type Props = {
  data: Payload;
  now: Date;
  onNavigate: (route: "schedule" | "grades" | "documents" | "notifications") => void;
  onNewRequest: () => void;
};

export function HomeView({ data, now, onNavigate, onNewRequest }: Props) {
  const { t, pick, lang, date } = useI18n();
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const todayIndex = data.schedule.days.findIndex((day) => day.date === todayStr);
  const todayDay = data.schedule.days[todayIndex];
  const tomorrowDay = data.schedule.days[todayIndex + 1];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const classes = todayDay?.classes ?? [];
  const live = classes.find((item) => {
    const [sh, sm] = item.start.split(":").map(Number);
    const [eh, em] = item.end.split(":").map(Number);
    return nowMinutes >= sh * 60 + sm && nowMinutes < eh * 60 + em;
  });
  const upcoming = classes.find((item) => {
    const [sh, sm] = item.start.split(":").map(Number);
    return nowMinutes < sh * 60 + sm;
  });
  const hero = live ?? upcoming ?? null;
  const firstName = pick(data.profile.shortName).split(" ")[0];

  const deadlines = data.notifications
    .filter((item) => item.dueAt != null)
    .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""))
    .slice(0, 3);
  const news = data.notifications.filter((item) => item.category === "news" || item.category === "dean").slice(0, 4);

  const dayName = lang === "ru"
    ? new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(today)
    : new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(today);

  const liveProgress = live ? (() => {
    const [sh, sm] = live.start.split(":").map(Number);
    const [eh, em] = live.end.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return Math.min(100, Math.max(4, ((nowMinutes - start) / (end - start)) * 100));
  })() : 0;

  const creditsPct = data.profile.academic.creditsTotal
    ? Math.round((data.profile.academic.creditsEarned / data.profile.academic.creditsTotal) * 100)
    : 0;

  const changeTone = { cancelled: "coral", moved: "gold", added: "teal" } as const;
  const changeIcon = { cancelled: CalendarX2, moved: ArrowRightLeft, added: Plus } as const;
  const changeLabel = { cancelled: "schedule.cancelled", moved: "schedule.moved", added: "schedule.added" } as const;
  const upcomingChanges = data.schedule.upcomingChanges.slice(0, 4);

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <p className="eyebrow" style={{ textTransform: "capitalize" }}>{dayName}</p>
          <h1 className="h1" style={{ marginTop: 6 }}>{t(greetingKey(now.getHours()))}, {firstName}</h1>
          <p className="page-sub">{t("home.subtitle")}</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onNewRequest}>
            <FilePlus2 size={16} />
            <span className="long">{t("documents.new")}</span>
          </button>
        </div>
      </div>

      <div className="home-grid">
        <div className="home-col">
          <section className="hero" aria-label={t("nav.schedule")}>
            <div className="hero-top">
              <span className="hero-card-label">
                {live ? t("home.live") : upcoming ? t("home.next") : t("home.heroEmptyTitle")}
              </span>
              {hero ? (
                <span className="hero-time">
                  <Clock size={13} />
                  {hero.start}–{hero.end}
                </span>
              ) : null}
            </div>

            {hero ? (
              <div>
                <h2 className="hero-title">{pick(hero.title)}</h2>
                <div className="hero-meta">
                  <span><MapPin size={13} /> {hero.room} · {pick(hero.building)}</span>
                  <span><UserRound size={13} /> {pick(hero.teacher)}</span>
                  <span>{pick(hero.kindLabel)}</span>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="hero-title">{t("home.heroEmptyTitle")}</h2>
                <p style={{ color: "rgba(244,241,230,0.72)", fontSize: 13.5, marginTop: 10, lineHeight: 1.5 }}>
                  {tomorrowDay?.classes[0]
                    ? `${t("home.heroEmptyNext")}: ${pick(tomorrowDay.classes[0].title)} · ${tomorrowDay.classes[0].start}`
                    : t("home.heroEmptySub")}
                </p>
              </div>
            )}

            <div className="hero-foot">
              {live ? (
                <div className="grow">
                  <div className="row-between" style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 11.5, color: "rgba(244,241,230,0.7)" }}>
                      {t("home.through", { time: live.end })}
                    </span>
                    <span style={{ fontSize: 11.5, color: "rgba(244,241,230,0.9)", fontWeight: 650 }}>
                      {t("home.left", { time: durationLabel(minutesToClock(nowMinutes), live.end, lang) })}
                    </span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${liveProgress}%` }} /></div>
                </div>
              ) : upcoming ? (
                <span style={{ fontSize: 12.5, color: "rgba(244,241,230,0.72)" }}>
                  {lang === "ru"
                    ? `Начнётся через ${durationLabel(minutesToClock(nowMinutes), upcoming.start, lang)}`
                    : `Starts in ${durationLabel(minutesToClock(nowMinutes), upcoming.start, lang)}`}
                </span>
              ) : (
                <span style={{ fontSize: 12.5, color: "rgba(244,241,230,0.72)" }}>
                  {t("home.classesToday", { n: classes.length })}
                </span>
              )}
              <button type="button" className="hero-link" onClick={() => onNavigate("schedule")}>
                {t("home.openSchedule")}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>

          <div className="quick-grid">
            <button type="button" className="quick-tile" onClick={onNewRequest}>
              <span className="icon-circle"><FilePlus2 size={17} /></span>
              <span className="quick-label">{t("home.quickCertificate")}</span>
            </button>
            <button type="button" className="quick-tile" onClick={onNewRequest}>
              <span className="icon-circle violet"><FileText size={17} /></span>
              <span className="quick-label">{t("home.quickStatement")}</span>
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("schedule")}>
              <span className="icon-circle gold"><CalendarDays size={17} /></span>
              <span className="quick-label">{t("home.quickSchedule")}</span>
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("grades")}>
              <span className="icon-circle teal"><GraduationCap size={17} /></span>
              <span className="quick-label">{t("home.quickGrades")}</span>
            </button>
          </div>

          {upcomingChanges.length ? (
            <section className="card card-pad">
              <div className="section-head">
                <div>
                  <h2 className="h2">{t("home.changesTitle")}</h2>
                  <p className="tiny muted" style={{ margin: "2px 0 0" }}>{t("home.changesSub")}</p>
                </div>
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => onNavigate("schedule")}>
                  {t("common.all")}
                </button>
              </div>
              <div>
                {upcomingChanges.map((change) => {
                  const Icon = changeIcon[change.status];
                  return (
                    <button key={change.id} type="button" className="news-item" onClick={() => onNavigate("schedule")}>
                      <span className={`icon-circle sm ${changeTone[change.status]}`}><Icon size={16} /></span>
                      <span className="grow" style={{ textAlign: "left" }}>
                        <span className="news-meta" style={{ marginTop: 0 }}>
                          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: `var(--site-${changeTone[change.status]})` }}>
                            {t(changeLabel[change.status])}
                          </span>
                        </span>
                        <span className="news-title" style={{ display: "block" }}>{pick(change.title)}</span>
                        <span className="news-meta">
                          {date(new Date(`${change.date}T00:00:00`), { day: "numeric", month: "short" })} · {change.start}–{change.end} · {change.room}
                        </span>
                      </span>
                      <ArrowRight size={15} style={{ color: "var(--site-muted)", flex: "none" }} />
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="card card-pad">
            <div className="section-head">
              <h2 className="h2">{t("home.todayTitle")}</h2>
              <span className="tiny muted">{classes.length ? t("schedule.classesCount", { n: classes.length }) : t("home.freeDay")}</span>
            </div>
            {classes.length ? (
              <div className="timeline">
                {classes.map((item) => (
                  <button key={item.id} type="button" className="timeline-row" onClick={() => onNavigate("schedule")} style={{ background: "none", border: 0, width: "100%", textAlign: "left" }}>
                    <div className="tl-time">{item.start}<span>{item.end}</span></div>
                    <div className="tl-rail">
                      <span className={`tl-dot ${item.status === "cancelled" ? "coral" : item.status === "moved" ? "gold" : item.status === "added" ? "violet" : ""}`} />
                    </div>
                    <div className="tl-body" style={{ padding: "8px 10px", borderRadius: 12 }}>
                      <div className="tl-title">
                        {item.status === "cancelled" ? <s>{pick(item.title)}</s> : pick(item.title)}
                      </div>
                      <div className="tl-meta">
                        <span>{pick(item.kindLabel)}</span>
                        <span>{item.room}</span>
                        <span>{pick(item.teacher)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "18px 10px 12px" }}>
                <span className="icon-circle teal"><CalendarDays size={21} /></span>
                <div className="h3">{t("home.noMore")}</div>
                <p className="muted small" style={{ maxWidth: 320 }}>{t("schedule.emptyDaySub")}</p>
              </div>
            )}
          </section>
        </div>

        <div className="home-col right">
          <section className="card card-pad pulse-card">
            <div className="row-between">
              <div>
                <div className="eyebrow">{t("home.pulseTitle")}</div>
                <div className="h2" style={{ marginTop: 5, fontSize: 20 }}>{t("nav.grades")}</div>
              </div>
              <button type="button" className="icon-btn" onClick={() => onNavigate("grades")} aria-label={t("home.pulseDetails")}>
                <ArrowRight size={17} />
              </button>
            </div>
            <div className="row" style={{ gap: 18 }}>
              <Ring value={data.profile.academic.gpa ?? 0} max={5} size={112} stroke={9}>
                <span className="gpa-ring-value">{data.profile.academic.gpa?.toFixed(2) ?? "—"}</span>
                <span className="gpa-ring-label">{t("home.of5")}</span>
              </Ring>
              <div className="stack-sm grow">
                <div>
                  <div className="metric-row">
                    <span className="muted small">{t("home.credits")}</span>
                    <strong>{data.profile.academic.creditsEarned} / {data.profile.academic.creditsTotal}</strong>
                  </div>
                  <div className="meter" style={{ marginTop: 6 }}><span style={{ width: `${creditsPct}%` }} /></div>
                </div>
                <div className="metric-row" style={{ marginTop: 4 }}>
                  <span className="muted small">{t("home.rank")}</span>
                  <strong>
                    {`${data.profile.academic.rank.position} ${t("home.rankValue")} ${data.profile.academic.rank.total}`}
                  </strong>
                </div>
                <div className="metric-row">
                  <span className="muted small">{t("grades.current")}</span>
                  <strong>{t("grades.semester", { n: data.profile.academic.currentSemester })}</strong>
                </div>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => onNavigate("grades")}>
              {t("home.pulseDetails")}
              <ArrowRight size={14} />
            </button>
          </section>

          <section className="card card-pad">
            <div className="section-head">
              <h2 className="h2">{t("home.deadlinesTitle")}</h2>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => onNavigate("notifications")}>
                {t("common.all")}
              </button>
            </div>
            {deadlines.length ? (
              <div className="stack-sm">
                {deadlines.map((item) => {
                  const days = item.dueInDays ?? 0;
                  return (
                    <button key={item.id} type="button" className="deadline-item" onClick={() => onNavigate("notifications")}>
                      <span className={`deadline-days ${days <= 2 ? "urgent" : ""}`}>
                        {days <= 0 ? "0" : days}
                        <small>{lang === "ru" ? (days === 1 ? "день" : days < 5 ? "дня" : "дней") : (days === 1 ? "day" : "days")}</small>
                      </span>
                      <span className="grow" style={{ textAlign: "left" }}>
                        <span className="news-title" style={{ display: "block" }}>{pick(item.title)}</span>
                        <span className="news-meta">{t("notifications.due")} {date(new Date(item.dueAt ?? item.createdAt), { day: "numeric", month: "short" })}</span>
                      </span>
                      <ArrowRight size={15} style={{ color: "var(--site-muted)", flex: "none" }} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="muted small">{t("home.deadlinesEmpty")}</p>
            )}
          </section>

          <section className="card card-pad">
            <div className="section-head">
              <h2 className="h2">{t("home.newsTitle")}</h2>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => onNavigate("notifications")}>
                {t("home.newsAll")}
              </button>
            </div>
            <div>
              {news.map((item) => (
                <button key={item.id} type="button" className="news-item" onClick={() => onNavigate("notifications")}>
                  <CategoryIcon category={item.category} />
                  <span className="grow">
                    <span className="news-title" style={{ display: "block" }}>{pick(item.title)}</span>
                    <span className="news-meta">
                      <span>{t(`notifications.${item.category}`)}</span>
                      <span>·</span>
                      <span>{timeAgo(item.createdAt, lang)}</span>
                      {!item.read ? <span className="pill pill-accent" style={{ height: 18, padding: "0 6px", fontSize: 9.5 }}>{lang === "ru" ? "новое" : "new"}</span> : null}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
