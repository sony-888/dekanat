// Thin data-access layer. The deployed Function uses the platform database
// client; the local preview injects an in-memory implementation with the same
// methods so the real business routes can be exercised without credentials.

const DB_FAILURE = Symbol('db_failure');

function unwrap(result) {
  if (!result || result.error) throw new Error(String(DB_FAILURE));
  const data = result.data;
  if (data == null) return [];
  return Array.isArray(data) ? data : [data];
}

export function createDatabaseStore(db) {
  return {
    async countStudents() {
      return unwrap(await db.from('students').select('id').limit(1)).length;
    },
    async findStudentByLogin(login) {
      return unwrap(await db.from('students').select('*').eq('login', login).limit(1))[0] ?? null;
    },
    async getStudent(id) {
      return unwrap(await db.from('students').select('*').eq('id', id).limit(1))[0] ?? null;
    },
    async seedStudent(row) {
      const inserted = unwrap(await db.from('students')
        .insertIfAbsent(row, { onConflict: 'login' }).select('id'));
      return inserted.length === 1;
    },

    async countStaff() {
      return unwrap(await db.from('staff').select('id').limit(1)).length;
    },
    async findStaffByLogin(login) {
      return unwrap(await db.from('staff').select('*').eq('login', login).limit(1))[0] ?? null;
    },
    async getStaff(id) {
      return unwrap(await db.from('staff').select('*').eq('id', id).limit(1))[0] ?? null;
    },
    async seedStaff(row) {
      const inserted = unwrap(await db.from('staff')
        .insertIfAbsent(row, { onConflict: 'login' }).select('id'));
      return inserted.length === 1;
    },

    async createSession(row) {
      unwrap(await db.from('sessions').insertIfAbsent(row, { onConflict: 'token_digest' }).select('token_digest'));
    },
    async findSession(digest) {
      return unwrap(await db.from('sessions')
        .select('token_digest,subject_type,subject_id,expires_at,revoked_at').eq('token_digest', digest).limit(1))[0] ?? null;
    },
    async revokeSession(digest) {
      unwrap(await db.from('sessions')
        .update({ revoked_at: new Date().toISOString() }).eq('token_digest', digest).select('token_digest'));
    },
    async revokeAllSessions(subjectType, subjectId) {
      const changed = unwrap(await db.from('sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('subject_type', subjectType).eq('subject_id', subjectId)
        .select('token_digest'));
      return changed.length;
    },

    async listCourseGradesForStudent(studentId) {
      return unwrap(await db.from('course_grades')
        .select('*').eq('student_id', studentId).limit(200));
    },
    async listCourseGradesByCodes(codes) {
      if (!codes.length) return [];
      const allowed = new Set(codes);
      const rows = unwrap(await db.from('course_grades').select('*').limit(1000));
      return rows
        .filter((row) => allowed.has(row.course_code))
        .sort((a, b) => String(a.student_id).localeCompare(String(b.student_id))
          || String(a.course_code).localeCompare(String(b.course_code)));
    },
    async getCourseGrade(studentId, courseCode) {
      return unwrap(await db.from('course_grades')
        .select('*').eq('student_id', studentId).eq('course_code', courseCode).limit(1))[0] ?? null;
    },
    async upsertCourseGrade(row) {
      const inserted = unwrap(await db.from('course_grades')
        .insertIfAbsent(row, { onConflict: 'student_id,course_code' }).select('student_id'));
      if (inserted.length === 1) return;
      unwrap(await db.from('course_grades')
        .update({
          grade: row.grade, passed: row.passed, points: row.points,
          updated_by: row.updated_by, updated_at: row.updated_at,
        })
        .eq('student_id', row.student_id).eq('course_code', row.course_code)
        .select('student_id'));
    },

    async listApplications(studentId) {
      return unwrap(await db.from('applications')
        .select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(100));
    },
    async listAllApplications() {
      return unwrap(await db.from('applications')
        .select('*').order('created_at', { ascending: false }).limit(200));
    },
    async getApplication(studentId, id) {
      return unwrap(await db.from('applications')
        .select('*').eq('id', id).eq('student_id', studentId).limit(1))[0] ?? null;
    },
    async getApplicationById(id) {
      return unwrap(await db.from('applications').select('*').eq('id', id).limit(1))[0] ?? null;
    },
    async insertApplication(row) {
      unwrap(await db.from('applications')
        .insertIfAbsent(row, { onConflict: 'reference' }).select('id'));
    },
    async updateApplication(id, studentId, patch) {
      return unwrap(await db.from('applications')
        .update(patch).eq('id', id).eq('student_id', studentId).select('*'))[0] ?? null;
    },
    async updateApplicationById(id, patch) {
      return unwrap(await db.from('applications')
        .update(patch).eq('id', id).select('*'))[0] ?? null;
    },
    async countByReference(reference) {
      return unwrap(await db.from('applications').select('id').eq('reference', reference).limit(1)).length;
    },

    async listScheduleChanges(groupCode) {
      return unwrap(await db.from('schedule_changes')
        .select('*').eq('group_code', groupCode).limit(500));
    },
    async insertScheduleChange(row) {
      unwrap(await db.from('schedule_changes')
        .insertIfAbsent(row, { onConflict: 'id' }).select('id'));
    },
    async updateScheduleChange(id, patch) {
      return unwrap(await db.from('schedule_changes')
        .update(patch).eq('id', id).select('*'))[0] ?? null;
    },
    async deleteScheduleChange(id) {
      return unwrap(await db.from('schedule_changes')
        .delete().eq('id', id).select('id')).length === 1;
    },

    async listReads(studentId) {
      return unwrap(await db.from('notification_reads')
        .select('notification_id').eq('student_id', studentId).limit(500));
    },
    async markRead(studentId, notificationId, at) {
      unwrap(await db.from('notification_reads')
        .insertIfAbsent({ student_id: studentId, notification_id: notificationId, read_at: at },
          { onConflict: 'student_id,notification_id' }).select('notification_id'));
    },

    async getLimiter(key) {
      return unwrap(await db.from('auth_limiter')
        .select('key,window_started_at,attempt_count').eq('key', key).limit(1))[0] ?? null;
    },
    async insertLimiter(row) {
      const inserted = unwrap(await db.from('auth_limiter')
        .insertIfAbsent(row, { onConflict: 'key' }).select('key'));
      return inserted.length === 1;
    },
    async updateLimiter(key, seenWindowStart, patch) {
      const changed = unwrap(await db.from('auth_limiter')
        .update(patch).eq('key', key).eq('window_started_at', seenWindowStart).select('key'));
      return changed.length === 1;
    },
  };
}

// Local preview only. Keeps the same surface so app.mjs stays unchanged.
export function createMemoryStore(seedRows = []) {
  const students = new Map();
  const studentsByLogin = new Map();
  for (const row of seedRows) {
    students.set(row.id, row);
    studentsByLogin.set(row.login, row);
  }
  const staff = new Map();
  const staffByLogin = new Map();
  const sessions = new Map();
  const applications = new Map();
  const courseGrades = new Map();
  const scheduleChanges = new Map();
  const reads = new Set();
  const limiter = new Map();

  return {
    async countStudents() { return students.size; },
    async findStudentByLogin(login) { return studentsByLogin.get(login) ?? null; },
    async getStudent(id) { return students.get(id) ?? null; },
    async seedStudent(row) {
      if (studentsByLogin.has(row.login)) return false;
      students.set(row.id, row);
      studentsByLogin.set(row.login, row);
      return true;
    },

    async countStaff() { return staff.size; },
    async findStaffByLogin(login) { return staffByLogin.get(login) ?? null; },
    async getStaff(id) { return staff.get(id) ?? null; },
    async seedStaff(row) {
      if (staffByLogin.has(row.login)) return false;
      staff.set(row.id, row);
      staffByLogin.set(row.login, row);
      return true;
    },

    async createSession(row) { if (!sessions.has(row.token_digest)) sessions.set(row.token_digest, row); },
    async findSession(digest) { return sessions.get(digest) ?? null; },
    async revokeSession(digest) {
      const row = sessions.get(digest);
      if (row) row.revoked_at = new Date().toISOString();
    },
    async revokeAllSessions(subjectType, subjectId) {
      let count = 0;
      for (const row of sessions.values()) {
        if (row.subject_type === subjectType && row.subject_id === subjectId && !row.revoked_at) {
          row.revoked_at = new Date().toISOString(); count += 1;
        }
      }
      return count;
    },

    async listCourseGradesForStudent(studentId) {
      return [...courseGrades.values()].filter((row) => row.student_id === studentId);
    },
    async listCourseGradesByCodes(codes) {
      const allowed = new Set(codes);
      return [...courseGrades.values()].filter((row) => allowed.has(row.course_code));
    },
    async getCourseGrade(studentId, courseCode) {
      return courseGrades.get(`${studentId}:${courseCode}`) ?? null;
    },
    async upsertCourseGrade(row) {
      const key = `${row.student_id}:${row.course_code}`;
      courseGrades.set(key, { ...(courseGrades.get(key) ?? {}), ...row });
    },

    async listApplications(studentId) {
      return [...applications.values()]
        .filter((row) => row.student_id === studentId)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    },
    async listAllApplications() {
      return [...applications.values()]
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    },
    async getApplication(studentId, id) {
      const row = applications.get(id);
      return row && row.student_id === studentId ? row : null;
    },
    async getApplicationById(id) { return applications.get(id) ?? null; },
    async insertApplication(row) { if (![...applications.values()].some((r) => r.reference === row.reference)) applications.set(row.id, row); },
    async updateApplication(id, studentId, patch) {
      const row = applications.get(id);
      if (!row || row.student_id !== studentId) return null;
      Object.assign(row, patch);
      return row;
    },
    async updateApplicationById(id, patch) {
      const row = applications.get(id);
      if (!row) return null;
      Object.assign(row, patch);
      return row;
    },
    async countByReference(reference) {
      return [...applications.values()].filter((r) => r.reference === reference).length;
    },

    async listScheduleChanges(groupCode) {
      return [...scheduleChanges.values()].filter((row) => row.group_code === groupCode);
    },
    async insertScheduleChange(row) { scheduleChanges.set(row.id, { ...row }); },
    async updateScheduleChange(id, patch) {
      const row = scheduleChanges.get(id);
      if (!row) return null;
      Object.assign(row, patch);
      return { ...row };
    },
    async deleteScheduleChange(id) { return scheduleChanges.delete(id); },

    async listReads(studentId) {
      return [...reads].filter((key) => key.startsWith(`${studentId}:`))
        .map((key) => ({ notification_id: key.slice(studentId.length + 1) }));
    },
    async markRead(studentId, notificationId) { reads.add(`${studentId}:${notificationId}`); },

    async getLimiter(key) { return limiter.get(key) ?? null; },
    async insertLimiter(row) {
      if (limiter.has(row.key)) return false;
      limiter.set(row.key, { ...row });
      return true;
    },
    async updateLimiter(key, seenWindowStart, patch) {
      const row = limiter.get(key);
      if (!row || row.window_started_at !== seenWindowStart) return false;
      Object.assign(row, patch);
      return true;
    },
  };
}
