/* =========================================================
   РЕШАТОР
   ========================================================= */

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


/* =========================================================
   КОНСТАНТЫ
   ========================================================= */

const STORAGE_KEY = "reshatorOptions";
const STORAGE_VERSION = 3;

const BOT_URL =
  "https://t.me/reshatorbykkchrv_bot/Reshator";


const defaultOptions = {

  food: {
    icon: "🍔",
    title: "Что поесть?",

    items: [
      "Пицца",
      "Суши",
      "Бургер",
      "Паста",
      "Шаурма",
      "Стейк"
    ]
  },

  movies: {
    icon: "🍿",
    title: "Что посмотреть?",

    items: [
      "Фильм",
      "Сериал",
      "Аниме",
      "Документалка"
    ]
  },

  games: {
    icon: "🎮",
    title: "Во что поиграть?",

    items: [
      "Dota 2",
      "CS2",
      "EA FC",
      "House Flipper"
    ]
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

let previousResults = {};

let toastTimer = null;


/* =========================================================
   DOM
   ========================================================= */

const homeScreen =
  document.getElementById("homeScreen");

const settingsScreen =
  document.getElementById("settingsScreen");

const editorScreen =
  document.getElementById("editorScreen");

const categoriesContainer =
  document.getElementById("categoriesContainer");

const settingsCategories =
  document.getElementById("settingsCategories");

const itemsList =
  document.getElementById("itemsList");

const emptyItemsState =
  document.getElementById("emptyItemsState");

const noActiveItemsState =
  document.getElementById("noActiveItemsState");

const itemsCountText =
  document.getElementById("itemsCountText");

const activeItemsCount =
  document.getElementById("activeItemsCount");

const editorIconInput =
  document.getElementById("editorIconInput");

const editorNameInput =
  document.getElementById("editorNameInput");

const newItemInput =
  document.getElementById("newItemInput");

const rouletteModal =
  document.getElementById("rouletteModal");

const rouletteCategoryIcon =
  document.getElementById("rouletteCategoryIcon");

const rouletteCategoryTitle =
  document.getElementById("rouletteCategoryTitle");

const rouletteHint =
  document.getElementById("rouletteHint");

const slotReel =
  document.getElementById("slotReel");

const rerollButton =
  document.getElementById("rerollButton");

const showResultButton =
  document.getElementById("showResultButton");

const resultModal =
  document.getElementById("resultModal");

const resultIcon =
  document.getElementById("resultIcon");

const resultCategory =
  document.getElementById("resultCategory");

const resultText =
  document.getElementById("resultText");

const toast =
  document.getElementById("toast");


/* =========================================================
   УТИЛИТЫ
   ========================================================= */

function cloneDefaults() {
  return JSON.parse(
    JSON.stringify(defaultOptions)
  );
}


function haptic(type = "light") {
  try {

    if (!tg?.HapticFeedback) {
      return;
    }

    if (type === "success") {
      tg.HapticFeedback.notificationOccurred(
        "success"
      );

    } else if (type === "error") {
      tg.HapticFeedback.notificationOccurred(
        "error"
      );

    } else {
      tg.HapticFeedback.impactOccurred(type);
    }

  } catch {
    // Ничего не делаем
  }
}


function showToast(message) {
  clearTimeout(toastTimer);

  toast.textContent = message;

  toast.classList.remove("hidden");

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
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
  return !Object.prototype.hasOwnProperty.call(
    defaultOptions,
    category
  );
}


function categoryCountText(count) {

  if (count === 0) {
    return "Нет вариантов";
  }

  if (count === 1) {
    return "1 вариант";
  }

  if (count >= 2 && count <= 4) {
    return `${count} варианта`;
  }

  return `${count} вариантов`;
}


function getActiveItems(category) {

  if (!options[category]) {
    return [];
  }

  return options[category].items
    .filter((item) => item.enabled !== false)
    .map((item) => item.text);
}


function normalizeItems(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  const result = [];

  const seen = new Set();

  items.forEach((item) => {

    /*
     * Новый формат:
     * {
     *   text: "Пицца",
     *   enabled: true
     * }
     */

    if (
      item &&
      typeof item === "object" &&
      typeof item.text === "string"
    ) {

      const text = item.text.trim();

      if (!text) {
        return;
      }

      const key = text.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);

      result.push({
        text,
        enabled: item.enabled !== false
      });

      return;
    }


    /*
     * Старый формат:
     * "Пицца"
     *
     * Старые варианты автоматически включаются.
     */

    if (typeof item === "string") {

      const text = item.trim();

      if (!text) {
        return;
      }

      const key = text.toLowerCase();

      if (seen.has(key)) {
        return;
      }

      seen.add(key);

      result.push({
        text,
        enabled: true
      });
    }

  });

  return result;
}


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function normalizeOptions(data) {

  const normalized = {};

  if (!data || typeof data !== "object") {
    return cloneDefaults();
  }

  Object.keys(data).forEach((category) => {

    const value = data[category];

    if (!value || typeof value !== "object") {
      return;
    }

    const icon =
      typeof value.icon === "string" &&
      value.icon.trim()
        ? value.icon.trim()
        : "✨";

    const title =
      typeof value.title === "string" &&
      value.title.trim()
        ? value.title.trim()
        : "Категория";

    normalized[category] = {
      icon,
      title,
      items: normalizeItems(value.items)
    };

  });

  return normalized;
}


function mergeWithDefaults(savedOptions) {

  const result = {};

  const saved =
    normalizeOptions(savedOptions);


  /*
   * Стандартные категории сохраняются,
   * даже если пользователь менял их содержимое.
   */

  Object.keys(defaultOptions).forEach(
    (category) => {

      if (saved[category]) {

        result[category] = {

          icon:
            saved[category].icon ||
            defaultOptions[category].icon,

          title:
            saved[category].title ||
            defaultOptions[category].title,

          items:
            saved[category].items

        };

      } else {

        result[category] = {

          icon:
            defaultOptions[category].icon,

          title:
            defaultOptions[category].title,

          items:
            normalizeItems(
              defaultOptions[category].items
            )

        };

      }

    }
  );


  /*
   * Пользовательские категории сохраняются.
   */

  Object.keys(saved).forEach(
    (category) => {

      if (!result[category]) {
        result[category] = saved[category];
      }

    }
  );

  return result;
}


function loadOptions() {

  try {

    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {

      options = cloneDefaults();

      /*
       * Преобразуем дефолтные массивы строк
       * в новый формат объектов.
       */

      options = normalizeOptions(options);

      saveOptions();

      return;
    }


    const parsed = JSON.parse(raw);


    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.version === STORAGE_VERSION
    ) {

      options =
        mergeWithDefaults(parsed.data);

    } else {

      /*
       * Миграция:
       *
       * версия 1:
       * items = ["Пицца", "Суши"]
       *
       * версия 2:
       * items = ["Пицца", "Суши"]
       *
       * версия 3:
       * items = [
       *   { text: "Пицца", enabled: true }
       * ]
       */

      options =
        mergeWithDefaults(
          parsed?.data || parsed
        );

      saveOptions();
    }

  } catch (error) {

    console.error(
      "Ошибка загрузки данных:",
      error
    );

    options =
      normalizeOptions(
        cloneDefaults()
      );

    saveOptions();
  }
}


function saveOptions() {

  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify({
      version: STORAGE_VERSION,
      data: options
    })
  );
}


/* =========================================================
   ЭКРАНЫ
   ========================================================= */

function showScreen(screen) {

  currentScreen = screen;

  homeScreen.classList.remove("active");
  settingsScreen.classList.remove("active");
  editorScreen.classList.remove("active");


  if (screen === "home") {
    homeScreen.classList.add("active");
  }

  if (screen === "settings") {
    settingsScreen.classList.add("active");
  }

  if (screen === "editor") {
    editorScreen.classList.add("active");
  }


  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}


/* =========================================================
   ГЛАВНЫЙ ЭКРАН
   ========================================================= */

function renderHome() {

  categoriesContainer.innerHTML = "";


  Object.entries(options).forEach(
    ([category, data]) => {

      const button =
        document.createElement("button");

      button.className =
        "category-button";


      const activeCount =
        data.items.filter(
          (item) =>
            item.enabled !== false
        ).length;


      button.innerHTML = `

        <div class="category-icon">
          ${escapeHtml(data.icon)}
        </div>

        <div class="category-info">

          <div class="category-title">
            ${escapeHtml(data.title)}
          </div>

          <div class="category-count">
            ${activeCount > 0
              ? `${activeCount} участвует`
              : "Ничего не выбрано"}
          </div>

        </div>

        <div class="category-arrow">
          ›
        </div>
      `;


      button.addEventListener(
        "click",
        () => openRoulette(category)
      );


      categoriesContainer.appendChild(button);

    }
  );
}


/* =========================================================
   НАСТРОЙКИ
   ========================================================= */

function renderSettings() {

  settingsCategories.innerHTML = "";


  Object.entries(options).forEach(
    ([category, data]) => {

      const button =
        document.createElement("button");

      button.className =
        "settings-category";


      const activeCount =
        data.items.filter(
          (item) =>
            item.enabled !== false
        ).length;


      button.innerHTML = `

        <div class="settings-category-icon">
          ${escapeHtml(data.icon)}
        </div>

        <div class="settings-category-info">

          <div class="settings-category-title">
            ${escapeHtml(data.title)}
          </div>

          <div class="settings-category-count">
            ${activeCount} из ${data.items.length} участвует
          </div>

        </div>

        <div class="settings-category-arrow">
          ›
        </div>
      `;


      button.addEventListener(
        "click",
        () => openEditor(category)
      );


      settingsCategories.appendChild(button);

    }
  );
}


function openSettings() {

  renderSettings();

  showScreen("settings");
}


function closeSettings() {

  showScreen("home");
}


/* =========================================================
   РЕДАКТОР
   ========================================================= */

function openEditor(category) {

  if (!options[category]) {
    return;
  }

  editorCategory = category;


  editorIconInput.value =
    options[category].icon;

  editorNameInput.value =
    options[category].title;


  renderEditorItems();


  const deleteButton =
    document.getElementById(
      "deleteCategoryButton"
    );

  const resetButton =
    document.getElementById(
      "resetListButton"
    );


  if (isCustomCategory(category)) {

    deleteButton.classList.remove(
      "hidden"
    );

    resetButton.classList.add(
      "hidden"
    );

  } else {

    deleteButton.classList.add(
      "hidden"
    );

    resetButton.classList.remove(
      "hidden"
    );

  }


  showScreen("editor");
}


function closeEditor() {

  editorCategory = null;

  showScreen("settings");
}


function saveCategoryChanges() {

  if (
    !editorCategory ||
    !options[editorCategory]
  ) {
    return;
  }


  const icon =
    editorIconInput.value.trim() ||
    "✨";

  const title =
    editorNameInput.value.trim();


  if (!title) {

    haptic("error");

    showToast(
      "Введите название категории"
    );

    editorNameInput.focus();

    return;
  }


  options[editorCategory].icon =
    icon;

  options[editorCategory].title =
    title;


  saveOptions();


  renderHome();
  renderSettings();
  renderEditorItems();


  haptic("success");

  showToast(
    "Изменения сохранены"
  );
}


/* =========================================================
   РЕДАКТИРОВАНИЕ СПИСКА
   ========================================================= */

function renderEditorItems() {

  if (
    !editorCategory ||
    !options[editorCategory]
  ) {
    return;
  }


  const items =
    options[editorCategory].items;


  const activeCount =
    items.filter(
      (item) =>
        item.enabled !== false
    ).length;


  itemsList.innerHTML = "";


  itemsCountText.textContent =
    categoryCountText(
      items.length
    );


  activeItemsCount.textContent =
    `${activeCount} из ${items.length}`;


  if (items.length === 0) {

    emptyItemsState.classList.remove(
      "hidden"
    );

  } else {

    emptyItemsState.classList.add(
      "hidden"
    );
  }


  if (
    items.length > 0 &&
    activeCount === 0
  ) {

    noActiveItemsState.classList.remove(
      "hidden"
    );

  } else {

    noActiveItemsState.classList.add(
      "hidden"
    );
  }


  items.forEach(
    (item, index) => {

      const row =
        document.createElement("div");

      row.className =
        "list-item";


      if (item.enabled === false) {
        row.classList.add(
          "inactive"
        );
      }


      /*
       * Чекбокс участия
       */

      const checkbox =
        document.createElement(
          "input"
        );

      checkbox.type =
        "checkbox";

      checkbox.className =
        "list-item-checkbox";

      checkbox.checked =
        item.enabled !== false;


      checkbox.setAttribute(
        "aria-label",
        "Участвует в рулетке"
      );


      checkbox.addEventListener(
        "change",
        () => {

          item.enabled =
            checkbox.checked;

          saveOptions();

          renderEditorItems();
          renderHome();
          renderSettings();

          haptic("light");
        }
      );


      /*
       * Текст варианта
       */

      const input =
        document.createElement(
          "input"
        );

      input.className =
        "list-item-input";

      input.type = "text";
      input.maxLength = 100;

      input.value =
        item.text;


      input.addEventListener(
        "change",
        () => {
          updateItem(
            index,
            input.value
          );
        }
      );


      input.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key === "Enter"
          ) {
            input.blur();
          }

        }
      );


      /*
       * Удаление варианта
       */

      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.type =
        "button";

      deleteButton.className =
        "list-item-delete";

      deleteButton.innerHTML =
        "×";

      deleteButton.setAttribute(
        "aria-label",
        "Удалить вариант"
      );


      deleteButton.addEventListener(
        "click",
        () => {
          deleteItem(index);
        }
      );


      row.appendChild(
        checkbox
      );

      row.appendChild(
        input
      );

      row.appendChild(
        deleteButton
      );


      itemsList.appendChild(
        row
      );

    }
  );
}


/* =========================================================
   ИЗМЕНЕНИЕ ВАРИАНТА
   ========================================================= */

function updateItem(index, value) {

  if (
    !editorCategory ||
    !options[editorCategory]
  ) {
    return;
  }


  const cleaned =
    value.trim();


  if (!cleaned) {

    renderEditorItems();

    return;
  }


  const duplicate =
    options[editorCategory].items.some(
      (item, itemIndex) =>
        itemIndex !== index &&
        item.text.toLowerCase() ===
          cleaned.toLowerCase()
    );


  if (duplicate) {

    haptic("error");

    showToast(
      "Такой вариант уже есть"
    );

    renderEditorItems();

    return;
  }


  options[editorCategory]
    .items[index]
    .text = cleaned;


  saveOptions();

  renderEditorItems();

  renderHome();

  renderSettings();
}


/* =========================================================
   ДОБАВЛЕНИЕ
   ========================================================= */

function addItem() {

  if (
    !editorCategory ||
    !options[editorCategory]
  ) {
    return;
  }


  const value =
    newItemInput.value.trim();


  if (!value) {
    return;
  }


  const duplicate =
    options[editorCategory].items.some(
      (item) =>
        item.text.toLowerCase() ===
        value.toLowerCase()
    );


  if (duplicate) {

    haptic("error");

    showToast(
      "Такой вариант уже есть"
    );

    newItemInput.select();

    return;
  }


  /*
   * Новый вариант по умолчанию
   * сразу участвует в рулетке.
   */

  options[editorCategory].items.push({
    text: value,
    enabled: true
  });


  saveOptions();


  newItemInput.value = "";


  renderEditorItems();
  renderHome();
  renderSettings();


  haptic("light");
}


/* =========================================================
   УДАЛЕНИЕ
   ========================================================= */

function deleteItem(index) {

  if (
    !editorCategory ||
    !options[editorCategory]
  ) {
    return;
  }


  const items =
    options[editorCategory].items;


  if (!items[index]) {
    return;
  }


  const item =
    items[index];


  const confirmed =
    window.confirm(
      `Удалить вариант «${item.text}»?`
    );


  if (!confirmed) {
    return;
  }


  items.splice(index, 1);


  saveOptions();


  renderEditorItems();
  renderHome();
  renderSettings();


  haptic("light");

  showToast(
    "Вариант удалён"
  );
}


/* =========================================================
   СБРОС СПИСКА
   ========================================================= */

function resetCurrentList() {

  if (
    !editorCategory ||
    !options[editorCategory]
  ) {
    return;
  }


  if (
    !defaultOptions[editorCategory]
  ) {
    return;
  }


  const category =
    editorCategory;


  const confirmed =
    window.confirm(
      `Сбросить список «${options[category].title}» к исходному?`
    );


  if (!confirmed) {
    return;
  }


  options[category].items =
    normalizeItems(
      defaultOptions[category].items
    );


  saveOptions();


  renderEditorItems();
  renderHome();
  renderSettings();


  haptic("success");

  showToast(
    "Список восстановлен"
  );
}


/* =========================================================
   СОЗДАНИЕ КАТЕГОРИИ
   ========================================================= */

function openCreateCategory() {

  document
    .getElementById(
      "createCategoryModal"
    )
    .classList.remove("hidden");


  document
    .getElementById(
      "newCategoryName"
    )
    .focus();
}


function closeCreateCategory() {

  document
    .getElementById(
      "createCategoryModal"
    )
    .classList.add("hidden");
}


function createCategory() {

  const iconInput =
    document.getElementById(
      "newCategoryIcon"
    );

  const nameInput =
    document.getElementById(
      "newCategoryName"
    );


  const icon =
    iconInput.value.trim() ||
    "✨";

  const title =
    nameInput.value.trim();


  if (!title) {

    haptic("error");

    showToast(
      "Введите название категории"
    );

    nameInput.focus();

    return;
  }


  const duplicateTitle =
    Object.values(options).some(
      (category) =>
        category.title.toLowerCase() ===
        title.toLowerCase()
    );


  if (duplicateTitle) {

    haptic("error");

    showToast(
      "Такая категория уже существует"
    );

    nameInput.select();

    return;
  }


  let id =
    `custom_${Date.now()}`;


  while (options[id]) {

    id =
      `custom_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}`;
  }


  options[id] = {

    icon,
    title,

    items: []
  };


  saveOptions();


  iconInput.value =
    "✨";

  nameInput.value =
    "";


  closeCreateCategory();


  renderHome();
  renderSettings();


  haptic("success");

  showToast(
    "Категория создана"
  );


  openEditor(id);
}


/* =========================================================
   УДАЛЕНИЕ КАТЕГОРИИ
   ========================================================= */

function deleteCurrentCategory() {

  if (!editorCategory) {
    return;
  }


  if (
    !isCustomCategory(
      editorCategory
    )
  ) {
    return;
  }


  const title =
    options[editorCategory].title;


  const confirmed =
    window.confirm(
      `Удалить категорию «${title}»?\n\nВсе варианты внутри неё тоже будут удалены.`
    );


  if (!confirmed) {
    return;
  }


  delete options[
    editorCategory
  ];


  delete previousResults[
    editorCategory
  ];


  saveOptions();


  editorCategory = null;


  renderHome();
  renderSettings();


  haptic("success");

  showToast(
    "Категория удалена"
  );


  showScreen("settings");
}


/* =========================================================
   РУЛЕТКА
   ========================================================= */

function openRoulette(category) {

  if (!options[category]) {
    return;
  }


  const activeItems =
    getActiveItems(category);


  if (activeItems.length === 0) {

    haptic("error");

    showToast(
      "Выберите хотя бы один вариант в настройках"
    );

    return;
  }


  rouletteCategory =
    category;


  rouletteCategoryIcon.textContent =
    options[category].icon;


  rouletteCategoryTitle.textContent =
    options[category].title;


  rouletteModal.classList.remove(
    "hidden"
  );


  haptic("light");


  startRoulette();
}


function closeRoulette() {

  if (isRolling) {
    return;
  }


  rouletteModal.classList.add(
    "hidden"
  );


  rouletteCategory = null;
  rouletteResult = null;
}


/* =========================================================
   ДОСТУПНЫЕ ВАРИАНТЫ
   ========================================================= */

function getAvailableRouletteItems() {

  if (!rouletteCategory) {
    return [];
  }


  const items =
    getActiveItems(
      rouletteCategory
    );


  const previous =
    previousResults[
      rouletteCategory
    ];


  /*
   * Если есть несколько активных вариантов,
   * прошлый результат не участвует
   * в следующем запуске.
   *
   * Если активный вариант только один —
   * он остаётся доступен.
   */

  if (
    items.length > 1 &&
    previous
  ) {

    return items.filter(
      (item) =>
        item !== previous
    );
  }


  return [...items];
}


/* =========================================================
   ЭЛЕМЕНТ РУЛЕТКИ
   ========================================================= */

function createSlotItem(text) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "slot-item";


  element.textContent =
    text;


  return element;
}


/* =========================================================
   ЗАПУСК РУЛЕТКИ
   ========================================================= */

function startRoulette() {

  if (!rouletteCategory) {
    return;
  }


  const available =
    getAvailableRouletteItems();


  if (available.length === 0) {

    haptic("error");

    showToast(
      "Нет доступных вариантов"
    );

    return;
  }


  isRolling = true;


  rerollButton.disabled =
    true;


  showResultButton.classList.add(
    "hidden"
  );


  rouletteHint.textContent =
    "Выбираем...";


  slotReel.style.transition =
    "none";


  slotReel.style.transform =
    "translateY(0)";


  /*
   * Создаём длинную ленту.
   */

  const rounds = 8;

  const sequence = [];


  for (
    let round = 0;
    round < rounds;
    round++
  ) {

    available.forEach(
      (item) => {
        sequence.push(item);
      }
    );
  }


  /*
   * Выбираем результат.
   */

  const result =
    available[
      Math.floor(
        Math.random() *
        available.length
      )
    ];


  sequence.push(result);


  rouletteResult =
    result;


  slotReel.innerHTML =
    "";


  sequence.forEach(
    (item) => {

      slotReel.appendChild(
        createSlotItem(item)
      );

    }
  );


  const targetIndex =
    sequence.length - 1;


  const itemHeight =
    82;


  const duration =
    2500 +
    Math.floor(
      Math.random() * 500
    );


  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          slotReel.style.transition =
            `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.18, 1)`;


          slotReel.style.transform =
            `translateY(-${
              targetIndex *
              itemHeight
            }px)`;

        }
      );

    }
  );


  setTimeout(
    () => {

      isRolling = false;


      rerollButton.disabled =
        false;


      rouletteHint.textContent =
        "Решение готово";


      showResultButton.classList.remove(
        "hidden"
      );


      previousResults[
        rouletteCategory
      ] = rouletteResult;


      haptic("success");

    },
    duration + 100
  );
}


function rerollRoulette() {

  if (isRolling) {
    return;
  }


  startRoulette();
}


/* =========================================================
   РЕЗУЛЬТАТ
   ========================================================= */

function openResult() {

  if (
    !rouletteCategory ||
    !rouletteResult
  ) {
    return;
  }


  const category =
    options[rouletteCategory];


  resultIcon.textContent =
    category.icon;


  resultCategory.textContent =
    category.title;


  resultText.textContent =
    rouletteResult;


  resultModal.classList.remove(
    "hidden"
  );


  haptic("light");
}


function closeResult() {

  resultModal.classList.add(
    "hidden"
  );
}


/* =========================================================
   SHARING
   ========================================================= */

function getShareText() {

  if (
    !rouletteCategory ||
    !rouletteResult
  ) {
    return "";
  }


  const category =
    options[rouletteCategory];


  return [
    "🎲 Решатор",
    "",
    `${category.icon} ${category.title}`,
    "",
    `👉 ${rouletteResult}`,
    "",
    `Реши сам: ${BOT_URL}`
  ].join("\n");
}


async function shareResult() {

  const text =
    getShareText();


  if (!text) {
    return;
  }


  if (navigator.share) {

    try {

      await navigator.share({

        title:
          "Решатор",

        text,

        url:
          BOT_URL

      });


      haptic("success");

      return;

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {
        return;
      }

    }
  }


  await copyText(text);

  showToast(
    "Готово — результат скопирован"
  );
}


async function copyResult() {

  const text =
    getShareText();


  if (!text) {
    return;
  }


  await copyText(text);
}


async function copyText(text) {

  try {

    await navigator.clipboard.writeText(
      text
    );


    haptic("success");

    showToast(
      "Скопировано"
    );

  } catch {

    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      text;


    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";


    document.body.appendChild(
      textarea
    );


    textarea.select();


    try {

      document.execCommand(
        "copy"
      );


      haptic("success");

      showToast(
        "Скопировано"
      );

    } catch {

      haptic("error");

      showToast(
        "Не удалось скопировать"
      );
    }


    textarea.remove();
  }
}


/* =========================================================
   СОБЫТИЯ
   ========================================================= */

document
  .getElementById(
    "settingsButton"
  )
  .addEventListener(
    "click",
    openSettings
  );


document
  .getElementById(
    "settingsBackButton"
  )
  .addEventListener(
    "click",
    closeSettings
  );


document
  .getElementById(
    "editorBackButton"
  )
  .addEventListener(
    "click",
    closeEditor
  );


document
  .getElementById(
    "saveCategoryChangesButton"
  )
  .addEventListener(
    "click",
    saveCategoryChanges
  );


editorNameInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {
      saveCategoryChanges();
    }

  }
);


editorIconInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {
      saveCategoryChanges();
    }

  }
);


document
  .getElementById(
    "addItemButton"
  )
  .addEventListener(
    "click",
    addItem
  );


newItemInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {
      addItem();
    }

  }
);


document
  .getElementById(
    "resetListButton"
  )
  .addEventListener(
    "click",
    resetCurrentList
  );


document
  .getElementById(
    "deleteCategoryButton"
  )
  .addEventListener(
    "click",
    deleteCurrentCategory
  );


document
  .getElementById(
    "createCategoryButton"
  )
  .addEventListener(
    "click",
    openCreateCategory
  );


document
  .getElementById(
    "closeCreateCategoryButton"
  )
  .addEventListener(
    "click",
    closeCreateCategory
  );


document
  .getElementById(
    "confirmCreateCategoryButton"
  )
  .addEventListener(
    "click",
    createCategory
  );


document
  .getElementById(
    "newCategoryName"
  )
  .addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {
        createCategory();
      }

    }
  );


document
  .getElementById(
    "closeRouletteButton"
  )
  .addEventListener(
    "click",
    closeRoulette
  );


rerollButton.addEventListener(
  "click",
  rerollRoulette
);


showResultButton.addEventListener(
  "click",
  openResult
);


document
  .getElementById(
    "closeResultButton"
  )
  .addEventListener(
    "click",
    closeResult
  );


document
  .getElementById(
    "shareResultButton"
  )
  .addEventListener(
    "click",
    shareResult
  );


document
  .getElementById(
    "copyResultButton"
  )
  .addEventListener(
    "click",
    copyResult
  );


/* Закрытие модалок по затемнению */

rouletteModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
        rouletteModal &&
      !isRolling
    ) {
      closeRoulette();
    }

  }
);


resultModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      resultModal
    ) {
      closeResult();
    }

  }
);


document
  .getElementById(
    "createCategoryModal"
  )
  .addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        document.getElementById(
          "createCategoryModal"
        )
      ) {
        closeCreateCategory();
      }

    }
  );


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

loadOptions();

renderHome();

renderSettings();

showScreen("home");