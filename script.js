const options = {
    food: { icon: "🍿", list: ["Пицца", "Бургер", "Суши", "Паста", "Шаурма", "Рамен", "Вкусная пита"] },
    watch: { icon: "🎬", list: ["Интерстеллар", "Начало", "Во все тяжкие", "Унесенные призраками", "Шрек", "Джентльмены"] },
    game: { icon: "🎮", list: ["Ведьмак 3", "Minecraft", "GTA V", "Cyberpunk 2077", "Elden Ring", "Hades"] },
    love: { icon: "❤️", list: ["Пойти на пикник", "Приготовить ужин вместе", "Поиграть в настолки", "Сходить в кино", "Прогулка в парке"] }
};

const resultText = document.getElementById("result");
const resultBlock = document.getElementById("resultBlock");
const rerollButton = document.getElementById("rerollButton");
const buttons = document.querySelectorAll(".choice");

const tg = window.Telegram.WebApp;

let currentCategory = null; // Здесь будем хранить запущенную категорию

// Функция для запуска крутилки (вынесена отдельно, чтобы не дублировать код)
function startRoulette(category) {
    const currentData = options[category];
    const currentList = currentData.list;
    
    // Блокируем все кнопки, включая кнопку перевыбора
    buttons.forEach(b => b.style.pointerEvents = "none");
    rerollButton.style.pointerEvents = "none";
    rerollButton.style.opacity = "0.5";
    
    resultBlock.classList.add("show");
    
    let counter = 0;
    const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * currentList.length);
        resultText.textContent = `${currentData.icon} ${currentList[randomIndex]}`;
        counter++;
        
        if (counter > 12) {
            clearInterval(interval);
            
            const finalIndex = Math.floor(Math.random() * currentList.length);
            resultText.textContent = `${currentData.icon} ${currentList[finalIndex]}`;
            
            resultText.style.animation = 'none';
            void resultText.offsetWidth; 
            resultText.style.animation = 'pulse 0.3s ease-in-out';
            
            // Разблокируем кнопки обратно
            buttons.forEach(b => b.style.pointerEvents = "auto");
            rerollButton.style.pointerEvents = "auto";
            rerollButton.style.opacity = "1";
        }
    }, 60);
}

// Обработчик для основных кнопок
buttons.forEach(button => {
    button.addEventListener("click", function() {
        currentCategory = this.getAttribute("data-category"); // Запоминаем, что выбрали
        startRoulette(currentCategory);
    });
});

// Обработчик для кнопки "Перевыбрать"
rerollButton.addEventListener("click", function() {
    if (currentCategory) {
        startRoulette(currentCategory); // Крутим ту же категорию заново
    }
});

tg.ready();