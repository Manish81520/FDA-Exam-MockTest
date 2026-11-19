export type Choice = number | "E";
export type Outcome = "correct" | "wrong" | "declined" | "blank";

export interface Marks { correct: string; wrong: string; blank: string; decline: string }
export interface ExamInfo {
  exam_id: string; title: string; description: string;
  duration_minutes: number; questions: number; marks: Marks;
}
export interface HistoryItem {
  id: string; exam_id: string; status: "in_progress" | "submitted";
  title: string; started_at: number; net: string | null; max: string | null;
}
export interface Question {
  id: string; topic: string; topic_label: string; question: string; options: string[];
  question_en: string; options_en: string[];
}
export interface Attempt {
  id: string; exam_id: string; title: string; paper_label: string; status: string;
  expires_at: number; server_time: number; marks: Marks;
  questions: Question[]; answers: Record<string, Choice>;
}
export interface TopicRow {
  topic: string; label: string; total: number;
  correct: number; wrong: number; declined: number; blank: number;
  net: string; max: string; accuracy: string; attempted_accuracy: string | null;
  needs_improvement: boolean; primary_issue: "wrong" | "blank" | "declined" | null;
}
export interface ReviewItem {
  id: string; topic: string; question: string; options: string[];
  correct_index: number; explanation: string; choice: Choice | null; outcome: Outcome;
}
export interface Result {
  net: string; max: string; percentage: string; passed: boolean | null;
  counts: Record<Outcome, number>; avoidable_blank_loss: string;
  elapsed_seconds: number; auto_submitted: boolean;
  topics: TopicRow[]; review: ReviewItem[];
}
