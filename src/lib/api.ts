import type {
  Application, DeanApplication, DeanCancelInput, DeanClassInput, DeanData, DeanMoveInput, DeanScheduleData,
  LoginResult, Payload, PublicInfo, ScheduleSearchResult, ScheduleViewData, TeacherData, TeacherScheduleData,
  TeacherStudent,
} from "./types";

const BASE = "/functions/v1/app";

export class ApiError extends Error {
  code: string;
  status: number;
  retryAfter?: number;
  constructor(code: string, status: number, retryAfter?: number) {
    super(code);
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

type Json = Record<string, unknown>;

async function requestJson<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { accept: "application/json" };
  if (method !== "GET") {
    headers["x-atlas-request"] = "1";
    if (init.body !== undefined) headers["content-type"] = "application/json";
  }
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError("network_error", 0);
  }
  let data: Json | null = null;
  try {
    data = (await response.json()) as Json;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const code = typeof data?.error === "string" ? data.error : "internal_error";
    const retryAfter = typeof data?.retryAfter === "number" ? data.retryAfter : undefined;
    throw new ApiError(code, response.status, retryAfter);
  }
  return data as T;
}

export function todayStr(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const api = {
  publicInfo: () => requestJson<PublicInfo>("/api/public"),
  session: () => requestJson<LoginResult>("/api/session"),
  login: (login: string, password: string) =>
    requestJson<LoginResult>("/api/login", { method: "POST", body: { login, password } }),
  logout: () => requestJson<{ ok: true }>("/api/logout", { method: "POST" }),
  data: (date = todayStr()) => requestJson<Payload>(`/api/data?date=${encodeURIComponent(date)}`),
  teacher: () => requestJson<TeacherData>("/api/teacher"),
  teacherSchedule: (date = todayStr()) =>
    requestJson<TeacherScheduleData>(`/api/teacher/schedule?date=${encodeURIComponent(date)}`),
  scheduleLookup: (query: string) =>
    requestJson<{ ok: true; results: ScheduleSearchResult[] }>(`/api/schedule/lookup?q=${encodeURIComponent(query)}`),
  scheduleView: (target: { group?: string; teacher?: string }, date = todayStr()) => {
    const params = new URLSearchParams({ date });
    if (target.group) params.set("group", target.group);
    if (target.teacher) params.set("teacher", target.teacher);
    return requestJson<ScheduleViewData>(`/api/schedule/view?${params.toString()}`);
  },
  setGrade: (body: {
    studentId: string;
    courseCode: string;
    grade?: number | null;
    passed?: boolean | null;
    points?: number | null;
  }) => requestJson<{ ok: true; entry: TeacherStudent }>("/api/teacher/grades", { method: "POST", body }),
  dean: () => requestJson<DeanData>("/api/dean"),
  deanSchedule: (group: string, date: string) =>
    requestJson<DeanScheduleData>(`/api/dean/schedule?group=${encodeURIComponent(group)}&date=${encodeURIComponent(date)}`),
  createClass: (body: DeanClassInput) =>
    requestJson<{ ok: true }>("/api/dean/schedule/create", { method: "POST", body }),
  moveClass: (body: DeanMoveInput) =>
    requestJson<{ ok: true }>("/api/dean/schedule/move", { method: "POST", body }),
  cancelClass: (body: DeanCancelInput) =>
    requestJson<{ ok: true }>("/api/dean/schedule/cancel", { method: "POST", body }),
  restoreClass: (body: { group: string; id: string }) =>
    requestJson<{ ok: true }>("/api/dean/schedule/restore", { method: "POST", body }),
  deleteClass: (body: { group: string; id: string }) =>
    requestJson<{ ok: true }>("/api/dean/schedule/delete", { method: "POST", body }),
  setApplicationStatus: (id: string, status: string) =>
    requestJson<{ ok: true; application: DeanApplication }>(`/api/dean/applications/${id}/status`, {
      method: "POST",
      body: { status },
    }),
  createApplication: (body: {
    typeCode: string;
    copies?: number;
    delivery?: string;
    urgency?: string;
    comment: string;
  }) => requestJson<{ ok: true; application: Application }>("/api/applications", { method: "POST", body }),
  cancelApplication: (id: string) =>
    requestJson<{ ok: true; application: Application }>(`/api/applications/${id}/cancel`, { method: "POST" }),
  collectApplication: (id: string) =>
    requestJson<{ ok: true; application: Application }>(`/api/applications/${id}/collect`, { method: "POST" }),
  markRead: (ids: string[] | "all") =>
    requestJson<{ ok: true; marked: number }>("/api/notifications/read", {
      method: "POST",
      body: ids === "all" ? { all: true } : { ids },
    }),
  revokeAll: () => requestJson<{ ok: true; revoked: number }>("/api/security/revoke-all", { method: "POST" }),
};
