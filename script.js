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

    options = JSON.parse(savedOptions);

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

const resultBlock =
    document.getElementById("resultBlock");

const resultText =
    document.getElementById("result");

const rerollButton =
    document.getElementById("rerollButton");

const editorTitle =
    document.getElementById("editorTitle");

const itemsList =
    document.getElementById("itemsList");

const newItemInput =
    document.getElementById("newItemInput");

const addItemButton =
    document.getElementById("addItemButton");

const resetListButton =
    document.getElementById("resetListButton");


// ====================
// СОСТОЯНИЕ
// ====================

let currentCategory = null;

let isRolling = false;

let editorCategory = null;


// ====================
// НАСТРОЙКИ
// ====================

function openSettings() {

    homeScreen.classList.add("hidden");

    settingsScreen.classList.remove("hidden");

}


function closeSettings() {

    settingsScreen.classList.add("hidden");

    homeScreen.classList.remove("hidden");

}


// ====================
// ОТКРЫТИЕ РЕДАКТОРА
// ====================

function openEditor(category) {

    editorCategory = category;

    editorTitle.textContent =
        options[category].title;

    settingsScreen.classList.add("hidden");

    editorScreen.classList.remove("hidden");

    renderItems();

}


// ====================
// ЗАКРЫТИЕ РЕДАКТОРА
// ====================

function closeEditor() {

    editorScreen.classList.add("hidden");

    settingsScreen.classList.remove("hidden");

    newItemInput.value = "";

}


// ====================
// ОТРИСОВКА СПИСКА
// ====================

function renderItems() {

    itemsList.innerHTML = "";

    const list =
        options[editorCategory].list;

    list.forEach((item, index) => {

        const itemElement =
            document.createElement("div");

        itemElement.className = "list-item";


        // Поле с текстом

        const input =
            document.createElement("input");

        input.type = "text";

        input.value = item;

        input.maxLength = 100;


        // Сохраняем изменения

        input.addEventListener(
            "change",
            function() {

                const newValue =
                    input.value.trim();

                if (!newValue) {

                    input.value = list[index];

                    return;

                }

                options[editorCategory].list[index] =
                    newValue;

                saveOptions();

            }
        );


        // Кнопка удаления

        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete-item";

        deleteButton.textContent =
            "🗑️";


        deleteButton.addEventListener(
            "click",
            function() {

                options[editorCategory].list.splice(
                    index,
                    1
                );

                saveOptions();

                renderItems();

            }
        );


        itemElement.appendChild(input);

        itemElement.appendChild(deleteButton);

        itemsList.appendChild(itemElement);

    });

}


// ====================
// ДОБАВЛЕНИЕ ВАРИАНТА
// ====================

function addItem() {

    const value =
        newItemInput.value.trim();

    if (!value) {
        return;
    }


    options[editorCategory].list.push(value);

    saveOptions();

    newItemInput.value = "";

    renderItems();

    newItemInput.focus();

}


// Кнопка

addItemButton.addEventListener(
    "click",
    addItem
);


// Enter в поле

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


        options[editorCategory].list =
            JSON.parse(
                JSON.stringify(
                    defaultOptions[editorCategory].list
                )
            );

        saveOptions();

        renderItems();

    }
);


// ====================
// РУЛЕТКА
// ====================

function startRoulette(category) {

    if (isRolling) {
        return;
    }

    const currentData =
        options[category];

    const currentList =
        currentData.list;


    // Если список пустой

    if (currentList.length === 0) {

        resultBlock.classList.add("show");

        resultText.textContent =
            "Добавь варианты в настройках";

        return;

    }


    isRolling = true;

    resultBlock.classList.add("show");


    buttons.forEach(button => {

        button.style.pointerEvents = "none";
        button.style.opacity = "0.6";

    });


    rerollButton.style.pointerEvents =
        "none";

    rerollButton.style.opacity =
        "0.5";


    let counter = 0;


    const interval =
        setInterval(() => {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    currentList.length
                );


            resultText.textContent =
                `${currentData.icon} ${currentList[randomIndex]}`;


            counter++;


            if (counter > 12) {

                clearInterval(interval);


                const finalIndex =
                    Math.floor(
                        Math.random() *
                        currentList.length
                    );


                resultText.textContent =
                    `${currentData.icon} ${currentList[finalIndex]}`;


                resultText.style.animation =
                    "none";

                void resultText.offsetWidth;

                resultText.style.animation =
                    "pulse 0.3s ease-in-out";


                isRolling = false;


                buttons.forEach(button => {

                    button.style.pointerEvents =
                        "auto";

                    button.style.opacity =
                        "1";

                });


                rerollButton.style.pointerEvents =
                    "auto";

                rerollButton.style.opacity =
                    "1";


                if (tg.HapticFeedback) {

                    tg.HapticFeedback.notificationOccurred(
                        "success"
                    );

                }

            }

        }, 60);

}


// ====================
// ВЫБОР КАТЕГОРИИ
// ====================

buttons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            currentCategory =
                this.dataset.category;

            startRoulette(
                currentCategory
            );

        }
    );

});


// ====================
// КРУТИТЬ ЕЩЁ РАЗ
// ====================

rerollButton.addEventListener(
    "click",
    function() {

        if (currentCategory) {

            startRoulette(
                currentCategory
            );

        }

    }
);


// ====================
// ОТКРЫТЬ НАСТРОЙКИ
// ====================

settingsButton.addEventListener(
    "click",
    function() {

        openSettings();

    }
);


// ====================
// НАЗАД ИЗ НАСТРОЕК
// ====================

backButton.addEventListener(
    "click",
    function() {

        closeSettings();

    }
);


// ====================
// ОТКРЫТЬ РЕДАКТОР КАТЕГОРИИ
// ====================

settingsItems.forEach(item => {

    item.addEventListener(
        "click",
        function() {

            const category =
                this.dataset.category;

            openEditor(category);

        }
    );

});


// ====================
// НАЗАД ИЗ РЕДАКТОРА
// ====================

editorBackButton.addEventListener(
    "click",
    function() {

        closeEditor();

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