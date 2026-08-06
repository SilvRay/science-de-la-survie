const SITE_CONFIG = {
  price: "19 €",
  checkoutUrl: "https://buy.stripe.com/8x2dR8829gWn3UgdiWgjC0D",
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
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    countdownEl.textContent = `${days} j ${pad(hours)} h ${pad(minutes)} min ${pad(seconds)} s avant parution en date du 5 septembre 2026`;
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

class TimelineStack {
  constructor(root) {
    this.root = root;
    this.cards = [...root.querySelectorAll(".timeline-item")];
    this.order = this.cards.map((_, i) => i);
    this.visibleDepth = 3;
    this.countEl = document.getElementById("timelineCount");
    this.prevBtn = document.getElementById("timelinePrev");
    this.nextBtn = document.getElementById("timelineNext");

    this.pendingSwipe = null;

    this.cards.forEach((card) => this.bindDrag(card));
    this.nextBtn?.addEventListener("click", () => this.swipeFront(1));
    this.prevBtn?.addEventListener("click", () => this.bringBack());
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") this.swipeFront(1);
      if (event.key === "ArrowLeft") this.bringBack();
    });

    this.render();
  }

  cancelPendingSwipe() {
    if (!this.pendingSwipe) return;
    const { card, settle } = this.pendingSwipe;
    card.removeEventListener("transitionend", settle);
    card.classList.remove("is-dragging");
    this.pendingSwipe = null;
  }

  setFilter(filter) {
    this.cancelPendingSwipe();
    this.order = this.cards
      .map((_, i) => i)
      .filter((i) => filter === "all" || this.cards[i].dataset.type.split(" ").includes(filter));
    this.cards.forEach((card, i) => {
      card.hidden = !this.order.includes(i);
      card.classList.add("is-resetting");
    });
    this.render();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.cards.forEach((card) => card.classList.remove("is-resetting"));
      });
    });
  }

  render() {
    this.order.forEach((cardIndex, pos) => {
      const card = this.cards[cardIndex];
      card.style.zIndex = String(this.order.length - pos);
      card.tabIndex = pos === 0 ? 0 : -1;
      if (pos === 0) {
        card.style.transform = "";
        card.style.opacity = "1";
      } else {
        const depth = Math.min(pos, this.visibleDepth);
        card.style.transform = `translateY(${depth * 18}px) scale(${1 - depth * 0.06})`;
        card.style.opacity = pos < this.visibleDepth ? String(1 - depth * 0.1) : "0";
      }
    });
    if (this.countEl) {
      this.countEl.textContent = this.order.length
        ? `${this.order.length} précédent${this.order.length > 1 ? "s" : ""}`
        : "";
    }
  }

  swipeFront(direction) {
    if (this.order.length < 2) {
      const card = this.cards[this.order[0]];
      if (card) card.style.transform = "";
      return;
    }
    if (reducedMotion) {
      this.order.push(this.order.shift());
      this.render();
      return;
    }
    const cardIndex = this.order[0];
    const card = this.cards[cardIndex];
    card.style.transform = `translate(${direction * 480}px, -30px) rotate(${direction * 28}deg)`;
    card.style.opacity = "0";

    const settle = () => {
      card.removeEventListener("transitionend", settle);
      this.pendingSwipe = null;
      this.order.push(this.order.shift());
      card.classList.add("is-resetting");
      this.render();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => card.classList.remove("is-resetting"));
      });
    };
    this.pendingSwipe = { card, settle };
    card.addEventListener("transitionend", settle, { once: true });
  }

  bringBack() {
    if (this.order.length < 2) return;
    const cardIndex = this.order.pop();
    const card = this.cards[cardIndex];
    if (reducedMotion) {
      this.order.unshift(cardIndex);
      this.render();
      return;
    }
    card.classList.add("is-resetting");
    card.style.transform = "translate(-480px, -30px) rotate(-28deg)";
    card.style.opacity = "0";
    this.order.unshift(cardIndex);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove("is-resetting");
        this.render();
      });
    });
  }

  bindDrag(card) {
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dragging = false;

    card.addEventListener("pointerdown", (event) => {
      if (this.order[0] !== this.cards.indexOf(card) || event.button === 2) return;
      if (event.target.closest("a")) return;
      startX = event.clientX;
      startY = event.clientY;
      dx = 0;
      dragging = true;
      card.setPointerCapture(event.pointerId);
      card.classList.add("is-dragging");
    });

    card.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      dx = event.clientX - startX;
      const dy = event.clientY - startY;
      card.style.transform = `translate(${dx}px, ${dy * 0.15}px) rotate(${dx / 18}deg)`;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      card.classList.remove("is-dragging");
      const threshold = 90;
      if (Math.abs(dx) > threshold) {
        this.swipeFront(dx > 0 ? 1 : -1);
      } else {
        card.style.transform = "";
      }
    };

    card.addEventListener("pointerup", endDrag);
    card.addEventListener("pointercancel", endDrag);
  }
}

const filterButtons = document.querySelectorAll(".filter-btn");
const timelineStackEl = document.getElementById("timelineStack");
const timelineStack = timelineStackEl ? new TimelineStack(timelineStackEl) : null;

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    timelineStack?.setFilter(filter);
  });
});

const quiz = document.getElementById("autonomyQuiz");
const quizResult = document.getElementById("quizResult");
const scoreValue = document.getElementById("scoreValue");
const scoreTitle = document.getElementById("scoreTitle");
const scoreText = document.getElementById("scoreText");
const priorityList = document.getElementById("priorityList");

const quizQuestions = [...quiz.querySelectorAll(".quiz-question")];
const quizSubmitButton = quiz.querySelector('button[type="submit"]');
let currentQuizIndex = 0;

function updateQuizNav(fieldset, index) {
  const prevBtn = fieldset.querySelector('[data-nav="prev"]');
  const nextBtn = fieldset.querySelector('[data-nav="next"]');
  if (prevBtn) prevBtn.hidden = index === 0;
  if (nextBtn) {
    nextBtn.hidden = index === quizQuestions.length - 1;
    nextBtn.disabled = !fieldset.querySelector("input:checked");
  }
}

function showQuizQuestion(index) {
  currentQuizIndex = index;
  quizQuestions.forEach((fieldset, i) => {
    fieldset.hidden = i !== index;
  });
  if (quizSubmitButton) {
    quizSubmitButton.hidden = index !== quizQuestions.length - 1;
  }
  updateQuizNav(quizQuestions[index], index);
}

quizQuestions.forEach((fieldset, index) => {
  fieldset.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (index < quizQuestions.length - 1) {
        showQuizQuestion(index + 1);
      } else {
        updateQuizNav(fieldset, index);
      }
    });
  });

  fieldset.querySelector('[data-nav="prev"]')?.addEventListener("click", () => {
    if (index > 0) showQuizQuestion(index - 1);
  });

  fieldset.querySelector('[data-nav="next"]')?.addEventListener("click", () => {
    if (index < quizQuestions.length - 1) showQuizQuestion(index + 1);
  });
});

showQuizQuestion(0);

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
  showQuizQuestion(0);
});

if (SITE_CONFIG.checkoutUrl) {
  document.querySelectorAll(".js-buy").forEach((link) => {
    link.href = SITE_CONFIG.checkoutUrl;
  });
}

const prefaceModal = document.getElementById("prefaceModal");
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

document.querySelectorAll(".js-preface").forEach((button) => {
  button.addEventListener("click", () => openModal(prefaceModal));
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

class Accordion {
  constructor(details, contentSelector, group = []) {
    this.el = details;
    this.group = group;
    this.summary = details.querySelector("summary");
    this.content = details.querySelector(contentSelector);
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
    group.push(new Accordion(el, ".question-card-content", group));
  });
});

document.querySelectorAll(".faq details").forEach((el) => {
  new Accordion(el, ".faq-answer");
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
