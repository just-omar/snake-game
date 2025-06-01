// Получаем элементы DOM
const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const gameOverMessage = document.getElementById("game-over-message");
const restartButton = document.getElementById("restart-btn");

// Настройки игры
const gridSize = 20; // Размер одного квадрата (змейка, еда) в пикселях
const boardSize = 400; // Размер игрового поля в пикселях (400x400)
const maxCells = boardSize / gridSize; // Количество ячеек по одной стороне (400/20 = 20)

// Game state
let snake = [{ x: 10, y: 10, prevX: 10, prevY: 10 }]; // Данные о логической позиции змейки
let snakeElements = []; // Массив для хранения ссылок на DOM-элементы сегментов змейки
let food = {}; // Позиция еды
let dx = 0; // Логическое смещение по X (направление движения змейки по клеткам)
let dy = 0; // Логическое смещение по Y
let score = 0;
let gameSpeed = 150; // Скорость игры в миллисекундах (как часто змейка переходит на новую клетку)

// Animation related variables
let animationId; // ID для requestAnimationFrame
let lastFrameTime = 0; // Время последнего кадра отрисовки
let timeSinceLastMove = 0; // Время, прошедшее с последнего логического перемещения змейки

let isGameOver = false;
// let changingDirection = false; // <-- УДАЛЯЕМ ЭТУ ПЕРЕМЕННУЮ!

// --- Инициализация и сброс игры ---
function initGame() {
  // Reset game state
  snake = [{ x: 10, y: 10, prevX: 10, prevY: 10 }]; // Сброс данных змейки
  dx = 0;
  dy = 0;
  score = 0;
  scoreDisplay.textContent = `Счет: ${score}`;
  isGameOver = false;
  gameOverMessage.classList.add("hidden");
  gameSpeed = 150; // Сброс скорости
  timeSinceLastMove = 0; // Сброс таймера движения

  // Clear board and snake elements
  while (gameBoard.firstChild) {
    gameBoard.removeChild(gameBoard.firstChild);
  }
  snakeElements = [];

  // Create initial snake DOM elements
  snake.forEach((segment, index) => {
    const snakeElement = document.createElement("div");
    snakeElement.classList.add("snake");
    if (index === 0) {
      snakeElement.classList.add("snake-head");
    }
    // Начальная позиция сразу, без плавности, т.к. это инициализация
    snakeElement.style.left = `${segment.x * gridSize}px`;
    snakeElement.style.top = `${segment.y * gridSize}px`;
    gameBoard.appendChild(snakeElement);
    snakeElements.push(snakeElement);
  });

  generateFood();
  drawFood(); // Отрисовать еду в DOM

  // Запускаем игровой цикл на основе requestAnimationFrame
  if (animationId) cancelAnimationFrame(animationId); // Отменяем предыдущий цикл, если был
  lastFrameTime = performance.now(); // Инициализируем время первого кадра
  animationId = requestAnimationFrame(gameLoop);
}

// --- Основной игровой цикл (requestAnimationFrame) ---
function gameLoop(currentTime) {
  if (isGameOver) {
    cancelAnimationFrame(animationId);
    return;
  }

  const deltaTime = currentTime - lastFrameTime; // Время, прошедшее с последнего кадра
  lastFrameTime = currentTime;

  timeSinceLastMove += deltaTime;

  // Если прошло достаточно времени для логического перемещения змейки
  if (timeSinceLastMove >= gameSpeed) {
    timeSinceLastMove -= gameSpeed; // Вычитаем gameSpeed, чтобы сохранить "остаток" времени
    // Это улучшает точность тайминга при очень быстрых изменениях скорости
    // changingDirection = false; // <-- УДАЛЯЕМ ЭТУ СТРОКУ!

    // Выполняем логическое перемещение змейки (обновление snake массива)
    moveSnakeLogic();
  }

  // Отрисовка текущего положения (для плавности между клетками)
  drawSnakeVisual();

  animationId = requestAnimationFrame(gameLoop); // Запрашиваем следующий кадр
}

// --- Логическое перемещение змейки (обновление массива 'snake') ---
function moveSnakeLogic() {
  // Если змейка не движется (dx=0, dy=0), не делаем никаких логических шагов
  if (
    dx === 0 &&
    dy === 0 &&
    snake.length === 1 &&
    snake[0].x === 10 &&
    snake[0].y === 10
  ) {
    return; // Змейка на старте, ждет первого движения
  }

  // Сохраняем текущие положения как предыдущие для следующего кадра
  for (let i = 0; i < snake.length; i++) {
    snake[i].prevX = snake[i].x;
    snake[i].prevY = snake[i].y;
  }

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Проверяем столкновение со стенами
  if (head.x < 0 || head.x >= maxCells || head.y < 0 || head.y >= maxCells) {
    endGame();
    return;
  }

  // Проверяем столкновение с самим собой (начиная со второго сегмента)
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      endGame();
      return;
    }
  }

  // Добавляем новую голову в массив данных
  snake.unshift({ x: head.x, y: head.y, prevX: snake[0].x, prevY: snake[0].y });
  // prevX/Y новой головы - это её предыдущая логическая клетка (откуда она пришла)

  const didEatFood = head.x === food.x && head.y === food.y;

  if (didEatFood) {
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    generateFood();
    drawFood();

    if (score % 5 === 0 && gameSpeed > 50) {
      gameSpeed -= 10;
    }

    const newHeadElement = document.createElement("div");
    newHeadElement.classList.add("snake");
    snakeElements.unshift(newHeadElement);
    gameBoard.insertBefore(newHeadElement, snakeElements[1]);
  } else {
    const tailElement = snakeElements.pop();
    snake.pop();

    snakeElements.unshift(tailElement);
    gameBoard.insertBefore(tailElement, snakeElements[1]);
  }
}

// --- Окончательная drawSnakeVisual ---
function drawSnakeVisual() {
  // `interpolationFactor` не должен превышать 1, даже если `timeSinceLastMove` перескочил `gameSpeed`
  const interpolationFactor = Math.min(1, timeSinceLastMove / gameSpeed);

  snakeElements.forEach((element, index) => {
    const segmentData = snake[index];
    let currentVisualX, currentVisualY;

    // Если змейка начала двигаться (dx или dy не 0),
    // интерполируем между предыдущей и текущей логической позицией.
    // Иначе (на старте или если стоит) просто показываем текущую логическую позицию.
    if (dx !== 0 || dy !== 0) {
      currentVisualX =
        segmentData.prevX +
        (segmentData.x - segmentData.prevX) * interpolationFactor;
      currentVisualY =
        segmentData.prevY +
        (segmentData.y - segmentData.prevY) * interpolationFactor;
    } else {
      currentVisualX = segmentData.x;
      currentVisualY = segmentData.y;
    }

    element.style.left = `${currentVisualX * gridSize}px`;
    element.style.top = `${currentVisualY * gridSize}px`;

    if (index === 0) {
      element.classList.add("snake-head");
    } else {
      element.classList.remove("snake-head");
    }
  });
}

// --- drawFood (без изменений) ---
function drawFood() {
  const existingFood = gameBoard.querySelector(".food");
  if (existingFood) {
    existingFood.remove();
  }

  const foodElement = document.createElement("div");
  foodElement.classList.add("food");
  foodElement.style.left = `${food.x * gridSize}px`;
  foodElement.style.top = `${food.y * gridSize}px`;
  gameBoard.appendChild(foodElement);
}

// --- generateFood (без изменений) ---
function generateFood() {
  let newFoodPosition;
  let collisionWithSnake;

  do {
    newFoodPosition = {
      x: Math.floor(Math.random() * maxCells),
      y: Math.floor(Math.random() * maxCells),
    };
    // Проверяем на столкновение с *логической* змейкой
    collisionWithSnake = snake.some(
      (segment) =>
        segment.x === newFoodPosition.x && segment.y === newFoodPosition.y
    );
  } while (collisionWithSnake);

  food = newFoodPosition;
}

// --- endGame (без изменений) ---
function endGame() {
  isGameOver = true;
  gameOverMessage.classList.remove("hidden");
  cancelAnimationFrame(animationId); // Важно остановить requestAnimationFrame
}

// --- Управление направлением (КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ЗДЕСЬ!) ---
function changeDirection(event) {
  // Удаляем проверку `if (changingDirection) return;`

  const keyPressed = event.keyCode;
  const currentDx = dx; // Сохраняем текущее логическое направление перед изменением
  const currentDy = dy;

  // Стрелка влево (37)
  if (keyPressed === 37 && currentDx !== 1) {
    // Не можем пойти влево, если уже движемся вправо
    dx = -1;
    dy = 0;
  }
  // Стрелка вверх (38)
  else if (keyPressed === 38 && currentDy !== 1) {
    // Не можем пойти вверх, если уже движемся вниз
    dx = 0;
    dy = -1;
  }
  // Стрелка вправо (39)
  else if (keyPressed === 39 && currentDx !== -1) {
    // Не можем пойти вправо, если уже движемся влево
    dx = 1;
    dy = 0;
  }
  // Стрелка вниз (40)
  else if (keyPressed === 40 && currentDy !== -1) {
    // Не можем пойти вниз, если уже движемся вверх
    dx = 0;
    dy = 1;
  }
  // После изменения направления, если оно было принято, сбрасываем timeSinceLastMove
  // до нуля, чтобы следующий логический шаг произошел немедленно (в следующем gameLoop)
  // Это и дает ощущение моментального отклика.
  // НО: Если вы измените направление, когда змейка уже почти завершила свой текущий шаг,
  // это может привести к небольшому "прыжку", так как интерполяция начнется заново.
  // Часто лучше этого не делать и просто позволить игроку поменять dx/dy,
  // а логический шаг все равно произойдет по расписанию `gameSpeed`.
  // Для "идеального" моментального отклика, можно сбросить timeSinceLastMove = 0;
  // Но для более стабильной анимации, лучше этого не делать.
  // Давайте оставим `timeSinceLastMove` как есть.
  // Смена направления будет учтена на следующем логическом шаге.
  // Если игрок быстро нажимает, он почувствует моментальный отклик, т.к. `dx/dy` обновились.
}

// --- Обработчики событий ---
document.addEventListener("keydown", changeDirection);
restartButton.addEventListener("click", initGame);

// --- Запуск игры при загрузке страницы ---
initGame();
