"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  EnglishStyle,
  Expression,
  ExpressionInsert,
  MasteryStatus,
  PracticeSessionWithExpression,
  UserProfile,
  UserRole,
  VisualStyle,
} from "../lib/database.types";
import { supabase } from "../lib/supabase";

type ViewName = "practice" | "generate" | "library" | "plan" | "profile";
type SpeakVaultAppMode = "login" | "app";
type AuthMode = "sign-in" | "sign-up";
type EditExpressionForm = {
  english: string;
  chinese: string;
  category: string;
  difficulty: string;
  note: string;
  tags: string;
  alternatives: string;
};
type PracticeFeedback = {
  pronunciation_score: number;
  accent_score: number;
  fluency_score: number;
  naturalness_score: number;
  completeness_score: number;
  summary: string;
  accent_focus: string;
  pronunciation_drill: string;
  audio_note: string;
  better_version: string;
  next_step: string;
};
type PracticeInputMode = "voice" | "typed";
type AppLanguage = "en" | "zh";
type ProfileContext = Pick<UserProfile, "role" | "major" | "location" | "english_style">;
type ProfileUpdate = Partial<
  Pick<
    UserProfile,
    | "role"
    | "major"
    | "location"
    | "english_style"
    | "visual_style"
    | "active_plan_key"
    | "active_plan_started_on"
    | "active_plan_completed_days"
    | "completed_plan_keys"
  >
>;
type WeeklyPlan = {
  key: string;
  audience: string;
  title: string;
  copy: string;
  tasks: Array<{
    title: string;
    copy: string;
  }>;
};
type SpeechRecognitionAlternativeLike = {
  transcript: string;
};
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): SpeechRecognitionResultLike;
    [index: number]: SpeechRecognitionResultLike;
  };
};
type SpeechRecognitionErrorLike = {
  error: string;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const starterLibrary: Expression[] = [
  {
    id: "starter-1",
    user_id: "demo",
    english: "Could I just check whether this figure is based on the latest client information?",
    chinese: "我想确认一下这个数字是基于最新的客户资料吗？",
    category: "Work Meeting",
    difficulty: "Natural",
    status: "Practising",
    tags: ["tax return", "clarification", "manager"],
    note: "Softens the question with “Could I just check”, which sounds natural in NZ/AU meetings.",
    alternatives: ["Can I quickly confirm the source of this figure?", "Is this based on the latest client docs?"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "starter-2",
    user_id: "demo",
    english: "I’ll double-check that and come back to you shortly.",
    chinese: "我会再核对一下，然后尽快回复你。",
    category: "Work Meeting",
    difficulty: "Easy",
    status: "Mastered",
    tags: ["figures", "follow-up", "client docs"],
    note: "Concise and confident when you need more time without over-explaining.",
    alternatives: ["Let me verify that first.", "I’ll check that and get back to you."],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "starter-3",
    user_id: "demo",
    english: "Could I jump in with one quick point?",
    chinese: "我可以插一句很快的观点吗？",
    category: "Work Meeting",
    difficulty: "Natural",
    status: "New",
    tags: ["interrupting", "polite", "meeting"],
    note: "A common, low-friction way to enter a conversation.",
    alternatives: ["Can I add one quick thing?", "Could I quickly add to that?"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const generatedSamples: Omit<ExpressionInsert, "status">[] = [
  {
    english: "I’m not sure this is the best option, but we could try it first.",
    chinese: "我不确定这是最好的选择，但我们可以先试一下。",
    category: "Work Meeting",
    difficulty: "Easy",
    tags: ["testing", "meeting", "soft disagreement"],
    note: "Simple, clear, and easy to say in a meeting without sounding too direct.",
    alternatives: ["We could try it first.", "Maybe we can test it first."],
  },
  {
    english: "I’m not completely sure this is the best approach, but I think it’s worth trialling first.",
    chinese: "我不完全确定这是最优方案，但我觉得值得先试一下。",
    category: "Work Meeting",
    difficulty: "Natural",
    tags: ["testing", "meeting", "soft disagreement"],
    note: "“Worth trialling” sounds natural in NZ/AU workplace English and avoids sounding too direct.",
    alternatives: ["It might be worth testing first.", "We could try it and review the outcome."],
  },
  {
    english: "I’m not fully convinced it’s the optimal option yet, but we could test it and review the outcome.",
    chinese: "我还不完全相信这是最优选择，但我们可以测试一下并复盘结果。",
    category: "Work Meeting",
    difficulty: "Advanced",
    tags: ["strategy", "disagreeing", "professional"],
    note: "“Not fully convinced” is professional and softer than saying “I disagree”.",
    alternatives: ["I’m not totally sold on it yet.", "I’d like to see how it performs first."],
  },
];

const roleOptions: UserRole[] = [
  "Tax Accountant",
  "Accountant",
  "Auditor",
  "Software / IT",
  "Business / Admin",
  "Healthcare",
  "Hospitality / Retail",
  "Student",
  "Other",
];
const majorOptions = ["Accounting", "Finance", "Business", "IT", "Engineering", "Healthcare", "Nursing", "Education", "Other"];
const locationOptions = ["New Zealand", "Australia", "United Kingdom", "United States", "Canada", "Other"];
const englishStyleOptions: EnglishStyle[] = ["New Zealand", "Australian", "British", "American", "Canadian"];
const visualStyleOptions: VisualStyle[] = ["System", "Light", "Dark"];

const defaultProfileContext: ProfileContext = {
  role: "Tax Accountant",
  major: "",
  location: "New Zealand",
  english_style: "New Zealand",
};

const weeklyPlans: WeeklyPlan[] = [
  {
    key: "tax-accountant-client-clarity",
    audience: "Tax Accountant",
    title: "Client-ready tax conversations",
    copy: "A focused week for explaining figures, asking for documents, and sounding calm with deadlines.",
    tasks: [
      { title: "Clarify a figure", copy: "Ask whether a number is based on the latest client information." },
      { title: "Request missing documents", copy: "Ask for bank statements or receipts without sounding demanding." },
      { title: "Explain a tax issue", copy: "Explain one tax return issue in plain, client-friendly English." },
      { title: "Buy more time", copy: "Ask for extra time while keeping confidence and ownership." },
      { title: "Raise a concern", copy: "Flag a potential issue softly before proposing the next step." },
      { title: "Summarise next steps", copy: "Close a conversation with two clear next actions." },
      { title: "Review and reuse", copy: "Record your best three sentences from this week from memory." },
    ],
  },
  {
    key: "accounting-workplace-updates",
    audience: "Accountant",
    title: "Accounting updates and checks",
    copy: "Practise concise updates, reconciliations, and follow-up language for finance teams.",
    tasks: [
      { title: "Give a status update", copy: "Summarise what is done, pending, and blocked in 20 seconds." },
      { title: "Check assumptions", copy: "Confirm the basis of a calculation before finalising it." },
      { title: "Explain a variance", copy: "Describe why a number changed without over-explaining." },
      { title: "Ask for review", copy: "Invite a manager to review your work with a specific question." },
      { title: "Handle a correction", copy: "Acknowledge an error and explain how you will fix it." },
      { title: "Close the loop", copy: "Send a spoken follow-up confirming the completed action." },
      { title: "Weekly recap", copy: "Record a one-minute recap of your accounting work this week." },
    ],
  },
  {
    key: "audit-evidence-questions",
    audience: "Auditor",
    title: "Audit evidence conversations",
    copy: "Build confident language for evidence requests, follow-up questions, and risk discussions.",
    tasks: [
      { title: "Request evidence", copy: "Ask for supporting documents with a clear reason." },
      { title: "Ask a follow-up", copy: "Probe an unclear answer politely." },
      { title: "Discuss a risk", copy: "Explain a risk without sounding accusatory." },
      { title: "Confirm scope", copy: "Clarify what period, entity, or transaction you are reviewing." },
      { title: "Challenge softly", copy: "Disagree with an explanation while keeping rapport." },
      { title: "Summarise findings", copy: "Give a concise spoken summary of one finding." },
      { title: "Review and reuse", copy: "Turn three audit questions into reusable expressions." },
    ],
  },
  {
    key: "student-academic-confidence",
    audience: "Student",
    title: "Study and class confidence",
    copy: "A weekly plan for tutorials, group work, lecturer questions, and explaining your major clearly.",
    tasks: [
      { title: "Introduce your major", copy: "Explain what you study and why in a natural way." },
      { title: "Ask a lecturer", copy: "Ask for clarification after a lecture or tutorial." },
      { title: "Group assignment", copy: "Suggest a next step in a group project." },
      { title: "Explain a concept", copy: "Explain one idea from your major in simple English." },
      { title: "Disagree politely", copy: "Push back on a group suggestion without sounding harsh." },
      { title: "Presentation warm-up", copy: "Give a 30-second mini presentation on a familiar topic." },
      { title: "Weekly reflection", copy: "Record what you learned and what you still find difficult." },
    ],
  },
  {
    key: "general-workplace-speaking",
    audience: "General",
    title: "Workplace speaking foundations",
    copy: "Useful meeting and small-talk practice for a wide range of roles.",
    tasks: [
      { title: "Make small talk", copy: "Start a light workplace conversation before a meeting." },
      { title: "Ask for clarification", copy: "Ask someone to repeat or explain a point naturally." },
      { title: "Give an update", copy: "Share progress, blockers, and next steps." },
      { title: "Interrupt politely", copy: "Add a point without taking over the conversation." },
      { title: "Make a suggestion", copy: "Propose a practical option and invite feedback." },
      { title: "Handle uncertainty", copy: "Say you are not sure and explain what you will check." },
      { title: "Weekly recap", copy: "Record a one-minute recap using five expressions from the week." },
    ],
  },
];

const translations = {
  en: {
    viewTitles: {
      practice: "Practice",
      generate: "Generate",
      library: "Library",
      plan: "Plan",
      profile: "Profile",
    },
    nav: {
      practice: "Practice",
      generate: "Generate",
      library: "Library",
      plan: "Plan",
      profile: "Profile",
    },
    common: {
      day: "7-day plan",
      loading: "Loading SpeakVault...",
      close: "Close",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      saved: "Saved",
      updating: "Updating...",
      chinese: "Chinese",
      better: "Better",
      next: "Next",
      audio: "Audio",
      accent: "Accent",
      drill: "Drill",
      complete: "Complete",
      completed: "Completed",
    },
    auth: {
      eyebrow: "Personal fluency system",
      tagline: "Build a private vault of workplace-ready English you can actually say.",
      signIn: "Sign in",
      createAccount: "Create account",
      email: "Email",
      password: "Password",
      passwordPlaceholder: "At least 6 characters",
      working: "Working...",
    },
    practice: {
      mission: "Today's mission",
      missionCopy: "Look at the Chinese prompt, say the English out loud, then compare it with your target expression.",
      start: "Start",
      today: "today",
      recent: "recent",
      last: "last",
      prompt: "Speaking prompt",
      startSpeaking: "Start speaking",
      stopAndSave: "Stop and save",
      recordAgain: "Record again",
      recordedAudio: "Recorded audio",
      liveTranscript: "Live transcript",
      yourTranscript: "Your transcript",
      aiFeedback: "AI feedback",
      accentFocus: "Accent focus",
      audioNote: "Audio",
      targetExpression: "Target expression",
      typedTranscript: "Typed transcript",
      transcriptPlaceholder: "Type what you said if transcription is missing.",
      saveTypedTranscript: "Save typed transcript",
      recentPractice: "Recent practice",
      savedCount: "saved",
      noSessions: "No practice sessions yet. Record once to start your history.",
      promptLabel: "Prompt",
      reviewQueue: "Review queue",
      viewAll: "View all",
      pronunciation: "Pronunciation",
      fluency: "Fluency",
      naturalness: "Naturalness",
      completeness: "Completeness",
    },
    generate: {
      thoughtLabel: "Chinese thought",
      button: "Generate 3 expressions",
      generating: "Generating...",
      why: "Why it works",
      saveToLibrary: "Save to Library",
    },
    library: {
      search: "Search expressions or tags",
      filters: ["All", "Work Meeting", "Small Talk", "Struggling"],
      loadingTitle: "Loading your vault...",
      loadingCopy: "Fetching your saved expressions from Supabase.",
      emptyTitle: "Your vault is empty",
      emptyCopy: "Go to Generate, save an expression, and it will appear here.",
      details: "Expression details",
      english: "English",
      chinese: "Chinese",
      category: "Category",
      difficulty: "Difficulty",
      why: "Why it works",
      alternatives: "Alternatives",
      tags: "Tags",
      mastery: "Mastery status",
      practiceThis: "Practice this",
      edit: "Edit expression",
      delete: "Delete expression",
      saveChanges: "Save changes",
    },
    plan: {
      eyebrow: "Weekly plan",
      progress: "completed",
      startNext: "Start next weekly plan",
      nextWeekReady: "Next weekly plan will start on Monday after all 7 days are complete.",
    },
    profile: {
      role: "Role and location",
      roleLabel: "Role",
      majorLabel: "Major",
      locationLabel: "Location",
      englishStyle: "English style",
      language: "System language",
      visualStyle: "Visual style",
      loginSecurity: "Login security",
      supabaseAuth: "Supabase Auth",
      profileSync: "Profile sync",
      supabaseProfile: "Supabase profile",
      session: "Session",
      signOut: "Sign out",
    },
  },
  zh: {
    viewTitles: {
      practice: "练习",
      generate: "生成",
      library: "语料库",
      plan: "计划",
      profile: "我的",
    },
    nav: {
      practice: "练习",
      generate: "生成",
      library: "语料库",
      plan: "计划",
      profile: "我的",
    },
    common: {
      day: "7 天计划",
      loading: "正在加载 SpeakVault...",
      close: "关闭",
      save: "保存",
      saving: "保存中...",
      cancel: "取消",
      saved: "已保存",
      updating: "更新中...",
      chinese: "中文",
      better: "更自然说法",
      next: "下一步",
      audio: "音频",
      accent: "口音",
      drill: "跟练",
      complete: "完成",
      completed: "已完成",
    },
    auth: {
      eyebrow: "个人口语训练系统",
      tagline: "建立一个你真正说得出口的职场英语语料库。",
      signIn: "登录",
      createAccount: "创建账号",
      email: "邮箱",
      password: "密码",
      passwordPlaceholder: "至少 6 位字符",
      working: "处理中...",
    },
    practice: {
      mission: "今日任务",
      missionCopy: "看中文提示，先大声说英文，再和目标表达对比。",
      start: "开始",
      today: "今天",
      recent: "最近",
      last: "上次",
      prompt: "口语提示",
      startSpeaking: "开始说话",
      stopAndSave: "停止并保存",
      recordAgain: "重新录音",
      recordedAudio: "录音回放",
      liveTranscript: "实时转写",
      yourTranscript: "你的转写",
      aiFeedback: "AI 反馈",
      accentFocus: "口音重点",
      audioNote: "音频说明",
      targetExpression: "目标表达",
      typedTranscript: "手动输入转写",
      transcriptPlaceholder: "如果没有自动转写，请输入你刚才说的英文。",
      saveTypedTranscript: "保存手动转写",
      recentPractice: "最近练习",
      savedCount: "条记录",
      noSessions: "还没有练习记录。录一次音开始积累历史。",
      promptLabel: "提示",
      reviewQueue: "复习队列",
      viewAll: "查看全部",
      pronunciation: "发音",
      fluency: "流利度",
      naturalness: "自然度",
      completeness: "完整度",
    },
    generate: {
      thoughtLabel: "中文想法",
      button: "生成 3 条表达",
      generating: "生成中...",
      why: "为什么自然",
      saveToLibrary: "保存到语料库",
    },
    library: {
      search: "搜索表达或标签",
      filters: ["全部", "工作会议", "闲聊", "容易忘"],
      loadingTitle: "正在加载语料库...",
      loadingCopy: "正在从 Supabase 获取你保存的表达。",
      emptyTitle: "语料库还是空的",
      emptyCopy: "去生成页保存一条表达，它会出现在这里。",
      details: "表达详情",
      english: "英文",
      chinese: "中文",
      category: "分类",
      difficulty: "难度",
      why: "为什么自然",
      alternatives: "替代表达",
      tags: "标签",
      mastery: "掌握状态",
      practiceThis: "练这条",
      edit: "编辑表达",
      delete: "删除表达",
      saveChanges: "保存修改",
    },
    plan: {
      eyebrow: "每周计划",
      progress: "已完成",
      startNext: "开始下一周计划",
      nextWeekReady: "完成 7 天任务后，下一套计划会在周一开始。",
    },
    profile: {
      role: "职位与地点",
      roleLabel: "职位",
      majorLabel: "专业",
      locationLabel: "地点",
      englishStyle: "English style",
      language: "系统语言",
      visualStyle: "视觉风格",
      loginSecurity: "登录安全",
      supabaseAuth: "Supabase Auth",
      profileSync: "Profile 同步",
      supabaseProfile: "Supabase Profile",
      session: "会话",
      signOut: "退出登录",
    },
  },
} as const;

const masteryStatuses: MasteryStatus[] = ["New", "Practising", "Struggling", "Mastered"];

function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getMondayStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);

  return start;
}

function isNewPlanWeekAvailable(startedOn: string) {
  const startedAt = new Date(`${startedOn}T00:00:00`);
  const currentWeek = getMondayStart(new Date());
  const startedWeek = getMondayStart(startedAt);

  return currentWeek.getTime() > startedWeek.getTime();
}

function getProfileContext(profile: UserProfile | null): ProfileContext {
  return profile
    ? {
        role: profile.role,
        major: profile.major,
        location: profile.location,
        english_style: profile.english_style,
      }
    : defaultProfileContext;
}

function getDefaultProfile(userId: string): UserProfile {
  return {
    user_id: userId,
    ...defaultProfileContext,
    visual_style: "System",
    active_plan_key: weeklyPlans[0].key,
    active_plan_started_on: getTodayDateKey(),
    active_plan_completed_days: [],
    completed_plan_keys: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getPlanAudience(profile: UserProfile | null) {
  const context = getProfileContext(profile);

  if (context.role === "Student") return "Student";
  if (["Tax Accountant", "Accountant", "Auditor"].includes(context.role)) return context.role;
  return "General";
}

function getMatchingPlans(profile: UserProfile | null) {
  const audience = getPlanAudience(profile);
  return weeklyPlans.filter((plan) => plan.audience === audience || plan.audience === "General");
}

function getActivePlan(profile: UserProfile | null) {
  const matchingPlans = getMatchingPlans(profile);
  const activePlan = matchingPlans.find((plan) => plan.key === profile?.active_plan_key);

  return activePlan ?? matchingPlans[0] ?? weeklyPlans[weeklyPlans.length - 1];
}

function getNextPlan(profile: UserProfile | null) {
  const matchingPlans = getMatchingPlans(profile);
  const activePlan = getActivePlan(profile);
  const currentIndex = matchingPlans.findIndex((plan) => plan.key === activePlan.key);

  return matchingPlans[(currentIndex + 1) % matchingPlans.length] ?? activePlan;
}

function shouldRollOverWeeklyPlan(profile: UserProfile) {
  const activePlan = getActivePlan(profile);
  const isComplete = profile.active_plan_completed_days.length >= activePlan.tasks.length;

  return isComplete && isNewPlanWeekAvailable(profile.active_plan_started_on);
}

export default function SpeakVaultApp({ mode }: { mode: SpeakVaultAppMode }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewName>("practice");
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("en");
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [practiceVoiceMessage, setPracticeVoiceMessage] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState<PracticeFeedback | null>(null);
  const [practiceAudioUrl, setPracticeAudioUrl] = useState("");
  const [audioDurationMs, setAudioDurationMs] = useState(0);
  const [practiceInputMode, setPracticeInputMode] = useState<PracticeInputMode>("typed");
  const [thought, setThought] = useState("我不是很确定这个方案是不是最优的，但我觉得我们可以先试一下。");
  const [generatedExpressions, setGeneratedExpressions] = useState<Omit<ExpressionInsert, "status">[]>(generatedSamples);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [library, setLibrary] = useState<Expression[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSessionWithExpression[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [savingExpression, setSavingExpression] = useState("");
  const [selectedExpressionId, setSelectedExpressionId] = useState("");
  const [practiceExpressionId, setPracticeExpressionId] = useState("");
  const [updatingExpressionId, setUpdatingExpressionId] = useState("");
  const [isEditingExpression, setIsEditingExpression] = useState(false);
  const [isSavingPractice, setIsSavingPractice] = useState(false);
  const [editExpressionForm, setEditExpressionForm] = useState<EditExpressionForm>({
    english: "",
    chinese: "",
    category: "",
    difficulty: "",
    note: "",
    tags: "",
    alternatives: "",
  });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const t = translations[appLanguage];

  function renderLoadingScreen() {
    return (
      <main className="phone-shell">
        <section className="screen active loading-screen" aria-label="Loading">
          <div className="brand-mark" aria-label="SpeakVault logo">
            <span className="vault-arc" />
            <span className="brand-letters">SV</span>
          </div>
          <p>{t.common.loading}</p>
        </section>
      </main>
    );
  }

  useEffect(() => {
    let isMounted = true;
    const authTimeout = window.setTimeout(() => {
      if (!isMounted) return;
      setUser(null);
      setIsAuthLoading(false);
    }, 4000);

    const storedLanguage = window.localStorage.getItem("speakvault-language");
    if (storedLanguage === "en" || storedLanguage === "zh") {
      setAppLanguage(storedLanguage);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setUser(data.session?.user ?? null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setAuthMessage(`Could not connect to Supabase auth: ${getErrorMessage(error)}`);
      })
      .finally(() => {
        if (!isMounted) return;
        window.clearTimeout(authTimeout);
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("speakvault-language", appLanguage);
    document.documentElement.lang = appLanguage === "zh" ? "zh-CN" : "en";
  }, [appLanguage]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (practiceAudioUrl) {
        URL.revokeObjectURL(practiceAudioUrl);
      }
    };
  }, [practiceAudioUrl]);

  useEffect(() => {
    if (!user) {
      setLibrary([]);
      setPracticeSessions([]);
      setSelectedExpressionId("");
      setProfile(null);
      return;
    }

    loadUserProfile(user.id);
    loadExpressions();
    loadPracticeSessions();
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (mode === "login" && user) {
      router.replace("/app");
    }

    if (mode === "app" && !user) {
      router.replace("/login");
    }
  }, [isAuthLoading, mode, router, user]);

  useEffect(() => {
    const selectedTheme = profile?.visual_style ?? "System";

    function applyTheme() {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolvedTheme = selectedTheme === "System" ? (prefersDark ? "dark" : "light") : selectedTheme.toLowerCase();

      document.documentElement.dataset.theme = resolvedTheme;
    }

    applyTheme();
    if (selectedTheme !== "System") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [profile?.visual_style]);

  const filteredLibrary = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return library;
    return library.filter((item) =>
      [
        item.english,
        item.chinese,
        item.category,
        item.difficulty,
        item.status,
        item.note,
        item.tags.join(" "),
        item.alternatives.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [library, query]);

  async function loadExpressions() {
    setIsLibraryLoading(true);

    try {
      const { data, error } = await supabase.from("expressions").select("*").order("created_at", { ascending: false });

      if (error) {
        setAuthMessage(`Could not load your library: ${error.message}`);
        setLibrary([]);
      } else {
        setLibrary(data ?? []);
        setSelectedExpressionId((current) => (current && data?.some((item) => item.id === current) ? current : ""));
        setIsEditingExpression(false);
      }
    } catch (error) {
      setAuthMessage(`Could not load your library: ${getErrorMessage(error)}`);
      setLibrary([]);
    } finally {
      setIsLibraryLoading(false);
    }
  }

  async function loadPracticeSessions() {
    try {
      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*, expressions(id, english, chinese, category, difficulty)")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        if (!error.message.includes("practice_sessions")) {
          setAuthMessage(`Could not load practice history: ${error.message}`);
        }
        setPracticeSessions([]);
      } else {
        setPracticeSessions((data ?? []) as PracticeSessionWithExpression[]);
      }
    } catch (error) {
      setAuthMessage(`Could not load practice history: ${getErrorMessage(error)}`);
      setPracticeSessions([]);
    }
  }

  async function loadUserProfile(userId: string) {
    setIsProfileLoading(true);

    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle();

      if (error) {
        if (error.message.includes("user_profiles")) {
          setProfile(getDefaultProfile(userId));
          setAuthMessage("Profile sync is not set up yet. Run supabase/user_profiles.sql in Supabase, then try again.");
        } else {
          setAuthMessage(`Could not load profile: ${error.message}`);
        }
        return;
      }

      if (data) {
        const activePlan = getActivePlan(data);
        if (data.active_plan_key !== activePlan.key) {
          const profileUpdate = {
            active_plan_key: activePlan.key,
            active_plan_started_on: getTodayDateKey(),
            active_plan_completed_days: [],
          };
          const { data: normalizedProfile, error: normalizeError } = await supabase
            .from("user_profiles")
            .update(profileUpdate)
            .eq("user_id", userId)
            .select()
            .single();

          if (normalizeError) {
            setProfile({
              ...data,
              ...profileUpdate,
            });
            setAuthMessage(`Could not sync weekly plan: ${normalizeError.message}`);
          } else {
            setProfile(normalizedProfile);
          }

          return;
        }

        if (shouldRollOverWeeklyPlan(data)) {
          const nextPlan = getNextPlan(data);
          const completedPlanKeys = data.completed_plan_keys.includes(activePlan.key)
            ? data.completed_plan_keys
            : [...data.completed_plan_keys, activePlan.key];
          const rolloverUpdate = {
            active_plan_key: nextPlan.key,
            active_plan_started_on: getTodayDateKey(),
            active_plan_completed_days: [],
            completed_plan_keys: completedPlanKeys,
          };
          const { data: rolledProfile, error: rolloverError } = await supabase
            .from("user_profiles")
            .update(rolloverUpdate)
            .eq("user_id", userId)
            .select()
            .single();

          if (rolloverError) {
            setProfile(data);
            setAuthMessage(`Could not start this week's plan: ${rolloverError.message}`);
          } else {
            setProfile(rolledProfile);
          }

          return;
        }

        setProfile(data);
        return;
      }

      const defaultProfile = getDefaultProfile(userId);
      const { data: createdProfile, error: createError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          role: defaultProfile.role,
          major: defaultProfile.major,
          location: defaultProfile.location,
          english_style: defaultProfile.english_style,
          visual_style: defaultProfile.visual_style,
          active_plan_key: defaultProfile.active_plan_key,
          active_plan_started_on: defaultProfile.active_plan_started_on,
          active_plan_completed_days: defaultProfile.active_plan_completed_days,
          completed_plan_keys: defaultProfile.completed_plan_keys,
        })
        .select()
        .single();

      if (createError) {
        setProfile(defaultProfile);
        setAuthMessage(`Could not create profile: ${createError.message}`);
      } else {
        setProfile(createdProfile);
      }
    } catch (error) {
      setAuthMessage(`Could not load profile: ${getErrorMessage(error)}`);
    } finally {
      setIsProfileLoading(false);
    }
  }

  async function updateProfile(updates: ProfileUpdate) {
    if (!user || !profile) return;

    const nextProfile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setProfile(nextProfile);
    setAuthMessage("");

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        setAuthMessage(`Could not sync profile: ${error.message}`);
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      setAuthMessage(`Could not sync profile: ${getErrorMessage(error)}`);
    }
  }

  function updateLearningContext(updates: Partial<Pick<UserProfile, "role" | "major" | "location">>) {
    if (!profile) return;

    const nextProfile = {
      ...profile,
      ...updates,
    };
    const nextPlan = getMatchingPlans(nextProfile)[0];

    updateProfile({
      ...updates,
      active_plan_key: nextPlan.key,
      active_plan_started_on: getTodayDateKey(),
      active_plan_completed_days: [],
    });
  }

  function togglePlanDay(dayNumber: number) {
    if (!profile) return;

    const completedDays = profile.active_plan_completed_days.includes(dayNumber)
      ? profile.active_plan_completed_days.filter((day) => day !== dayNumber)
      : [...profile.active_plan_completed_days, dayNumber].sort((a, b) => a - b);

    updateProfile({ active_plan_completed_days: completedDays });
  }

  function startNextWeeklyPlan() {
    if (!profile) return;

    const activePlan = getActivePlan(profile);
    const nextPlan = getNextPlan(profile);
    const completedPlanKeys = profile.completed_plan_keys.includes(activePlan.key)
      ? profile.completed_plan_keys
      : [...profile.completed_plan_keys, activePlan.key];

    updateProfile({
      active_plan_key: nextPlan.key,
      active_plan_started_on: getTodayDateKey(),
      active_plan_completed_days: [],
      completed_plan_keys: completedPlanKeys,
    });
  }

  const selectedExpression = library.find((item) => item.id === selectedExpressionId) ?? null;
  const practiceExpression = library.find((item) => item.id === practiceExpressionId) ?? starterLibrary[0];
  const libraryFilters = [
    { label: t.library.filters[0], value: "" },
    { label: t.library.filters[1], value: "Work Meeting" },
    { label: t.library.filters[2], value: "Small Talk" },
    { label: t.library.filters[3], value: "Struggling" },
  ];
  const todaysPracticeCount = practiceSessions.filter(
    (session) => new Date(session.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const lastPracticeTime = practiceSessions[0]?.created_at
    ? new Intl.DateTimeFormat("en-NZ", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(practiceSessions[0].created_at))
    : appLanguage === "zh" ? "暂无" : "Not yet";
  const practicedExpressionCounts = practiceSessions.reduce<Record<string, number>>((counts, session) => {
    if (session.expression_id) {
      counts[session.expression_id] = (counts[session.expression_id] ?? 0) + 1;
    }

    return counts;
  }, {});
  const reviewItems =
    library.length > 0
      ? [...library]
          .sort((a, b) => {
            const statusPriority: Record<MasteryStatus, number> = {
              Struggling: 0,
              New: 1,
              Practising: 2,
              Mastered: 3,
            };
            const statusDelta = statusPriority[a.status] - statusPriority[b.status];

            if (statusDelta !== 0) return statusDelta;

            return (practicedExpressionCounts[a.id] ?? 0) - (practicedExpressionCounts[b.id] ?? 0);
          })
          .slice(0, 3)
      : starterLibrary.slice(0, 2);
  const focusExpression = reviewItems[0];
  const profileContext = getProfileContext(profile);
  const activePlan = getActivePlan(profile);
  const planProgress = Math.round(((profile?.active_plan_completed_days.length ?? 0) / activePlan.tasks.length) * 100);
  const isWeeklyPlanComplete = (profile?.active_plan_completed_days.length ?? 0) >= activePlan.tasks.length;
  const isNextPlanWeekAvailable = profile ? isNewPlanWeekAvailable(profile.active_plan_started_on) : false;
  const profileRoleDisplay =
    profileContext.role === "Student" && profileContext.major
      ? `${profileContext.role} · ${profileContext.major} · ${profileContext.location}`
      : `${profileContext.role} · ${profileContext.location}`;

  function startPractice(expression: Expression) {
    setPracticeExpressionId(expression.id);
    resetPracticeCapture();
    setActiveView("practice");
  }

  function resetPracticeCapture() {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    setShowTranscript(false);
    setIsRecording(false);
    setSpokenTranscript("");
    setPracticeVoiceMessage("");
    setPracticeFeedback(null);
    setAudioDurationMs(0);
    setPracticeInputMode("typed");
    transcriptRef.current = "";
    audioChunksRef.current = [];
    recordingStartedAtRef.current = 0;
    if (practiceAudioUrl) {
      URL.revokeObjectURL(practiceAudioUrl);
      setPracticeAudioUrl("");
    }
  }

  function showVoiceIssue(message: string) {
    setPracticeVoiceMessage(message);
    setAuthMessage(message);
  }

  function isPracticeFeedback(result: PracticeFeedback | { error?: string }): result is PracticeFeedback {
    return (
      "pronunciation_score" in result &&
      "accent_score" in result &&
      "naturalness_score" in result &&
      "completeness_score" in result
    );
  }

  function getSpeechRecognition() {
    if (typeof window === "undefined") return null;

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  }

  async function startAudioRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("Audio recording is not available in this browser. Try Chrome on desktop.");
    }

    if (practiceAudioUrl) {
      URL.revokeObjectURL(practiceAudioUrl);
      setPracticeAudioUrl("");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaStreamRef.current = stream;
    mediaRecorderRef.current = recorder;
    recordingStartedAtRef.current = Date.now();
    setAudioDurationMs(0);
    setPracticeInputMode("voice");

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const duration = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : 0;
      const mimeType = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      setAudioDurationMs(duration);
      if (audioBlob.size > 0) {
        setPracticeAudioUrl(URL.createObjectURL(audioBlob));
      }
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
  }

  async function startSpeechPractice() {
    if (!user) {
      showVoiceIssue("Please sign in before saving speech practice.");
      return;
    }

    try {
      await startAudioRecording();
    } catch (error) {
      showVoiceIssue(getErrorMessage(error));
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setPracticeVoiceMessage("Recording audio. Speech transcript is not available here, so type what you said after stopping.");
      setShowTranscript(false);
      setAuthMessage("");
      setIsRecording(true);
      return;
    }

    recognitionRef.current?.stop();
    const recognition = new Recognition();
    recognition.lang = "en-NZ";
    recognition.continuous = true;
    recognition.interimResults = true;
    transcriptRef.current = "";
    setSpokenTranscript("");
    setPracticeVoiceMessage("Listening... speak your English answer now.");
    setShowTranscript(false);
    setAuthMessage("");
    setIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => {
        const result = event.results.item(index);
        return result[0]?.transcript ?? "";
      })
        .join(" ")
        .trim();

      transcriptRef.current = transcript;
      setSpokenTranscript(transcript);
      if (transcript) {
        setPracticeVoiceMessage("Listening... transcript is coming through.");
      }
    };
    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow microphone access for this site in Chrome, then try again."
          : `Speech recognition error: ${event.error}`;
      showVoiceIssue(message);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopSpeechPractice() {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    const transcript = transcriptRef.current.trim();
    const duration = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : audioDurationMs;
    setAudioDurationMs(duration);

    if (!transcript) {
      showVoiceIssue("Audio captured. Type what you said below, then save it for AI feedback.");
      return;
    }

    savePracticeSession(transcript, "voice", duration);
  }

  function saveTypedTranscript() {
    const transcript = spokenTranscript.trim();

    if (!transcript) {
      showVoiceIssue("Type what you said, then save it to your practice history.");
      return;
    }

    savePracticeSession(transcript, practiceAudioUrl ? "voice" : "typed", audioDurationMs);
  }

  function beginEditExpression(expression: Expression) {
    setEditExpressionForm({
      english: expression.english,
      chinese: expression.chinese,
      category: expression.category,
      difficulty: expression.difficulty,
      note: expression.note,
      tags: expression.tags.join("\n"),
      alternatives: expression.alternatives.join("\n"),
    });
    setIsEditingExpression(true);
  }

  function parseLines(value: string) {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function setEditField(field: keyof EditExpressionForm, value: string) {
    setEditExpressionForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Network request failed.";
  }

  function isMissingFeedbackColumns(message: string) {
    return (
      message.includes("feedback_summary") ||
      message.includes("input_mode") ||
      message.includes("audio_duration_ms") ||
      message.includes("accent_score") ||
      message.includes("fluency_score") ||
      message.includes("accent_focus") ||
      message.includes("pronunciation_drill") ||
      message.includes("audio_note") ||
      message.includes("better_version") ||
      message.includes("next_step") ||
      message.includes("schema cache")
    );
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setIsAuthLoading(true);

    const credentials = {
      email: authEmail,
      password: authPassword,
    };

    try {
      const { data, error } =
        authMode === "sign-in"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp(credentials);

      if (error) {
        setAuthMessage(error.message);
      } else if (authMode === "sign-up" && !data.session) {
        setAuthMessage("Account created. Please check your email to confirm your sign-up.");
      } else {
        setUser(data.user);
        setAuthMessage("");
        router.replace("/app");
      }
    } catch (error) {
      setAuthMessage(`Could not connect to Supabase auth: ${getErrorMessage(error)}`);
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      setAuthMessage(`Could not sign out from Supabase: ${getErrorMessage(error)}`);
    }

    setUser(null);
    setLibrary([]);
    setPracticeSessions([]);
    setActiveView("practice");
    router.replace("/login");
  }

  async function saveExpression(sample: Omit<ExpressionInsert, "status">) {
    if (!user) return;

    const key = `${sample.english}-${sample.difficulty}`;
    setSavingExpression(key);

    try {
      const { data, error } = await supabase
        .from("expressions")
        .insert({
          ...sample,
          status: "New",
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        setAuthMessage(`Could not save expression: ${error.message}`);
      } else if (data) {
        setLibrary((current) => [data, ...current]);
        setActiveView("library");
      }
    } catch (error) {
      setAuthMessage(`Could not save expression: ${getErrorMessage(error)}`);
    } finally {
      setSavingExpression("");
    }
  }

  async function updateExpressionStatus(expression: Expression, status: MasteryStatus) {
    setUpdatingExpressionId(expression.id);
    setAuthMessage("");

    try {
      const { data, error } = await supabase.from("expressions").update({ status }).eq("id", expression.id).select().single();

      if (error) {
        setAuthMessage(`Could not update expression: ${error.message}`);
      } else if (data) {
        setLibrary((current) => current.map((item) => (item.id === data.id ? data : item)));
      }
    } catch (error) {
      setAuthMessage(`Could not update expression: ${getErrorMessage(error)}`);
    } finally {
      setUpdatingExpressionId("");
    }
  }

  async function savePracticeSession(
    transcript = spokenTranscript.trim(),
    inputMode: PracticeInputMode = "typed",
    durationMs = 0,
  ) {
    if (!user) return;

    setShowTranscript(true);
    setIsSavingPractice(true);
    setAuthMessage("");
    setPracticeFeedback(null);

    const isSavedExpression = practiceExpression.user_id === user.id;
    let feedbackWarning = "";
    let persistenceWarning = "";
    let feedback: PracticeFeedback = {
      pronunciation_score: 82,
      accent_score: 82,
      fluency_score: 84,
      naturalness_score: 88,
      completeness_score: 91,
      summary: "Saved with fallback scores because AI feedback was not available.",
      accent_focus: "Focus on clear sentence stress and final consonants.",
      pronunciation_drill: "Could I just check? Could I just check whether this figure is based on the latest client information?",
      audio_note: inputMode === "voice" ? "Audio was recorded locally for playback." : "This attempt was typed.",
      better_version: practiceExpression.english,
      next_step: "Try the sentence again and compare it with the target expression.",
    };
    const savedTranscript = transcript || practiceExpression.english;
    const safeDurationMs = Math.max(0, Math.round(durationMs));

    try {
      const response = await fetch("/api/evaluate-practice", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          transcript: savedTranscript,
          targetExpression: practiceExpression.english,
          chinesePrompt: practiceExpression.chinese,
          inputMode,
          audioDurationMs: safeDurationMs,
          profile: profileContext,
        }),
      });
      const result = (await response.json()) as PracticeFeedback | { error?: string };

      if (!response.ok || !isPracticeFeedback(result)) {
        throw new Error("error" in result ? result.error : "Could not evaluate practice.");
      }

      feedback = result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not evaluate practice.";
      feedbackWarning = `Saved with fallback scores. AI feedback unavailable: ${message}`;
      setPracticeVoiceMessage(feedbackWarning);
    }

    const sessionInsert = {
      user_id: user.id,
      expression_id: isSavedExpression ? practiceExpression.id : null,
      transcript: savedTranscript,
      input_mode: inputMode,
      audio_duration_ms: safeDurationMs,
      pronunciation_score: feedback.pronunciation_score,
      accent_score: feedback.accent_score,
      fluency_score: feedback.fluency_score,
      naturalness_score: feedback.naturalness_score,
      completeness_score: feedback.completeness_score,
      feedback_summary: feedback.summary,
      accent_focus: feedback.accent_focus,
      pronunciation_drill: feedback.pronunciation_drill,
      audio_note: feedback.audio_note,
      better_version: feedback.better_version,
      next_step: feedback.next_step,
    };

    try {
      let { data, error } = await supabase
        .from("practice_sessions")
        .insert(sessionInsert)
        .select()
        .single();

      if (error && isMissingFeedbackColumns(error.message)) {
        const fallbackInsert = {
          user_id: sessionInsert.user_id,
          expression_id: sessionInsert.expression_id,
          transcript: sessionInsert.transcript,
          input_mode: sessionInsert.input_mode,
          audio_duration_ms: sessionInsert.audio_duration_ms,
          pronunciation_score: sessionInsert.pronunciation_score,
          naturalness_score: sessionInsert.naturalness_score,
          completeness_score: sessionInsert.completeness_score,
        };
        const fallbackResult = await supabase.from("practice_sessions").insert(fallbackInsert).select().single();

        data = fallbackResult.data
          ? {
              ...fallbackResult.data,
              input_mode: inputMode,
              audio_duration_ms: safeDurationMs,
              feedback_summary: feedback.summary,
              accent_score: feedback.accent_score,
              fluency_score: feedback.fluency_score,
              accent_focus: feedback.accent_focus,
              pronunciation_drill: feedback.pronunciation_drill,
              audio_note: feedback.audio_note,
              better_version: feedback.better_version,
              next_step: feedback.next_step,
            }
          : fallbackResult.data;
        error = fallbackResult.error;

        persistenceWarning = "";
      }

      if (error) {
        if (error.message.includes("practice_sessions")) {
          setAuthMessage("Practice history is not set up yet. Run supabase/practice_sessions.sql in Supabase, then try again.");
        } else {
          setAuthMessage(`Could not save practice session: ${error.message}`);
        }
      } else if (data) {
        setPracticeSessions((current) => [
          {
            ...data,
            expressions: isSavedExpression
              ? {
                  id: practiceExpression.id,
                  english: practiceExpression.english,
                  chinese: practiceExpression.chinese,
                  category: practiceExpression.category,
                  difficulty: practiceExpression.difficulty,
                }
              : null,
          },
          ...current,
        ]);

        if (isSavedExpression && practiceExpression.status !== "Practising") {
          await updateExpressionStatus(practiceExpression, "Practising");
        }
      }
    } catch (error) {
      setAuthMessage(`Could not save practice session: ${getErrorMessage(error)}`);
    }

    setIsRecording(false);
    setIsSavingPractice(false);
    setSpokenTranscript(savedTranscript);
    setPracticeInputMode(inputMode);
    setAudioDurationMs(safeDurationMs);
    setPracticeFeedback(feedback);
    if (!feedbackWarning && !persistenceWarning) {
      setPracticeVoiceMessage("");
    }
  }

  async function deleteExpression(expression: Expression) {
    setUpdatingExpressionId(expression.id);
    setAuthMessage("");

    try {
      const { error } = await supabase.from("expressions").delete().eq("id", expression.id);

      if (error) {
        setAuthMessage(`Could not delete expression: ${error.message}`);
      } else {
        setLibrary((current) => current.filter((item) => item.id !== expression.id));
        setSelectedExpressionId("");
        setIsEditingExpression(false);
      }
    } catch (error) {
      setAuthMessage(`Could not delete expression: ${getErrorMessage(error)}`);
    } finally {
      setUpdatingExpressionId("");
    }
  }

  async function saveExpressionEdits(expression: Expression) {
    const nextExpression = {
      english: editExpressionForm.english.trim(),
      chinese: editExpressionForm.chinese.trim(),
      category: editExpressionForm.category.trim() || "Work Meeting",
      difficulty: editExpressionForm.difficulty.trim() || "Natural",
      note: editExpressionForm.note.trim(),
      tags: parseLines(editExpressionForm.tags),
      alternatives: parseLines(editExpressionForm.alternatives),
    };

    if (!nextExpression.english || !nextExpression.chinese) {
      setAuthMessage("English and Chinese fields are required.");
      return;
    }

    setUpdatingExpressionId(expression.id);
    setAuthMessage("");

    try {
      const { data, error } = await supabase
        .from("expressions")
        .update(nextExpression)
        .eq("id", expression.id)
        .select()
        .single();

      if (error) {
        setAuthMessage(`Could not save edits: ${error.message}`);
      } else if (data) {
        setLibrary((current) => current.map((item) => (item.id === data.id ? data : item)));
        setIsEditingExpression(false);
      }
    } catch (error) {
      setAuthMessage(`Could not save edits: ${getErrorMessage(error)}`);
    } finally {
      setUpdatingExpressionId("");
    }
  }

  async function generateExpressions() {
    setGenerateError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-expressions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ thought, profile: profileContext }),
      });

      const data = (await response.json()) as {
        expressions?: Omit<ExpressionInsert, "status">[];
        error?: string;
      };

      if (!response.ok || !data.expressions) {
        throw new Error(data.error ?? "Could not generate expressions.");
      }

      setGeneratedExpressions(data.expressions);
      setAuthMessage("");
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Could not generate expressions.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (isAuthLoading && !user) {
    return renderLoadingScreen();
  }

  if ((mode === "login" && user) || (mode === "app" && !user)) {
    return renderLoadingScreen();
  }

  if (!user) {
    return (
      <main className="phone-shell">
        <section className="screen active" aria-label="Login">
          <div className="login-orbit">
            <div className="signal-ring ring-one" />
            <div className="signal-ring ring-two" />
            <div className="brand-mark" aria-label="SpeakVault logo">
              <span className="vault-arc" />
              <span className="brand-letters">SV</span>
            </div>
          </div>
          <div className="login-copy">
            <p className="eyebrow">{t.auth.eyebrow}</p>
            <h1>SpeakVault</h1>
            <p>{t.auth.tagline}</p>
          </div>
          <form className="login-card" onSubmit={handleAuth}>
            <div className="language-switch" aria-label="System language">
              <button
                className={appLanguage === "en" ? "active" : ""}
                type="button"
                onClick={() => setAppLanguage("en")}
              >
                EN
              </button>
              <button
                className={appLanguage === "zh" ? "active" : ""}
                type="button"
                onClick={() => setAppLanguage("zh")}
              >
                中文
              </button>
            </div>
            <div className="auth-toggle" aria-label="Authentication mode">
              <button
                className={authMode === "sign-in" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("sign-in")}
              >
                {t.auth.signIn}
              </button>
              <button
                className={authMode === "sign-up" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("sign-up")}
              >
                {t.auth.createAccount}
              </button>
            </div>
            <label>
              {t.auth.email}
              <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" />
            </label>
            <label>
              {t.auth.password}
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                autoComplete={authMode === "sign-in" ? "current-password" : "new-password"}
                minLength={6}
                placeholder={t.auth.passwordPlaceholder}
              />
            </label>
            {authMessage && <p className="form-message">{authMessage}</p>}
            <button className="primary-button" type="submit" disabled={isAuthLoading}>
              {isAuthLoading ? t.auth.working : authMode === "sign-in" ? t.auth.signIn : t.auth.createAccount}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="phone-shell app-shell">
      <section className="screen active" aria-label="SpeakVault app">
        <header className="app-header">
          <div>
            <p className="eyebrow">{t.common.day}</p>
            <h2>{t.viewTitles[activeView]}</h2>
          </div>
          <button className="icon-button" type="button" onClick={() => setActiveView("profile")} aria-label="Open profile">
            {user.email?.slice(0, 2).toUpperCase() ?? "SV"}
          </button>
        </header>

        {authMessage && <p className="app-message">{authMessage}</p>}

        {activeView === "practice" && (
          <div className="view active">
            <section className="daily-panel">
              <div>
                <p className="eyebrow">{t.practice.mission}</p>
                <h3>{practiceExpression.category}</h3>
                <p>{t.practice.missionCopy}</p>
              </div>
              <button
                className="pulse-button"
                type="button"
                onClick={() => {
                  recognitionRef.current?.stop();
                  resetPracticeCapture();
                }}
              >
                {t.practice.start}
              </button>
            </section>

            <section className="metric-grid" aria-label="Daily metrics">
              <article>
                <strong>{todaysPracticeCount}</strong>
                <span>{t.practice.today}</span>
              </article>
              <article>
                <strong>{practiceSessions.length}</strong>
                <span>{t.practice.recent}</span>
              </article>
              <article>
                <strong className="compact-stat">{lastPracticeTime}</strong>
                <span>{t.practice.last}</span>
              </article>
            </section>

            <section className="practice-card">
              <div className="card-topline">
                <span>{t.practice.prompt}</span>
                <b>{practiceExpression.difficulty}</b>
              </div>
              <p className="chinese-prompt">{practiceExpression.chinese}</p>
              <button
                className={`record-button ${isRecording ? "recording" : ""}`}
                type="button"
                disabled={isSavingPractice}
                onClick={isRecording ? stopSpeechPractice : startSpeechPractice}
              >
                <span />
                {isSavingPractice
                  ? t.common.saving
                  : isRecording
                    ? t.practice.stopAndSave
                    : showTranscript
                      ? t.practice.recordAgain
                      : t.practice.startSpeaking}
              </button>
              {practiceVoiceMessage && <p className="practice-message">{practiceVoiceMessage}</p>}
              {practiceAudioUrl && (
                <div className="audio-review">
                  <div>
                    <p className="label">{t.practice.recordedAudio}</p>
                    <span>{(audioDurationMs / 1000).toFixed(1)}s · {practiceInputMode}</span>
                  </div>
                  <audio controls src={practiceAudioUrl} />
                </div>
              )}
              {isRecording && spokenTranscript && (
                <div className="live-transcript">
                  <p className="label">{t.practice.liveTranscript}</p>
                  <p>{spokenTranscript}</p>
                </div>
              )}
              {showTranscript && (
                <div className="transcript-panel">
                  <p className="label">{t.practice.yourTranscript}</p>
                  <p>{spokenTranscript || practiceExpression.english}</p>
                  <div className="score-row">
                    <span>{t.practice.pronunciation} {practiceFeedback?.pronunciation_score ?? 82}</span>
                    <span>{t.common.accent} {practiceFeedback?.accent_score ?? 82}</span>
                    <span>{t.practice.fluency} {practiceFeedback?.fluency_score ?? 84}</span>
                    <span>{t.practice.naturalness} {practiceFeedback?.naturalness_score ?? 88}</span>
                    <span>{t.practice.completeness} {practiceFeedback?.completeness_score ?? 91}</span>
                  </div>
                  {practiceFeedback && (
                    <div className="feedback-notes">
                      <p className="label">{t.practice.aiFeedback}</p>
                      <p>{practiceFeedback.summary}</p>
                      <p>
                        <b>{t.practice.accentFocus}:</b> {practiceFeedback.accent_focus}
                      </p>
                      <p>
                        <b>{t.common.drill}:</b> {practiceFeedback.pronunciation_drill}
                      </p>
                      <p>
                        <b>{t.common.audio}:</b> {practiceFeedback.audio_note}
                      </p>
                      <p>
                        <b>{t.common.better}:</b> {practiceFeedback.better_version}
                      </p>
                      <p>
                        <b>{t.common.next}:</b> {practiceFeedback.next_step}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {!isRecording && (!showTranscript || (practiceAudioUrl && !spokenTranscript.trim())) && (
                <div className="manual-transcript">
                  <label htmlFor="manual-transcript">{t.practice.typedTranscript}</label>
                  <textarea
                    id="manual-transcript"
                    value={spokenTranscript}
                    onChange={(event) => setSpokenTranscript(event.target.value)}
                    placeholder={t.practice.transcriptPlaceholder}
                  />
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={isSavingPractice || !spokenTranscript.trim()}
                    onClick={saveTypedTranscript}
                  >
                    {t.practice.saveTypedTranscript}
                  </button>
                </div>
              )}
              <div className="target-expression">
                <p className="label">{t.practice.targetExpression}</p>
                <p>{practiceExpression.english}</p>
              </div>
            </section>

            <section>
              <div className="section-heading">
                <h3>{t.practice.recentPractice}</h3>
                <span className="subtle-count">{practiceSessions.length} {t.practice.savedCount}</span>
              </div>
              <div className="session-list">
                {practiceSessions.length === 0 ? (
                  <article className="session-card">
                    <p>{t.practice.noSessions}</p>
                  </article>
                ) : (
                  practiceSessions.slice(0, 3).map((session) => (
                    <article className="session-card" key={session.id}>
                      <div className="card-topline">
                        <span>
                          {session.expressions?.category ?? "Standalone"} · {session.input_mode ?? "typed"} ·{" "}
                          {new Intl.DateTimeFormat("en-NZ", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(session.created_at))}
                        </span>
                        <b>
                          {Math.round(
                            (session.pronunciation_score + session.naturalness_score + session.completeness_score) / 3,
                          )}
                        </b>
                      </div>
                      {session.expressions && <p className="session-source">{t.practice.promptLabel}: {session.expressions.chinese}</p>}
                      <p>{session.transcript}</p>
                      <div className="score-row">
                        <span>P {session.pronunciation_score}</span>
                        {session.accent_score !== null && <span>A {session.accent_score}</span>}
                        {session.fluency_score !== null && <span>F {session.fluency_score}</span>}
                        <span>N {session.naturalness_score}</span>
                        <span>C {session.completeness_score}</span>
                      </div>
                      {(session.feedback_summary ||
                        session.accent_focus ||
                        session.pronunciation_drill ||
                        session.audio_note ||
                        session.better_version ||
                        session.next_step) && (
                        <div className="session-feedback">
                          {session.feedback_summary && <p>{session.feedback_summary}</p>}
                          {session.audio_duration_ms !== null && (
                            <p>
                              <b>Audio:</b> {(session.audio_duration_ms / 1000).toFixed(1)}s
                            </p>
                          )}
                          {session.accent_focus && (
                            <p>
                              <b>{t.common.accent}:</b> {session.accent_focus}
                            </p>
                          )}
                          {session.pronunciation_drill && (
                            <p>
                              <b>{t.common.drill}:</b> {session.pronunciation_drill}
                            </p>
                          )}
                          {session.audio_note && (
                            <p>
                              <b>{t.practice.audioNote}:</b> {session.audio_note}
                            </p>
                          )}
                          {session.better_version && (
                            <p>
                              <b>{t.common.better}:</b> {session.better_version}
                            </p>
                          )}
                          {session.next_step && (
                            <p>
                              <b>{t.common.next}:</b> {session.next_step}
                            </p>
                          )}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="section-heading">
                <h3>{t.practice.reviewQueue}</h3>
                <button className="text-button" type="button" onClick={() => setActiveView("library")}>
                  {t.practice.viewAll}
                </button>
              </div>
              <div className="mini-list">
                {reviewItems.map((item) => (
                  <button className="mini-item" key={item.id} type="button" onClick={() => startPractice(item)}>
                    <span>{item.english}</span>
                    <b>{item.status} · {practicedExpressionCounts[item.id] ?? 0}x</b>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeView === "generate" && (
          <div className="view active">
            <section className="input-panel">
              <label htmlFor="thought-input">{t.generate.thoughtLabel}</label>
              <textarea id="thought-input" value={thought} onChange={(event) => setThought(event.target.value)} />
              {generateError && <p className="form-message">{generateError}</p>}
              <button className="primary-button" type="button" onClick={generateExpressions} disabled={isGenerating || !thought.trim()}>
                {isGenerating ? t.generate.generating : t.generate.button}
              </button>
            </section>

            <section className="generated-list">
              {generatedExpressions.map((sample) => {
                const key = `${sample.english}-${sample.difficulty}`;
                const alreadySaved = library.some((item) => item.english === sample.english);
                return (
                  <article className="expression-card" key={key}>
                    <div className="card-topline">
                      <span>{sample.difficulty}</span>
                      <b>{sample.category}</b>
                    </div>
                    <h3>{sample.english}</h3>
                    <p>{t.common.chinese}: {sample.chinese}</p>
                    <p>{t.generate.why}: {sample.note}</p>
                    <div className="tag-row">
                      {sample.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => saveExpression(sample)}
                      disabled={alreadySaved || savingExpression === key}
                    >
                      {alreadySaved ? t.common.saved : savingExpression === key ? t.common.saving : t.generate.saveToLibrary}
                    </button>
                  </article>
                );
              })}
            </section>
          </div>
        )}

        {activeView === "library" && (
          <div className="view active">
            <section className="search-panel">
              <input
                type="search"
                placeholder={t.library.search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="filter-row">
                {libraryFilters.map((filter) => (
                  <button
                    className={`chip ${query === filter.value || (!filter.value && !query) ? "active" : ""}`}
                    key={filter.value || "all"}
                    type="button"
                    onClick={() => setQuery(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </section>
            <section className="library-list">
              {isLibraryLoading ? (
                <article className="library-card">
                  <h3>{t.library.loadingTitle}</h3>
                  <p>{t.library.loadingCopy}</p>
                </article>
              ) : filteredLibrary.length === 0 ? (
                <article className="library-card">
                  <h3>{t.library.emptyTitle}</h3>
                  <p>{t.library.emptyCopy}</p>
                </article>
              ) : (
                filteredLibrary.map((item) => (
                  <button
                    className={`library-card library-card-button ${selectedExpressionId === item.id ? "selected" : ""}`}
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedExpressionId(item.id);
                      setIsEditingExpression(false);
                    }}
                  >
                    <div className="card-topline">
                      <span>
                        {item.category} · {item.difficulty}
                      </span>
                      <b>{item.status}</b>
                    </div>
                    <h3>{item.english}</h3>
                    <p>{t.common.chinese}: {item.chinese}</p>
                    <p>{item.note}</p>
                    <div className="tag-row">
                      {item.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </button>
                ))
              )}
            </section>
            {selectedExpression && (
              <section className="detail-panel" aria-label="Expression details">
                <div className="section-heading">
                  <h3>{t.library.details}</h3>
                  <button className="text-button" type="button" onClick={() => setSelectedExpressionId("")}>
                    {t.common.close}
                  </button>
                </div>
                <article className="detail-card">
                  <div className="card-topline">
                    <span>
                      {selectedExpression.category} · {selectedExpression.difficulty}
                    </span>
                    <b>{selectedExpression.status}</b>
                  </div>
                  {isEditingExpression ? (
                    <div className="edit-form">
                      <label>
                        {t.library.english}
                        <textarea value={editExpressionForm.english} onChange={(event) => setEditField("english", event.target.value)} />
                      </label>
                      <label>
                        {t.library.chinese}
                        <textarea value={editExpressionForm.chinese} onChange={(event) => setEditField("chinese", event.target.value)} />
                      </label>
                      <div className="two-column-fields">
                        <label>
                          {t.library.category}
                          <input value={editExpressionForm.category} onChange={(event) => setEditField("category", event.target.value)} />
                        </label>
                        <label>
                          {t.library.difficulty}
                          <input value={editExpressionForm.difficulty} onChange={(event) => setEditField("difficulty", event.target.value)} />
                        </label>
                      </div>
                      <label>
                        {t.library.why}
                        <textarea value={editExpressionForm.note} onChange={(event) => setEditField("note", event.target.value)} />
                      </label>
                      <label>
                        {t.library.alternatives}
                        <textarea
                          value={editExpressionForm.alternatives}
                          onChange={(event) => setEditField("alternatives", event.target.value)}
                        />
                      </label>
                      <label>
                        {t.library.tags}
                        <textarea value={editExpressionForm.tags} onChange={(event) => setEditField("tags", event.target.value)} />
                      </label>
                      <div className="detail-actions">
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={updatingExpressionId === selectedExpression.id}
                          onClick={() => saveExpressionEdits(selectedExpression)}
                        >
                          {updatingExpressionId === selectedExpression.id ? t.common.saving : t.library.saveChanges}
                        </button>
                        <button className="text-button" type="button" onClick={() => setIsEditingExpression(false)}>
                          {t.common.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{selectedExpression.english}</h3>
                      <p>{t.common.chinese}: {selectedExpression.chinese}</p>
                      <div className="detail-block">
                        <span>{t.library.why}</span>
                        <p>{selectedExpression.note}</p>
                      </div>
                      <div className="detail-block">
                        <span>{t.library.alternatives}</span>
                        <ul>
                          {selectedExpression.alternatives.map((alternative) => (
                            <li key={alternative}>{alternative}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="detail-block">
                        <span>{t.library.tags}</span>
                        <div className="tag-row">
                          {selectedExpression.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="detail-block">
                        <span>{t.library.mastery}</span>
                        <div className="status-grid">
                          {masteryStatuses.map((status) => (
                            <button
                              className={`chip ${selectedExpression.status === status ? "active" : ""}`}
                              key={status}
                              type="button"
                              disabled={updatingExpressionId === selectedExpression.id}
                              onClick={() => updateExpressionStatus(selectedExpression, status)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="detail-actions">
                        <button className="secondary-button" type="button" onClick={() => startPractice(selectedExpression)}>
                          {t.library.practiceThis}
                        </button>
                        <button className="secondary-button" type="button" onClick={() => beginEditExpression(selectedExpression)}>
                          {t.library.edit}
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          disabled={updatingExpressionId === selectedExpression.id}
                          onClick={() => deleteExpression(selectedExpression)}
                        >
                          {updatingExpressionId === selectedExpression.id ? t.common.updating : t.library.delete}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              </section>
            )}
          </div>
        )}

        {activeView === "plan" && (
          <div className="view active">
            <section className="plan-panel">
              <p className="eyebrow">{t.plan.eyebrow}</p>
              <h3>{activePlan.title}</h3>
              <div className="progress-track">
                <span style={{ width: `${planProgress}%` }} />
              </div>
              <p>{activePlan.copy}</p>
              <p className="plan-meta">
                {profileRoleDisplay} · {profileContext.english_style} · {profile?.active_plan_completed_days.length ?? 0}/7 {t.plan.progress}
              </p>
              {isWeeklyPlanComplete && isNextPlanWeekAvailable && (
                <button className="secondary-button" type="button" onClick={startNextWeeklyPlan}>
                  {t.plan.startNext}
                </button>
              )}
              {isWeeklyPlanComplete && !isNextPlanWeekAvailable && <p className="plan-meta">{t.plan.nextWeekReady}</p>}
            </section>
            <section className="day-list">
              {activePlan.tasks.map((task, index) => {
                const dayNumber = index + 1;
                const isComplete = profile?.active_plan_completed_days.includes(dayNumber) ?? false;

                return (
                  <article className={`day-card ${index === 0 ? "active-day" : ""} ${isComplete ? "completed-day" : ""}`} key={task.title}>
                    <span>Day {dayNumber}</span>
                    <h3>{task.title}</h3>
                    <p>{task.copy}</p>
                    <button className="chip" type="button" onClick={() => togglePlanDay(dayNumber)}>
                      {isComplete ? t.common.completed : t.common.complete}
                    </button>
                  </article>
                );
              })}
            </section>
          </div>
        )}

        {activeView === "profile" && (
          <div className="view active">
            <section className="profile-panel">
              <div className="avatar">{user.email?.slice(0, 2).toUpperCase() ?? "SV"}</div>
              <h3>{profileRoleDisplay}</h3>
              <p>{user.email}</p>
              <p>{profileContext.english_style} English</p>
            </section>
            <section className="settings-list">
              <div className="setting-row setting-row-static setting-row-stack">
                <span>{t.profile.role}</span>
                <div className="select-grid">
                  <label>
                    {t.profile.roleLabel}
                    <select
                      value={profileContext.role}
                      onChange={(event) => {
                        const nextRole = event.target.value as UserRole;
                        updateLearningContext({
                          role: nextRole,
                          major: nextRole === "Student" ? profile?.major || "Accounting" : "",
                        });
                      }}
                    >
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                  {profileContext.role === "Student" && (
                    <label>
                      {t.profile.majorLabel}
                      <select
                        value={profileContext.major || "Accounting"}
                        onChange={(event) => updateLearningContext({ major: event.target.value })}
                      >
                        {majorOptions.map((major) => (
                          <option key={major} value={major}>
                            {major}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    {t.profile.locationLabel}
                    <select value={profileContext.location} onChange={(event) => updateLearningContext({ location: event.target.value })}>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="setting-row setting-row-static setting-row-stack">
                <span>{t.profile.englishStyle}</span>
                <div className="option-grid">
                  {englishStyleOptions.map((style) => (
                    <button
                      className={`chip ${profileContext.english_style === style ? "active" : ""}`}
                      key={style}
                      type="button"
                      onClick={() => updateProfile({ english_style: style })}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row setting-row-static setting-row-stack">
                <span>{t.profile.visualStyle}</span>
                <div className="option-grid">
                  {visualStyleOptions.map((style) => (
                    <button
                      className={`chip ${(profile?.visual_style ?? "System") === style ? "active" : ""}`}
                      key={style}
                      type="button"
                      onClick={() => updateProfile({ visual_style: style })}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-row setting-row-static">
                <span>{t.profile.language}</span>
                <div className="language-switch compact" aria-label="System language">
                  <button
                    className={appLanguage === "en" ? "active" : ""}
                    type="button"
                    onClick={() => setAppLanguage("en")}
                  >
                    EN
                  </button>
                  <button
                    className={appLanguage === "zh" ? "active" : ""}
                    type="button"
                    onClick={() => setAppLanguage("zh")}
                  >
                    中文
                  </button>
                </div>
              </div>
              {[
                [t.profile.profileSync, isProfileLoading ? t.auth.working : t.profile.supabaseProfile],
                [t.profile.loginSecurity, t.profile.supabaseAuth],
              ].map(([label, value]) => (
                <button className="setting-row" key={label} type="button">
                  <span>{label}</span>
                  <b>{value}</b>
                </button>
              ))}
              <button className="setting-row" type="button" onClick={signOut}>
                <span>{t.profile.session}</span>
                <b>{t.profile.signOut}</b>
              </button>
            </section>
          </div>
        )}

        <nav className="bottom-nav" aria-label="Primary navigation">
          {[
            ["practice", "◌", t.nav.practice],
            ["generate", "+", t.nav.generate],
            ["library", "⌕", t.nav.library],
            ["plan", "▣", t.nav.plan],
            ["profile", "◇", t.nav.profile],
          ].map(([view, icon, label]) => (
            <button
              className={`nav-button ${activeView === view ? "active" : ""}`}
              key={view}
              type="button"
              onClick={() => setActiveView(view as ViewName)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
