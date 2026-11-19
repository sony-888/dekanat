import { useState } from "react";
import { BookOpen, ChevronRight, Loader2, Save } from "lucide-react";
import { api } from "../lib/api";
import type { TeacherCourse, TeacherData, TeacherStudent } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { Avatar, Seg, Sheet, useToast } from "../components/ui";
import { TeacherSchedule } from "./TeacherSchedule";

type GradePatch = { grade?: number | null; passed?: boolean | null; points?: number | null };
type Tab = "grades" | "schedule";

const hueOf = (key: string) => {
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
};

function diffPatch(student: TeacherStudent, patch: GradePatch): GradePatch {
  const out: GradePatch = {};
  if ("grade" in patch && patch.grade !== student.grade) out.grade = patch.grade ?? null;
  if ("passed" in patch && patch.passed !== student.passed) out.passed = patch.passed ?? null;
  if ("points" in patch && patch.points !== student.points) out.points = patch.points ?? null;
  return out;
}

function pendingCount(course: TeacherCourse, edits: Record<string, GradePatch>) {
  let count = 0;
  for (const student of course.students) {
    const patch = edits[student.studentId];
    if (patch && Object.keys(diffPatch(student, patch)).length) count += 1;
  }
  return count;
}

export function TeacherView({ data, onRefresh }: { data: TeacherData; onRefresh: () => Promise<void> }) {
  const { t, pick } = useI18n();
  const { notify } = useToast();
  const [tab, setTab] = useState<Tab>("grades");
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, GradePatch>>({});
  const [busy, setBusy] = useState(false);

  const course = data.courses.find((item) => item.code === openCode) ?? null;
  const dirty = course ? pendingCount(course, edits) : 0;

  const close = () => {
    setOpenCode(null);
    setEdits({});
  };

  const setPatch = (studentId: string, patch: GradePatch) => {
    setEdits((current) => ({ ...current, [studentId]: { ...current[studentId], ...patch } }));
  };

  const save = async () => {
    if (!course || busy) return;
    setBusy(true);
    try {
      for (const student of course.students) {
        const patch = edits[student.studentId];
        if (!patch) continue;
        const diff = diffPatch(student, patch);
        if (!Object.keys(diff).length) continue;
        await api.setGrade({ courseCode: course.code, studentId: student.studentId, ...diff });
      }
      await onRefresh();
      setEdits({});
      notify(t("teacher.saved"));
    } catch {
      notify(t("teacher.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t("teacher.eyebrow")}</p>
          <h1 className="h1">{tab === "grades" ? t("teacher.title") : t("teacher.scheduleTitle")}</h1>
          <p className="muted small">
            {pick(data.teacher.fullName)} · {pick(data.teacher.title)}
            {tab === "schedule" ? ` · ${t("teacher.scheduleSubtitle")}` : ""}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Seg
          value={tab}
          options={[
            { value: "grades", label: t("teacher.tabGrades") },
            { value: "schedule", label: t("teacher.tabSchedule") },
          ]}
          onChange={setTab}
          label={t("teacher.eyebrow")}
        />
      </div>

      {tab === "grades" ? (
        <>
          <div className="staff-stats">
            <div className="stat-tile"><b>{data.stats.courses}</b><span>{t("teacher.statCourses")}</span></div>
            <div className="stat-tile"><b>{data.stats.students}</b><span>{t("teacher.statStudents")}</span></div>
            <div className="stat-tile"><b>{data.stats.ungraded}</b><span>{t("teacher.statUngraded")}</span></div>
          </div>

          {data.courses.length ? (
            <div className="staff-cards">
              {data.courses.map((item) => (
                <button key={item.code} type="button" className="course-card" onClick={() => setOpenCode(item.code)}>
                  <span className="course-card-top">
                    <span className="pill pill-accent">{item.code}</span>
                    <span className="tiny muted">{t("teacher.semester", { n: item.semester })} · {t("teacher.credits", { n: item.credits })}</span>
                  </span>
                  <span className="course-card-title">{pick(item.title)}</span>
                  <span className="course-card-meta">{item.groups.join(" · ")} · {t("teacher.studentsCount", { n: item.students.length })}</span>
                  <span className="course-card-foot">
                    <span className="metric-inline">{t("teacher.avgPoints")} <b>{item.averagePoints ?? "—"}</b></span>
                    <span className="spacer" />
                    {item.ungraded
                      ? <span className="pill pill-coral">{t("teacher.awaiting", { n: item.ungraded })}</span>
                      : <span className="pill pill-teal">{t("teacher.allGraded")}</span>}
                    <ChevronRight size={16} className="muted" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="card card-pad empty-state">
              <span className="icon-circle"><BookOpen size={20} /></span>
              <p className="small muted">{t("teacher.empty")}</p>
            </div>
          )}
        </>
      ) : (
        <TeacherSchedule />
      )}

      <Sheet
        open={course !== null}
        onClose={close}
        title={course ? pick(course.title) : ""}
        eyebrow={course ? `${t("teacher.sheetTitle")} · ${course.code}` : undefined}
        wide
        foot={course ? (
          <div className="row-between" style={{ width: "100%", gap: 12 }}>
            <span className="tiny muted">{dirty ? t("teacher.changes", { n: dirty }) : t("teacher.noChanges")}</span>
            <button type="button" className="btn btn-primary" disabled={busy || dirty === 0} onClick={save}>
              {busy ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {busy ? t("teacher.saving") : t("teacher.save")}
            </button>
          </div>
        ) : undefined}
      >
        {course ? (
          <>
            <div className="row-between" style={{ flexWrap: "wrap", gap: 6 }}>
              <span className="tiny muted">{t("teacher.sheetHint")}</span>
              <span className="tiny muted">{course.groups.join(" · ")} · {t("teacher.studentsCount", { n: course.students.length })}</span>
            </div>
            <div className="grade-list">
              {course.students.map((student) => {
                const patch = edits[student.studentId];
                const points = patch && "points" in patch ? patch.points ?? null : student.points;
                const grade = patch && "grade" in patch ? patch.grade ?? null : student.grade;
                const passed = patch && "passed" in patch ? patch.passed ?? null : student.passed;
                return (
                  <div className="grade-row" key={student.studentId}>
                    <div className="grade-who">
                      <Avatar name={pick(student.fullName)} hue={hueOf(student.studentId)} />
                      <div style={{ minWidth: 0 }}>
                        <div className="grade-name">{pick(student.fullName)}</div>
                        <div className="grade-sub">{student.group} · {pick(student.program)}</div>
                      </div>
                    </div>
                    <div className="grade-controls">
                      <label className="points-box">
                        <span>{t("teacher.points")}</span>
                        <input
                          className="input points-input"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={100}
                          value={points ?? ""}
                          aria-label={`${t("teacher.points")}: ${pick(student.fullName)}`}
                          onChange={(event) => {
                            const raw = event.target.value;
                            if (raw === "") {
                              setPatch(student.studentId, { points: null });
                              return;
                            }
                            const next = Number(raw);
                            if (!Number.isFinite(next)) return;
                            setPatch(student.studentId, { points: Math.round(Math.max(0, Math.min(100, next))) });
                          }}
                        />
                      </label>
                      <div className="grade-box">
                        <span>{t("teacher.grade")}</span>
                        <div className="grade-seg" role="group" aria-label={`${t("teacher.grade")}: ${pick(student.fullName)}`}>
                          {course.assessment === "pass_fail" ? (
                            <>
                              <button type="button" className={passed == null ? "on" : ""} onClick={() => setPatch(student.studentId, { passed: null })}>{t("teacher.none")}</button>
                              <button type="button" className={passed === true ? "on" : ""} onClick={() => setPatch(student.studentId, { passed: true })}>{t("teacher.pass")}</button>
                              <button type="button" className={passed === false ? "on" : ""} onClick={() => setPatch(student.studentId, { passed: false })}>{t("teacher.fail")}</button>
                            </>
                          ) : (
                            [null, 5, 4, 3, 2].map((value) => (
                              <button
                                key={String(value)}
                                type="button"
                                className={grade === value ? "on" : ""}
                                onClick={() => setPatch(student.studentId, { grade: value })}
                              >
                                {value ?? "—"}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  );
}
