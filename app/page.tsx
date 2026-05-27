"use client";

import { FormEvent, useMemo, useState } from "react";

type ViewName = "practice" | "generate" | "library" | "plan" | "profile";
type MasteryStatus = "New" | "Practising" | "Struggling" | "Mastered";

type Expression = {
  id: number;
  english: string;
  chinese: string;
  category: string;
  difficulty: string;
  status: MasteryStatus;
  tags: string[];
  note: string;
  alternatives: string[];
};

const starterLibrary: Expression[] = [
  {
    id: 1,
    english: "Could I just check whether this figure is based on the latest client information?",
    chinese: "我想确认一下这个数字是基于最新的客户资料吗？",
    category: "Work Meeting",
    difficulty: "Natural",
    status: "Practising",
    tags: ["tax return", "clarification", "manager"],
    note: "Softens the question with “Could I just check”, which sounds natural in NZ/AU meetings.",
    alternatives: ["Can I quickly confirm the source of this figure?", "Is this based on the latest client docs?"],
  },
  {
    id: 2,
    english: "I’ll double-check that and come back to you shortly.",
    chinese: "我会再核对一下，然后尽快回复你。",
    category: "Work Meeting",
    difficulty: "Easy",
    status: "Mastered",
    tags: ["figures", "follow-up", "client docs"],
    note: "Concise and confident when you need more time without over-explaining.",
    alternatives: ["Let me verify that first.", "I’ll check that and get back to you."],
  },
  {
    id: 3,
    english: "Could I jump in with one quick point?",
    chinese: "我可以插一句很快的观点吗？",
    category: "Work Meeting",
    difficulty: "Natural",
    status: "New",
    tags: ["interrupting", "polite", "meeting"],
    note: "A common, low-friction way to enter a conversation.",
    alternatives: ["Can I add one quick thing?", "Could I quickly add to that?"],
  },
  {
    id: 4,
    english: "I’m not fully convinced it’s the optimal option yet, but we could test it and see how it goes.",
    chinese: "我还不完全相信这是最优选择，但我们可以测试一下看看效果。",
    category: "Work Meeting",
    difficulty: "Advanced",
    status: "Struggling",
    tags: ["disagreeing", "strategy", "soft tone"],
    note: "Disagrees without sounding blunt and keeps the discussion collaborative.",
    alternatives: ["I’m not sure it’s the best option yet.", "We could trial it before committing."],
  },
];

const generatedSamples: Omit<Expression, "id" | "status">[] = [
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

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewName>("practice");
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [thought, setThought] = useState("我不是很确定这个方案是不是最优的，但我觉得我们可以先试一下。");
  const [library, setLibrary] = useState<Expression[]>(starterLibrary);
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

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

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSignedIn(true);
  }

  function saveExpression(sample: Omit<Expression, "id" | "status">) {
    const key = `${sample.english}-${sample.difficulty}`;
    if (savedIds.has(key)) return;

    const nextExpression: Expression = {
      ...sample,
      id: Date.now(),
      status: "New",
    };

    setLibrary((current) => [nextExpression, ...current]);
    setSavedIds((current) => new Set(current).add(key));
  }

  if (!isSignedIn) {
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
          <form className="login-card" onSubmit={signIn}>
            <label>
              Email
              <input type="email" defaultValue="you@auckland.nz" autoComplete="email" />
            </label>
            <label>
              Password
              <input type="password" defaultValue="speakvault" autoComplete="current-password" />
            </label>
            <button className="primary-button" type="submit">
              Sign in
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="phone-shell">
      <section className="screen active" aria-label="SpeakVault app">
        <header className="app-header">
          <div>
            <p className="eyebrow">Day 4 of 30</p>
            <h2>{viewTitles[activeView]}</h2>
          </div>
          <button className="icon-button" type="button" onClick={() => setActiveView("profile")} aria-label="Open profile">
            YK
          </button>
        </header>

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
                {library.slice(0, 2).map((item) => (
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
              <button className="primary-button" type="button">
                Generate 3 expressions
              </button>
            </section>

            <section className="generated-list">
              {generatedSamples.map((sample) => {
                const key = `${sample.english}-${sample.difficulty}`;
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
                    <button className="secondary-button" type="button" onClick={() => saveExpression(sample)}>
                      {savedIds.has(key) ? "Saved" : "Save to Library"}
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
              {filteredLibrary.length === 0 ? (
                <article className="library-card">
                  <h3>No expressions found</h3>
                  <p>Try searching for meeting, figure, 插话, or weekend.</p>
                </article>
              ) : (
                filteredLibrary.map((item) => (
                  <article className="library-card" key={item.id}>
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
                  </article>
                ))
              )}
            </section>
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
              <div className="avatar">YK</div>
              <h3>Tax Accountant · Auckland</h3>
              <p>Target accent: NZ / AU workplace English</p>
            </section>
            <section className="settings-list">
              {[
                ["AI voice", "Selectable"],
                ["Interface language", "English"],
                ["Visual style", "Notion simple"],
                ["Login security", "Email"],
              ].map(([label, value]) => (
                <button className="setting-row" key={label} type="button">
                  <span>{label}</span>
                  <b>{value}</b>
                </button>
              ))}
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
