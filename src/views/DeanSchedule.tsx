import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft, CalendarClock, CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Clock, Loader2, MapPin,
  Plus, RotateCcw, Trash2, UserRound, X,
} from "lucide-react";
import { api, ApiError, todayStr } from "../lib/api";
import type { ClassItem, ClassKind, DeanScheduleData } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { Sheet, useToast } from "../components/ui";
import { addDays, dayRelative, isToday, monthShort, weekdayLong, weekdayShort } from "../lib/format";
import { ScheduleLookup } from "./ScheduleLookup";

type CreateForm = {
  date: string; courseCode: string; kind: ClassKind; start: string; end: string; room: string; building: string; note: string;
};

type MoveForm = { newDate: string; newStart: string; newEnd: string; newRoom: string; note: string };

type Target = { item: ClassItem; date: string };

function statusKey(status: ClassItem["status"]): string {
  if (status === "moved") return "schedule.moved";
  if (status === "cancelled") return "schedule.cancelled";
  if (status === "added") return "schedule.added";
  return "";
}

function statusClass(status: ClassItem["status"]): string {
  if (status === "cancelled") return "status-rejected";
  if (status === "moved") return "status-in_review";
  return "status-issued";
}

export function DeanSchedule() {
  const { t, pick, lang } = useI18n();
  const { notify } = useToast();
  const [group, setGroup] = useState("");
  const [anchor, setAnchor] = useState(todayStr());
  const [data, setData] = useState<DeanScheduleData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<Target | null>(null);
  const [cancelling, setCancelling] = useState<Target | null>(null);
  const [deleting, setDeleting] = useState<Target | null>(null);
  const [create, setCreate] = useState<CreateForm>({ date: "", courseCode: "", kind: "lecture", start: "10:00", end: "11:30", room: "", building: "", note: "" });
  const [move, setMove] = useState<MoveForm>({ newDate: "", newStart: "", newEnd: "", newRoom: "", note: "" });
  const [cancelNote, setCancelNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const pending = useRef<string | null>(null);

  const load = useCallback(async (groupCode: string, dateStr: string) => {
    setFailed(false);
    try {
      const value = await api.deanSchedule(groupCode, dateStr);
      setData(value);
      setGroup(value.group);
      const wanted = pending.current;
      pending.current = null;
      setSelected(wanted && value.days.some((day) => day.date === wanted)
        ? wanted
        : value.days.find((day) => day.date === todayStr())?.date ?? value.days[0]?.date ?? null);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    pending.current = todayStr();
    void load("", todayStr());
  }, [load]);

  const refresh = async () => {
    if (!data) return;
    pending.current = selected;
    await load(data.group, anchor);
  };

  const shiftWeek = (days: number) => {
    if (!data) return;
    const nextAnchor = addDays(data.monday, days);
    pending.current = selected ? addDays(selected, days) : nextAnchor;
    setAnchor(nextAnchor);
    void load(data.group, nextAnchor);
  };

  const goToday = () => {
    if (!data) return;
    pending.current = todayStr();
    setAnchor(todayStr());
    void load(data.group, todayStr());
  };

  const switchGroup = (code: string) => {
    setGroup(code);
    pending.current = selected;
    void load(code, anchor);
  };

  const openCreate = () => {
    if (!data) return;
    setFormError(null);
    setCreate({
      date: selected ?? todayStr(),
      courseCode: data.courses[0]?.code ?? "",
      kind: "lecture",
      start: "10:00",
      end: "11:30",
      room: "",
      building: "",
      note: "",
    });
    setCreating(true);
  };

  const openMove = (item: ClassItem, date: string) => {
    setFormError(null);
    setMove({ newDate: date, newStart: item.start, newEnd: item.end, newRoom: item.room, note: "" });
    setMoving({ item, date });
  };

  const openCancel = (item: ClassItem, date: string) => {
    setFormError(null);
    setCancelNote("");
    setCancelling({ item, date });
  };

  const problem = (error: unknown) => (error instanceof ApiError && error.code === "duplicate_change"
    ? t("dean.duplicateChange")
    : t("dean.scheduleError"));

  const submitCreate = async () => {
    if (!data || busy) return;
    if (!create.room.trim() || !create.building.trim() || !create.courseCode) {
      setFormError(t("dean.scheduleError"));
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await api.createClass({
        group: data.group,
        date: create.date,
        courseCode: create.courseCode,
        kind: create.kind,
        start: create.start,
        end: create.end,
        room: create.room.trim(),
        building: create.building.trim(),
        note: create.note.trim() || undefined,
      });
      setCreating(false);
      pending.current = create.date;
      setAnchor(create.date);
      await load(data.group, create.date);
      notify(t("dean.scheduleSaved"));
    } catch (error) {
      setFormError(problem(error));
    } finally {
      setBusy(false);
    }
  };

  const submitMove = async () => {
    if (!data || !moving || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.moveClass({
        group: data.group,
        date: moving.date,
        ref: moving.item.ref ?? "",
        changeId: moving.item.status === "moved" || moving.item.status === "added" ? moving.item.changeId ?? undefined : undefined,
        newDate: move.newDate,
        newStart: move.newStart,
        newEnd: move.newEnd,
        newRoom: move.newRoom.trim() || undefined,
        note: move.note.trim() || undefined,
      });
      setMoving(null);
      pending.current = move.newDate;
      setAnchor(move.newDate);
      await load(data.group, move.newDate);
      notify(t("dean.scheduleSaved"));
    } catch (error) {
      setFormError(problem(error));
    } finally {
      setBusy(false);
    }
  };

  const submitCancel = async () => {
    if (!data || !cancelling || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.cancelClass({
        group: data.group,
        date: cancelling.date,
        ref: cancelling.item.ref ?? "",
        note: cancelNote.trim() || undefined,
      });
      setCancelling(null);
      pending.current = cancelling.date;
      setAnchor(cancelling.date);
      await load(data.group, cancelling.date);
      notify(t("dean.scheduleSaved"));
    } catch (error) {
      setFormError(problem(error));
    } finally {
      setBusy(false);
    }
  };

  const restore = async (item: ClassItem) => {
    if (!data || busy || !item.changeId) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.restoreClass({ group: data.group, id: item.changeId });
      pending.current = selected;
      await load(data.group, anchor);
      notify(t("dean.scheduleSaved"));
    } catch {
      notify(t("dean.scheduleError"));
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async () => {
    if (!data || !deleting || busy || !deleting.item.changeId) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.deleteClass({ group: data.group, id: deleting.item.changeId });
      setDeleting(null);
      pending.current = selected;
      await load(data.group, anchor);
      notify(t("dean.scheduleSaved"));
    } catch {
      setFormError(t("dean.scheduleError"));
    } finally {
      setBusy(false);
    }
  };

  if (failed && !data) {
    return (
      <div className="card card-pad empty-state">
        <span className="icon-circle"><CalendarX2 size={20} /></span>
        <p className="h3" style={{ margin: 0 }}>{t("dean.scheduleError")}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { pending.current = todayStr(); void load("", todayStr()); }}>
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        <Loader2 size={18} className="spin" />
        <span className="small muted">{t("common.loading")}</span>
      </div>
    );
  }

  const first = data.days[0]?.date;
  const last = data.days[data.days.length - 1]?.date;
  const rangeLabel = first && last
    ? (monthShort(first, lang) === monthShort(last, lang)
      ? `${Number(first.slice(8))}–${Number(last.slice(8))} ${monthShort(last, lang)}`
      : `${Number(first.slice(8))} ${monthShort(first, lang)} – ${Number(last.slice(8))} ${monthShort(last, lang)}`)
    : "";
  const day = data.days.find((item) => item.date === selected) ?? data.days[0] ?? null;
  const relative = day ? dayRelative(day.date, lang) : null;
  const canCreate = data.courses.length > 0;

  return (
    <div className="stack" style={{ gap: 14 }}>
      <ScheduleLookup />

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="field">
          <label htmlFor="dean-group">{t("dean.group")}</label>
          <select id="dean-group" className="input" value={group} onChange={(event) => switchGroup(event.target.value)}>
            {data.groups.map((item) => (
              <option key={item.code} value={item.code}>{pick(item.label)}</option>
            ))}
          </select>
        </div>

        <div className="row" style={{ alignItems: "center", gap: 8 }}>
          <button type="button" className="icon-btn" onClick={() => shiftWeek(-7)} aria-label={t("dean.prevWeek")} title={t("dean.prevWeek")}>
            <ChevronLeft size={18} />
          </button>
          <div className="grow" style={{ textAlign: "center", minWidth: 0 }}>
            <b className="small">{t("dean.week", { n: data.weekNumber })}</b>
            <div className="tiny muted">{rangeLabel}</div>
          </div>
          <button type="button" className="icon-btn" onClick={() => shiftWeek(7)} aria-label={t("dean.nextWeek")} title={t("dean.nextWeek")}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm grow" onClick={goToday}>
            <CalendarDays size={15} /> {t("dean.thisWeek")}
          </button>
          <button type="button" className="btn btn-primary btn-sm grow" disabled={!canCreate} onClick={openCreate}>
            <Plus size={15} /> {t("dean.addClass")}
          </button>
        </div>
        <p className="tiny muted" style={{ margin: 0, lineHeight: 1.5 }}>{t("dean.scheduleHint")}</p>
      </div>

      <div className="week-strip" role="tablist" aria-label={t("nav.schedule")}>
        {data.days.map((item) => {
          const active = item.date === selected;
          const weekend = item.weekday >= 6;
          return (
            <button
              key={item.date}
              type="button"
              role="tab"
              aria-selected={active}
              className={`day-tile ${active ? "selected" : ""} ${isToday(item.date) ? "today" : ""} ${weekend ? "weekend" : ""}`}
              onClick={() => setSelected(item.date)}
            >
              <span className="dw">{weekdayShort(item.date, lang)}</span>
              <span className="dn">{Number(item.date.slice(8))}</span>
              <span className={`dc ${item.classes.length ? "has" : ""}`} />
            </button>
          );
        })}
      </div>

      {day ? (
        <section>
          <div className="day-head">
            <h2 className="h2">{relative ?? weekdayLong(day.date, lang)}</h2>
            <span className="day-chip">
              {Number(day.date.slice(8))} {monthShort(day.date, lang)}
              {day.classes.length ? ` · ${t("schedule.classesCount", { n: day.classes.length })}` : ""}
            </span>
          </div>

          {day.classes.length ? (
            <div className="stack-sm">
              {day.classes.map((item) => (
                <article key={item.id} className="class-row">
                  <div className="class-time">
                    <b>{item.start}</b>
                    <span>{item.end}</span>
                  </div>
                  <div className={`class-card ${item.status !== "normal" ? item.status : ""}`}>
                    <div className="class-top">
                      <div className="grow">
                        <div className="class-kind" style={{ color: item.kind === "exam" ? "var(--site-coral)" : undefined }}>
                          {pick(item.kindLabel)}
                        </div>
                        <h3 className="class-title">{pick(item.title)}</h3>
                      </div>
                      {item.status !== "normal" ? (
                        <span className={`status-pill ${statusClass(item.status)}`}>{t(statusKey(item.status))}</span>
                      ) : null}
                    </div>
                    <div className="class-meta">
                      <span><MapPin size={13} /> {item.room} · {pick(item.building)}</span>
                      <span><UserRound size={13} /> {pick(item.teacher)}</span>
                      <span><Clock size={13} /> {item.start}–{item.end}</span>
                    </div>
                    {item.status === "moved" && item.original ? (
                      <div className="class-note">
                        <ArrowRightLeft size={14} style={{ flex: "none" }} />
                        <span>
                          {t("schedule.was")}: <span className="class-oldtime">{item.original.start}–{item.original.end} · {item.original.room}</span>
                          {item.note ? <><br />{pick(item.note)}</> : null}
                        </span>
                      </div>
                    ) : item.status !== "normal" && item.note ? (
                      <div className="class-note">
                        {item.status === "cancelled" ? <X size={14} style={{ flex: "none" }} /> : <Plus size={14} style={{ flex: "none" }} />}
                        <span>{pick(item.note)}</span>
                      </div>
                    ) : null}
                    {item.status === "normal" && item.ref ? (
                      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openMove(item, day.date)}>
                          <ArrowRightLeft size={14} /> {t("dean.reschedule")}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openCancel(item, day.date)}>
                          <CalendarX2 size={14} /> {t("dean.cancelClass")}
                        </button>
                      </div>
                    ) : null}
                    {item.status === "moved" && item.changeId ? (
                      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openMove(item, day.date)}>
                          <ArrowRightLeft size={14} /> {t("dean.reschedule")}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => restore(item)}>
                          {busy ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
                          {t("dean.resetMove")}
                        </button>
                      </div>
                    ) : null}
                    {item.status === "cancelled" && item.changeId ? (
                      <div className="row" style={{ gap: 8, marginTop: 10 }}>
                        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => restore(item)}>
                          {busy ? <Loader2 size={14} className="spin" /> : <RotateCcw size={14} />}
                          {t("dean.restoreClass")}
                        </button>
                      </div>
                    ) : null}
                    {item.status === "added" && item.changeId ? (
                      <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openMove(item, day.date)}>
                          <ArrowRightLeft size={14} /> {t("dean.reschedule")}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() => { setFormError(null); setDeleting({ item, date: day.date }); }}
                        >
                          <Trash2 size={14} /> {t("dean.deleteClass")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon-circle teal"><CalendarClock size={22} /></span>
              <div className="h3">{t("dean.noClasses")}</div>
              <button type="button" className="btn btn-ghost btn-sm" disabled={!canCreate} onClick={openCreate}>
                <Plus size={15} /> {t("dean.addClass")}
              </button>
            </div>
          )}
        </section>
      ) : null}

      <Sheet
        open={creating}
        onClose={() => { if (!busy) setCreating(false); }}
        title={t("dean.createTitle")}
        eyebrow={create.date ? `${weekdayShort(create.date, lang)}, ${Number(create.date.slice(8))} ${monthShort(create.date, lang)}` : undefined}
        foot={(
          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={submitCreate}>
            {busy ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            {busy ? t("dean.saving") : t("dean.createAction")}
          </button>
        )}
      >
        <div className="field">
          <label htmlFor="class-course">{t("dean.course")}</label>
          <select id="class-course" className="input" value={create.courseCode} onChange={(event) => setCreate({ ...create, courseCode: event.target.value })}>
            {data.courses.map((course) => (
              <option key={course.code} value={course.code}>{pick(course.title)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="class-kind">{t("dean.classKind")}</label>
          <select id="class-kind" className="input" value={create.kind} onChange={(event) => setCreate({ ...create, kind: event.target.value as ClassKind })}>
            {data.kinds.map((kind) => (
              <option key={kind.value} value={kind.value}>{pick(kind.label)}</option>
            ))}
          </select>
        </div>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <div className="field grow">
            <label htmlFor="class-start">{t("dean.start")}</label>
            <input id="class-start" type="time" className="input" value={create.start} onChange={(event) => setCreate({ ...create, start: event.target.value })} />
          </div>
          <div className="field grow">
            <label htmlFor="class-end">{t("dean.end")}</label>
            <input id="class-end" type="time" className="input" value={create.end} onChange={(event) => setCreate({ ...create, end: event.target.value })} />
          </div>
        </div>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <div className="field grow">
            <label htmlFor="class-room">{t("dean.room")}</label>
            <input id="class-room" className="input" value={create.room} onChange={(event) => setCreate({ ...create, room: event.target.value })} placeholder={t("dean.roomPlaceholder")} maxLength={40} />
          </div>
          <div className="field grow">
            <label htmlFor="class-building">{t("dean.building")}</label>
            <input id="class-building" className="input" value={create.building} onChange={(event) => setCreate({ ...create, building: event.target.value })} placeholder={t("dean.buildingPlaceholder")} maxLength={40} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="class-note">{t("dean.note")}</label>
          <textarea id="class-note" className="input" value={create.note} onChange={(event) => setCreate({ ...create, note: event.target.value })} placeholder={t("dean.notePlaceholder")} maxLength={300} />
        </div>
        {formError ? <p className="small" style={{ color: "var(--site-coral)", margin: 0 }}>{formError}</p> : null}
      </Sheet>

      <Sheet
        open={moving !== null}
        onClose={() => { if (!busy) setMoving(null); }}
        title={t("dean.moveTitle")}
        eyebrow={moving ? pick(moving.item.title) : undefined}
        foot={(
          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={submitMove}>
            {busy ? <Loader2 size={16} className="spin" /> : <ArrowRightLeft size={16} />}
            {busy ? t("dean.saving") : t("dean.moveAction")}
          </button>
        )}
      >
        {moving ? (
          <div className="dean-comment">
            <span className="eyebrow">{moving.item.status === "normal" ? t("dean.original") : t("dean.currentPlacement")}</span>
            <p className="small" style={{ margin: 0 }}>
              {weekdayShort(moving.date, lang)}, {Number(moving.date.slice(8))} {monthShort(moving.date, lang)} · {moving.item.start}–{moving.item.end} · {moving.item.room}
            </p>
          </div>
        ) : null}
        <p className="tiny muted" style={{ margin: 0, lineHeight: 1.5 }}>{t("dean.moveHint")}</p>
        <div className="field">
          <label htmlFor="move-date">{t("dean.newDate")}</label>
          <input id="move-date" type="date" className="input" value={move.newDate} onChange={(event) => setMove({ ...move, newDate: event.target.value })} />
        </div>
        <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
          <div className="field grow">
            <label htmlFor="move-start">{t("dean.start")}</label>
            <input id="move-start" type="time" className="input" value={move.newStart} onChange={(event) => setMove({ ...move, newStart: event.target.value })} />
          </div>
          <div className="field grow">
            <label htmlFor="move-end">{t("dean.end")}</label>
            <input id="move-end" type="time" className="input" value={move.newEnd} onChange={(event) => setMove({ ...move, newEnd: event.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="move-room">{t("dean.newRoom")}</label>
          <input id="move-room" className="input" value={move.newRoom} onChange={(event) => setMove({ ...move, newRoom: event.target.value })} maxLength={40} />
        </div>
        <div className="field">
          <label htmlFor="move-note">{t("dean.note")}</label>
          <textarea id="move-note" className="input" value={move.note} onChange={(event) => setMove({ ...move, note: event.target.value })} placeholder={t("dean.notePlaceholder")} maxLength={300} />
        </div>
        {formError ? <p className="small" style={{ color: "var(--site-coral)", margin: 0 }}>{formError}</p> : null}
      </Sheet>

      <Sheet
        open={cancelling !== null}
        onClose={() => { if (!busy) setCancelling(null); }}
        title={t("dean.cancelTitle")}
        eyebrow={cancelling ? pick(cancelling.item.title) : undefined}
        foot={(
          <div className="stack-sm" style={{ width: "100%" }}>
            <button type="button" className="btn btn-coral btn-block" disabled={busy} onClick={submitCancel}>
              {busy ? <Loader2 size={16} className="spin" /> : <CalendarX2 size={16} />}
              {busy ? t("dean.saving") : t("dean.confirmCancel")}
            </button>
            <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => setCancelling(null)}>
              {t("dean.keepClass")}
            </button>
          </div>
        )}
      >
        <p className="small" style={{ margin: 0, lineHeight: 1.55 }}>{t("dean.cancelBody")}</p>
        {cancelling ? (
          <div className="dean-comment">
            <span className="eyebrow">{t("dean.original")}</span>
            <p className="small" style={{ margin: 0 }}>
              {weekdayShort(cancelling.date, lang)}, {Number(cancelling.date.slice(8))} {monthShort(cancelling.date, lang)} · {cancelling.item.start}–{cancelling.item.end} · {cancelling.item.room}
            </p>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="cancel-note">{t("dean.note")}</label>
          <textarea id="cancel-note" className="input" value={cancelNote} onChange={(event) => setCancelNote(event.target.value)} placeholder={t("dean.notePlaceholder")} maxLength={300} />
        </div>
        {formError ? <p className="small" style={{ color: "var(--site-coral)", margin: 0 }}>{formError}</p> : null}
      </Sheet>

      <Sheet
        open={deleting !== null}
        onClose={() => { if (!busy) setDeleting(null); }}
        title={t("dean.deleteTitle")}
        eyebrow={deleting ? pick(deleting.item.title) : undefined}
        foot={(
          <div className="stack-sm" style={{ width: "100%" }}>
            <button type="button" className="btn btn-coral btn-block" disabled={busy} onClick={submitDelete}>
              {busy ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
              {busy ? t("dean.saving") : t("dean.confirmDelete")}
            </button>
            <button type="button" className="btn btn-ghost btn-block" disabled={busy} onClick={() => setDeleting(null)}>
              {t("dean.keepDelete")}
            </button>
          </div>
        )}
      >
        <p className="small" style={{ margin: 0, lineHeight: 1.55 }}>{t("dean.deleteBody")}</p>
        {deleting ? (
          <div className="dean-comment">
            <span className="eyebrow">{t("dean.original")}</span>
            <p className="small" style={{ margin: 0 }}>
              {weekdayShort(deleting.date, lang)}, {Number(deleting.date.slice(8))} {monthShort(deleting.date, lang)} · {deleting.item.start}–{deleting.item.end} · {deleting.item.room}
            </p>
          </div>
        ) : null}
        {formError ? <p className="small" style={{ color: "var(--site-coral)", margin: 0 }}>{formError}</p> : null}
      </Sheet>
    </div>
  );
}
