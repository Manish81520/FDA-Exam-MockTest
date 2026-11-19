import type { Marks } from "./types";

/** All Kannada UI strings. Have a native speaker review before sharing. */
export const K = {
  title: "ಮಾಕ್ ಪರೀಕ್ಷೆ (Mock Exam)", pass: "ಪಾಸ್‌ಕೋಡ್ (Passcode)", login: "ಪ್ರವೇಶಿಸಿ (Login)",
  brandSub: "ಕರ್ನಾಟಕ FDA/SDA ಪೋರ್ಟಲ್", navHome: "ಮುಖಪುಟ / Home", navExams: "ಪರೀಕ್ಷೆಗಳು / Exams",
  navPast: "ಫಲಿತಾಂಶಗಳು / Past Attempts", candidate: "ಅಭ್ಯರ್ಥಿ / Candidate", active: "ನೋಂದಾಯಿತ (Active)",
  start: "ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ (Start Test)", resume: "ಪರೀಕ್ಷೆ ಮುಂದುವರಿಸಿ (Resume)",
  q: "ಪ್ರಶ್ನೆ", questions: "ಪ್ರಶ್ನೆಗಳು", min: "ನಿಮಿಷ",
  timeLeft: "ಉಳಿದ ಸಮಯ", done: "ಪೂರ್ಣಗೊಂಡಿದೆ",
  sync: {
    ok: "ಸರ್ವರ್ ಸಿಂಕ್ರೊನೈಸ್ ಆಗಿದೆ (Server Synced)",
    saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ… (Saving)",
    error: "ಸಂಪರ್ಕ ಸಮಸ್ಯೆ (Connection issue)",
  },
  note: "ಗಮನಿಸಿ:",
  banner: (pen: string) => `ಉತ್ತರಿಸದ ಪ್ರಶ್ನೆಗಳಿಗೆ -${pen} ಅಂಕ ಕಡಿತವಾಗುತ್ತದೆ. (ದಂಡ ತಪ್ಪಿಸಲು ಆಯ್ಕೆ 'ಉ' [E] ಬಳಸಿ).`,
  right: "ಸರಿ", wrong: "ತಪ್ಪು", blankShort: "ಖಾಲಿ",
  eDivider: "ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ – ದಂಡವಿಲ್ಲದ ಆಯ್ಕೆ", dec: "ಉತ್ತರ ಗೊತ್ತಿಲ್ಲ / ಉತ್ತರಿಸಲು ಬಯಸುವುದಿಲ್ಲ",
  eNote: (m: string) => `${m} ಅಂಕ (ಯಾವುದೇ ದಂಡ ಅನ್ವಯಿಸುವುದಿಲ್ಲ / No penalty)`,
  later: "ನಂತರ ನೋಡುತ್ತೇನೆ (Mark for Review)", save: "ಉಳಿಸಿ ಮತ್ತು ಮುಂದೆ (Save & Next)",
  lockNote: "ಉತ್ತರವನ್ನು ಒಮ್ಮೆ ಉಳಿಸಿದರೆ ಬದಲಾಯಿಸಲಾಗುವುದಿಲ್ಲ (Locked)",
  keyboard: "ಕೀಬೋರ್ಡ್:", keyPick: "1-5 ಅಥವಾ A-E", keyPickT: "ಆಯ್ಕೆ", keySaveT: "ಉಳಿಸಿ", keyLaterT: "ನಂತರ", keyMoveT: "ಚಲನೆ",
  palette: "ಪ್ರಶ್ನೆಗಳ ವಿವರ (Question Palette)", total: "ಒಟ್ಟು", answered: "ಉತ್ತರಿಸಿದ್ದು",
  review: "ನಂತರ ಪರಿಶೀಲನೆ", unvisited: "ಭೇಟಿ ನೀಡಿಲ್ಲ", eChoice: "ಆಯ್ಕೆ 'ಉ' (E)", pick: "ಪ್ರಶ್ನೆ ಸಂಖ್ಯೆ ಆಯ್ಕೆಮಾಡಿ:",
  scroll: (a: number, b: number) => `ಸ್ಕ್ರೋಲ್ ಮಾಡಿ (${a} ರಿಂದ ${b} ನೇ ಪ್ರಶ್ನೆಗಳು)...`,
  lgAnswered: "ಉತ್ತರಿಸಲಾಗಿದೆ", lgCurrent: "ಪ್ರಸ್ತುತ ಪ್ರಶ್ನೆ",
  submitExam: "ಪರೀಕ್ಷೆ ಮುಕ್ತಾಯಗೊಳಿಸಿ (Submit Exam)", submitNote: "ಅಂತಿಮ ಸಲ್ಲಿಕೆಯ ನಂತರ ಯಾವುದೇ ಉತ್ತರಗಳನ್ನು ಬದಲಾಯಿಸಲಾಗದು.",
  footer: "© ಖಾಸಗಿ ಅಭ್ಯಾಸ ಪೋರ್ಟಲ್ (Private practice portal)",
  back: "ಹಿಂದೆ", confirm: "ಸಲ್ಲಿಸಿ", blank: "ಉತ್ತರಿಸದ್ದು", declined: "ಗೊತ್ತಿಲ್ಲ",
  total2: "ಒಟ್ಟು ಅಂಕ", topics: "ವಿಷಯವಾರು ವಿಶ್ಲೇಷಣೆ", weak: "ಸುಧಾರಣೆ ಅಗತ್ಯ",
  history: "ಹಿಂದಿನ ಪ್ರಯತ್ನಗಳು", empty: "ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಯತ್ನವಿಲ್ಲ", yours: "ನಿಮ್ಮ ಉತ್ತರ", correct: "ಸರಿ ಉತ್ತರ",
  all: "ಎಲ್ಲವೂ", home: "ಮುಖಪುಟ", view: "ಫಲಿತಾಂಶ ನೋಡಿ", loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
  noExams: "ಈಗ ಯಾವುದೇ ಪ್ರಶ್ನೆಪತ್ರಿಕೆ ಲಭ್ಯವಿಲ್ಲ (No exams available right now)",
  noExamsNote: "ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ. (Please check back later or contact the administrator.)",
  badPass: "ಪಾಸ್‌ಕೋಡ್ ತಪ್ಪಾಗಿದೆ", saveFail: "ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  passed: "ಉತ್ತೀರ್ಣ", failed: "ಅನುತ್ತೀರ್ಣ",
  timeWarn: "ಸಮಯ ಮುಗಿಯುತ್ತಿದೆ. ಉತ್ತರಿಸದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಅಂಕ ಕಳೆಯಲಾಗುತ್ತದೆ.",
  autoSub: "ಸಮಯ ಮುಗಿದ ಕಾರಣ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ.",
  rules: (m: Marks) =>
    `ಸರಿ ಉತ್ತರ ${m.correct}, ತಪ್ಪು ಉತ್ತರ ${m.wrong}, ಉತ್ತರಿಸದೆ ಬಿಟ್ಟರೆ ${m.blank}, "ಉತ್ತರ ಗೊತ್ತಿಲ್ಲ" ಆಯ್ಕೆಗೆ ${m.decline} ಅಂಕ. ಉಳಿಸಿದ ಉತ್ತರ ಬದಲಿಸಲಾಗದು.`,
  unanswered: (n: number, pen: string, tot: string) =>
    `${n} ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿಲ್ಲ. ಪ್ರತಿಯೊಂದಕ್ಕೂ ${pen} ಅಂಕ ಕಳೆಯಲಾಗುತ್ತದೆ (ಒಟ್ಟು ${tot}). ತಪ್ಪಿಸಲು "ಉತ್ತರ ಗೊತ್ತಿಲ್ಲ" ಆಯ್ಕೆ ಮಾಡಿ.`,
  avoid: (x: string) =>
    `ಉತ್ತರಿಸದೆ ಬಿಟ್ಟ ಪ್ರಶ್ನೆಗಳಿಂದ ${x} ಅಂಕ ಕಳೆದುಹೋಯಿತು. "ಗೊತ್ತಿಲ್ಲ" ಆಯ್ಕೆ ಮಾಡಿದ್ದರೆ ತಪ್ಪಿಸಬಹುದಿತ್ತು.`,
  advice: {
    wrong: "ತಪ್ಪು ಉತ್ತರಗಳು ಹೆಚ್ಚು: ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಮತ್ತೆ ಓದಿ.",
    declined: "ತಿಳಿಯದ ಪ್ರಶ್ನೆಗಳು ಹೆಚ್ಚು: ಈ ವಿಷಯವನ್ನು ಅಧ್ಯಯನ ಮಾಡಿ.",
    blank: "ಉತ್ತರಿಸದೆ ಬಿಟ್ಟದ್ದು ಹೆಚ್ಚು: ಸಮಯ ನಿರ್ವಹಿಸಿ; ಗೊತ್ತಿಲ್ಲದಿದ್ದರೆ ಕೊನೆಯ ಆಯ್ಕೆ ಆರಿಸಿ.",
  },
} as const;
