import { DOC_CATALOG, DEANS, KIND_LABELS, STAFF, STUDENTS, TEACHERS, UNIVERSITY } from './catalog.mjs';
import {
  AppError, burnPasswordCycle, clearSessionCookie, consumeLoginAttempt, createSession,
  currentSession, fail, hashPassword, sessionCookie, verifyPassword, SESSION_TTL_SECONDS,
} from './auth.mjs';
import {
  buildApplications, buildDeanQueue, buildDeanScheduleView, buildPayload, buildTeacherView, classRefOf,
  currentSemesterOf, mergeScheduleSources, parseDate, publicCatalog, staffProfile, toDateStr, weekdayOf,
} from './derive.mjs';

const BODY_LIMIT = 8192;
const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const minutesOf = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const cleanText = (value, max) => {
  if (typeof value !== 'string') return '';
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length > max ? null : text;
};
const NO_STORE = {
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

const json = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { ...NO_STORE, ...extra } });

function applicationPath(request) {
  const match = new URL(request.url).pathname.match(/^\/(?:functions\/v1\/)?(?:app|app-d[0-9a-f]{32})(\/.*)?$/);
  if (!match) fail('not_found', 404);
  return match[1] || '/';
}

async function readJson(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') fail('invalid_input', 400);
  const reader = request.body?.getReader();
  if (!reader) fail('invalid_input', 400);
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > BODY_LIMIT) { await reader.cancel(); fail('payload_too_large', 413); }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail('invalid_input', 400);
  }
}

function profileFromRow(row) {
  return {
    fullName: { ru: row.full_name_ru, en: row.full_name_en },
    shortName: { ru: row.short_name_ru, en: row.short_name_en },
    faculty: { ru: row.faculty_ru, en: row.faculty_en },
    program: { ru: row.program_ru, en: row.program_en },
    degree: { ru: row.degree_ru, en: row.degree_en },
    studyForm: { ru: row.study_form_ru, en: row.study_form_en },
    group: row.group_name,
    studentCard: row.student_card,
    email: row.email,
    phone: row.phone,
    year: row.year,
    admissionYear: row.admission_year,
    curator: { ru: row.curator_ru, en: row.curator_en },
  };
}

function studentRow(content, secret, now) {
  const p = content.profile;
  return {
    id: content.id,
    login: content.login,
    password_hash: secret.hash,
    password_salt: secret.salt,
    password_iterations: secret.iterations,
    full_name_ru: p.fullName.ru,
    full_name_en: p.fullName.en,
    short_name_ru: p.shortName.ru,
    short_name_en: p.shortName.en,
    faculty_ru: p.faculty.ru,
    faculty_en: p.faculty.en,
    program_ru: p.program.ru,
    program_en: p.program.en,
    degree_ru: p.degree.ru,
    degree_en: p.degree.en,
    study_form_ru: p.studyForm.ru,
    study_form_en: p.studyForm.en,
    year: p.year,
    group_name: p.group,
    student_card: p.studentCard,
    email: p.email,
    phone: p.phone,
    admission_year: p.admissionYear,
    curator_ru: p.curator.ru,
    curator_en: p.curator.en,
    created_at: new Date(now).toISOString(),
  };
}

function demoRow(studentId, demo, now) {
  const type = DOC_CATALOG.find((item) => item.code === demo.typeCode);
  return {
    id: crypto.randomUUID(),
    student_id: studentId,
    type_code: demo.typeCode,
    reference: demo.reference,
    status: demo.status,
    auto_progress: false,
    review_minutes: demo.reviewMinutes,
    ready_minutes: demo.readyMinutes,
    copies: demo.copies,
    delivery: demo.delivery,
    urgency: demo.urgency,
    comment: demo.comment ?? '',
    created_at: new Date(now - demo.createdDaysAgo * 86400000).toISOString(),
    updated_at: new Date(now - demo.updatedDaysAgo * 86400000).toISOString(),
  };
}

function staffRow(content, secret, now) {
  const p = content.profile;
  return {
    id: content.id,
    login: content.login,
    role: content.role,
    password_hash: secret.hash,
    password_salt: secret.salt,
    password_iterations: secret.iterations,
    full_name_ru: p.fullName.ru,
    full_name_en: p.fullName.en,
    short_name_ru: p.shortName.ru,
    short_name_en: p.shortName.en,
    title_ru: p.title.ru,
    title_en: p.title.en,
    faculty_ru: p.faculty.ru,
    faculty_en: p.faculty.en,
    email: p.email,
    created_at: new Date(now).toISOString(),
  };
}

export function createApp({ store, now = () => Date.now() }) {
  let seeding = null;

  function scheduleGroups() {
    const groups = new Map();
    for (const content of Object.values(STUDENTS)) {
      const code = content.profile.group;
      if (groups.has(code)) continue;
      const semester = currentSemesterOf(content.courses);
      groups.set(code, {
        code,
        label: {
          ru: `${code} · ${content.profile.program.ru}, ${content.profile.year} курс`,
          en: `${code} · ${content.profile.program.en}, year ${content.profile.year}`,
        },
        entries: content.schedule,
        courses: content.courses
          .filter((course) => course.semester === semester)
          .map(({ code: courseCode, title, teacher }) => ({ code: courseCode, title, teacher })),
      });
    }
    return [...groups.values()];
  }

  function occurrenceOf(group, date, ref) {
    const weekday = weekdayOf(date);
    return group.entries.find((entry) => entry.weekday === weekday && classRefOf(entry) === ref) ?? null;
  }

  function snapshotOf(group, entry, date) {
    const course = group.courses.find((item) => item.title.ru === entry.title.ru);
    return {
      group_code: group.code,
      class_kind: entry.kind,
      base_date: date,
      base_ref: classRefOf(entry),
      course_code: course?.code ?? null,
      title_ru: entry.title.ru,
      title_en: entry.title.en,
      start_time: entry.start,
      end_time: entry.end,
      room: entry.room,
      building_ru: entry.building.ru,
      building_en: entry.building.en,
      teacher_ru: entry.teacher.ru,
      teacher_en: entry.teacher.en,
    };
  }

  async function assertNoChange(groupCode, date, ref) {
    const existing = (await store.listScheduleChanges(groupCode))
      .find((row) => row.base_date === date && row.base_ref === ref);
    if (existing) fail('duplicate_change', 409);
  }

  function teacherMatcher(content) {
    const ruSurname = content.profile.fullName.ru.split(/\s+/)[0].toLowerCase();
    const enSurname = content.profile.fullName.en.split(/\s+/).slice(-1)[0].toLowerCase();
    const courseTitles = new Set();
    for (const student of Object.values(STUDENTS)) {
      for (const course of student.courses) {
        if (content.courseCodes?.includes(course.code)) courseTitles.add(course.title.ru.toLowerCase());
      }
    }
    return (entry) => {
      const text = `${entry.teacher?.ru ?? ''} ${entry.teacher?.en ?? ''}`.toLowerCase();
      if (text.includes(ruSurname) || text.includes(enSurname)) return true;
      return courseTitles.has((entry.title?.ru ?? '').toLowerCase());
    };
  }

  async function teacherSources(content) {
    const matches = teacherMatcher(content);
    const sources = [];
    for (const group of scheduleGroups()) {
      const entries = group.entries.filter(matches);
      if (!entries.length) continue;
      const changes = (await store.listScheduleChanges(group.code)).filter((row) => matches({
        teacher: { ru: row.teacher_ru, en: row.teacher_en },
        title: { ru: row.title_ru, en: row.title_en },
      }));
      sources.push({ code: group.code, entries, changes });
    }
    return sources;
  }

  function lookupEntries(query) {
    const groups = scheduleGroups().map((group) => ({
      kind: 'group',
      key: group.code,
      label: group.label,
      meta: { ru: 'Учебная группа', en: 'Study group' },
    }));
    const teachers = Object.values(TEACHERS).map((content) => ({
      kind: 'teacher',
      key: content.login,
      label: content.profile.fullName,
      meta: content.profile.title,
    }));
    const text = query.trim().toLowerCase();
    const all = [...groups, ...teachers];
    const matched = text
      ? all.filter((item) => `${item.key} ${item.label.ru} ${item.label.en} ${item.meta.ru} ${item.meta.en}`.toLowerCase().includes(text))
      : all;
    return matched.slice(0, 12);
  }

  // Idempotent: rows are inserted with onConflict so a partial first seed heals.
  async function ensureSeeded(at) {
    if (seeding) return seeding;
    seeding = (async () => {
      const [studentCount, staffCount] = await Promise.all([store.countStudents(), store.countStaff()]);
      await Promise.all([
        ...(studentCount === 0 ? Object.values(STUDENTS).map(async (content) => {
          const secret = await hashPassword(content.password);
          await store.seedStudent(studentRow(content, secret, at));
        }) : []),
        ...(staffCount === 0 ? Object.values(STAFF).map(async (content) => {
          const secret = await hashPassword(content.password);
          await store.seedStaff(staffRow(content, secret, at));
        }) : []),
      ]);
      await Promise.all(Object.values(STUDENTS).map(async (content) => {
        for (const demo of content.demos) {
          if (await store.countByReference(demo.reference)) continue;
          await store.insertApplication(demoRow(content.id, demo, at));
        }
        const semester = currentSemesterOf(content.courses);
        for (const course of content.courses) {
          if (course.semester !== semester || course.points == null) continue;
          if (await store.getCourseGrade(content.id, course.code)) continue;
          await store.upsertCourseGrade({
            student_id: content.id,
            course_code: course.code,
            grade: null,
            passed: null,
            points: course.points,
            updated_by: 'seed',
            updated_at: new Date(at).toISOString(),
          });
        }
      }));
    })().finally(() => { seeding = null; });
    return seeding;
  }

  async function currentSubject(request, at) {
    const session = await currentSession(store, request, at);
    if (!session) fail('unauthenticated', 401);
    if (session.subjectType === 'student') {
      const row = await store.getStudent(session.subjectId);
      const content = row ? STUDENTS[row.login] : null;
      if (!row || !content) fail('unauthenticated', 401);
      return { role: 'student', session, student: { ...row, profile: profileFromRow(row) }, content };
    }
    const row = await store.getStaff(session.subjectId);
    const content = row ? STAFF[row.login] : null;
    if (!row || !content) fail('unauthenticated', 401);
    return { role: content.role, session, staff: { ...row }, content };
  }

  function requireStudent(subject) {
    if (subject.role !== 'student') fail('role_forbidden', 403);
    return subject;
  }

  function requireStaff(subject, role) {
    if (subject.role !== role) fail('role_forbidden', 403);
    return subject;
  }

  function accountOf(subject) {
    if (subject.role === 'student') {
      return { ...subject.student.profile, id: subject.student.id, login: subject.student.login, role: 'student' };
    }
    return staffProfile(subject.content);
  }

  function validDate(value) {
    if (value == null) return toDateStr(now());
    const parsed = parseDate(value);
    if (parsed == null) fail('invalid_input', 400);
    return value;
  }

  async function makeReference(at) {
    const year = new Date(at).getUTCFullYear().toString().slice(2);
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = `ATL-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!(await store.countByReference(code))) return code;
    }
    fail('reference_unavailable', 503);
  }

  return async function handle(request) {
    const at = now();
    const path = applicationPath(request);
    const method = request.method;

    if (method !== 'GET' && method !== 'HEAD' && request.headers.get('x-atlas-request') !== '1') {
      fail('origin_forbidden', 403);
    }

    if (path === '/api/health' && method === 'GET') return json({ ok: true });
    if (path === '/api/public' && method === 'GET') {
      return json({ ok: true, university: UNIVERSITY, catalog: publicCatalog() });
    }

    if (path === '/api/login' && method === 'POST') {
      await ensureSeeded(at);
      const body = await readJson(request);
      const login = typeof body?.login === 'string' ? body.login.trim().toLowerCase() : '';
      const password = typeof body?.password === 'string' ? body.password : '';
      if (!LOGIN_RE.test(login) || password.length < 1 || password.length > 128) fail('invalid_input', 400);
      await consumeLoginAttempt(store, login, at);
      const studentRowFound = await store.findStudentByLogin(login);
      let found = null;
      if (studentRowFound && STUDENTS[studentRowFound.login]) {
        found = { role: 'student', row: studentRowFound, content: STUDENTS[studentRowFound.login] };
      } else {
        const staffRowFound = await store.findStaffByLogin(login);
        if (staffRowFound && STAFF[staffRowFound.login]) {
          found = { role: STAFF[staffRowFound.login].role, row: staffRowFound, content: STAFF[staffRowFound.login] };
        }
      }
      const valid = found
        ? await verifyPassword(password, { salt: found.row.password_salt, hash: found.row.password_hash, iterations: found.row.password_iterations })
        : await burnPasswordCycle(password);
      if (!found || !valid) fail('invalid_credentials', 401);
      const session = await createSession(store, { type: found.role === 'student' ? 'student' : 'staff', id: found.row.id }, at);
      const account = found.role === 'student'
        ? { ...profileFromRow(found.row), id: found.row.id, login: found.row.login, role: 'student' }
        : staffProfile(found.content);
      return json(
        { ok: true, role: found.role, account },
        200,
        { 'set-cookie': sessionCookie(request, session.token, session.maxAge) },
      );
    }

    if (path === '/api/logout' && method === 'POST') {
      const session = await currentSession(store, request, at);
      if (session) await store.revokeSession(session.digest);
      return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie(request) });
    }

    if (path === '/api/session' && method === 'GET') {
      const subject = await currentSubject(request, at);
      return json({ ok: true, role: subject.role, account: accountOf(subject) });
    }

    if (path === '/api/data' && method === 'GET') {
      const { student, content } = requireStudent(await currentSubject(request, at));
      const date = validDate(new URL(request.url).searchParams.get('date'));
      const [reads, applications, gradeRows, scheduleChanges] = await Promise.all([
        store.listReads(student.id),
        store.listApplications(student.id),
        store.listCourseGradesForStudent(student.id),
        store.listScheduleChanges(content.profile.group),
      ]);
      return json(buildPayload({
        student,
        content,
        now: at,
        dateStr: date,
        reads: reads.map((row) => row.notification_id),
        applications,
        gradeRows,
        scheduleChanges,
      }));
    }

    if (path === '/api/applications' && method === 'POST') {
      const { student, content } = requireStudent(await currentSubject(request, at));
      const body = await readJson(request);
      const type = DOC_CATALOG.find((item) => item.code === body?.typeCode);
      if (!type) fail('invalid_input', 400);
      const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
      if (comment.length > 1000) fail('invalid_input', 400);
      if (type.fields.includes('comment') && comment.length < 10 && type.kind === 'statement') fail('comment_required', 400);
      const copies = type.fields.includes('copies') ? Number(body?.copies ?? 1) : 1;
      if (!Number.isInteger(copies) || copies < 1 || copies > 5) fail('invalid_input', 400);
      const delivery = type.fields.includes('delivery') && body?.delivery === 'paper' ? 'paper' : 'digital';
      const urgency = type.fields.includes('urgency') && body?.urgency === 'urgent' ? 'urgent' : 'normal';

      const active = (await store.listApplications(student.id)).filter((row) => row.status === 'submitted' || row.status === 'in_review' || row.auto_progress);
      if (active.length >= 10) fail('too_many_requests', 409);
      const open = active.filter((row) => row.type_code === type.code).length;
      if (open >= 3) fail('duplicate_request', 409);

      const row = {
        id: crypto.randomUUID(),
        student_id: student.id,
        type_code: type.code,
        reference: await makeReference(at),
        status: 'submitted',
        auto_progress: true,
        review_minutes: urgency === 'urgent' ? Math.max(1, Math.round(type.reviewMinutes / 3)) : type.reviewMinutes,
        ready_minutes: urgency === 'urgent' ? Math.max(2, Math.round(type.readyMinutes / 3)) : type.readyMinutes,
        copies,
        delivery,
        urgency,
        comment,
        created_at: new Date(at).toISOString(),
        updated_at: new Date(at).toISOString(),
      };
      await store.insertApplication(row);
      const [application] = buildApplications([row], at);
      return json({ ok: true, application }, 201);
    }

    const action = path.match(/^\/api\/applications\/([0-9a-f-]{36})\/(cancel|collect)$/);
    if (action && method === 'POST') {
      const { student } = requireStudent(await currentSubject(request, at));
      if (!UUID_RE.test(action[1])) fail('not_found', 404);
      const row = await store.getApplication(student.id, action[1]);
      if (!row) fail('not_found', 404);
      const [current] = buildApplications([row], at);
      if (action[2] === 'cancel') {
        if (!current.canCancel) fail('not_cancellable', 409);
        const updated = await store.updateApplication(row.id, student.id, {
          status: 'cancelled', auto_progress: false, updated_at: new Date(at).toISOString(),
        });
        if (!updated) fail('not_found', 404);
        const [application] = buildApplications([updated], at);
        return json({ ok: true, application });
      }
      if (!current.canCollect) fail('not_collectable', 409);
      const updated = await store.updateApplication(row.id, student.id, {
        status: 'issued', auto_progress: false, updated_at: new Date(at).toISOString(),
      });
      if (!updated) fail('not_found', 404);
      const [application] = buildApplications([updated], at);
      return json({ ok: true, application });
    }

    if (path === '/api/notifications/read' && method === 'POST') {
      const { student, content } = requireStudent(await currentSubject(request, at));
      const body = await readJson(request);
      const changeRows = await store.listScheduleChanges(content.profile.group);
      const allowed = new Set([
        ...content.notifications.map((item) => item.id),
        ...changeRows.map((row) => `sch-${row.id}`),
      ]);
      let ids = [];
      if (body?.all === true) ids = [...allowed];
      else if (Array.isArray(body?.ids)) {
        if (body.ids.length > 100 || body.ids.some((id) => typeof id !== 'string' || !allowed.has(id))) fail('invalid_input', 400);
        ids = [...new Set(body.ids)];
      } else fail('invalid_input', 400);
      for (const id of ids) await store.markRead(student.id, id, new Date(at).toISOString());
      return json({ ok: true, marked: ids.length });
    }

    if (path === '/api/security/revoke-all' && method === 'POST') {
      const subject = await currentSubject(request, at);
      const revoked = await store.revokeAllSessions(subject.session.subjectType, subject.session.subjectId);
      return json({ ok: true, revoked }, 200, { 'set-cookie': clearSessionCookie(request) });
    }

    if (path === '/api/schedule/lookup' && method === 'GET') {
      await currentSubject(request, at);
      const query = new URL(request.url).searchParams.get('q') ?? '';
      if (query.length > 80) fail('invalid_input', 400);
      return json({ ok: true, results: lookupEntries(query) });
    }

    if (path === '/api/schedule/view' && method === 'GET') {
      await currentSubject(request, at);
      const url = new URL(request.url);
      const date = validDate(url.searchParams.get('date'));
      const groupCode = url.searchParams.get('group');
      const teacherLogin = url.searchParams.get('teacher');
      if (groupCode) {
        const group = scheduleGroups().find((item) => item.code === groupCode);
        if (!group) fail('not_found', 404);
        const changes = await store.listScheduleChanges(group.code);
        const schedule = mergeScheduleSources([{ code: group.code, entries: group.entries, changes }], date);
        return json({
          ok: true,
          serverTime: new Date(at).toISOString(),
          target: { kind: 'group', key: group.code, label: group.label, meta: { ru: 'Учебная группа', en: 'Study group' } },
          ...schedule,
        });
      }
      if (teacherLogin) {
        const content = TEACHERS[teacherLogin];
        if (!content) fail('not_found', 404);
        const sources = await teacherSources(content);
        const schedule = mergeScheduleSources(sources, date);
        return json({
          ok: true,
          serverTime: new Date(at).toISOString(),
          target: { kind: 'teacher', key: content.login, label: content.profile.fullName, meta: content.profile.title },
          groups: sources.map((source) => source.code),
          ...schedule,
        });
      }
      fail('invalid_input', 400);
    }

    if (path === '/api/teacher' && method === 'GET') {
      const subject = requireStaff(await currentSubject(request, at), 'teacher');
      const gradeRows = await store.listCourseGradesByCodes(subject.content.courseCodes);
      return json(buildTeacherView({ content: subject.content, students: STUDENTS, gradeRows, now: at }));
    }

    if (path === '/api/teacher/schedule' && method === 'GET') {
      const subject = requireStaff(await currentSubject(request, at), 'teacher');
      const date = validDate(new URL(request.url).searchParams.get('date'));
      const sources = await teacherSources(subject.content);
      const schedule = mergeScheduleSources(sources, date);
      return json({
        ok: true,
        serverTime: new Date(at).toISOString(),
        teacher: staffProfile(subject.content),
        groups: sources.map((source) => source.code),
        ...schedule,
      });
    }

    if (path === '/api/teacher/grades' && method === 'POST') {
      const subject = requireStaff(await currentSubject(request, at), 'teacher');
      const body = await readJson(request);
      const courseCode = typeof body?.courseCode === 'string' ? body.courseCode : '';
      if (!subject.content.courseCodes.includes(courseCode)) fail('not_found', 404);
      const studentId = typeof body?.studentId === 'string' ? body.studentId : '';
      if (!UUID_RE.test(studentId)) fail('invalid_input', 400);
      const studentContent = Object.values(STUDENTS).find((item) => item.id === studentId);
      const course = studentContent?.courses.find((item) => item.code === courseCode);
      if (!studentContent || !course) fail('not_found', 404);

      const hasGrade = Object.prototype.hasOwnProperty.call(body, 'grade');
      const hasPassed = Object.prototype.hasOwnProperty.call(body, 'passed');
      const hasPoints = Object.prototype.hasOwnProperty.call(body, 'points');
      if (!hasGrade && !hasPassed && !hasPoints) fail('invalid_input', 400);

      let grade = null;
      if (hasGrade) {
        if (course.assessment === 'pass_fail') fail('invalid_input', 400);
        if (body.grade !== null) {
          if (!Number.isInteger(body.grade) || body.grade < 2 || body.grade > 5) fail('invalid_input', 400);
          grade = body.grade;
        }
      }
      let passed = null;
      if (hasPassed) {
        if (course.assessment !== 'pass_fail') fail('invalid_input', 400);
        if (body.passed !== null) {
          if (typeof body.passed !== 'boolean') fail('invalid_input', 400);
          passed = body.passed;
        }
      }
      let points = null;
      if (hasPoints) {
        if (body.points !== null) {
          if (!Number.isSafeInteger(body.points) || body.points < 0 || body.points > 100) fail('invalid_input', 400);
          points = body.points;
        }
      }

      const existing = await store.getCourseGrade(studentId, courseCode);
      const record = {
        student_id: studentId,
        course_code: courseCode,
        grade: hasGrade ? grade : (existing?.grade ?? null),
        passed: hasPassed ? passed : (existing?.passed ?? null),
        points: hasPoints ? points : (existing?.points ?? course.points ?? null),
        updated_by: subject.content.login,
        updated_at: new Date(at).toISOString(),
      };
      await store.upsertCourseGrade(record);
      const entry = {
        studentId,
        login: studentContent.login,
        name: studentContent.profile.shortName,
        fullName: studentContent.profile.fullName,
        group: studentContent.profile.group,
        year: studentContent.profile.year,
        program: studentContent.profile.program,
        grade: record.grade,
        passed: record.passed,
        points: record.points,
        pendingGrade: record.grade == null && record.passed == null,
        updatedAt: record.updated_at,
      };
      return json({ ok: true, entry });
    }

    if (path === '/api/dean' && method === 'GET') {
      const subject = requireStaff(await currentSubject(request, at), 'dean');
      const rows = await store.listAllApplications();
      return json({
        ok: true,
        serverTime: new Date(at).toISOString(),
        university: UNIVERSITY,
        dean: staffProfile(subject.content),
        applications: buildDeanQueue({ rows, students: STUDENTS, now: at }),
      });
    }

    if (path === '/api/dean/schedule' && method === 'GET') {
      requireStaff(await currentSubject(request, at), 'dean');
      const url = new URL(request.url);
      const groups = scheduleGroups();
      const group = groups.find((item) => item.code === url.searchParams.get('group')) ?? groups[0];
      const date = validDate(url.searchParams.get('date'));
      const changes = await store.listScheduleChanges(group.code);
      return json(buildDeanScheduleView({ groups, groupCode: group.code, dateStr: date, changes, now: at }));
    }

    if (path === '/api/dean/schedule/create' && method === 'POST') {
      const subject = requireStaff(await currentSubject(request, at), 'dean');
      const body = await readJson(request);
      const group = scheduleGroups().find((item) => item.code === body?.group);
      if (!group) fail('invalid_input', 400);
      const date = typeof body?.date === 'string' ? body.date : '';
      if (parseDate(date) == null) fail('invalid_input', 400);
      const course = group.courses.find((item) => item.code === body?.courseCode);
      const kind = typeof body?.kind === 'string' ? body.kind : '';
      if (!course || !Object.prototype.hasOwnProperty.call(KIND_LABELS, kind)) fail('invalid_input', 400);
      const start = typeof body?.start === 'string' ? body.start : '';
      const end = typeof body?.end === 'string' ? body.end : '';
      if (!TIME_RE.test(start) || !TIME_RE.test(end) || minutesOf(end) <= minutesOf(start)) fail('invalid_input', 400);
      const room = cleanText(body?.room, 40);
      const building = cleanText(body?.building, 40);
      const note = cleanText(body?.note, 300);
      if (!room || !building || note === null) fail('invalid_input', 400);
      const duplicate = (await store.listScheduleChanges(group.code)).some((row) =>
        row.change_kind === 'created' && row.base_date === date
        && row.course_code === course.code && row.start_time === start);
      if (duplicate) fail('duplicate_change', 409);
      await store.insertScheduleChange({
        id: crypto.randomUUID(),
        group_code: group.code,
        change_kind: 'created',
        class_kind: kind,
        base_date: date,
        base_ref: null,
        course_code: course.code,
        title_ru: course.title.ru,
        title_en: course.title.en,
        start_time: start,
        end_time: end,
        new_date: null,
        new_start: null,
        new_end: null,
        new_room: null,
        room,
        building_ru: building,
        building_en: building,
        teacher_ru: course.teacher.ru,
        teacher_en: course.teacher.en,
        note_ru: note || null,
        note_en: note || null,
        created_by: subject.content.login,
        created_at: new Date(at).toISOString(),
      });
      return json({ ok: true }, 201);
    }

    if (path === '/api/dean/schedule/cancel' && method === 'POST') {
      const subject = requireStaff(await currentSubject(request, at), 'dean');
      const body = await readJson(request);
      const group = scheduleGroups().find((item) => item.code === body?.group);
      if (!group) fail('invalid_input', 400);
      const date = typeof body?.date === 'string' ? body.date : '';
      if (parseDate(date) == null) fail('invalid_input', 400);
      const entry = occurrenceOf(group, date, typeof body?.ref === 'string' ? body.ref : '');
      if (!entry) fail('not_found', 404);
      const note = cleanText(body?.note, 300);
      if (note === null) fail('invalid_input', 400);
      await assertNoChange(group.code, date, classRefOf(entry));
      await store.insertScheduleChange({
        ...snapshotOf(group, entry, date),
        id: crypto.randomUUID(),
        change_kind: 'cancelled',
        new_date: null,
        new_start: null,
        new_end: null,
        new_room: null,
        note_ru: note || 'Занятие отменено деканатом.',
        note_en: note || 'Cancelled by the dean’s office.',
        created_by: subject.content.login,
        created_at: new Date(at).toISOString(),
      });
      return json({ ok: true }, 201);
    }

    if (path === '/api/dean/schedule/move' && method === 'POST') {
      const subject = requireStaff(await currentSubject(request, at), 'dean');
      const body = await readJson(request);
      const group = scheduleGroups().find((item) => item.code === body?.group);
      if (!group) fail('invalid_input', 400);
      const newDate = typeof body?.newDate === 'string' ? body.newDate : '';
      if (parseDate(newDate) == null) fail('invalid_input', 400);
      const newStart = typeof body?.newStart === 'string' ? body.newStart : '';
      const newEnd = typeof body?.newEnd === 'string' ? body.newEnd : '';
      if (!TIME_RE.test(newStart) || !TIME_RE.test(newEnd) || minutesOf(newEnd) <= minutesOf(newStart)) fail('invalid_input', 400);
      const newRoom = cleanText(body?.newRoom, 40);
      const note = cleanText(body?.note, 300);
      if (newRoom === null || note === null) fail('invalid_input', 400);

      // Moving an already adjusted class again updates that adjustment in place,
      // so a class can be rescheduled any number of times without piling up changes.
      const changeId = typeof body?.changeId === 'string' ? body.changeId : '';
      if (changeId) {
        if (!UUID_RE.test(changeId)) fail('invalid_input', 400);
        const row = (await store.listScheduleChanges(group.code))
          .find((item) => item.id === changeId && (item.change_kind === 'moved' || item.change_kind === 'created'));
        if (!row) fail('not_found', 404);
        const same = row.change_kind === 'moved'
          ? newDate === row.new_date && newStart === row.new_start && newEnd === row.new_end && (!newRoom || newRoom === row.new_room)
          : newDate === row.base_date && newStart === row.start_time && newEnd === row.end_time && (!newRoom || newRoom === row.room);
        if (same) fail('invalid_input', 400);
        const patch = row.change_kind === 'moved'
          ? {
            new_date: newDate,
            new_start: newStart,
            new_end: newEnd,
            new_room: newRoom || row.new_room || null,
            note_ru: note || row.note_ru || 'Занятие перенесено деканатом.',
            note_en: note || row.note_en || 'Rescheduled by the dean’s office.',
            created_at: new Date(at).toISOString(),
          }
          : {
            base_date: newDate,
            start_time: newStart,
            end_time: newEnd,
            room: newRoom || row.room,
            note_ru: note || row.note_ru || 'Занятие перенесено деканатом.',
            note_en: note || row.note_en || 'Rescheduled by the dean’s office.',
            created_at: new Date(at).toISOString(),
          };
        const updated = await store.updateScheduleChange(changeId, patch);
        if (!updated) fail('not_found', 404);
        return json({ ok: true });
      }

      const date = typeof body?.date === 'string' ? body.date : '';
      if (parseDate(date) == null) fail('invalid_input', 400);
      const entry = occurrenceOf(group, date, typeof body?.ref === 'string' ? body.ref : '');
      if (!entry) fail('not_found', 404);
      if (newDate === date && newStart === entry.start && newEnd === entry.end && (!newRoom || newRoom === entry.room)) {
        fail('invalid_input', 400);
      }
      await assertNoChange(group.code, date, classRefOf(entry));
      await store.insertScheduleChange({
        ...snapshotOf(group, entry, date),
        id: crypto.randomUUID(),
        change_kind: 'moved',
        new_date: newDate,
        new_start: newStart,
        new_end: newEnd,
        new_room: newRoom || null,
        note_ru: note || 'Занятие перенесено деканатом.',
        note_en: note || 'Rescheduled by the dean’s office.',
        created_by: subject.content.login,
        created_at: new Date(at).toISOString(),
      });
      return json({ ok: true }, 201);
    }

    if (path === '/api/dean/schedule/restore' && method === 'POST') {
      requireStaff(await currentSubject(request, at), 'dean');
      const body = await readJson(request);
      const group = scheduleGroups().find((item) => item.code === body?.group);
      const id = typeof body?.id === 'string' ? body.id : '';
      if (!group || !UUID_RE.test(id)) fail('invalid_input', 400);
      const row = (await store.listScheduleChanges(group.code))
        .find((item) => item.id === id && (item.change_kind === 'cancelled' || item.change_kind === 'moved'));
      if (!row) fail('not_found', 404);
      if (!(await store.deleteScheduleChange(id))) fail('not_found', 404);
      return json({ ok: true });
    }

    if (path === '/api/dean/schedule/delete' && method === 'POST') {
      requireStaff(await currentSubject(request, at), 'dean');
      const body = await readJson(request);
      const group = scheduleGroups().find((item) => item.code === body?.group);
      const id = typeof body?.id === 'string' ? body.id : '';
      if (!group || !UUID_RE.test(id)) fail('invalid_input', 400);
      const row = (await store.listScheduleChanges(group.code))
        .find((item) => item.id === id && item.change_kind === 'created');
      if (!row) fail('not_found', 404);
      if (!(await store.deleteScheduleChange(id))) fail('not_found', 404);
      return json({ ok: true });
    }

    const deanAction = path.match(/^\/api\/dean\/applications\/([0-9a-f-]{36})\/status$/);
    if (deanAction && method === 'POST') {
      requireStaff(await currentSubject(request, at), 'dean');
      if (!UUID_RE.test(deanAction[1])) fail('not_found', 404);
      const body = await readJson(request);
      const target = typeof body?.status === 'string' ? body.status : '';
      const row = await store.getApplicationById(deanAction[1]);
      if (!row) fail('not_found', 404);
      const type = DOC_CATALOG.find((item) => item.code === row.type_code);
      if (!type) fail('not_found', 404);
      const [current] = buildApplications([row], at);
      const nextSteps = type.kind === 'certificate' ? ['ready'] : ['approved'];
      // Decisions stay revisable: staff can reopen a request or change an earlier
      // outcome at any point, and the student sees the latest status immediately.
      const allowed = {
        submitted: ['in_review', 'rejected', ...nextSteps],
        in_review: ['rejected', ...nextSteps],
        ready: ['in_review', 'rejected', 'issued'],
        approved: ['in_review', 'rejected'],
        issued: ['in_review', 'ready', 'rejected'],
        rejected: ['in_review', ...nextSteps],
        cancelled: [],
      }[current.status] ?? [];
      if (!allowed.includes(target)) fail('invalid_transition', 409);
      const updated = await store.updateApplicationById(row.id, {
        status: target,
        auto_progress: false,
        updated_at: new Date(at).toISOString(),
      });
      if (!updated) fail('not_found', 404);
      const [application] = buildApplications([updated], at);
      const studentContent = Object.values(STUDENTS).find((item) => item.id === updated.student_id);
      return json({
        ok: true,
        application: {
          ...application,
          student: studentContent ? {
            id: studentContent.id,
            login: studentContent.login,
            name: studentContent.profile.shortName,
            fullName: studentContent.profile.fullName,
            group: studentContent.profile.group,
            program: studentContent.profile.program,
            year: studentContent.profile.year,
            email: studentContent.profile.email,
          } : null,
        },
      });
    }

    fail('not_found', 404);
  };
}

export function errorResponse(error) {
  if (error instanceof AppError) {
    const extra = { ...(error.extra ?? {}) };
    if (extra.retryAfter) extra['retry-after'] = String(extra.retryAfter);
    return json({ error: error.code, ...(error.extra?.retryAfter ? { retryAfter: error.extra.retryAfter } : {}) }, error.status, extra);
  }
  return json({ error: 'internal_error' }, 500);
}

export { SESSION_TTL_SECONDS };
