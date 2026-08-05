const SITE_CONFIG = {
  price: "37 €",
  checkoutUrl: "", // Collez ici le lien Stripe, Klarna ou votre page de paiement.
};

document.querySelectorAll("[data-price]").forEach((node) => {
  node.textContent = SITE_CONFIG.price;
});

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

const modals = {
  excerpt: document.getElementById("excerptModal"),
  purchase: document.getElementById("purchaseModal"),
};

let lastFocused = null;

function openModal(modal) {
  lastFocused = document.activeElement;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  const close = modal.querySelector(".modal-close");
  close?.focus();
}

function closeModal(modal) {
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocused?.focus();
}

document.querySelectorAll(".js-excerpt").forEach((button) => {
  button.addEventListener("click", () => openModal(modals.excerpt));
});

document.querySelectorAll(".js-buy").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (!SITE_CONFIG.checkoutUrl) {
      event.preventDefault();
      openModal(modals.purchase);
      return;
    }
    if (button.tagName === "A") {
      button.href = SITE_CONFIG.checkoutUrl;
    } else {
      window.location.href = SITE_CONFIG.checkoutUrl;
    }
  });
});

document.querySelectorAll("[data-close-modal]").forEach((node) => {
  node.addEventListener("click", () => closeModal(node.closest(".modal")));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const open = document.querySelector('.modal[aria-hidden="false"]');
  if (open) closeModal(open);
});

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
