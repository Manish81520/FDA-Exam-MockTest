import type { Attempt, Choice, ExamInfo, HistoryItem, Result } from "./types";

export interface AdminExam {
  exam_id: string;
  title: string;
  duration_minutes: number;
  questions: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function req<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    detail?: string | { msg?: string }[];
  };
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/admin/") && path !== "/auth/login") {
      window.dispatchEvent(new Event("auth-lost"));
    }
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).filter(Boolean).join("; ")
      : data.detail;
    throw new ApiError(res.status, data.error?.message ?? detail ?? res.statusText);
  }
  return data as T;
}

export const api = {
  me: () => req<{ ok: boolean }>("/auth/me"),
  login: (passcode: string) => req<{ ok: boolean }>("/auth/login", "POST", { passcode }),
  logout: () => req<{ ok: boolean }>("/auth/logout", "POST"),
  exams: () => req<ExamInfo[]>("/exams"),
  history: () => req<HistoryItem[]>("/attempts"),
  start: (examId: string) => req<Attempt>("/attempts", "POST", { exam_id: examId }),
  attempt: (id: string) => req<Attempt>(`/attempts/${id}`),
  answer: (id: string, qid: string, choice: Choice) =>
    req<{ locked: boolean }>(`/attempts/${id}/answers/${qid}`, "PUT", { choice }),
  submit: (id: string) => req<{ status: string }>(`/attempts/${id}/submit`, "POST"),
  result: (id: string) => req<Result>(`/attempts/${id}/result`),
  adminMe: () => req<{ ok: boolean }>("/admin/auth/me"),
  adminLogin: (passcode: string) =>
    req<{ ok: boolean }>("/admin/auth/login", "POST", { passcode }),
  adminLogout: () => req<{ ok: boolean }>("/admin/auth/logout", "POST"),
  adminExams: () => req<AdminExam[]>("/admin/exams"),
  adminUpload: (exam: unknown) => req<{ exam_id: string; title: string; replaced: boolean }>(
    "/admin/exams", "POST", exam,
  ),
  adminDelete: (examId: string) => req<{ ok: boolean }>(
    `/admin/exams/${encodeURIComponent(examId)}`, "DELETE",
  ),
};
