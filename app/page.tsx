"use client";

import type { User } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Expression, ExpressionInsert, MasteryStatus } from "../lib/database.types";
import { supabase } from "../lib/supabase";

type ViewName = "practice" | "generate" | "library" | "plan" | "profile";
type AuthMode = "sign-in" | "sign-up";

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
    english: "I’m not completely sure this is the best approach, but I think it’s worth trialling first.",
    chinese: "我不完全确定这是最优方案，但我觉得值得先试一下。",
    category: "Work Meeting",
    difficulty: "Natural",
    tags: ["testing", "meeting", "soft disagreement"],
    note: "“Worth trialling” sounds natural in NZ/AU workplace English and avoids sounding too direct.",
    alternatives: ["It might be worth testing first.", "We could try it and review the outcome."],
  },
  {
    english: "I’m not fully convinced it’s the optimal option yet, but we could test it and see how it goes.",
    chinese: "我还不完全相信这是最优选择，但我们可以测试一下看看效果。",
    category: "Work Meeting",
    difficulty: "Advanced",
    tags: ["strategy", "disagreeing", "professional"],
    note: "“Not fully convinced” is professional and softer than saying “I disagree”.",
    alternatives: ["I’m not totally sold on it yet.", "I’d like to see how it performs first."],
  },
  {
    english: "It might not be perfect, but I’m happy to give it a go and review the outcome.",
    chinese: "它可能不是完美方案，但我愿意先试试，再看结果。",
    category: "Work Meeting",
    difficulty: "Softer",
    tags: ["NZ English", "team chat", "trial"],
    note: "“Give it a go” is conversational and common in New Zealand.",
    alternatives: ["Let’s give it a go.", "We can try it and revisit it later."],
  },
];

const viewTitles: Record<ViewName, string> = {
  practice: "Practice",
  generate: "Generate",
  library: "Library",
  plan: "Plan",
  profile: "Profile",
};

const masteryStatuses: MasteryStatus[] = ["New", "Practising", "Struggling", "Mastered"];

export default function Home() {
  const [activeView, setActiveView] = useState<ViewName>("practice");
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [authEmail, setAuthEmail] = useState("you@auckland.nz");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [thought, setThought] = useState("我不是很确定这个方案是不是最优的，但我觉得我们可以先试一下。");
  const [generatedExpressions, setGeneratedExpressions] = useState<Omit<ExpressionInsert, "status">[]>(generatedSamples);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [library, setLibrary] = useState<Expression[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [savingExpression, setSavingExpression] = useState("");
  const [selectedExpressionId, setSelectedExpressionId] = useState("");
  const [updatingExpressionId, setUpdatingExpressionId] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLibrary([]);
      setSelectedExpressionId("");
      return;
    }

    loadExpressions();
  }, [user]);

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
    const { data, error } = await supabase.from("expressions").select("*").order("created_at", { ascending: false });

    if (error) {
      setAuthMessage(`Could not load your library: ${error.message}`);
      setLibrary([]);
    } else {
      setLibrary(data ?? []);
      setSelectedExpressionId((current) => (current && data?.some((item) => item.id === current) ? current : ""));
    }

    setIsLibraryLoading(false);
  }

  const selectedExpression = library.find((item) => item.id === selectedExpressionId) ?? null;

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setIsAuthLoading(true);

    const credentials = {
      email: authEmail,
      password: authPassword,
    };

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
    }

    setIsAuthLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setLibrary([]);
    setActiveView("practice");
  }

  async function saveExpression(sample: Omit<ExpressionInsert, "status">) {
    if (!user) return;

    const key = `${sample.english}-${sample.difficulty}`;
    setSavingExpression(key);

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

    setSavingExpression("");
  }

  async function updateExpressionStatus(expression: Expression, status: MasteryStatus) {
    setUpdatingExpressionId(expression.id);
    setAuthMessage("");

    const { data, error } = await supabase.from("expressions").update({ status }).eq("id", expression.id).select().single();

    if (error) {
      setAuthMessage(`Could not update expression: ${error.message}`);
    } else if (data) {
      setLibrary((current) => current.map((item) => (item.id === data.id ? data : item)));
    }

    setUpdatingExpressionId("");
  }

  async function deleteExpression(expression: Expression) {
    setUpdatingExpressionId(expression.id);
    setAuthMessage("");

    const { error } = await supabase.from("expressions").delete().eq("id", expression.id);

    if (error) {
      setAuthMessage(`Could not delete expression: ${error.message}`);
    } else {
      setLibrary((current) => current.filter((item) => item.id !== expression.id));
      setSelectedExpressionId("");
    }

    setUpdatingExpressionId("");
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
        body: JSON.stringify({ thought }),
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
    return (
      <main className="phone-shell">
        <section className="screen active loading-screen" aria-label="Loading">
          <div className="brand-mark" aria-label="SpeakVault logo">
            <span className="vault-arc" />
            <span className="brand-letters">SV</span>
          </div>
          <p>Loading SpeakVault...</p>
        </section>
      </main>
    );
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
            <p className="eyebrow">Personal fluency system</p>
            <h1>SpeakVault</h1>
            <p>Build a private vault of workplace-ready English you can actually say.</p>
          </div>
          <form className="login-card" onSubmit={handleAuth}>
            <div className="auth-toggle" aria-label="Authentication mode">
              <button
                className={authMode === "sign-in" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("sign-in")}
              >
                Sign in
              </button>
              <button
                className={authMode === "sign-up" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("sign-up")}
              >
                Create account
              </button>
            </div>
            <label>
              Email
              <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" />
            </label>
            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                autoComplete={authMode === "sign-in" ? "current-password" : "new-password"}
                minLength={6}
                placeholder="At least 6 characters"
              />
            </label>
            {authMessage && <p className="form-message">{authMessage}</p>}
            <button className="primary-button" type="submit" disabled={isAuthLoading}>
              {isAuthLoading ? "Working..." : authMode === "sign-in" ? "Sign in" : "Create account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const reviewItems = library.length > 0 ? library.slice(0, 2) : starterLibrary.slice(0, 2);

  return (
    <main className="phone-shell">
      <section className="screen active" aria-label="SpeakVault app">
        <header className="app-header">
          <div>
            <p className="eyebrow">Day 4 of 30</p>
            <h2>{viewTitles[activeView]}</h2>
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
                <p className="eyebrow">Today&apos;s mission</p>
                <h3>Ask for clarification in a tax meeting</h3>
                <p>Focus on sounding calm, specific, and professional when you need more context.</p>
              </div>
              <button
                className="pulse-button"
                type="button"
                onClick={() => {
                  setShowTranscript(false);
                  setIsRecording(false);
                }}
              >
                Start
              </button>
            </section>

            <section className="metric-grid" aria-label="Daily metrics">
              <article>
                <strong>10</strong>
                <span>min learn</span>
              </article>
              <article>
                <strong>10</strong>
                <span>min speak</span>
              </article>
              <article>
                <strong>10</strong>
                <span>min review</span>
              </article>
            </section>

            <section className="practice-card">
              <div className="card-topline">
                <span>Speaking prompt</span>
                <b>Work Meeting</b>
              </div>
              <p className="chinese-prompt">我想确认一下这个数字是基于最新的客户资料吗？</p>
              <button
                className={`record-button ${isRecording ? "recording" : ""}`}
                type="button"
                onClick={() => {
                  setIsRecording((current) => !current);
                  setShowTranscript(true);
                }}
              >
                <span />
                {isRecording ? "Recording..." : showTranscript ? "Record again" : "Hold to speak"}
              </button>
              {showTranscript && (
                <div className="transcript-panel">
                  <p className="label">Your transcript</p>
                  <p>Could I just check whether this figure is based on the latest client information?</p>
                  <div className="score-row">
                    <span>Pronunciation 82</span>
                    <span>Naturalness 88</span>
                    <span>Completeness 91</span>
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="section-heading">
                <h3>Review queue</h3>
                <button className="text-button" type="button" onClick={() => setActiveView("library")}>
                  View all
                </button>
              </div>
              <div className="mini-list">
                {reviewItems.map((item) => (
                  <button className="mini-item" key={item.id} type="button" onClick={() => setActiveView("library")}>
                    <span>{item.english}</span>
                    <b>{item.status}</b>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeView === "generate" && (
          <div className="view active">
            <section className="input-panel">
              <label htmlFor="thought-input">Chinese thought</label>
              <textarea id="thought-input" value={thought} onChange={(event) => setThought(event.target.value)} />
              {generateError && <p className="form-message">{generateError}</p>}
              <button className="primary-button" type="button" onClick={generateExpressions} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate 3 expressions"}
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
                    <p>中文：{sample.chinese}</p>
                    <p>Why it works: {sample.note}</p>
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
                      {alreadySaved ? "Saved" : savingExpression === key ? "Saving..." : "Save to Library"}
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
                placeholder="Search expressions or tags"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="filter-row">
                {["All", "Work Meeting", "Small Talk", "Struggling"].map((filter) => (
                  <button
                    className={`chip ${query === filter || (filter === "All" && !query) ? "active" : ""}`}
                    key={filter}
                    type="button"
                    onClick={() => setQuery(filter === "All" ? "" : filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </section>
            <section className="library-list">
              {isLibraryLoading ? (
                <article className="library-card">
                  <h3>Loading your vault...</h3>
                  <p>Fetching your saved expressions from Supabase.</p>
                </article>
              ) : filteredLibrary.length === 0 ? (
                <article className="library-card">
                  <h3>Your vault is empty</h3>
                  <p>Go to Generate, save an expression, and it will appear here.</p>
                </article>
              ) : (
                filteredLibrary.map((item) => (
                  <button
                    className={`library-card library-card-button ${selectedExpressionId === item.id ? "selected" : ""}`}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedExpressionId(item.id)}
                  >
                    <div className="card-topline">
                      <span>
                        {item.category} · {item.difficulty}
                      </span>
                      <b>{item.status}</b>
                    </div>
                    <h3>{item.english}</h3>
                    <p>中文：{item.chinese}</p>
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
                  <h3>Expression details</h3>
                  <button className="text-button" type="button" onClick={() => setSelectedExpressionId("")}>
                    Close
                  </button>
                </div>
                <article className="detail-card">
                  <div className="card-topline">
                    <span>
                      {selectedExpression.category} · {selectedExpression.difficulty}
                    </span>
                    <b>{selectedExpression.status}</b>
                  </div>
                  <h3>{selectedExpression.english}</h3>
                  <p>中文：{selectedExpression.chinese}</p>
                  <div className="detail-block">
                    <span>Why it works</span>
                    <p>{selectedExpression.note}</p>
                  </div>
                  <div className="detail-block">
                    <span>Alternatives</span>
                    <ul>
                      {selectedExpression.alternatives.map((alternative) => (
                        <li key={alternative}>{alternative}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="detail-block">
                    <span>Tags</span>
                    <div className="tag-row">
                      {selectedExpression.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="detail-block">
                    <span>Mastery status</span>
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
                  <button
                    className="danger-button"
                    type="button"
                    disabled={updatingExpressionId === selectedExpression.id}
                    onClick={() => deleteExpression(selectedExpression)}
                  >
                    {updatingExpressionId === selectedExpression.id ? "Updating..." : "Delete expression"}
                  </button>
                </article>
              </section>
            )}
          </div>
        )}

        {activeView === "plan" && (
          <div className="view active">
            <section className="plan-panel">
              <p className="eyebrow">Adaptive plan</p>
              <h3>Current weakness: concise meeting responses</h3>
              <div className="progress-track">
                <span style={{ width: "28%" }} />
              </div>
              <p>SpeakVault will prioritise clarification, interruptions, and progress updates this week.</p>
            </section>
            <section className="day-list">
              {[
                ["Day 4", "Ask for clarification", "Real task: ask whether a tax figure uses the latest client data."],
                ["Day 5", "Interrupt politely", "Real task: add one quick point without sounding abrupt."],
                ["Day 6", "Explain a delay", "Real task: ask for more time while keeping confidence."],
              ].map(([day, title, copy], index) => (
                <article className={`day-card ${index === 0 ? "active-day" : ""}`} key={day}>
                  <span>{day}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </section>
          </div>
        )}

        {activeView === "profile" && (
          <div className="view active">
            <section className="profile-panel">
              <div className="avatar">{user.email?.slice(0, 2).toUpperCase() ?? "SV"}</div>
              <h3>Tax Accountant · Auckland</h3>
              <p>{user.email}</p>
              <p>Target accent: NZ / AU workplace English</p>
            </section>
            <section className="settings-list">
              {[
                ["AI voice", "Selectable"],
                ["Interface language", "English"],
                ["Visual style", "Notion simple"],
                ["Login security", "Supabase Auth"],
              ].map(([label, value]) => (
                <button className="setting-row" key={label} type="button">
                  <span>{label}</span>
                  <b>{value}</b>
                </button>
              ))}
              <button className="setting-row" type="button" onClick={signOut}>
                <span>Session</span>
                <b>Sign out</b>
              </button>
            </section>
          </div>
        )}

        <nav className="bottom-nav" aria-label="Primary navigation">
          {[
            ["practice", "◌", "Practice"],
            ["generate", "+", "Generate"],
            ["library", "⌕", "Library"],
            ["plan", "▣", "Plan"],
            ["profile", "◇", "Profile"],
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
