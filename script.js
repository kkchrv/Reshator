"use strict";

/* =========================================================
   РЕШАТОР
   ========================================================= */

const tg = window.Telegram?.WebApp;
const supports = (version) => Boolean(tg?.isVersionAtLeast?.(version));

if (tg) {
  tg.ready();
  tg.expand();
  if (supports("7.7")) tg.disableVerticalSwipes();
}


/* =========================================================
   КОНСТАНТЫ
   ========================================================= */

const STORAGE_KEY = "reshatorOptions";
const STORAGE_VERSION = 4;
const BOT_URL = "https://t.me/reshatorbykkchrv_bot/Reshator";

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const defaultOptions = {
  food: {
    icon: "🍔",
    title: "Что поесть?",
    items: ["Пицца", "Суши", "Бургер", "Паста", "Шаурма", "Стейк"]
  },
  movies: {
    icon: "🍿",
    title: "Что посмотреть?",
    items: ["Фильм", "Сериал", "Аниме", "Документалка"]
  },
  games: {
    icon: "🎮",
    title: "Во что поиграть?",
    items: ["Dota 2", "CS2", "EA FC", "House Flipper"]
  },
  couple: {
    icon: "✨",
    title: "Что делать вдвоем?",
    items: [
      "Сходить в кино",
      "Погулять",
      "Заказать еду",
      "Сыграть во что-нибудь",
      "Посмотреть сериал"
    ]
  }
};


/* =========================================================
   СОСТОЯНИЕ
   ========================================================= */

let options = {};
let currentScreen = "home";
let editorCategory = null;

let rouletteCategory = null;
let rouletteResult = null;
let isRolling = false;
let rollToken = 0;
let sharePrep = null;

const previousResults = {};
let toastTimer = null;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");


/* =========================================================
   DOM
   ========================================================= */

const $ = (id) => document.getElementById(id);

const els = {
  home: $("homeScreen"),
  settings: $("settingsScreen"),
  editor: $("editorScreen"),

  categories: $("categoriesContainer"),
  settingsCategories: $("settingsCategories"),

  itemsList: $("itemsList"),
  emptyState: $("emptyItemsState"),
  noActiveState: $("noActiveItemsState"),
  itemsCountText: $("itemsCountText"),
  activeItemsCount: $("activeItemsCount"),
  editorIcon: $("editorIconInput"),
  editorName: $("editorNameInput"),
  newItem: $("newItemInput"),
  resetButton: $("resetListButton"),
  deleteButton: $("deleteCategoryButton"),

  rouletteModal: $("rouletteModal"),
  rouletteIcon: $("rouletteCategoryIcon"),
  rouletteTitle: $("rouletteCategoryTitle"),
  rouletteHint: $("rouletteHint"),
  slotReel: $("slotReel"),
  rerollButton: $("rerollButton"),
  shareButton: $("shareResultButton"),

  createModal: $("createCategoryModal"),
  newCategoryIcon: $("newCategoryIcon"),
  newCategoryName: $("newCategoryName"),

  toast: $("toast")
};


/* =========================================================
   УТИЛИТЫ
   ========================================================= */

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultOptions));
}

function haptic(type = "light") {
  try {
    if (!tg?.HapticFeedback) return;

    if (type === "success" || type === "error") {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Ничего
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  toastTimer = setTimeout(() => els.toast.classList.add("hidden"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isCustomCategory(category) {
  return !Object.prototype.hasOwnProperty.call(defaultOptions, category);
}

function categoryCountText(count) {
  if (count === 0) return "Нет вариантов";

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return `${count} вариант`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} варианта`;
  return `${count} вариантов`;
}

function countActive(category) {
  return category.items.filter((item) => item.enabled !== false).length;
}

function getActiveItems(category) {
  if (!options[category]) return [];

  return options[category].items
    .filter((item) => item.enabled !== false)
    .map((item) => item.text);
}

function isOpen(element) {
  return !element.classList.contains("hidden");
}

function confirmAction(message) {
  return new Promise((resolve) => {
    if (supports("6.2") && tg?.showConfirm) {
      try {
        tg.showConfirm(message, resolve);
        return;
      } catch {
        // падаем на window.confirm
      }
    }

    resolve(window.confirm(message));
  });
}


/* =========================================================
   НОРМАЛИЗАЦИЯ
   ========================================================= */

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  const result = [];
  const seen = new Set();

  items.forEach((item) => {
    const isObject = item && typeof item === "object";
    const raw = isObject ? item.text : item;

    if (typeof raw !== "string") return;

    const text = raw.trim();
    if (!text) return;

    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    result.push({
      text,
      enabled: isObject ? item.enabled !== false : true
    });
  });

  return result;
}

function normalizeOptions(data) {
  const normalized = {};

  if (!data || typeof data !== "object") return normalized;

  Object.keys(data).forEach((category) => {
    const value = data[category];
    if (!value || typeof value !== "object") return;

    normalized[category] = {
      icon:
        typeof value.icon === "string" && value.icon.trim()
          ? value.icon.trim()
          : "✨",
      title:
        typeof value.title === "string" && value.title.trim()
          ? value.title.trim()
          : "Категория",
      items: normalizeItems(value.items)
    };
  });

  return normalized;
}

function mergeWithDefaults(savedOptions) {
  const saved = normalizeOptions(savedOptions);
  const result = {};

  Object.keys(defaultOptions).forEach((category) => {
    const base = defaultOptions[category];

    result[category] = saved[category] || {
      icon: base.icon,
      title: base.title,
      items: normalizeItems(base.items)
    };
  });

  Object.keys(saved).forEach((category) => {
    if (!result[category]) result[category] = saved[category];
  });

  return result;
}


/* =========================================================
   ХРАНИЛИЩЕ: localStorage + Telegram CloudStorage
   ========================================================= */

const cloud =
  tg?.CloudStorage && supports("6.9") ? tg.CloudStorage : null;

let cloudTimer = null;
let cloudKnownIds = [];

function loadOptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      options = mergeWithDefaults(cloneDefaults());
      saveLocal();
      return;
    }

    const parsed = JSON.parse(raw);
    const isCurrent =
      parsed && typeof parsed === "object" && parsed.version === STORAGE_VERSION;

    options = mergeWithDefaults(isCurrent ? parsed.data : parsed?.data || parsed);

    if (!isCurrent) saveLocal();
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    options = mergeWithDefaults(cloneDefaults());
  }
}

function saveLocal() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, data: options })
    );
  } catch (error) {
    console.warn("Не удалось сохранить в localStorage:", error);
  }
}

function saveOptions() {
  saveLocal();
  scheduleCloudSync();
}

function scheduleCloudSync() {
  if (!cloud) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(syncCloud, 600);
}

/*
 * В CloudStorage значение ограничено 4096 символами,
 * поэтому каждая категория хранится под своим ключом.
 * Слишком большие категории остаются только в localStorage.
 */
function syncCloud() {
  if (!cloud) return;

  const syncedIds = [];

  Object.keys(options).forEach((id) => {
    const value = JSON.stringify(options[id]);
    if (value.length > 4096) return;

    syncedIds.push(id);
    cloud.setItem(`c_${id}`, value, () => {});
  });

  const removed = cloudKnownIds.filter((id) => !options[id] || !syncedIds.includes(id));

  if (removed.length) {
    cloud.removeItems(removed.map((id) => `c_${id}`), () => {});
  }

  cloudKnownIds = syncedIds;
  cloud.setItem("ids", JSON.stringify(syncedIds), () => {});
}

function loadCloud() {
  if (!cloud) return;

  cloud.getItem("ids", (error, value) => {
    if (error) return;

    let ids = [];

    try {
      ids = JSON.parse(value || "[]");
    } catch {
      ids = [];
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      syncCloud();
      return;
    }

    cloudKnownIds = ids;

    cloud.getItems(ids.map((id) => `c_${id}`), (itemsError, result) => {
      if (itemsError || !result) return;

      const data = {};

      ids.forEach((id) => {
        try {
          if (result[`c_${id}`]) data[id] = JSON.parse(result[`c_${id}`]);
        } catch {
          // битые данные пропускаем
        }
      });

      options = mergeWithDefaults({ ...options, ...data });
      saveLocal();

      if (currentScreen !== "editor") render();
    });
  });
}


/* =========================================================
   ЭКРАНЫ И КНОПКА «НАЗАД»
   ========================================================= */

function showScreen(screen) {
  currentScreen = screen;

  els.home.classList.toggle("active", screen === "home");
  els.settings.classList.toggle("active", screen === "settings");
  els.editor.classList.toggle("active", screen === "editor");

  render();
  updateBackButton();
  window.scrollTo(0, 0);
}

function render() {
  if (currentScreen === "home") renderHome();
  else if (currentScreen === "settings") renderSettings();
  else if (currentScreen === "editor") renderEditorItems();
}

function updateBackButton() {
  if (!tg?.BackButton || !supports("6.1")) return;

  const needed =
    currentScreen !== "home" || isOpen(els.rouletteModal) || isOpen(els.createModal);

  if (needed) tg.BackButton.show();
  else tg.BackButton.hide();
}

function handleBack() {
  if (isOpen(els.createModal)) return closeCreateCategory();
  if (isOpen(els.rouletteModal)) return closeRoulette();
  if (currentScreen === "editor") return closeEditor();
  if (currentScreen === "settings") return closeSettings();
}


/* =========================================================
   ГЛАВНЫЙ ЭКРАН
   ========================================================= */

function renderHome() {
  els.categories.innerHTML = "";

  Object.entries(options).forEach(([category, data]) => {
    const button = document.createElement("button");
    button.className = "category-button";

    const activeCount = countActive(data);

    button.innerHTML = `
      <div class="category-icon">${escapeHtml(data.icon)}</div>
      <div class="category-info">
        <div class="category-title">${escapeHtml(data.title)}</div>
        <div class="category-count">${
          activeCount > 0 ? `${activeCount} участвует` : "Ничего не выбрано"
        }</div>
      </div>
      <div class="category-arrow">›</div>
    `;

    button.addEventListener("click", () => openRoulette(category));
    els.categories.appendChild(button);
  });
}


/* =========================================================
   НАСТРОЙКИ
   ========================================================= */

function renderSettings() {
  els.settingsCategories.innerHTML = "";

  Object.entries(options).forEach(([category, data]) => {
    const button = document.createElement("button");
    button.className = "settings-category";

    button.innerHTML = `
      <div class="settings-category-icon">${escapeHtml(data.icon)}</div>
      <div class="settings-category-info">
        <div class="settings-category-title">${escapeHtml(data.title)}</div>
        <div class="settings-category-count">${countActive(data)} из ${data.items.length} участвует</div>
      </div>
      <div class="settings-category-arrow">›</div>
    `;

    button.addEventListener("click", () => openEditor(category));
    els.settingsCategories.appendChild(button);
  });
}

function openSettings() {
  showScreen("settings");
}

function closeSettings() {
  showScreen("home");
}


/* =========================================================
   РЕДАКТОР
   ========================================================= */

function openEditor(category) {
  if (!options[category]) return;

  editorCategory = category;

  els.editorIcon.value = options[category].icon;
  els.editorName.value = options[category].title;

  const custom = isCustomCategory(category);
  els.deleteButton.classList.toggle("hidden", !custom);
  els.resetButton.classList.toggle("hidden", custom);

  showScreen("editor");
}

function closeEditor() {
  editorCategory = null;
  showScreen("settings");
}

function getEditorItems() {
  return options[editorCategory]?.items || [];
}

async function saveCategoryChanges() {
  if (!editorCategory || !options[editorCategory]) return;

  const icon = els.editorIcon.value.trim() || "✨";
  const title = els.editorName.value.trim();

  if (!title) {
    haptic("error");
    showToast("Введите название категории");
    els.editorName.focus();
    return;
  }

  const duplicate = Object.entries(options).some(
    ([id, category]) =>
      id !== editorCategory && category.title.toLowerCase() === title.toLowerCase()
  );

  if (duplicate) {
    haptic("error");
    showToast("Такая категория уже существует");
    els.editorName.select();
    return;
  }

  options[editorCategory].icon = icon;
  options[editorCategory].title = title;

  els.editorIcon.value = icon;
  els.editorName.value = title;

  saveOptions();
  haptic("success");
  showToast("Изменения сохранены");
}


/* =========================================================
   СПИСОК ВАРИАНТОВ
   ========================================================= */

/*
 * Обновляет только счётчики и подсказки —
 * без перерисовки списка, чтобы не терять фокус в полях.
 */
function updateEditorMeta() {
  const items = getEditorItems();
  const activeCount = items.filter((item) => item.enabled !== false).length;

  els.itemsCountText.textContent = categoryCountText(items.length);
  els.activeItemsCount.textContent = `${activeCount} из ${items.length}`;

  els.emptyState.classList.toggle("hidden", items.length !== 0);
  els.noActiveState.classList.toggle("hidden", !(items.length > 0 && activeCount === 0));
}

function renderEditorItems() {
  if (!editorCategory || !options[editorCategory]) return;

  els.itemsList.innerHTML = "";

  getEditorItems().forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "list-item";
    if (item.enabled === false) row.classList.add("inactive");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "list-item-checkbox";
    checkbox.checked = item.enabled !== false;
    checkbox.setAttribute("aria-label", `Участвует: ${item.text}`);

    checkbox.addEventListener("change", () => {
      const current = getEditorItems()[index];
      if (!current) return;

      current.enabled = checkbox.checked;
      row.classList.toggle("inactive", !current.enabled);

      saveOptions();
      updateEditorMeta();
      haptic("light");
    });

    const input = document.createElement("input");
    input.className = "list-item-input";
    input.type = "text";
    input.maxLength = 100;
    input.value = item.text;

    input.addEventListener("change", () => updateItem(index, input));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") input.blur();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "list-item-delete";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Удалить: ${item.text}`);
    deleteButton.addEventListener("click", () => deleteItem(index));

    row.append(checkbox, input, deleteButton);
    els.itemsList.appendChild(row);
  });

  updateEditorMeta();
}

function updateItem(index, input) {
  const items = getEditorItems();
  const current = items[index];
  if (!current) return;

  const cleaned = input.value.trim();

  if (!cleaned) {
    input.value = current.text;
    return;
  }

  const duplicate = items.some(
    (item, itemIndex) =>
      itemIndex !== index && item.text.toLowerCase() === cleaned.toLowerCase()
  );

  if (duplicate) {
    haptic("error");
    showToast("Такой вариант уже есть");
    input.value = current.text;
    return;
  }

  current.text = cleaned;
  input.value = cleaned;
  saveOptions();
}

function addItem() {
  if (!editorCategory || !options[editorCategory]) return;

  const value = els.newItem.value.trim();
  if (!value) return;

  const items = getEditorItems();

  if (items.some((item) => item.text.toLowerCase() === value.toLowerCase())) {
    haptic("error");
    showToast("Такой вариант уже есть");
    els.newItem.select();
    return;
  }

  items.push({ text: value, enabled: true });
  saveOptions();

  els.newItem.value = "";
  renderEditorItems();
  els.newItem.focus();

  haptic("light");
}

async function deleteItem(index) {
  const items = getEditorItems();
  const item = items[index];
  if (!item) return;

  const confirmed = await confirmAction(`Удалить вариант «${item.text}»?`);
  if (!confirmed || items[index] !== item) return;

  items.splice(index, 1);
  saveOptions();
  renderEditorItems();

  haptic("light");
  showToast("Вариант удалён");
}

async function resetCurrentList() {
  if (!editorCategory || !options[editorCategory]) return;
  if (!defaultOptions[editorCategory]) return;

  const confirmed = await confirmAction(
    `Сбросить список «${options[editorCategory].title}» к исходному?`
  );
  if (!confirmed || !options[editorCategory]) return;

  options[editorCategory].items = normalizeItems(defaultOptions[editorCategory].items);
  saveOptions();
  renderEditorItems();

  haptic("success");
  showToast("Список восстановлен");
}


/* =========================================================
   СОЗДАНИЕ КАТЕГОРИИ
   ========================================================= */

function openCreateCategory() {
  els.createModal.classList.remove("hidden");
  updateBackButton();
  els.newCategoryName.focus();
}

function closeCreateCategory() {
  els.createModal.classList.add("hidden");
  updateBackButton();
}

function createCategory() {
  const icon = els.newCategoryIcon.value.trim() || "✨";
  const title = els.newCategoryName.value.trim();

  if (!title) {
    haptic("error");
    showToast("Введите название категории");
    els.newCategoryName.focus();
    return;
  }

  const duplicate = Object.values(options).some(
    (category) => category.title.toLowerCase() === title.toLowerCase()
  );

  if (duplicate) {
    haptic("error");
    showToast("Такая категория уже существует");
    els.newCategoryName.select();
    return;
  }

  let id;
  do {
    id = `custom_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  } while (options[id]);

  options[id] = { icon, title, items: [] };
  saveOptions();

  els.newCategoryIcon.value = "✨";
  els.newCategoryName.value = "";

  closeCreateCategory();

  haptic("success");
  showToast("Категория создана");

  openEditor(id);
}

async function deleteCurrentCategory() {
  if (!editorCategory || !isCustomCategory(editorCategory)) return;

  const id = editorCategory;
  const confirmed = await confirmAction(
    `Удалить категорию «${options[id].title}»?\n\nВсе варианты внутри неё тоже будут удалены.`
  );
  if (!confirmed || !options[id]) return;

  delete options[id];
  delete previousResults[id];
  saveOptions();

  editorCategory = null;

  haptic("success");
  showToast("Категория удалена");

  showScreen("settings");
}


/* =========================================================
   РУЛЕТКА
   ========================================================= */

function openRoulette(category) {
  if (!options[category]) return;

  if (getActiveItems(category).length === 0) {
    haptic("error");
    showToast("Выберите хотя бы один вариант в настройках");
    return;
  }

  rouletteCategory = category;
  els.rouletteIcon.textContent = options[category].icon;
  els.rouletteTitle.textContent = options[category].title;

  els.rouletteModal.classList.remove("hidden");
  updateBackButton();
  haptic("light");

  startRoulette();
}

function closeRoulette() {
  if (isRolling) return;

  els.rouletteModal.classList.add("hidden");

  rouletteCategory = null;
  rouletteResult = null;
  sharePrep = null;

  updateBackButton();
}

/*
 * Исключаем предыдущий результат, если есть хотя бы два варианта.
 */
function getAvailableRouletteItems() {
  if (!rouletteCategory) return [];

  const items = getActiveItems(rouletteCategory);
  const previous = previousResults[rouletteCategory];

  if (items.length > 1 && previous) {
    const filtered = items.filter((item) => item !== previous);
    if (filtered.length) return filtered;
  }

  return items;
}

function createSlotItem(text) {
  const element = document.createElement("div");
  element.className = "slot-item";
  element.textContent = text;
  return element;
}

function startRoulette() {
  if (!rouletteCategory) return;

  const available = getAvailableRouletteItems();

  if (available.length === 0) {
    haptic("error");
    showToast("Нет доступных вариантов");
    return;
  }

  const token = ++rollToken;
  const category = rouletteCategory;

  isRolling = true;
  sharePrep = null;

  els.rerollButton.disabled = true;
  els.shareButton.classList.add("hidden");
  els.rouletteHint.textContent = "Выбираем...";

  const rounds = Math.max(3, Math.ceil(48 / available.length));
  const sequence = [];

  for (let round = 0; round < rounds; round++) {
    sequence.push(...available);
  }

  const result = available[Math.floor(Math.random() * available.length)];
  sequence.push(result);
  rouletteResult = result;

  els.slotReel.style.transition = "none";
  els.slotReel.style.transform = "translateY(0)";
  els.slotReel.replaceChildren(...sequence.map(createSlotItem));

  // Высота берётся из DOM, а не дублируется числом из CSS
  const itemHeight = els.slotReel.firstElementChild.offsetHeight;
  const offset = (sequence.length - 1) * itemHeight;

  let finished = false;

  const finish = () => {
    if (finished || token !== rollToken) return;
    finished = true;

    els.slotReel.removeEventListener("transitionend", onTransitionEnd);

    isRolling = false;
    els.rerollButton.disabled = false;
    els.rouletteHint.textContent = "Решение готово";
    els.shareButton.classList.remove("hidden");

    previousResults[category] = result;

    haptic("success");

    // Картинку готовим заранее, чтобы шаринг сработал по тапу мгновенно
    sharePrep = buildShareFile().catch(() => null);
  };

  const onTransitionEnd = (event) => {
    if (event.target === els.slotReel && event.propertyName === "transform") {
      finish();
    }
  };

  if (reduceMotion.matches) {
    els.slotReel.style.transform = `translateY(-${offset}px)`;
    requestAnimationFrame(() => requestAnimationFrame(finish));
    return;
  }

  const duration = 2500 + Math.floor(Math.random() * 500);

  els.slotReel.addEventListener("transitionend", onTransitionEnd);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (token !== rollToken) return;

      els.slotReel.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.18, 1)`;
      els.slotReel.style.transform = `translateY(-${offset}px)`;
    });
  });

  // Запасной таймер на случай, если transitionend не сработает
  setTimeout(finish, duration + 400);
}

function rerollRoulette() {
  if (isRolling) return;
  startRoulette();
}


/* =========================================================
   CANVAS-КАРТОЧКА РЕЗУЛЬТАТА (1080 × 1350)
   ========================================================= */

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/*
 * Разбивает текст на строки по ширине (шрифт задаётся до вызова).
 * Длинные слова режутся посимвольно, лишние строки заменяются «…».
 */
function wrapLines(ctx, text, maxWidth, maxLines) {
  const lines = [];
  let line = "";

  const pushLine = () => {
    if (line) lines.push(line);
    line = "";
  };

  String(text)
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      if (ctx.measureText(word).width > maxWidth) {
        pushLine();

        for (const char of word) {
          if (ctx.measureText(line + char).width > maxWidth && line) pushLine();
          line += char;
        }

        return;
      }

      const test = line ? `${line} ${word}` : word;

      if (ctx.measureText(test).width > maxWidth && line) {
        pushLine();
        line = word;
      } else {
        line = test;
      }
    });

  pushLine();

  if (lines.length > maxLines) {
    lines.length = maxLines;

    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }

    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }

  return lines;
}

/* Рисует строки, вертикально центрируя блок относительно centerY */
function drawLines(ctx, lines, x, centerY, lineHeight) {
  const firstY = centerY - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, x, firstY + index * lineHeight);
  });
}

function getTelegramButtonColor() {
  const color = tg?.themeParams?.button_color;

  if (!color) return "#2481cc";

  // Telegram может вернуть hex или rgb(...).
  const match = color.match(
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
  );

  if (match) {
    let hex = match[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Если тема слишком светлая, белый текст и белая иконка теряются.
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance > 0.78) return "#2481cc";
  }

  return color;
}

function getShareHeaderColor() {
  const color = getTelegramButtonColor();

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return '#2481cc';

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.78 ? '#2481cc' : color;
}

function createResultCanvas() {
  const category = options[rouletteCategory];

  if (!category || !rouletteResult) throw new Error("Нет результата");

  const width = 1080;
  const side = 60;
  const cardWidth = width - side * 2;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas недоступен");

  ctx.textBaseline = "middle";

  /* =========================================================
     ПОДБОР РАЗМЕРОВ
     ========================================================= */

  const iconSize = 150;
  const iconY = 45;

  ctx.font = `700 52px ${FONT}`;
  ctx.textAlign = "center";
  const titleLines = wrapLines(ctx, category.title, 820, 2);
  const titleLineHeight = 60;

  /*
   * Результат остаётся крупным, но карточка теперь растёт
   * только по количеству строк результата.
   */
  const maxResultWidth = 820;
  let resultSize = 84;

  for (; resultSize >= 44; resultSize -= 4) {
    ctx.font = `800 ${resultSize}px ${FONT}`;
    if (wrapLines(ctx, rouletteResult, maxResultWidth, 3).length <= 3) break;
  }

  resultSize = Math.max(resultSize, 44);
  ctx.font = `800 ${resultSize}px ${FONT}`;
  const resultLines = wrapLines(ctx, rouletteResult, maxResultWidth, 3);
  const resultLineHeight = Math.round(resultSize * 1.12);
  const resultBlockHeight = resultLines.length * resultLineHeight;

  /* Верхний блок — только настолько высокий, насколько нужен заголовок. */
  const topHeight = 270 + (titleLines.length - 1) * titleLineHeight;

  /*
   * Карточка максимально компактная:
   * 80 px — «РЕШЕНО»,
   * 42 px — промежуток,
   * результат,
   * не больше половины высоты шрифта снизу.
   */
  const cardY = topHeight + 32;
  const cardTopPadding = 82;
  const resultGap = 42;
  const cardBottomPadding = Math.round(resultSize * 0.5);
  const cardHeight =
    cardTopPadding +
    resultGap +
    resultBlockHeight +
    cardBottomPadding;

  /* Нижний блок заканчивается почти сразу после ссылки. */
  const footerTop = cardY + cardHeight + 42;
  const footerBottom = 42;
  const height = footerTop + 72 + footerBottom;

  canvas.width = width;
  canvas.height = height;

  /* =========================================================
     ФОН
     ========================================================= */

  ctx.fillStyle = "#f2f2f7";
  ctx.fillRect(0, 0, width, height);

  /* =========================================================
     ВЕРХНИЙ БЛОК
     ========================================================= */

  ctx.fillStyle = getShareHeaderColor();
  ctx.fillRect(0, 0, width, topHeight);

  /* Иконка категории */
  const iconX = (width - iconSize) / 2;

  roundedRect(ctx, iconX, iconY, iconSize, iconSize, 40);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fill();

  let iconFontSize = 88;
  ctx.font = `${iconFontSize}px ${EMOJI_FONT}`;

  const iconWidth = ctx.measureText(category.icon).width;
  if (iconWidth > 125) {
    iconFontSize = Math.floor((iconFontSize * 125) / iconWidth);
    ctx.font = `${iconFontSize}px ${EMOJI_FONT}`;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(category.icon, width / 2, iconY + iconSize / 2 + 3);

  /* Название категории */
  ctx.font = `700 52px ${FONT}`;
  ctx.fillStyle = "#ffffff";
  drawLines(
    ctx,
    titleLines,
    width / 2,
    iconY + iconSize + 48 + (titleLines.length - 1) * 4,
    titleLineHeight
  );

  /* =========================================================
     КАРТОЧКА РЕЗУЛЬТАТА
     ========================================================= */

  const cardX = side;

  roundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 42);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  /* «РЕШЕНО» */
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#8e8e93";
  ctx.font = `800 28px ${FONT}`;
  ctx.letterSpacing = "4px";
  ctx.fillText("РЕШЕНО", width / 2, cardY + 48);
  ctx.restore();

  /* Результат */
  ctx.font = `800 ${resultSize}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillStyle = "#111111";

  const resultCenterY =
    cardY + cardTopPadding + resultGap + resultBlockHeight / 2;

  drawLines(ctx, resultLines, width / 2, resultCenterY, resultLineHeight);

  /* =========================================================
     НИЖНИЙ БЛОК
     ========================================================= */

  ctx.textAlign = "left";

  ctx.fillStyle = "#111111";
  ctx.font = `800 36px ${FONT}`;
  ctx.fillText("🎲  Решатор", side, footerTop + 22);

  ctx.fillStyle = "#8e8e93";
  ctx.font = `500 25px ${FONT}`;
  ctx.fillText("t.me/reshatorbykkchrv_bot/Reshator", side, footerTop + 62);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось создать изображение"))),
      "image/png",
      1
    );
  });
}

async function buildShareFile() {
  const blob = await canvasToBlob(createResultCanvas());
  return new File([blob], "reshator-result.png", { type: "image/png" });
}


/* =========================================================
   ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ
   ========================================================= */

function getShareCaption() {
  return `Решатор: ${BOT_URL}`;
}

async function shareResult() {
  if (!rouletteCategory || !rouletteResult || !options[rouletteCategory]) return;

  try {
    const file = await sharePrep;

    /*
     * В Telegram WebView передача files + text приводит к двум
     * отдельным сообщениям: фото отдельно, текст отдельно.
     * Поэтому здесь отправляем ТОЛЬКО фото.
     * Ссылка на Решатор уже находится внутри самого изображения.
     */
    if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });

      haptic("success");
      return;
    }

    /*
     * Запасной вариант без поддержки отправки файла.
     * Открываем стандартное Telegram-поделиться только со ссылкой.
     */
    if (tg?.openTelegramLink) {
      const url =
        `https://t.me/share/url?url=${encodeURIComponent(BOT_URL)}` +
        `&text=${encodeURIComponent("Результат Решатора — см. в приложении.")}`;

      tg.openTelegramLink(url);
      return;
    }

    const copied = await copyText(getShareCaption(), false);
    showToast(copied ? "Ссылка скопирована" : "Не удалось поделиться");
  } catch (error) {
    if (error?.name === "AbortError") return;

    console.error("Ошибка отправки результата:", error);
    haptic("error");
    showToast("Не удалось поделиться");
  }
}

async function copyText(text, showNotification = true) {
  try {
    await navigator.clipboard.writeText(text);

    if (showNotification) {
      haptic("success");
      showToast("Скопировано");
    }

    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    let success = false;

    try {
      success = document.execCommand("copy");
    } catch {
      success = false;
    }

    textarea.remove();

    if (showNotification) {
      haptic(success ? "success" : "error");
      showToast(success ? "Скопировано" : "Не удалось скопировать");
    }

    return success;
  }
}


/* =========================================================
   СОБЫТИЯ
   ========================================================= */

const on = (element, event, handler) => element.addEventListener(event, handler);

const onEnter = (element, handler) =>
  on(element, "keydown", (event) => {
    if (event.key === "Enter") handler();
  });

on($("settingsButton"), "click", openSettings);
on($("settingsBackButton"), "click", closeSettings);
on($("editorBackButton"), "click", closeEditor);

on($("saveCategoryChangesButton"), "click", saveCategoryChanges);
onEnter(els.editorName, saveCategoryChanges);
onEnter(els.editorIcon, saveCategoryChanges);

on($("addItemButton"), "click", addItem);
onEnter(els.newItem, addItem);

on(els.resetButton, "click", resetCurrentList);
on(els.deleteButton, "click", deleteCurrentCategory);

on($("createCategoryButton"), "click", openCreateCategory);
on($("closeCreateCategoryButton"), "click", closeCreateCategory);
on($("confirmCreateCategoryButton"), "click", createCategory);
onEnter(els.newCategoryName, createCategory);

on($("closeRouletteButton"), "click", closeRoulette);
on(els.rerollButton, "click", rerollRoulette);
on(els.shareButton, "click", shareResult);

/* Клик по затемнению */
on(els.rouletteModal, "click", (event) => {
  if (event.target === els.rouletteModal) closeRoulette();
});

on(els.createModal, "click", (event) => {
  if (event.target === els.createModal) closeCreateCategory();
});

/* Escape закрывает открытое окно */
on(document, "keydown", (event) => {
  if (event.key !== "Escape") return;

  if (isOpen(els.createModal)) closeCreateCategory();
  else if (isOpen(els.rouletteModal)) closeRoulette();
});

/* Системная кнопка «Назад» в Telegram */
if (tg?.BackButton && supports("6.1")) {
  tg.BackButton.onClick(handleBack);
}


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

loadOptions();
showScreen("home");
loadCloud();