// ====================
// TELEGRAM
// ====================

const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();


// ====================
// СТАНДАРТНЫЕ КАТЕГОРИИ
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
// ЗАГРУЗКА
// ====================

const savedOptions =
    localStorage.getItem(
        "reshatorOptions"
    );

let options;

if (savedOptions) {

    try {

        options =
            JSON.parse(
                savedOptions
            );

    } catch (error) {

        options =
            JSON.parse(
                JSON.stringify(
                    defaultOptions
                )
            );

    }

} else {

    options =
        JSON.parse(
            JSON.stringify(
                defaultOptions
            )
        );

}


// ====================
// МИГРАЦИЯ
// ====================

Object.keys(options).forEach(
    category => {

        if (!options[category].icon) {

            options[category].icon =
                "✨";

        }

        if (!options[category].title) {

            options[category].title =
                category;

        }

        if (
            !Array.isArray(
                options[category].list
            )
        ) {

            options[category].list = [];

        }

    }
);


function saveOptions() {

    localStorage.setItem(
        "reshatorOptions",
        JSON.stringify(
            options
        )
    );

}


saveOptions();


// ====================
// ПОЛЬЗОВАТЕЛЬСКАЯ КАТЕГОРИЯ
// ====================

function isCustomCategory(category) {

    return !Object.prototype.hasOwnProperty.call(
        defaultOptions,
        category
    );

}


// ====================
// ЭЛЕМЕНТЫ
// ====================

const homeScreen =
    document.getElementById(
        "homeScreen"
    );

const settingsScreen =
    document.getElementById(
        "settingsScreen"
    );

const editorScreen =
    document.getElementById(
        "editorScreen"
    );

const choices =
    document.getElementById(
        "choices"
    );

const settingsList =
    document.getElementById(
        "settingsList"
    );

const settingsButton =
    document.getElementById(
        "settingsButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const editorBackButton =
    document.getElementById(
        "editorBackButton"
    );


// ====================
// РЕДАКТОР КАТЕГОРИИ
// ====================

const editorIconInput =
    document.getElementById(
        "editorIconInput"
    );

const editorNameInput =
    document.getElementById(
        "editorNameInput"
    );

const saveCategoryChangesButton =
    document.getElementById(
        "saveCategoryChangesButton"
    );


// ====================
// РЕДАКТОР ПОЗИЦИЙ
// ====================

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

const deleteCategoryButton =
    document.getElementById(
        "deleteCategoryButton"
    );


// ====================
// РУЛЕТКА
// ====================

const rouletteModal =
    document.getElementById(
        "rouletteModal"
    );

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

const shareResultButton =
    document.getElementById(
        "shareResultButton"
    );


// ====================
// СОЗДАНИЕ КАТЕГОРИИ
// ====================

const createCategoryButton =
    document.getElementById(
        "createCategoryButton"
    );

const categoryModal =
    document.getElementById(
        "categoryModal"
    );

const categoryIconInput =
    document.getElementById(
        "categoryIconInput"
    );

const categoryNameInput =
    document.getElementById(
        "categoryNameInput"
    );

const cancelCategoryButton =
    document.getElementById(
        "cancelCategoryButton"
    );

const saveCategoryButton =
    document.getElementById(
        "saveCategoryButton"
    );


// ====================
// СОСТОЯНИЕ
// ====================

let currentCategory = null;

let editorCategory = null;

let isRolling = false;

let previousResult = null;

let currentResult = null;


// ====================
// ГЛАВНЫЕ КАТЕГОРИИ
// ====================

function renderCategories() {

    choices.innerHTML = "";

    Object.keys(options).forEach(
        category => {

            const data =
                options[category];

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "choice";


            const title =
                document.createElement(
                    "span"
                );

            title.textContent =
                data.title;


            const icon =
                document.createElement(
                    "span"
                );

            icon.className =
                "choice-icon";

            icon.textContent =
                data.icon;


            button.appendChild(
                title
            );

            button.appendChild(
                icon
            );


            button.addEventListener(
                "click",
                function() {

                    openRoulette(
                        category
                    );

                    startRoulette(
                        category,
                        false
                    );

                }
            );


            choices.appendChild(
                button
            );

        }
    );

}


// ====================
// НАСТРОЙКИ
// ====================

function renderSettings() {

    settingsList.innerHTML = "";

    Object.keys(options).forEach(
        category => {

            const data =
                options[category];


            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "settings-item";


            const title =
                document.createElement(
                    "span"
                );

            title.textContent =
                `${data.icon} ${data.title}`;


            const arrow =
                document.createElement(
                    "span"
                );

            arrow.textContent =
                "›";


            button.appendChild(
                title
            );

            button.appendChild(
                arrow
            );


            button.addEventListener(
                "click",
                function() {

                    openEditor(
                        category
                    );

                }
            );


            settingsList.appendChild(
                button
            );

        }
    );

}


// ====================
// ОТКРЫТЬ НАСТРОЙКИ
// ====================

function openSettings() {

    homeScreen.classList.add(
        "hidden"
    );

    editorScreen.classList.add(
        "hidden"
    );

    settingsScreen.classList.remove(
        "hidden"
    );

    renderSettings();

}


// ====================
// ЗАКРЫТЬ НАСТРОЙКИ
// ====================

function closeSettings() {

    settingsScreen.classList.add(
        "hidden"
    );

    homeScreen.classList.remove(
        "hidden"
    );

    renderCategories();

}


// ====================
// ОТКРЫТЬ РЕДАКТОР
// ====================

function openEditor(category) {

    editorCategory =
        category;


    const data =
        options[category];


    editorIconInput.value =
        data.icon;

    editorNameInput.value =
        data.title;


    settingsScreen.classList.add(
        "hidden"
    );

    editorScreen.classList.remove(
        "hidden"
    );


    // Стандартная категория

    if (
        isCustomCategory(category)
    ) {

        deleteCategoryButton.classList.remove(
            "hidden"
        );

        resetListButton.classList.add(
            "hidden"
        );

    }

    // Пользовательская категория

    else {

        deleteCategoryButton.classList.add(
            "hidden"
        );

        resetListButton.classList.remove(
            "hidden"
        );

    }


    renderItems();

}


// ====================
// СОХРАНИТЬ НАЗВАНИЕ
// ====================

function saveCategoryChanges() {

    if (!editorCategory) {
        return;
    }


    let icon =
        editorIconInput.value.trim();

    let title =
        editorNameInput.value.trim();


    if (!icon) {
        icon = "✨";
    }


    if (!title) {

        editorNameInput.focus();

        return;

    }


    options[
        editorCategory
    ].icon =
        icon;

    options[
        editorCategory
    ].title =
        title;


    saveOptions();


    // Обновляем интерфейс

    renderCategories();

    renderSettings();


    // Если редактор всё ещё открыт

    editorIconInput.value =
        icon;

    editorNameInput.value =
        title;


    // Небольшая вибрация
    // в Telegram

    if (
        tg.HapticFeedback
    ) {

        tg.HapticFeedback
            .notificationOccurred(
                "success"
            );

    }

}


saveCategoryChangesButton.addEventListener(
    "click",
    saveCategoryChanges
);


// ====================
// ENTER В НАЗВАНИИ
// ====================

editorNameInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Enter"
        ) {

            saveCategoryChanges();

        }

    }
);


// ====================
// ЗАКРЫТЬ РЕДАКТОР
// ====================

function closeEditor() {

    editorScreen.classList.add(
        "hidden"
    );

    settingsScreen.classList.remove(
        "hidden"
    );

    newItemInput.value = "";

    renderSettings();

}


// ====================
// ПОЗИЦИИ КАТЕГОРИИ
// ====================

function renderItems() {

    itemsList.innerHTML = "";


    if (!editorCategory) {
        return;
    }


    const list =
        options[
            editorCategory
        ].list;


    list.forEach(
        (item, index) => {

            const itemElement =
                document.createElement(
                    "div"
                );

            itemElement.className =
                "list-item";


            // Поле

            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "text";

            input.value =
                item;

            input.maxLength =
                100;


            input.addEventListener(
                "change",
                function() {

                    const newValue =
                        input.value.trim();


                    if (!newValue) {

                        input.value =
                            options[
                                editorCategory
                            ].list[index];

                        return;

                    }


                    options[
                        editorCategory
                    ].list[index] =
                        newValue;


                    saveOptions();

                }
            );


            // Крестик

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type =
                "button";

            deleteButton.className =
                "delete-item-button";

            deleteButton.textContent =
                "×";


            deleteButton.setAttribute(
                "aria-label",
                `Удалить ${item}`
            );


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
// ДОБАВИТЬ ПОЗИЦИЮ
// ====================

function addItem() {

    const value =
        newItemInput.value.trim();


    if (!value) {
        return;
    }


    options[
        editorCategory
    ].list.push(
        value
    );


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

        if (
            event.key ===
            "Enter"
        ) {

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

        if (!editorCategory) {
            return;
        }


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
// СОЗДАНИЕ КАТЕГОРИИ
// ====================

function openCategoryModal() {

    categoryIconInput.value =
        "✨";

    categoryNameInput.value =
        "";


    categoryModal.classList.remove(
        "hidden"
    );


    categoryNameInput.focus();

}


function closeCategoryModal() {

    categoryModal.classList.add(
        "hidden"
    );

}


function createCategory() {

    const icon =
        categoryIconInput.value.trim() ||
        "✨";


    const title =
        categoryNameInput.value.trim();


    if (!title) {

        categoryNameInput.focus();

        return;

    }


    const categoryId =
        `custom_${Date.now()}`;


    options[
        categoryId
    ] = {

        icon:
            icon,

        title:
            title,

        list:
            [],

        custom:
            true

    };


    saveOptions();


    closeCategoryModal();


    renderCategories();

    renderSettings();


    openEditor(
        categoryId
    );

}


createCategoryButton.addEventListener(
    "click",
    openCategoryModal
);


cancelCategoryButton.addEventListener(
    "click",
    closeCategoryModal
);


saveCategoryButton.addEventListener(
    "click",
    createCategory
);


categoryNameInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Enter"
        ) {

            createCategory();

        }

    }
);


// ====================
// УДАЛЕНИЕ КАТЕГОРИИ
// ====================

deleteCategoryButton.addEventListener(
    "click",
    function() {

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


        const category =
            options[
                editorCategory
            ];


        const confirmed =
            confirm(
                `Удалить категорию «${category.title}»?`
            );


        if (!confirmed) {
            return;
        }


        delete options[
            editorCategory
        ];


        saveOptions();


        editorCategory =
            null;


        editorScreen.classList.add(
            "hidden"
        );

        settingsScreen.classList.remove(
            "hidden"
        );


        renderSettings();

        renderCategories();

    }
);


// ====================
// РУЛЕТКА — ОТКРЫТИЕ
// ====================

function openRoulette(category) {

    currentCategory =
        category;

    previousResult =
        null;

    currentResult =
        null;


    rouletteCategory.textContent =
        `${options[category].icon} ${options[category].title}`;


    slotTrack.innerHTML = "";


    shareResultButton.classList.add(
        "hidden"
    );


    rouletteModal.classList.add(
        "show"
    );

}


// ====================
// РУЛЕТКА — ЗАКРЫТИЕ
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
// SLOT ITEM
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
// ЗАПУСК РУЛЕТКИ
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


    if (
        currentList.length ===
        0
    ) {

        slotTrack.innerHTML = "";


        slotTrack.appendChild(
            createSlotItem(
                "Добавь варианты",
                "⚙️"
            )
        );


        shareResultButton.classList.add(
            "hidden"
        );


        return;

    }


    let availableList =
        [...currentList];


    // При повторном вращении
    // исключаем только прошлый результат

    if (
        isReroll &&
        previousResult !== null &&
        availableList.length > 1
    ) {

        availableList =
            availableList.filter(
                item =>
                    item !==
                    previousResult
            );

    }


    isRolling =
        true;


    rouletteModal.classList.add(
        "rolling"
    );


    shareResultButton.classList.add(
        "hidden"
    );


    slotTrack.innerHTML = "";


    const spinItems = [];

    const rounds = 8;


    for (
        let round = 0;
        round < rounds;
        round++
    ) {

        availableList.forEach(
            item => {

                spinItems.push(
                    item
                );

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


    const finalIndex =
        Math.floor(
            Math.random() *
            availableList.length
        );


    const finalResult =
        availableList[
            finalIndex
        ];


    const roundSize =
        availableList.length;

    const targetRound =
        6;

    const targetIndex =
        targetRound *
        roundSize +
        finalIndex;


    const itemHeight =
        82;


    const offset =
        targetIndex *
        itemHeight;


    slotTrack.style.transition =
        "none";

    slotTrack.style.transform =
        "translateY(0)";


    void slotTrack.offsetWidth;


    slotTrack.style.transition =
        "transform 3s cubic-bezier(0.12, 0.8, 0.18, 1)";


    slotTrack.style.transform =
        `translateY(-${offset}px)`;


    setTimeout(
        function() {

            previousResult =
                finalResult;

            currentResult =
                finalResult;


            isRolling =
                false;


            rouletteModal.classList.remove(
                "rolling"
            );


            shareResultButton.classList.remove(
                "hidden"
            );


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
// ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ
// ====================

async function shareResult() {

    if (
        !currentCategory ||
        !currentResult
    ) {

        return;

    }


    const data =
        options[
            currentCategory
        ];


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        1080;

    canvas.height =
        1350;


    const ctx =
        canvas.getContext(
            "2d"
        );


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            1080,
            1350
        );


    gradient.addColorStop(
        0,
        "#f5f7fa"
    );

    gradient.addColorStop(
        1,
        "#dfe6ee"
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        1080,
        1350
    );


    const cardX =
        70;

    const cardY =
        70;

    const cardWidth =
        940;

    const cardHeight =
        1210;

    const radius =
        48;


    ctx.fillStyle =
        "#ffffff";


    roundRect(
        ctx,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        radius
    );


    ctx.fill();


    ctx.fillStyle =
        "#111111";

    ctx.font =
        "800 72px Arial";

    ctx.textAlign =
        "center";


    ctx.fillText(
        "Решатор",
        540,
        250
    );


    ctx.font =
        "120px Arial";


    ctx.fillText(
        data.icon,
        540,
        460
    );


    ctx.fillStyle =
        "#777777";

    ctx.font =
        "600 38px Arial";


    ctx.fillText(
        data.title,
        540,
        550
    );


    ctx.fillStyle =
        "#e5e5e5";

    ctx.fillRect(
        220,
        610,
        640,
        3
    );


    ctx.fillStyle =
        "#111111";

    ctx.font =
        "800 62px Arial";


    const lines =
        wrapText(
            ctx,
            currentResult,
            760
        );


    let resultY =
        760;


    lines.forEach(
        line => {

            ctx.fillText(
                line,
                540,
                resultY
            );

            resultY +=
                82;

        }
    );


    ctx.fillStyle =
        "#999999";

    ctx.font =
        "400 30px Arial";


    ctx.fillText(
        "Решено за тебя",
        540,
        1120
    );


    ctx.font =
        "600 28px Arial";


    ctx.fillText(
        "РЕШАТОР",
        540,
        1190
    );


    const blob =
        await canvasToBlob(
            canvas
        );


    const file =
        new File(
            [blob],
            "reshator-result.png",
            {
                type:
                    "image/png"
            }
        );


    if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
            files: [file]
        })
    ) {

        try {

            await navigator.share({

                title:
                    "Решатор",

                text:
                    `${data.title}: ${currentResult}`,

                files: [
                    file
                ]

            });


            return;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                return;

            }

        }

    }


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        "reshator-result.png";


    document.body.appendChild(
        link
    );

    link.click();

    link.remove();


    URL.revokeObjectURL(
        url
    );

}


// ====================
// CANVAS
// ====================

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {

    ctx.beginPath();

    ctx.moveTo(
        x + radius,
        y
    );

    ctx.lineTo(
        x + width - radius,
        y
    );

    ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    ctx.lineTo(
        x + width,
        y + height - radius
    );

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    ctx.lineTo(
        x + radius,
        y + height
    );

    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    ctx.lineTo(
        x,
        y + radius
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    ctx.closePath();

}


function wrapText(
    ctx,
    text,
    maxWidth
) {

    const words =
        text.split(" ");

    const lines = [];

    let line = "";


    words.forEach(
        word => {

            const testLine =
                line
                    ? `${line} ${word}`
                    : word;


            const width =
                ctx.measureText(
                    testLine
                ).width;


            if (
                width > maxWidth &&
                line
            ) {

                lines.push(
                    line
                );

                line =
                    word;

            } else {

                line =
                    testLine;

            }

        }
    );


    if (line) {

        lines.push(
            line
        );

    }


    return lines;

}


function canvasToBlob(
    canvas
) {

    return new Promise(
        resolve => {

            canvas.toBlob(
                resolve,
                "image/png"
            );

        }
    );

}


// ====================
// СОБЫТИЯ
// ====================

settingsButton.addEventListener(
    "click",
    openSettings
);


backButton.addEventListener(
    "click",
    closeSettings
);


editorBackButton.addEventListener(
    "click",
    closeEditor
);


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


shareResultButton.addEventListener(
    "click",
    shareResult
);


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


categoryModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList.contains(
                "small-modal-overlay"
            )
        ) {

            closeCategoryModal();

        }

    }
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
// ПЕРВЫЙ РЕНДЕР
// ====================

renderCategories();

renderSettings();


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