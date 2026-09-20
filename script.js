// ====================
// TELEGRAM
// ====================

const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();


// ====================
// СТАНДАРТНЫЕ ДАННЫЕ
// ====================

const defaultOptions = {

    food: {
        icon: "🍔",
        title: "Что поесть?",
        list: [
            "Пицца",
            "Бургер",
            "Суши",
            "Паста",
            "Шаурма",
            "Рамен",
            "Вкусная пита"
        ]
    },

    watch: {
        icon: "🍿",
        title: "Что посмотреть?",
        list: [
            "Интерстеллар",
            "Начало",
            "Во все тяжкие",
            "Унесённые призраками",
            "Шрек",
            "Джентльмены"
        ]
    },

    game: {
        icon: "🎮",
        title: "Во что поиграть?",
        list: [
            "Ведьмак 3",
            "Minecraft",
            "GTA V",
            "Cyberpunk 2077",
            "Elden Ring",
            "Hades"
        ]
    },

    love: {
        icon: "✨",
        title: "Что делать вдвоём?",
        list: [
            "Пойти на пикник",
            "Приготовить ужин вместе",
            "Поиграть в настолки",
            "Сходить в кино",
            "Прогулка в парке"
        ]
    }

};


// ====================
// ЗАГРУЗКА ДАННЫХ
// ====================

const savedOptions =
    localStorage.getItem("reshatorOptions");

let options;

if (savedOptions) {

    try {

        options = JSON.parse(savedOptions);

    } catch (error) {

        options =
            JSON.parse(
                JSON.stringify(defaultOptions)
            );

    }

} else {

    options =
        JSON.parse(
            JSON.stringify(defaultOptions)
        );

}


// ====================
// СОХРАНЕНИЕ
// ====================

function saveOptions() {

    localStorage.setItem(
        "reshatorOptions",
        JSON.stringify(options)
    );

}


// ====================
// ЭЛЕМЕНТЫ
// ====================

const homeScreen =
    document.getElementById("homeScreen");

const settingsScreen =
    document.getElementById("settingsScreen");

const editorScreen =
    document.getElementById("editorScreen");

const settingsButton =
    document.getElementById("settingsButton");

const backButton =
    document.getElementById("backButton");

const editorBackButton =
    document.getElementById("editorBackButton");

const buttons =
    document.querySelectorAll(".choice");

const settingsItems =
    document.querySelectorAll(".settings-item");


// ====================
// РУЛЕТКА
// ====================

const rouletteModal =
    document.getElementById("rouletteModal");

const closeRouletteButton =
    document.getElementById(
        "closeRouletteButton"
    );

const rouletteCategory =
    document.getElementById(
        "rouletteCategory"
    );

const slotTrack =
    document.getElementById(
        "slotTrack"
    );

const rerollButton =
    document.getElementById(
        "rerollButton"
    );


// ====================
// РЕДАКТОР
// ====================

const editorTitle =
    document.getElementById(
        "editorTitle"
    );

const itemsList =
    document.getElementById(
        "itemsList"
    );

const newItemInput =
    document.getElementById(
        "newItemInput"
    );

const addItemButton =
    document.getElementById(
        "addItemButton"
    );

const resetListButton =
    document.getElementById(
        "resetListButton"
    );


// ====================
// СОСТОЯНИЕ
// ====================

let currentCategory = null;

let editorCategory = null;

let isRolling = false;

let previousResult = null;


// ====================
// НАСТРОЙКИ
// ====================

function openSettings() {

    homeScreen.classList.add(
        "hidden"
    );

    settingsScreen.classList.remove(
        "hidden"
    );

}

function closeSettings() {

    settingsScreen.classList.add(
        "hidden"
    );

    homeScreen.classList.remove(
        "hidden"
    );

}


// ====================
// РЕДАКТОР
// ====================

function openEditor(category) {

    editorCategory = category;

    editorTitle.textContent =
        options[category].title;

    settingsScreen.classList.add(
        "hidden"
    );

    editorScreen.classList.remove(
        "hidden"
    );

    renderItems();

}

function closeEditor() {

    editorScreen.classList.add(
        "hidden"
    );

    settingsScreen.classList.remove(
        "hidden"
    );

    newItemInput.value = "";

}

function renderItems() {

    itemsList.innerHTML = "";

    const list =
        options[editorCategory].list;

    list.forEach(
        (item, index) => {

            const itemElement =
                document.createElement(
                    "div"
                );

            itemElement.className =
                "list-item";


            const input =
                document.createElement(
                    "input"
                );

            input.type = "text";

            input.value = item;

            input.maxLength = 100;

            input.addEventListener(
                "change",
                function() {

                    const newValue =
                        input.value.trim();

                    if (!newValue) {

                        input.value =
                            list[index];

                        return;

                    }

                    options[
                        editorCategory
                    ].list[index] =
                        newValue;

                    saveOptions();

                }
            );


            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.className =
                "delete-item";

            deleteButton.textContent =
                "🗑️";

            deleteButton.addEventListener(
                "click",
                function() {

                    options[
                        editorCategory
                    ].list.splice(
                        index,
                        1
                    );

                    saveOptions();

                    renderItems();

                }
            );


            itemElement.appendChild(
                input
            );

            itemElement.appendChild(
                deleteButton
            );

            itemsList.appendChild(
                itemElement
            );

        }
    );

}


// ====================
// ДОБАВЛЕНИЕ
// ====================

function addItem() {

    const value =
        newItemInput.value.trim();

    if (!value) {
        return;
    }

    options[
        editorCategory
    ].list.push(value);

    saveOptions();

    newItemInput.value = "";

    renderItems();

    newItemInput.focus();

}

addItemButton.addEventListener(
    "click",
    addItem
);

newItemInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            addItem();

        }

    }
);


// ====================
// СБРОС СПИСКА
// ====================

resetListButton.addEventListener(
    "click",
    function() {

        const confirmed =
            confirm(
                "Сбросить список к стандартному?"
            );

        if (!confirmed) {
            return;
        }

        options[
            editorCategory
        ].list =
            JSON.parse(
                JSON.stringify(
                    defaultOptions[
                        editorCategory
                    ].list
                )
            );

        saveOptions();

        renderItems();

    }
);


// ====================
// ОТКРЫТИЕ РУЛЕТКИ
// ====================

function openRoulette(category) {

    currentCategory =
        category;

    previousResult = null;

    rouletteCategory.textContent =
        options[category].title;

    slotTrack.innerHTML = "";

    rouletteModal.classList.add(
        "show"
    );

}


// ====================
// ЗАКРЫТИЕ РУЛЕТКИ
// ====================

function closeRoulette() {

    if (isRolling) {
        return;
    }

    rouletteModal.classList.remove(
        "show"
    );

}


// ====================
// ПОДГОТОВКА ЭЛЕМЕНТА SLOT
// ====================

function createSlotItem(
    text,
    icon
) {

    const element =
        document.createElement(
            "div"
        );

    element.className =
        "slot-item";

    element.textContent =
        `${icon} ${text}`;

    return element;

}


// ====================
// РУЛЕТКА
// ====================

function startRoulette(
    category,
    isReroll = false
) {

    if (isRolling) {
        return;
    }

    const currentData =
        options[category];

    const currentList =
        currentData.list;


    // Если список пустой

    if (currentList.length === 0) {

        slotTrack.innerHTML = "";

        const emptyItem =
            createSlotItem(
                "Добавь варианты",
                "⚙️"
            );

        slotTrack.appendChild(
            emptyItem
        );

        return;
    }


    // ====================
    // ДОСТУПНЫЕ ВАРИАНТЫ
    // ====================

    let availableList =
        [...currentList];

    /*
        При повторном запуске
        убираем только предыдущий
        результат.

        Если вариант всего один —
        он остаётся доступным.
    */

    if (
        isReroll &&
        previousResult !== null &&
        availableList.length > 1
    ) {

        availableList =
            availableList.filter(
                item =>
                    item !== previousResult
            );

    }


    // ====================
    // НАЧИНАЕМ АНИМАЦИЮ
    // ====================

    isRolling = true;

    rouletteModal.classList.add(
        "rolling"
    );


    // Очищаем старый барабан

    slotTrack.innerHTML = "";


    // ====================
    // СОЗДАЁМ ДЛИННЫЙ БАРАБАН
    // ====================

    const spinItems = [];

    const rounds = 8;

    for (
        let round = 0;
        round < rounds;
        round++
    ) {

        availableList.forEach(
            item => {

                spinItems.push(item);

            }
        );

    }


    spinItems.forEach(
        item => {

            slotTrack.appendChild(
                createSlotItem(
                    item,
                    currentData.icon
                )
            );

        }
    );


    // ====================
    // ВЫБИРАЕМ РЕЗУЛЬТАТ
    // ====================

    const finalIndex =
        Math.floor(
            Math.random() *
            availableList.length
        );

    const finalResult =
        availableList[finalIndex];


    // ====================
    // ПОЗИЦИЯ РЕЗУЛЬТАТА
    // ====================

    const roundSize =
        availableList.length;

    const targetRound = 6;

    const targetIndex =
        targetRound * roundSize +
        finalIndex;

    const itemHeight = 82;

    const offset =
        targetIndex * itemHeight;


    // ====================
    // ЗАПУСК АНИМАЦИИ
    // ====================

    slotTrack.style.transition =
        "none";

    slotTrack.style.transform =
        "translateY(0)";


    // Принудительно применяем
    // начальное положение

    void slotTrack.offsetWidth;


    slotTrack.style.transition =
        "transform 3s cubic-bezier(0.12, 0.8, 0.18, 1)";

    slotTrack.style.transform =
        `translateY(-${offset}px)`;


    // ====================
    // ЗАВЕРШЕНИЕ
    // ====================

    setTimeout(
        function() {

            previousResult =
                finalResult;

            isRolling = false;

            rouletteModal.classList.remove(
                "rolling"
            );


            // Вибрация Telegram

            if (
                tg.HapticFeedback
            ) {

                tg.HapticFeedback
                    .notificationOccurred(
                        "success"
                    );

            }

        },
        3100
    );

}


// ====================
// КАТЕГОРИИ
// ====================

buttons.forEach(
    button => {

        button.addEventListener(
            "click",
            function() {

                const category =
                    this.dataset.category;

                openRoulette(
                    category
                );

                startRoulette(
                    category,
                    false
                );

            }
        );

    }
);


// ====================
// REROLL
// ====================

rerollButton.addEventListener(
    "click",
    function() {

        if (!currentCategory) {
            return;
        }

        startRoulette(
            currentCategory,
            true
        );

    }
);


// ====================
// ЗАКРЫТИЕ РУЛЕТКИ
// ====================

closeRouletteButton.addEventListener(
    "click",
    closeRoulette
);

rouletteModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList.contains(
                "roulette-overlay"
            )
        ) {

            closeRoulette();

        }

    }
);


// ====================
// НАСТРОЙКИ
// ====================

settingsButton.addEventListener(
    "click",
    openSettings
);

backButton.addEventListener(
    "click",
    closeSettings
);


// ====================
// КАТЕГОРИИ В НАСТРОЙКАХ
// ====================

settingsItems.forEach(
    item => {

        item.addEventListener(
            "click",
            function() {

                const category =
                    this.dataset.category;

                openEditor(
                    category
                );

            }
        );

    }
);


// ====================
// НАЗАД ИЗ РЕДАКТОРА
// ====================

editorBackButton.addEventListener(
    "click",
    closeEditor
);


// ====================
// TELEGRAM THEME
// ====================

tg.onEvent(
    "themeChanged",
    function() {

        console.log(
            "Telegram theme changed"
        );

    }
);


// ====================
// DEBUG
// ====================

console.log(
    "Telegram WebApp:",
    tg
);

console.log(
    "Telegram theme:",
    tg.themeParams
);

console.log(
    "Reshator options:",
    options
);