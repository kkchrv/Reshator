/* =========================
   TELEGRAM
   ========================= */

const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();


/* =========================
   ДАННЫЕ РЕШАТОРА
   ========================= */

const options = {

    food: {
        icon: "🍿",
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
        icon: "🎬",
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
        icon: "❤️",
        list: [
            "Пойти на пикник",
            "Приготовить ужин вместе",
            "Поиграть в настолки",
            "Сходить в кино",
            "Прогулка в парке"
        ]
    }

};


/* =========================
   ЭЛЕМЕНТЫ HTML
   ========================= */

const resultText =
    document.getElementById("result");

const resultBlock =
    document.getElementById("resultBlock");

const rerollButton =
    document.getElementById("rerollButton");

const buttons =
    document.querySelectorAll(".choice");


/* =========================
   СОСТОЯНИЕ
   ========================= */

let currentCategory = null;

let isRolling = false;


/* =========================
   РУЛЕТКА
   ========================= */

function startRoulette(category) {

    if (isRolling) {
        return;
    }

    const currentData = options[category];

    const currentList = currentData.list;

    isRolling = true;


    /* Показываем карточку */

    resultBlock.classList.add("show");


    /* Блокируем кнопки */

    buttons.forEach(button => {
        button.style.pointerEvents = "none";
        button.style.opacity = "0.6";
    });

    rerollButton.style.pointerEvents = "none";
    rerollButton.style.opacity = "0.5";


    /* Запускаем рулетку */

    let counter = 0;

    const interval = setInterval(() => {

        const randomIndex =
            Math.floor(
                Math.random() * currentList.length
            );

        resultText.textContent =
            `${currentData.icon} ${currentList[randomIndex]}`;

        counter++;


        /* Останавливаем рулетку */

        if (counter > 12) {

            clearInterval(interval);


            const finalIndex =
                Math.floor(
                    Math.random() * currentList.length
                );


            resultText.textContent =
                `${currentData.icon} ${currentList[finalIndex]}`;


            /* Перезапускаем анимацию */

            resultText.style.animation = "none";

            void resultText.offsetWidth;

            resultText.style.animation =
                "pulse 0.3s ease-in-out";


            /* Разблокируем кнопки */

            isRolling = false;


            buttons.forEach(button => {
                button.style.pointerEvents = "auto";
                button.style.opacity = "1";
            });


            rerollButton.style.pointerEvents = "auto";
            rerollButton.style.opacity = "1";


            /* Haptic Feedback Telegram */

            if (tg.HapticFeedback) {

                tg.HapticFeedback.notificationOccurred(
                    "success"
                );

            }

        }

    }, 60);

}


/* =========================
   ОСНОВНЫЕ КНОПКИ
   ========================= */

buttons.forEach(button => {

    button.addEventListener("click", function() {

        currentCategory =
            this.dataset.category;

        startRoulette(currentCategory);

    });

});


/* =========================
   ПЕРЕВЫБОР
   ========================= */

rerollButton.addEventListener("click", function() {

    if (currentCategory) {

        startRoulette(currentCategory);

    }

});


/* =========================
   ТЕМА TELEGRAM
   ========================= */

/*
   Telegram автоматически обновляет
   CSS-переменные --tg-theme-*
   при смене темы.

   Поэтому основной интерфейс
   использует их напрямую через CSS.
*/


tg.onEvent("themeChanged", function() {

    console.log("Telegram theme changed");

});


/* =========================
   ОТЛАДКА
   ========================= */

console.log("Telegram WebApp:", tg);

console.log(
    "Telegram theme:",
    tg.themeParams
);