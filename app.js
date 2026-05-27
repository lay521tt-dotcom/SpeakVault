const libraryItems = [
  {
    english: "Could I just check whether this figure is based on the latest client information?",
    chinese: "我想确认一下这个数字是基于最新的客户资料吗？",
    category: "Work Meeting",
    status: "Practising",
    tags: ["tax return", "clarification", "manager"],
    note: "Softens the question with “Could I just check”, which sounds natural in NZ/AU meetings.",
  },
  {
    english: "I’ll double-check that and come back to you shortly.",
    chinese: "我会再核对一下，然后尽快回复你。",
    category: "Work Meeting",
    status: "Mastered",
    tags: ["figures", "follow-up", "client docs"],
    note: "Concise and confident when you need more time without over-explaining.",
  },
  {
    english: "Could I jump in with one quick point?",
    chinese: "我可以插一句很快的观点吗？",
    category: "Work Meeting",
    status: "New",
    tags: ["interrupting", "polite", "meeting"],
    note: "A common, low-friction way to enter a conversation.",
  },
  {
    english: "I’m not fully convinced it’s the optimal option yet, but we could test it and see how it goes.",
    chinese: "我还不完全相信这是最优选择，但我们可以测试一下看看效果。",
    category: "Work Meeting",
    status: "Struggling",
    tags: ["disagreeing", "strategy", "soft tone"],
    note: "Disagrees without sounding blunt and keeps the discussion collaborative.",
  },
  {
    english: "How was your weekend? Did you get up to much?",
    chinese: "周末怎么样？有做什么有意思的事吗？",
    category: "Small Talk",
    status: "Practising",
    tags: ["colleagues", "small talk", "NZ"],
    note: "“Get up to much” is very natural in New Zealand casual conversation.",
  },
];

const titleMap = {
  practice: "Practice",
  generate: "Generate",
  library: "Library",
  plan: "Plan",
  profile: "Profile",
};

const loginForm = document.querySelector("#login-form");
const loginScreen = document.querySelector("#login-screen");
const appScreen = document.querySelector("#app-screen");
const navButtons = document.querySelectorAll(".nav-button");
const viewButtons = document.querySelectorAll("[data-view]");
const views = document.querySelectorAll(".view");
const viewTitle = document.querySelector("#view-title");
const libraryList = document.querySelector("#library-list");
const librarySearch = document.querySelector("#library-search");
const recordButton = document.querySelector("#record-button");
const transcriptPanel = document.querySelector("#transcript-panel");
const generateButton = document.querySelector("#generate-button");
const thoughtInput = document.querySelector("#thought-input");

function showApp() {
  loginScreen.classList.remove("active");
  appScreen.classList.add("active");
}

function switchView(viewName) {
  views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}-view`));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  viewTitle.textContent = titleMap[viewName] || "SpeakVault";
}

function renderLibrary(query = "") {
  const normalisedQuery = query.trim().toLowerCase();
  const filteredItems = libraryItems.filter((item) => {
    const searchable = [
      item.english,
      item.chinese,
      item.category,
      item.status,
      item.tags.join(" "),
      item.note,
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(normalisedQuery);
  });

  libraryList.innerHTML = filteredItems
    .map(
      (item) => `
        <article class="library-card">
          <div class="card-topline">
            <span>${item.category}</span>
            <b>${item.status}</b>
          </div>
          <h3>${item.english}</h3>
          <p>中文：${item.chinese}</p>
          <p>${item.note}</p>
          <div class="tag-row">
            ${item.tags.map((tag) => `<span>${tag}</span>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");

  if (filteredItems.length === 0) {
    libraryList.innerHTML = '<article class="library-card"><h3>No expressions found</h3><p>Try searching for meeting, figure, 插话, or weekend.</p></article>';
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showApp();
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.view) {
      switchView(button.dataset.view);
    }
  });
});

recordButton.addEventListener("click", () => {
  recordButton.classList.toggle("recording");
  recordButton.textContent = recordButton.classList.contains("recording") ? "Recording..." : "Record again";
  transcriptPanel.classList.remove("hidden");
});

document.querySelector("#start-practice").addEventListener("click", () => {
  transcriptPanel.classList.add("hidden");
  recordButton.classList.remove("recording");
  recordButton.innerHTML = "<span></span> Hold to speak";
  document.querySelector(".practice-card").scrollIntoView({ behavior: "smooth", block: "center" });
});

librarySearch.addEventListener("input", (event) => {
  renderLibrary(event.target.value);
});

generateButton.addEventListener("click", () => {
  const thought = thoughtInput.value.trim() || "我想更自然地表达这个想法。";
  const firstSentence = thought.length > 30 ? `${thought.slice(0, 30)}...` : thought;
  generateButton.textContent = "Generated";
  setTimeout(() => {
    generateButton.textContent = "Generate 3 expressions";
  }, 1100);
  document.querySelector("#generated-list").firstElementChild.querySelector("p").textContent = `中文：${firstSentence}`;
});

document.querySelectorAll(".save-expression").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "Saved";
    button.disabled = true;
  });
});

renderLibrary();
