const SITE_CONFIG = {
  price: "19 €",
  checkoutUrl: "", // Collez ici le lien Stripe, Klarna ou votre page de paiement.
};

document.querySelectorAll("[data-price]").forEach((node) => {
  node.textContent = SITE_CONFIG.price;
});

const countdownEl = document.getElementById("launchCountdown");
if (countdownEl) {
  const launchDate = new Date("2026-09-05T00:00:00");
  const pad = (value) => String(value).padStart(2, "0");

  function updateCountdown() {
    const diff = launchDate - new Date();
    if (diff <= 0) {
      countdownEl.textContent = "C'est le jour du lancement !";
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    countdownEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)} avant le lancement du 5 septembre`;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");

const safeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // L'aperçu autonome peut être ouvert dans un contexte qui bloque le stockage local.
    }
  },
};

const savedTheme = safeStorage.get("science-survie-theme");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
root.dataset.theme = savedTheme || (systemDark ? "dark" : "light");

function updateThemeLabel() {
  const dark = root.dataset.theme === "dark";
  themeButton.setAttribute("aria-label", dark ? "Activer le thème clair" : "Activer le thème sombre");
  themeButton.setAttribute("title", dark ? "Thème clair" : "Thème sombre");
}

updateThemeLabel();

themeButton.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  safeStorage.set("science-survie-theme", root.dataset.theme);
  updateThemeLabel();
});

const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("mainNav");

navToggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const filterButtons = document.querySelectorAll(".filter-btn");
const timelineItems = document.querySelectorAll(".timeline-item");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");

    timelineItems.forEach((item) => {
      const types = item.dataset.type.split(" ");
      item.hidden = filter !== "all" && !types.includes(filter);
    });
  });
});

const quiz = document.getElementById("autonomyQuiz");
const quizResult = document.getElementById("quizResult");
const scoreValue = document.getElementById("scoreValue");
const scoreTitle = document.getElementById("scoreTitle");
const scoreText = document.getElementById("scoreText");
const priorityList = document.getElementById("priorityList");

quiz.addEventListener("submit", (event) => {
  event.preventDefault();
  const questions = [...quiz.querySelectorAll(".quiz-question")];
  const answers = [];

  for (const fieldset of questions) {
    const checked = fieldset.querySelector("input:checked");
    if (!checked) {
      fieldset.scrollIntoView({ behavior: "smooth", block: "center" });
      fieldset.animate(
        [{ outlineColor: "transparent" }, { outlineColor: "#A8283C" }, { outlineColor: "transparent" }],
        { duration: 900 }
      );
      return;
    }
    answers.push({
      value: Number(checked.value),
      tip: fieldset.dataset.tip,
    });
  }

  const total = answers.reduce((sum, item) => sum + item.value, 0);
  const score = Math.round((total / (answers.length * 3)) * 100);

  let title;
  let text;
  if (score < 40) {
    title = "Santé largement déléguée";
    text = "Vous dépendez encore beaucoup des décisions prises après l'apparition d'un problème. Le premier objectif consiste à rendre vos informations et vos habitudes visibles.";
  } else if (score < 70) {
    title = "Autonomie en construction";
    text = "Vous avez déjà commencé à reprendre une place active. La prochaine étape est de rendre vos pratiques plus régulières et vos critères de décision plus clairs.";
  } else {
    title = "Autonomie active";
    text = "Vous participez déjà à vos décisions avec méthode. Le livre peut vous aider à approfondir votre cadre, à repérer vos angles morts et à transmettre cette logique.";
  }

  scoreValue.textContent = String(score);
  scoreTitle.textContent = title;
  scoreText.textContent = text;
  priorityList.innerHTML = "";

  answers
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => a.value - b.value || a.index - b.index)
    .slice(0, 3)
    .forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.tip;
      priorityList.appendChild(li);
    });

  quizResult.classList.add("show");
  quizResult.focus({ preventScroll: true });
  quizResult.scrollIntoView({ behavior: "smooth", block: "center" });
});

quiz.addEventListener("reset", () => {
  quizResult.classList.remove("show");
  scoreValue.textContent = "0";
  priorityList.innerHTML = "";
});

if (SITE_CONFIG.checkoutUrl) {
  document.querySelectorAll(".js-buy").forEach((link) => {
    link.href = SITE_CONFIG.checkoutUrl;
  });
}

const progress = document.getElementById("scrollProgress");
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? (window.scrollY / max) * 100 : 0;
  progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
}
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => observer.observe(el));
}

class QuestionAccordion {
  constructor(details, group) {
    this.el = details;
    this.group = group;
    this.summary = details.querySelector("summary");
    this.content = details.querySelector(".question-card-content");
    this.animation = null;
    this.isExpanding = false;
    this.isClosing = false;
    this.summary.addEventListener("click", (event) => this.onClick(event));
  }

  onClick(event) {
    event.preventDefault();
    if (this.isExpanding || this.el.open) {
      this.collapse();
    } else {
      this.group.forEach((accordion) => {
        if (accordion !== this && accordion.el.open) accordion.collapse();
      });
      this.expand();
    }
  }

  expand() {
    this.el.classList.remove("is-closing");
    this.content.style.overflow = "hidden";
    this.el.open = true;
    this.isExpanding = true;
    const endHeight = this.content.scrollHeight;

    if (reducedMotion) {
      this.content.style.height = "";
      this.content.style.overflow = "";
      this.isExpanding = false;
      return;
    }

    this.animation?.cancel();
    this.animation = this.content.animate(
      { height: ["0px", `${endHeight}px`] },
      { duration: 320, easing: "cubic-bezier(0.2, 0, 0, 1)" }
    );
    this.animation.onfinish = () => {
      this.content.style.overflow = "";
      this.isExpanding = false;
      this.animation = null;
    };
  }

  collapse() {
    this.el.classList.add("is-closing");
    this.content.style.overflow = "hidden";
    this.isClosing = true;
    const startHeight = this.content.scrollHeight;

    const finish = () => {
      this.el.open = false;
      this.el.classList.remove("is-closing");
      this.content.style.overflow = "";
      this.isClosing = false;
      this.animation = null;
    };

    if (reducedMotion) {
      finish();
      return;
    }

    this.animation?.cancel();
    this.animation = this.content.animate(
      { height: [`${startHeight}px`, "0px"] },
      { duration: 240, easing: "cubic-bezier(0.4, 0, 1, 1)" }
    );
    this.animation.onfinish = finish;
  }
}

document.querySelectorAll(".question-board").forEach((board) => {
  const group = [];
  board.querySelectorAll(".question-card--toc").forEach((el) => {
    group.push(new QuestionAccordion(el, group));
  });
});

const printState = new Map();
window.addEventListener("beforeprint", () => {
  document.querySelectorAll("details").forEach((detail) => {
    printState.set(detail, detail.open);
    detail.open = true;
  });
});
window.addEventListener("afterprint", () => {
  printState.forEach((wasOpen, detail) => {
    detail.open = wasOpen;
  });
  printState.clear();
});

document.getElementById("year").textContent = String(new Date().getFullYear());
