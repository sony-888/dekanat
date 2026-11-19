import { useMemo, useState } from "react";
import { CheckCircle2, Download, GraduationCap, Printer, Trophy } from "lucide-react";
import type { Course, Payload } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { Ring } from "../components/ui";
import { downloadDocPng, printDoc, type PrintDoc } from "../lib/document";

function GradeBadge({ course }: { course: Course }) {
  const { pick, lang } = useI18n();
  if (course.grade != null) {
    const short = course.grade === 5 ? (lang === "ru" ? "отл" : "exc") : course.grade === 4 ? (lang === "ru" ? "хор" : "good") : (lang === "ru" ? "удовл" : "sat");
    return (
      <span className={`grade-badge g${course.grade}`} title={pick(course.gradeLabel)}>
        {course.grade}
        <small>{short}</small>
      </span>
    );
  }
  if (course.passed === true) {
    return <span className="grade-badge g5" title={pick(course.gradeLabel)}>✓<small>{lang === "ru" ? "зачёт" : "pass"}</small></span>;
  }
  if (course.passed === false) {
    return <span className="grade-badge g2" title={pick(course.gradeLabel)}>✕<small>{lang === "ru" ? "незач" : "fail"}</small></span>;
  }
  return <span className="grade-badge pending">···</span>;
}

export function GradesView({ data }: { data: Payload }) {
  const { t, pick, lang, date } = useI18n();
  const grades = data.grades;
  const [semester, setSemester] = useState(grades.currentSemester);

  const current = grades.semesters.find((item) => item.number === semester) ?? grades.semesters[0];
  const dist = grades.distribution;
  const scored = dist.five + dist.four + dist.three + dist.two;
  const pointValues = grades.semesters
    .flatMap((item) => item.courses)
    .map((course) => course.points)
    .filter((value): value is number => value != null);
  const avgPoints = pointValues.length
    ? Math.round(pointValues.reduce((sum, value) => sum + value, 0) / pointValues.length)
    : null;

  const sessionDoc = useMemo<PrintDoc | null>(() => {
    if (!grades.session) return null;
    const session = grades.session;
    const p = data.profile;
    return {
      lang,
      university: pick(data.university.name),
      title: lang === "ru" ? "СЕРТИФИКАТ" : "CERTIFICATE",
      subtitle: lang === "ru" ? `об успеваемости · ${session.period.ru}` : `academic results · ${session.period.en}`,
      ref: `ATL-SES-${p.studentCard.replace(/[^A-Za-z0-9]/g, "")}`,
      dateText: date(new Date(), { day: "numeric", month: "long", year: "numeric" }),
      paragraphs: [
        `__NAME__${pick(p.fullName)}`,
        lang === "ru"
          ? `Подтверждается, что студент(ка) обучается на ${p.year} курсе ${pick(p.faculty)}, группа ${p.group}, и успешно прошёл(ла) промежуточную аттестацию за ${session.period.ru}.`
          : `This confirms that the student is enrolled in year ${p.year} at the ${pick(p.faculty)}, group ${p.group}, and has completed the assessment period of ${session.period.en}.`,
        lang === "ru"
          ? `Средний балл — ${session.average?.toFixed(2) ?? "—"} из 5,0. Зачтено дисциплин: ${session.passed} из ${session.total}.`
          : `Grade point average — ${session.average?.toFixed(2) ?? "—"} out of 5.0. Passed courses: ${session.passed} of ${session.total}.`,
      ],
      table: {
        head: [lang === "ru" ? "Дисциплина" : "Course", lang === "ru" ? "Кредиты" : "Credits", lang === "ru" ? "Оценка" : "Grade"],
        rows: session.results.map((course) => [pick(course.title), String(course.credits), pick(course.gradeLabel)]),
      },
      meta: [
        { label: lang === "ru" ? "Средний балл" : "Average", value: session.average?.toFixed(2) ?? "—" },
        { label: lang === "ru" ? "Зачтено" : "Passed", value: `${session.passed}/${session.total}` },
        { label: lang === "ru" ? "Рейтинг" : "Rank", value: `${session.rank.position}/${session.rank.total}` },
      ],
      qrValue: `ATLAS:VERIFY:SESSION:${p.studentCard}:${session.semester}`,
      signer: pick(p.curator),
      signerRole: lang === "ru" ? "Куратор образовательной программы" : "Programme curator",
      verify: lang === "ru" ? "Проверка подлинности документа по QR-коду" : "Verify this document via the QR code",
      footer: lang === "ru"
        ? `Сформировано автоматически в Atlas · ${pick(data.university.name)} · ${date(new Date(), { day: "numeric", month: "long", year: "numeric" })}`
        : `Generated automatically in Atlas · ${pick(data.university.name)}`,
      fileBase: `atlas-session-${session.semester}-${p.studentCard}`,
    };
  }, [data, date, grades.session, lang, pick]);

  return (
    <div className="page-enter stack">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="eyebrow">{t("nav.grades")}</p>
          <h1 className="h1" style={{ marginTop: 6 }}>{t("grades.title")}</h1>
          <p className="page-sub">{t("grades.subtitle")}</p>
        </div>
        {sessionDoc ? (
          <div className="page-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => printDoc(sessionDoc)} aria-label={t("detail.print")}>
              <Printer size={15} />
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => downloadDocPng(sessionDoc)}>
              <Download size={15} />
              <span className="long">{t("grades.sessionCert")}</span>
            </button>
          </div>
        ) : null}
      </div>

      <section className="card card-pad">
        <div className="grade-hero">
          <Ring value={grades.gpa ?? 0} max={5} size={128} stroke={10}>
            <span className="gpa-ring-value" style={{ fontSize: 36 }}>{grades.gpa?.toFixed(2) ?? "—"}</span>
            <span className="gpa-ring-label">{t("home.of5")}</span>
          </Ring>
          <div className="stack-sm">
            <div>
              <div className="eyebrow">{t("grades.gpa")}</div>
              <div className="row-between" style={{ marginTop: 4 }}>
                <span className="h2" style={{ fontSize: 19 }}>{t("grades.distribution")}</span>
                <span className="tiny muted">{scored} {lang === "ru" ? "оценок" : "grades"}</span>
              </div>
            </div>
            <div className="dist" aria-hidden>
              {dist.five ? <span style={{ width: `${(dist.five / Math.max(1, scored)) * 100}%`, background: "var(--site-accent)" }} /> : null}
              {dist.four ? <span style={{ width: `${(dist.four / Math.max(1, scored)) * 100}%`, background: "var(--site-teal)" }} /> : null}
              {dist.three ? <span style={{ width: `${(dist.three / Math.max(1, scored)) * 100}%`, background: "var(--site-gold)" }} /> : null}
              {dist.two ? <span style={{ width: `${(dist.two / Math.max(1, scored)) * 100}%`, background: "var(--site-coral)" }} /> : null}
            </div>
            <div className="row wrap" style={{ gap: 6 }}>
              <span className="pill pill-accent">{t("grades.excellent")} · {dist.five}</span>
              <span className="pill pill-teal">{t("grades.good")} · {dist.four}</span>
              <span className="pill pill-gold">{t("grades.satisfactory")} · {dist.three}</span>
              <span className="pill pill-violet">{t("grades.pass")} · {dist.pass}</span>
              {dist.fail ? <span className="pill pill-coral">{t("grades.failed")} · {dist.fail}</span> : null}
            </div>
            <div className="row" style={{ gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              <div className="stat-tile grow">
                <b>{grades.creditsEarned}</b>
                <span>{t("grades.credits")} · {t("grades.earnedOf", { a: grades.creditsEarned, b: grades.creditsTotal })}</span>
              </div>
              <div className="stat-tile grow">
                <b><Trophy size={17} style={{ display: "inline", verticalAlign: -1, marginRight: 5, color: "var(--site-gold)" }} />{grades.rank.position}</b>
                <span>{t("grades.rank")} · {t("grades.placeShort", { pos: grades.rank.position, total: grades.rank.total })}</span>
              </div>
              {avgPoints != null ? (
                <div className="stat-tile grow">
                  <b>{avgPoints}</b>
                  <span>{t("grades.pointsAvg")}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {grades.session ? (
        <section className="card card-pad">
          <div className="section-head">
            <div>
              <h2 className="h2">{t("grades.session")}</h2>
              <p className="page-sub" style={{ marginTop: 4 }}>{t("grades.sessionSub", { n: grades.session.semester, period: pick(grades.session.period) })}</p>
            </div>
            <span className="pill pill-accent"><CheckCircle2 size={13} /> {grades.session.passed} {t("grades.passed")}</span>
          </div>
          <div className="session-grid" style={{ marginBottom: 14 }}>
            <div className="stat-tile"><b>{grades.session.average?.toFixed(2) ?? "—"}</b><span>{t("grades.avg")}</span></div>
            <div className="stat-tile"><b>{grades.session.passed}</b><span>{t("grades.passed")}</span></div>
            <div className="stat-tile"><b>{grades.session.failed}</b><span>{t("grades.failed")}</span></div>
            <div className="stat-tile"><b>{grades.session.rank.position}</b><span>{t("grades.rank")}</span></div>
          </div>
          <div>
            {grades.session.results.map((course) => (
              <div key={course.code} className="course-row">
                <div className="grow">
                  <div className="course-title">{pick(course.title)}</div>
                  <div className="course-meta">
                    <span>{course.credits} {t("grades.creditsShort")}</span>
                    <span>{pick(course.assessmentLabel)}</span>
                    {course.points != null ? <span>{t("grades.points")}: {course.points}</span> : null}
                  </div>
                </div>
                <GradeBadge course={course} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="home-grid">
        <section className="card card-pad">
          <div className="section-head">
            <h2 className="h2">{t("grades.chart")}</h2>
          </div>
          <div className="bars">
            {grades.averageBySemester.map((item) => (
              <div key={item.semester} className="bar-col" title={`${t("grades.semester", { n: item.semester })}: ${item.value}`}>
                <span>{item.value.toFixed(1)}</span>
                <div className="bar" style={{ height: `${Math.max(12, (item.value / 5) * 100)}%` }} />
                <span>{item.semester}</span>
              </div>
            ))}
          </div>
          <div className="row-between" style={{ marginTop: 10 }}>
            <span className="tiny muted">{t("grades.chart")}</span>
            <span className="tiny muted">{lang === "ru" ? "по семестрам" : "by semester"}</span>
          </div>
        </section>

        <section className="card card-pad">
          <div className="section-head">
            <h2 className="h2">{grades.semesters.find((s) => s.inProgress) ? t("grades.current") : t("grades.semester", { n: grades.currentSemester })}</h2>
            <span className="pill pill-gold">{t("grades.inProgress")}</span>
          </div>
          {(() => {
            const sem = grades.semesters.find((s) => s.number === grades.currentSemester);
            if (!sem) return null;
            return (
              <div className="stack-sm">
                {sem.courses.map((course) => (
                  <div key={course.code} className="course-row" style={{ padding: "9px 0" }}>
                    <div className="grow">
                      <div className="course-title">{pick(course.title)}</div>
                      <div className="course-meta">
                        <span>{course.credits} {t("grades.creditsShort")}</span>
                        <span>{pick(course.teacher)}</span>
                        {course.points != null ? <span>{t("grades.points")}: {course.points}</span> : null}
                      </div>
                    </div>
                    <GradeBadge course={course} />
                  </div>
                ))}
                <p className="tiny muted">{t("grades.currentHint", { n: grades.currentSemester })}</p>
              </div>
            );
          })()}
        </section>
      </div>

      <section className="card card-pad">
        <div className="section-head">
          <h2 className="h2">{t("grades.session")}</h2>
          <span className="tiny muted">{lang === "ru" ? "Все дисциплины" : "All courses"}</span>
        </div>
        <div className="tabs-scroll" role="tablist" aria-label={t("grades.session")} style={{ marginBottom: 12 }}>
          {grades.semesters.map((item) => (
            <button
              key={item.number}
              type="button"
              role="tab"
              aria-selected={item.number === current?.number}
              className={`filter-chip ${item.number === current?.number ? "active" : ""}`}
              onClick={() => setSemester(item.number)}
            >
              {t("grades.semester", { n: item.number })}
              {item.number === grades.currentSemester ? <span className="count">· {t("grades.inProgress")}</span> : null}
            </button>
          ))}
        </div>
        {current ? (
          <div>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="tiny muted">{current.completedCount} / {current.totalCount} {lang === "ru" ? "завершено" : "completed"}</span>
              {current.average != null ? <span className="pill pill-accent">{t("grades.avg")} · {current.average.toFixed(2)}</span> : null}
            </div>
            {current.courses.map((course) => (
              <div key={course.code} className="course-row">
                <span className="icon-circle sm" style={{ background: "var(--site-accent-soft)", color: "var(--site-accent)" }}>
                  <GraduationCap size={15} />
                </span>
                <div className="grow">
                  <div className="course-title">{pick(course.title)}</div>
                  <div className="course-meta">
                    <span>{course.code}</span>
                    <span>{course.credits} {t("grades.creditsShort")}</span>
                    <span>{pick(course.assessmentLabel)}</span>
                    {course.points != null ? <span>{t("grades.points")}: {course.points}</span> : null}
                  </div>
                </div>
                <GradeBadge course={course} />
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
