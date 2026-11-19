export type Lang = "ru" | "en";
export type L = { ru: string; en: string };

export type ClassKind = "lecture" | "seminar" | "lab" | "practice" | "pe" | "consult" | "exam";
export type ClassStatus = "normal" | "moved" | "cancelled" | "added";

export type ClassItem = {
  id: string;
  weekday: number;
  date: string;
  start: string;
  end: string;
  kind: ClassKind;
  kindLabel: L;
  title: L;
  room: string;
  building: L;
  teacher: L;
  status: ClassStatus;
  note: L | null;
  original: { start: string; end: string; room: string } | null;
  ref?: string | null;
  changeId?: string | null;
  group?: string | null;
};

export type Day = { date: string; weekday: number; classes: ClassItem[] };

export type UpcomingChange = {
  id: string;
  date: string;
  weekday: number;
  start: string;
  end: string;
  status: "moved" | "cancelled" | "added";
  kind: ClassKind;
  kindLabel: L;
  title: L;
  room: string;
  building: L;
  teacher: L;
  note: L | null;
  original: { start: string; end: string; room: string } | null;
  group: string;
  createdAt: string;
};

export type Schedule = {
  monday: string;
  weekNumber: number;
  days: Day[];
  changes: (ClassItem & { date: string })[];
  upcomingChanges: UpcomingChange[];
};

export type Course = {
  semester: number;
  code: string;
  title: L;
  teacher: L;
  credits: number;
  assessment: "exam" | "pass_fail" | "graded_pass";
  assessmentLabel: L;
  grade?: number | null;
  passed?: boolean | null;
  gradedAt?: string;
  points?: number | null;
  completed: boolean;
  gradeLabel: L;
};

export type Semester = {
  number: number;
  courses: Course[];
  average: number | null;
  credits: number;
  earned: number;
  completedCount: number;
  totalCount: number;
  inProgress: boolean;
};

export type Rank = { position: number; total: number };

export type SessionResult = {
  semester: number;
  period: L;
  results: Course[];
  average: number | null;
  passed: number;
  failed: number;
  total: number;
  rank: Rank;
};

export type Grades = {
  semesters: Semester[];
  currentSemester: number;
  gpa: number | null;
  creditsEarned: number;
  creditsTotal: number;
  distribution: { five: number; four: number; three: number; two: number; pass: number; fail: number };
  session: SessionResult | null;
  averageBySemester: { semester: number; value: number }[];
  rank: Rank;
};

export type Profile = {
  id: string;
  login: string;
  hue: number;
  fullName: L;
  shortName: L;
  faculty: L;
  program: L;
  degree: L;
  studyForm: L;
  group: string;
  studentCard: string;
  email: string;
  phone: string;
  year: number;
  admissionYear: number;
  curator: L;
  academic: {
    gpa: number | null;
    creditsEarned: number;
    creditsTotal: number;
    rank: Rank;
    currentSemester: number;
  };
};

export type ApplicationStatus =
  | "submitted"
  | "in_review"
  | "approved"
  | "ready"
  | "issued"
  | "rejected"
  | "cancelled";

export type ApplicationEvent = { status: ApplicationStatus; at: string };

export type Application = {
  id: string;
  typeCode: string;
  kind: "certificate" | "statement";
  icon: string;
  title: L;
  reference: string;
  status: ApplicationStatus;
  statusLabel: L;
  createdAt: string;
  updatedAt: string;
  copies: number;
  delivery: "digital" | "paper";
  urgency: "normal" | "urgent";
  comment: string;
  eta: L;
  events: ApplicationEvent[];
  canCancel: boolean;
  canCollect: boolean;
  resultCode: string;
};

export type DocType = {
  code: string;
  kind: "certificate" | "statement";
  icon: string;
  title: L;
  description: L;
  eta: L;
  popular: boolean;
  fields: ("comment" | "copies" | "delivery" | "urgency")[];
};

export type NotificationCategory = "dean" | "deadline" | "schedule" | "news" | "grades";

export type Notification = {
  id: string;
  category: NotificationCategory;
  title: L;
  body: L;
  pinned: boolean;
  createdAt: string;
  dueAt: string | null;
  dueInDays: number | null;
  action: { label: L; target: string } | null;
  read: boolean;
};

export type Payload = {
  ok: true;
  serverTime: string;
  university: { name: L; short: L };
  profile: Profile;
  schedule: Schedule;
  grades: Grades;
  applications: Application[];
  notifications: Notification[];
  catalog: DocType[];
};

export type PublicInfo = {
  ok: true;
  university: { name: L; short: L };
  catalog: DocType[];
};

export type Role = "student" | "teacher" | "dean";

export type StaffAccount = {
  id: string;
  login: string;
  role: Role;
  hue: number;
  fullName: L;
  shortName: L;
  title: L;
  faculty: L;
  email: string;
};

export type LoginResult = { ok: true; role: Role; account: Profile | StaffAccount };

export type TeacherStudent = {
  studentId: string;
  login: string;
  name: L;
  fullName: L;
  group: string;
  year: number;
  program: L;
  grade: number | null;
  passed: boolean | null;
  points: number | null;
  pendingGrade: boolean;
  updatedAt: string | null;
};

export type TeacherCourse = {
  code: string;
  title: L;
  semester: number;
  credits: number;
  assessment: "exam" | "pass_fail" | "graded_pass";
  groups: string[];
  students: TeacherStudent[];
  averagePoints: number | null;
  ungraded: number;
};

export type TeacherData = {
  ok: true;
  serverTime: string;
  university: { name: L; short: L };
  teacher: StaffAccount;
  courses: TeacherCourse[];
  stats: { courses: number; students: number; ungraded: number };
};

export type TeacherScheduleData = {
  ok: true;
  serverTime: string;
  teacher: StaffAccount;
  groups: string[];
  monday: string;
  weekNumber: number;
  days: Day[];
};

export type ScheduleSearchResult = {
  kind: "group" | "teacher";
  key: string;
  label: L;
  meta: L;
};

export type ScheduleViewData = {
  ok: true;
  serverTime: string;
  target: { kind: "group" | "teacher"; key: string; label: L; meta: L };
  groups?: string[];
  monday: string;
  weekNumber: number;
  days: Day[];
};

export type DeanScheduleGroup = { code: string; label: L };

export type DeanScheduleCourse = { code: string; title: L; teacher: L };

export type DeanKindOption = { value: ClassKind; label: L };

export type DeanScheduleData = {
  ok: true;
  serverTime: string;
  groups: DeanScheduleGroup[];
  group: string;
  courses: DeanScheduleCourse[];
  kinds: DeanKindOption[];
  monday: string;
  weekNumber: number;
  days: Day[];
};

export type DeanClassInput = {
  group: string;
  date: string;
  courseCode: string;
  kind: ClassKind;
  start: string;
  end: string;
  room: string;
  building: string;
  note?: string;
};

export type DeanMoveInput = {
  group: string;
  date: string;
  ref: string;
  changeId?: string;
  newDate: string;
  newStart: string;
  newEnd: string;
  newRoom?: string;
  note?: string;
};

export type DeanCancelInput = {
  group: string;
  date: string;
  ref: string;
  note?: string;
};

export type DeanStudent = {
  id: string;
  login: string;
  name: L;
  fullName: L;
  group: string;
  program: L;
  year: number;
  email: string;
};

export type DeanApplication = Application & { student: DeanStudent | null };

export type DeanData = {
  ok: true;
  serverTime: string;
  university: { name: L; short: L };
  dean: StaffAccount;
  applications: DeanApplication[];
};
