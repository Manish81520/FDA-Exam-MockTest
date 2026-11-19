import type { Attempt, Choice, ExamInfo, HistoryItem, Result } from "./types";

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
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") window.dispatchEvent(new Event("auth-lost"));
    throw new ApiError(res.status, data.error?.message ?? res.statusText);
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
};
