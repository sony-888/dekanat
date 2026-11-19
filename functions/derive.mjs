// Builds the presentation payload for one authenticated student. Academic
// content comes from the fictional catalog; only sessions, requests and read
// marks are stored in the database.

import { DOC_CATALOG, KIND_LABELS, STATUS_LABELS, UNIVERSITY } from './catalog.mjs';

const DAY_MS = 86400000;
const L = (ru, en) => ({ ru, en });
const MONTHS = {
  ru: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const time = Date.UTC(y, m - 1, d);
  const probe = new Date(time);
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return time;
}

export function toDateStr(time) {
  return new Date(time).toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const base = parseDate(dateStr);
  return toDateStr((base ?? Date.now()) + days * DAY_MS);
}

export function weekdayOf(dateStr) {
  const time = parseDate(dateStr) ?? Date.now();
  const day = new Date(time).getUTCDay();
  return day === 0 ? 7 : day;
}

export function mondayOf(dateStr) {
  return addDays(dateStr, -(weekdayOf(dateStr) - 1));
}

export function isoWeekOf(dateStr) {
  const time = parseDate(dateStr) ?? Date.now();
  const date = new Date(Date.UTC(new Date(time).getUTCFullYear(), new Date(time).getUTCMonth(), new Date(time).getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / DAY_MS) + 1) / 7);
}

const sortByTime = (a, b) => a.start.localeCompare(b.start);

// Stable identity of a weekly template occurrence, used by dean-made changes.
export function classRefOf(entry) {
  return `${entry.weekday}|${entry.start}|${entry.title.ru}`;
}

const localized = (ru, en) => (ru || en ? { ru: ru || en, en: en || ru } : null);

function changedNote(row) {
  return localized(row.note_ru, row.note_en);
}

function changedClass(row, date, status, original) {
  const moved = status === 'moved';
  return {
    id: `${status === 'moved' ? 'm' : 'a'}-${row.id}`,
    weekday: weekdayOf(date),
    date,
    start: moved ? row.new_start : row.start_time,
    end: moved ? row.new_end : row.end_time,
    kind: row.class_kind,
    kindLabel: KIND_LABELS[row.class_kind] ?? KIND_LABELS.lecture,
    title: { ru: row.title_ru, en: row.title_en },
    room: (moved && row.new_room) || row.room || '',
    building: localized(row.building_ru, row.building_en) ?? L('', ''),
    teacher: localized(row.teacher_ru, row.teacher_en) ?? L('', ''),
    status,
    note: changedNote(row),
    original,
    ref: null,
    changeId: row.id,
    group: row.group_code ?? null,
  };
}

export function buildSchedule(entries, dateStr, changes = []) {
  const monday = mondayOf(dateStr);
  const lastDate = addDays(monday, 6);
  const inWeek = (date) => date >= monday && date <= lastDate;
  const cancelledAt = new Map();
  const movedAt = new Map();
  const extras = [];
  for (const change of changes) {
    if (change.change_kind === 'cancelled' && change.base_ref && inWeek(change.base_date)) {
      cancelledAt.set(`${change.base_date}|${change.base_ref}`, change);
    } else if (change.change_kind === 'moved' && change.base_ref) {
      if (inWeek(change.base_date)) movedAt.set(`${change.base_date}|${change.base_ref}`, change);
      if (change.new_date && inWeek(change.new_date)) {
        extras.push(changedClass(change, change.new_date, 'moved', {
          start: change.start_time, end: change.end_time, room: change.room ?? '',
        }));
      }
    } else if (change.change_kind === 'created' && inWeek(change.base_date)) {
      extras.push(changedClass(change, change.base_date, 'added', null));
    }
  }

  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(monday, i);
    const weekday = i + 1;
    const classes = [];
    for (const entry of entries) {
      if (entry.weekday !== weekday) continue;
      const ref = classRefOf(entry);
      if (movedAt.has(`${date}|${ref}`)) continue;
      const cancel = cancelledAt.get(`${date}|${ref}`);
      classes.push({
        weekday,
        date,
        start: entry.start,
        end: entry.end,
        kind: entry.kind,
        kindLabel: KIND_LABELS[entry.kind] ?? KIND_LABELS.lecture,
        title: entry.title,
        room: entry.room,
        building: entry.building,
        teacher: entry.teacher,
        status: cancel ? 'cancelled' : (entry.status ?? 'normal'),
        note: cancel ? changedNote(cancel) : (entry.note ?? null),
        original: entry.original ?? null,
        ref,
        changeId: cancel ? cancel.id : null,
        group: entry.group ?? null,
      });
    }
    classes.sort(sortByTime);
    for (const [index, item] of classes.entries()) {
      item.id = `c-${weekday}-${index}-${item.start.replace(':', '')}`;
    }
    for (const extra of extras) {
      if (extra.date === date) classes.push(extra);
    }
    classes.sort(sortByTime);
    days.push({ date, weekday, classes });
  }
  const changesList = days.flatMap((day) => day.classes.filter((c) => c.status !== 'normal').map((c) => ({ ...c, date: day.date })));
  return { monday, weekNumber: isoWeekOf(monday), days, changes: changesList };
}

const changeStatus = (kind) => (kind === 'cancelled' ? 'cancelled' : kind === 'moved' ? 'moved' : 'added');

export function changeEffectiveDate(row) {
  return row.change_kind === 'moved' ? (row.new_date ?? row.base_date) : row.base_date;
}

const MONTHS_RU_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function changeDateLabel(date, lang) {
  const [, month, day] = date.split('-').map(Number);
  return lang === 'ru' ? `${day} ${MONTHS_RU_GEN[month - 1]}` : `${MONTHS.en[month - 1]} ${day}`;
}

export function upcomingScheduleChanges(rows, todayStr) {
  return rows
    .map((row) => {
      const status = changeStatus(row.change_kind);
      const moved = status === 'moved';
      const date = changeEffectiveDate(row);
      return {
        id: row.id,
        date,
        weekday: weekdayOf(date),
        start: moved ? row.new_start : row.start_time,
        end: moved ? row.new_end : row.end_time,
        status,
        kind: row.class_kind,
        kindLabel: KIND_LABELS[row.class_kind] ?? KIND_LABELS.lecture,
        title: { ru: row.title_ru, en: row.title_en },
        room: (moved && row.new_room) || row.room || '',
        building: localized(row.building_ru, row.building_en) ?? L('', ''),
        teacher: localized(row.teacher_ru, row.teacher_en) ?? L('', ''),
        note: changedNote(row),
        original: moved ? { start: row.start_time, end: row.end_time, room: row.room ?? '' } : null,
        group: row.group_code,
        createdAt: row.created_at,
      };
    })
    .filter((item) => item.date && item.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
}

export function scheduleNotifications(rows, todayStr, readIds, now) {
  const read = new Set(readIds);
  return upcomingScheduleChanges(rows, todayStr).map((change) => {
    const id = `sch-${change.id}`;
    const time = `${change.start}–${change.end}`;
    const where = change.room ? ` · ${change.room}` : '';
    const title = change.status === 'cancelled'
      ? L(`Занятие отменено: ${change.title.ru}`, `Class cancelled: ${change.title.en}`)
      : change.status === 'moved'
        ? L(`Занятие перенесено: ${change.title.ru}`, `Class rescheduled: ${change.title.en}`)
        : L(`Дополнительное занятие: ${change.title.ru}`, `Extra class: ${change.title.en}`);
    const noteRu = change.note?.ru ? ` ${change.note.ru}` : '';
    const noteEn = change.note?.en ? ` ${change.note.en}` : '';
    return {
      id,
      category: 'schedule',
      title,
      body: L(
        `${changeDateLabel(change.date, 'ru')} · ${time}${where}.${noteRu}`,
        `${changeDateLabel(change.date, 'en')} · ${time}${where}.${noteEn}`,
      ),
      pinned: false,
      createdAt: change.createdAt ?? new Date(now).toISOString(),
      dueAt: null,
      dueInDays: null,
      action: { label: L('Открыть расписание', 'Open schedule'), target: '/schedule' },
      read: read.has(id),
    };
  });
}

export function mergeScheduleSources(sources, dateStr) {
  const byDate = new Map();
  for (const source of sources) {
    const schedule = buildSchedule(source.entries, dateStr, source.changes ?? []);
    for (const day of schedule.days) {
      let bucket = byDate.get(day.date);
      if (!bucket) {
        bucket = { date: day.date, weekday: day.weekday, classes: [] };
        byDate.set(day.date, bucket);
      }
      for (const item of day.classes) {
        bucket.classes.push({ ...item, id: `${source.code}:${item.id}`, group: source.code });
      }
    }
  }
  const monday = mondayOf(dateStr);
  const days = [];
  for (let index = 0; index < 7; index += 1) {
    const date = addDays(monday, index);
    const bucket = byDate.get(date);
    days.push(bucket
      ? { ...bucket, classes: [...bucket.classes].sort(sortByTime) }
      : { date, weekday: index + 1, classes: [] });
  }
  return { monday, weekNumber: isoWeekOf(monday), days };
}

const gradeLabel = (course) => {
  if (course.grade === 5) return L('Отлично', 'Excellent');
  if (course.grade === 4) return L('Хорошо', 'Good');
  if (course.grade === 3) return L('Удовлетворительно', 'Satisfactory');
  if (course.grade === 2) return L('Неудовлетворительно', 'Unsatisfactory');
  if (course.passed === true) return L('Зачёт', 'Pass');
  if (course.passed === false) return L('Не зачтено', 'Fail');
  return L('В процессе', 'In progress');
};

const assessmentLabel = (assessment) => {
  if (assessment === 'pass_fail') return L('Зачёт', 'Pass/fail');
  if (assessment === 'graded_pass') return L('Диф. зачёт', 'Graded pass');
  return L('Экзамен', 'Exam');
};

const isCompleted = (course) => course.grade != null || course.passed != null;
const isEarned = (course) => (course.grade != null && course.grade >= 3) || course.passed === true;

function mergeCourseGrades(courses, gradeRows) {
  const byCode = new Map(gradeRows.map((row) => [row.course_code, row]));
  return courses.map((course) => {
    const row = byCode.get(course.code);
    if (!row) return course;
    const next = { ...course };
    if (row.grade != null) next.grade = row.grade;
    if (row.passed != null) next.passed = Boolean(row.passed);
    if (row.points != null) next.points = row.points;
    if ((row.grade != null || row.passed != null) && !course.gradedAt && row.updated_at) {
      next.gradedAt = String(row.updated_at).slice(0, 10);
    }
    return next;
  });
}

function weightedAverage(courses) {
  const graded = courses.filter((c) => typeof c.grade === 'number');
  if (!graded.length) return null;
  const credits = graded.reduce((sum, c) => sum + c.credits, 0);
  if (!credits) return null;
  return graded.reduce((sum, c) => sum + c.grade * c.credits, 0) / credits;
}

function periodLabel(courses) {
  const dates = courses.map((c) => c.gradedAt).filter(Boolean).sort();
  if (!dates.length) return L('Последняя сессия', 'Last session');
  const date = new Date(dates[dates.length - 1]);
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  return L(`${MONTHS.ru[month]} ${year}`, `${MONTHS.en[month]} ${year}`);
}

export function buildGrades(courses, profile, rank, creditsTotal) {
  const decorated = courses.map((course) => ({
    ...course,
    completed: isCompleted(course),
    gradeLabel: gradeLabel(course),
    assessmentLabel: assessmentLabel(course.assessment),
  }));

  const semesterNumbers = [...new Set(decorated.map((c) => c.semester))].sort((a, b) => a - b);
  const semesters = semesterNumbers.map((number) => {
    const items = decorated.filter((c) => c.semester === number);
    const average = weightedAverage(items.filter((c) => c.grade != null));
    return {
      number,
      courses: items,
      average: average == null ? null : Math.round(average * 100) / 100,
      credits: items.reduce((sum, c) => sum + c.credits, 0),
      earned: items.filter(isEarned).reduce((sum, c) => sum + c.credits, 0),
      completedCount: items.filter(isCompleted).length,
      totalCount: items.length,
      inProgress: items.some((c) => !isCompleted(c)),
    };
  });

  const currentSemester = (semesters.find((s) => s.inProgress)?.number) ?? semesters[semesters.length - 1]?.number ?? 1;
  const completedCourses = decorated.filter(isCompleted);
  const creditsEarned = completedCourses.filter(isEarned).reduce((sum, c) => sum + c.credits, 0);

  const gpaRaw = weightedAverage(completedCourses);
  const gpa = gpaRaw == null ? null : Math.round(gpaRaw * 100) / 100;

  const distribution = { five: 0, four: 0, three: 0, two: 0, pass: 0, fail: 0 };
  for (const course of completedCourses) {
    if (course.grade === 5) distribution.five += 1;
    else if (course.grade === 4) distribution.four += 1;
    else if (course.grade === 3) distribution.three += 1;
    else if (course.grade === 2) distribution.two += 1;
    else if (course.passed === true) distribution.pass += 1;
    else if (course.passed === false) distribution.fail += 1;
  }

  const pastSemesters = semesters.filter((s) => s.number < currentSemester && s.courses.some(isCompleted));
  const last = pastSemesters[pastSemesters.length - 1] ?? null;
  let session = null;
  if (last) {
    const results = last.courses.filter(isCompleted);
    const passed = results.filter(isEarned).length;
    session = {
      semester: last.number,
      period: periodLabel(results),
      results,
      average: last.average,
      passed,
      failed: results.length - passed,
      total: results.length,
      rank,
    };
  }

  return {
    semesters,
    currentSemester,
    gpa,
    creditsEarned,
    creditsTotal,
    distribution,
    session,
    averageBySemester: semesters
      .filter((s) => s.average != null)
      .map((s) => ({ semester: s.number, value: s.average })),
    rank,
  };
}

export function buildApplications(rows, now) {
  const byCode = new Map(DOC_CATALOG.map((item) => [item.code, item]));
  return rows.map((row) => {
    const type = byCode.get(row.type_code) ?? DOC_CATALOG[0];
    const created = Date.parse(row.created_at);
    const updated = Date.parse(row.updated_at);
    const elapsedMin = (now - created) / 60000;
    let status = row.status;
    const auto = Boolean(row.auto_progress);
    if (auto) {
      if (elapsedMin < row.review_minutes) status = 'submitted';
      else if (elapsedMin < row.ready_minutes) status = 'in_review';
      else status = type.kind === 'statement' ? 'approved' : 'ready';
    }

    const events = [{ status: 'submitted', at: new Date(created).toISOString() }];
    if (auto) {
      const reviewAt = created + row.review_minutes * 60000;
      const readyAt = created + row.ready_minutes * 60000;
      if (now >= reviewAt) events.push({ status: 'in_review', at: new Date(reviewAt).toISOString() });
      if (now >= readyAt) {
        events.push({ status: type.kind === 'statement' ? 'approved' : 'ready', at: new Date(readyAt).toISOString() });
      }
    } else if (row.status !== 'submitted') {
      if (row.status === 'issued') {
        const readyAt = Math.min(created + row.ready_minutes * 60000, updated - 60000);
        events.push({ status: 'ready', at: new Date(readyAt).toISOString() });
      }
      events.push({ status: row.status, at: new Date(updated).toISOString() });
    }

    return {
      id: row.id,
      typeCode: row.type_code,
      kind: type.kind,
      icon: type.icon,
      title: type.title,
      reference: row.reference,
      status,
      statusLabel: STATUS_LABELS[status] ?? STATUS_LABELS.submitted,
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(updated).toISOString(),
      copies: row.copies,
      delivery: row.delivery,
      urgency: row.urgency,
      comment: row.comment ?? '',
      eta: type.eta,
      events,
      canCancel: status === 'submitted' || status === 'in_review',
      canCollect: status === 'ready',
      resultCode: row.reference.replace(/[^A-Z0-9]/g, ''),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buildNotifications(items, readIds, now, dateStr, extra = []) {
  const read = new Set(readIds);
  const mapped = items.map((item) => {
    const created = new Date(now - item.ageHours * 3600000).toISOString();
    return {
      id: item.id,
      category: item.category,
      title: item.title,
      body: item.body,
      pinned: Boolean(item.pinned),
      createdAt: created,
      dueAt: item.dueInDays != null ? `${addDays(dateStr, item.dueInDays)}T12:00:00.000Z` : null,
      dueInDays: item.dueInDays ?? null,
      action: item.action ?? null,
      read: read.has(item.id),
    };
  });
  return [...extra, ...mapped].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function publicCatalog() {
  return DOC_CATALOG.map(({ code, kind, icon, title, description, eta, popular, fields }) => ({
    code, kind, icon, title, description, eta, popular: Boolean(popular), fields,
  }));
}

export function buildPayload({ student, content, now, dateStr, reads, applications, gradeRows = [], scheduleChanges = [] }) {
  const profile = student.profile ?? content.profile;
  const courses = mergeCourseGrades(content.courses, gradeRows);
  const grades = buildGrades(courses, profile, content.rank, content.creditsTotal);
  const upcomingChanges = upcomingScheduleChanges(scheduleChanges, dateStr);
  return {
    ok: true,
    serverTime: new Date(now).toISOString(),
    university: UNIVERSITY,
    profile: {
      id: student.id,
      login: student.login,
      hue: content.hue,
      ...profile,
      academic: {
        gpa: grades.gpa,
        creditsEarned: grades.creditsEarned,
        creditsTotal: grades.creditsTotal,
        rank: content.rank,
        currentSemester: grades.currentSemester,
      },
    },
    schedule: {
      ...buildSchedule(content.schedule, dateStr, scheduleChanges),
      upcomingChanges,
    },
    grades,
    applications: buildApplications(applications, now),
    notifications: buildNotifications(
      content.notifications, reads, now, dateStr,
      scheduleNotifications(scheduleChanges, dateStr, reads, now),
    ),
    catalog: publicCatalog(),
  };
}

export function buildDeanScheduleView({ groups, groupCode, dateStr, changes, now }) {
  const group = groups.find((item) => item.code === groupCode) ?? groups[0];
  const schedule = buildSchedule(group.entries, dateStr, changes);
  return {
    ok: true,
    serverTime: new Date(now).toISOString(),
    groups: groups.map(({ code, label }) => ({ code, label })),
    group: group.code,
    courses: group.courses,
    kinds: Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label })),
    monday: schedule.monday,
    weekNumber: schedule.weekNumber,
    days: schedule.days,
  };
}

export function staffProfile(content) {
  return {
    id: content.id,
    login: content.login,
    role: content.role,
    hue: content.hue,
    fullName: content.profile.fullName,
    shortName: content.profile.shortName,
    title: content.profile.title,
    faculty: content.profile.faculty,
    email: content.profile.email,
  };
}

export function currentSemesterOf(courses) {
  const pending = courses.filter((course) => course.grade == null && course.passed == null).map((course) => course.semester);
  if (pending.length) return Math.max(...pending);
  return courses.reduce((max, course) => Math.max(max, course.semester), 1);
}

export function buildTeacherView({ content, students, gradeRows, now }) {
  const rows = new Map(gradeRows.map((row) => [`${row.student_id}:${row.course_code}`, row]));
  const courses = new Map();
  for (const student of Object.values(students)) {
    for (const course of student.courses) {
      if (!content.courseCodes.includes(course.code)) continue;
      const row = rows.get(`${student.id}:${course.code}`);
      const grade = row?.grade ?? course.grade ?? null;
      const passed = row?.passed != null ? Boolean(row.passed) : (course.passed ?? null);
      const points = row?.points ?? course.points ?? null;
      let entry = courses.get(course.code);
      if (!entry) {
        entry = {
          code: course.code,
          title: course.title,
          semester: course.semester,
          credits: course.credits,
          assessment: course.assessment,
          groups: new Set(),
          students: [],
        };
        courses.set(course.code, entry);
      }
      entry.groups.add(student.profile.group);
      entry.students.push({
        studentId: student.id,
        login: student.login,
        name: student.profile.shortName,
        fullName: student.profile.fullName,
        group: student.profile.group,
        year: student.profile.year,
        program: student.profile.program,
        grade: grade == null ? null : grade,
        passed: passed == null ? null : Boolean(passed),
        points: points == null ? null : Number(points),
        pendingGrade: grade == null && passed == null,
        updatedAt: row?.updated_at ?? null,
      });
    }
  }
  const list = [...courses.values()]
    .map((entry) => {
      const withPoints = entry.students.filter((item) => item.points != null);
      return {
        ...entry,
        groups: [...entry.groups].sort(),
        students: entry.students.sort((a, b) => a.fullName.ru.localeCompare(b.fullName.ru)),
        averagePoints: withPoints.length
          ? Math.round(withPoints.reduce((sum, item) => sum + item.points, 0) / withPoints.length)
          : null,
        ungraded: entry.students.filter((item) => item.pendingGrade).length,
      };
    })
    .filter((entry) => entry.ungraded > 0 || entry.students.some((item) => item.updatedAt))
    .sort((a, b) => b.semester - a.semester || a.code.localeCompare(b.code));
  return {
    ok: true,
    serverTime: new Date(now).toISOString(),
    university: UNIVERSITY,
    teacher: staffProfile(content),
    courses: list,
    stats: {
      courses: list.length,
      students: list.reduce((sum, entry) => sum + entry.students.length, 0),
      ungraded: list.reduce((sum, entry) => sum + entry.ungraded, 0),
    },
  };
}

export function buildDeanQueue({ rows, students, now }) {
  const byId = new Map(Object.values(students).map((content) => [content.id, content]));
  return buildApplications(rows, now).map((app) => {
    const row = rows.find((item) => item.id === app.id);
    const student = row ? byId.get(row.student_id) : null;
    return {
      ...app,
      student: student ? {
        id: student.id,
        login: student.login,
        name: student.profile.shortName,
        fullName: student.profile.fullName,
        group: student.profile.group,
        program: student.profile.program,
        year: student.profile.year,
        email: student.profile.email,
      } : null,
    };
  });
}
