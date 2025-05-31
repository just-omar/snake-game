// Получаем элементы DOM
const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const gameOverMessage = document.getElementById("game-over-message");
const restartButton = document.getElementById("restart-btn");

// Настройки игры
const gridSize = 20; // Размер одного квадрата (змейка, еда) в пикселях
const boardSize = 400; // Размер игрового поля в пикселях (400x400)
const maxCells = boardSize / gridSize; // Количество ячеек по одной стороне (400/20 = 20)

let snake = [{ x: 10, y: 10 }]; // Начальная позиция змейки (голова)
let food = {}; // Позиция еды
let dx = 0; // Смещение по X (направление)
let dy = 0; // Смещение по Y (направление)
let score = 0;
let gameInterval; // ID интервала для игрового цикла
let gameSpeed = 150; // Скорость игры (меньше = быстрее)
let isGameOver = false;
let changingDirection = false; // Флаг для предотвращения быстрой смены направления

// --- Инициализация и сброс игры ---
function initGame() {
  snake = [{ x: 10, y: 10 }]; // Сброс змейки в центр
  dx = 0; // Сброс направления
  dy = 0;
  score = 0;
  scoreDisplay.textContent = `Счет: ${score}`;
  isGameOver = false;
  gameOverMessage.classList.add("hidden"); // Скрыть сообщение "Игра окончена"
  generateFood(); // Сгенерировать новую еду
  draw(); // Отрисовать начальное состояние
  startGameLoop(); // Запустить игровой цикл
}

// --- Игровой цикл ---
function startGameLoop() {
  clearInterval(gameInterval); // Очищаем предыдущий интервал, если он был
  gameInterval = setInterval(gameLoop, gameSpeed);
}

function gameLoop() {
  if (isGameOver) {
    clearInterval(gameInterval); // Остановить игровой цикл
    return;
  }

  changingDirection = false; // Сбросить флаг для следующего кадра

  moveSnake();
  draw(); // Отрисовать обновленное состояние
}

// --- Отрисовка элементов на доске ---
function draw() {
  gameBoard.innerHTML = ""; // Очищаем доску перед каждой отрисовкой

  // Отрисовка змейки
  snake.forEach((segment) => {
    const snakeElement = document.createElement("div");
    snakeElement.classList.add("snake");
    snakeElement.style.left = `${segment.x * gridSize}px`;
    snakeElement.style.top = `${segment.y * gridSize}px`;
    gameBoard.appendChild(snakeElement);
  });

  // Отрисовка еды
  const foodElement = document.createElement("div");
  foodElement.classList.add("food");
  foodElement.style.left = `${food.x * gridSize}px`;
  foodElement.style.top = `${food.y * gridSize}px`;
  gameBoard.appendChild(foodElement);
}

// --- Перемещение змейки ---
function moveSnake() {
  // Вычисляем новую голову змейки
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Проверяем столкновение со стенами
  if (head.x < 0 || head.x >= maxCells || head.y < 0 || head.y >= maxCells) {
    endGame();
    return;
  }

  // Проверяем столкновение с самим собой
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      endGame();
      return;
    }
  }

  // Добавляем новую голову в начало массива
  snake.unshift(head);

  // Если змейка съела еду
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    generateFood(); // Генерируем новую еду
    // Увеличиваем скорость при каждом 5-м очке
    if (score % 5 === 0 && gameSpeed > 50) {
      gameSpeed -= 10;
      startGameLoop(); // Перезапускаем цикл с новой скоростью
    }
  } else {
    // Если еда не съедена, удаляем хвост
    snake.pop();
  }
}

// --- Генерация еды ---
function generateFood() {
  let newFoodPosition;
  let collisionWithSnake;

  do {
    newFoodPosition = {
      x: Math.floor(Math.random() * maxCells),
      y: Math.floor(Math.random() * maxCells),
    };
    collisionWithSnake = snake.some(
      (segment) =>
        segment.x === newFoodPosition.x && segment.y === newFoodPosition.y
    );
  } while (collisionWithSnake); // Повторяем, пока еда не окажется вне змейки

  food = newFoodPosition;
}

// --- Конец игры ---
function endGame() {
  isGameOver = true;
  gameOverMessage.classList.remove("hidden"); // Показать сообщение "Игра окончена"
}

// --- Управление направлением ---
function changeDirection(event) {
  // Предотвращаем быструю смену направления (например, влево, а потом сразу вправо за один кадр)
  if (changingDirection) return;
  changingDirection = true;

  const keyPressed = event.keyCode;
  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingLeft = dx === -1;
  const goingRight = dx === 1;

  // Стрелка влево (37)
  if (keyPressed === 37 && !goingRight) {
    dx = -1;
    dy = 0;
  }
  // Стрелка вверх (38)
  else if (keyPressed === 38 && !goingDown) {
    dx = 0;
    dy = -1;
  }
  // Стрелка вправо (39)
  else if (keyPressed === 39 && !goingLeft) {
    dx = 1;
    dy = 0;
  }
  // Стрелка вниз (40)
  else if (keyPressed === 40 && !goingUp) {
    dx = 0;
    dy = 1;
  }
}

// --- Обработчики событий ---
document.addEventListener("keydown", changeDirection);
restartButton.addEventListener("click", initGame);

// --- Запуск игры при загрузке страницы ---
initGame();
