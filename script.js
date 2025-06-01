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
let snake = [{ x: 10, y: 10 }]; // Данные о логической позиции змейки (голова)
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
let changingDirection = false; // Флаг для предотвращения быстрой смены направления

// --- Инициализация и сброс игры ---
function initGame() {
  // Reset game state
  snake = [{ x: 10, y: 10 }];
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
    timeSinceLastMove = 0; // Сбрасываем таймер
    changingDirection = false; // Сбросить флаг для следующего логического шага

    // Выполняем логическое перемещение змейки (обновление snake массива)
    moveSnakeLogic();

    // Если игра не окончена после логического перемещения,
    // то теперь нужно визуально обновить элементы
    if (!isGameOver) {
      // Обновляем позиции DOM-элементов змейки
      // drawSnake() вызывается здесь после логического перемещения,
      // но визуальное смещение будет управляться ниже
    }
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

  snake.unshift(head); // Добавляем новую голову в массив данных

  const didEatFood = head.x === food.x && head.y === food.y;

  if (didEatFood) {
    score++;
    scoreDisplay.textContent = `Счет: ${score}`;
    generateFood();
    drawFood(); // Отрисовываем новую еду

    if (score % 5 === 0 && gameSpeed > 50) {
      gameSpeed -= 10;
    }

    // Змейка выросла: создаем новый DOM-элемент для новой головы
    const newHeadElement = document.createElement("div");
    newHeadElement.classList.add("snake");
    snakeElements.unshift(newHeadElement); // Добавляем в начало массива DOM-элементов
    gameBoard.insertBefore(newHeadElement, snakeElements[1]); // Вставляем в DOM перед старой головой
  } else {
    // Змейка не выросла: перемещаем элемент хвоста на место новой головы
    const tailElement = snakeElements.pop(); // Удаляем элемент хвоста из конца массива DOM-элементов
    snake.pop(); // Удаляем хвост из массива данных

    snakeElements.unshift(tailElement); // Перемещаем элемент хвоста в начало массива DOM-элементов
    gameBoard.insertBefore(tailElement, snakeElements[1]); // Перемещаем в DOM на позицию головы
  }
}

// --- Визуальная отрисовка змейки (обновление 'left'/'top' стилей) ---
function drawSnakeVisual() {
  // Смещение для плавности: от 0 (начало движения к новой клетке) до 1 (конец движения)
  const interpolationFactor = timeSinceLastMove / gameSpeed;

  snakeElements.forEach((element, index) => {
    let targetX = snake[index].x;
    let targetY = snake[index].y;

    // Если это голова или сегмент, который только что двинулся, и змейка движется
    if (index === 0 && (dx !== 0 || dy !== 0)) {
      // Для головы вычисляем промежуточное положение между старой и новой клеткой
      const prevX = snake[0].x - dx;
      const prevY = snake[0].y - dy;

      element.style.left = `${(prevX + dx * interpolationFactor) * gridSize}px`;
      element.style.top = `${(prevY + dy * interpolationFactor) * gridSize}px`;
    } else if ((index > 0 && dx !== 0) || dy !== 0) {
      // Для остальных сегментов, которые "следуют" за предыдущими
      // Их "старое" положение было положением предыдущего сегмента на предыдущем шаге
      // Их "новое" положение - это текущее положение предыдущего сегмента
      const prevSegmentX = snake[index - 1].x;
      const prevSegmentY = snake[index - 1].y;

      // Вычисляем, куда *визуально* движется этот сегмент
      let currentVisualX, currentVisualY;

      // Если это не голова, то его "старая" позиция была позицией предыдущего сегмента в предыдущий момент
      const segmentPrevX =
        snake[index].x - (snake[index - 1].x - snake[index].x); // Где он был относительно предыдущего сегмента
      const segmentPrevY =
        snake[index].y - (snake[index - 1].y - snake[index].y);

      // Этот кусок сложный, он должен быть проще:
      // Каждый сегмент движется в позицию предыдущего сегмента.
      // Старая логическая позиция этого сегмента: snake[index]
      // Новая логическая позиция этого сегмента: snake[index-1] (для тела)
      // Для головы: snake[0] - это новая, а old_head = snake[0] - direction

      // Проще: просто отрисовываем каждый сегмент по его текущей *логической* координате,
      // и позволяем JS интерполировать *смещение* от этой координаты.
      // Эта версия будет сложной, давайте вернемся к более простой, но эффективной
      // интерполяции, которая фокусируется на смещении внутри клетки.

      // ---- ВАЖНОЕ УПРОЩЕНИЕ: ----
      // Для плавной отрисовки, мы будем двигать каждый сегмент от его *предыдущего* логического положения
      // к его *текущему* логическому положению.
      // Для этого нам нужно хранить *предыдущее* логическое положение каждого сегмента.
      // Это значительно усложнит массив `snake`, добавляя `prevX`, `prevY` к каждому объекту.
      // Либо мы можем интерполировать *всю змейку* на основе движения головы.

      // ---- АЛЬТЕРНАТИВА (проще для тела): ----
      // Сегменты тела просто следуют за сегментом перед ними.
      // Голова движется от (Xprev, Yprev) к (Xcurr, Ycurr)
      // Тело движется от (Xcurr_prev_segment, Ycurr_prev_segment) к (Xcurr_this_segment, Ycurr_this_segment)
      // Это приводит к "волнообразному" движению.
      //
      // Проще всего: интерполировать только голову, а тело просто следует за головой со сдвигом.
      // Но тогда тело будет дергаться.

      // Давайте использовать самый простой и часто используемый метод для smooth-snake:
      // мы считаем, что каждый сегмент движется из своего *предыдущего логического места*
      // в *текущее логическое место*.
      // Чтобы это работало, нам нужно хранить prevX/prevY для каждого сегмента в `snake`.

      // --- МЕТОД: Сохранение предыдущих позиций ---
      // Для каждого сегмента змейки (кроме головы) его "новое" положение - это "старое" положение предыдущего сегмента.
      // А для головы его "новое" положение - это (snake[0].x, snake[0].y).
      // Его "старое" положение было (snake[0].x - dx, snake[0].y - dy).

      // Давайте упростим логику отрисовки для плавности:
      // Все сегменты змейки перемещаются из своей текущей ячейки в целевую ячейку.
      // `interpolationFactor` (от 0 до 1) определяет, насколько далеко они уже продвинулись.
      // `snake` уже содержит целевые ячейки.
      // Нам нужно знать *предыдущие* ячейки для каждого сегмента.
      // Самый простой способ - сохранять их при каждом `moveSnakeLogic`.
    }

    // *******************************************************************
    // ************* НОВАЯ ЛОГИКА ДЛЯ ПЛАВНОЙ ОТРЕСОВКИ ***************
    // *******************************************************************
    // Для каждого сегмента змейки нам нужно его текущее *логическое* положение
    // и его *предыдущее* логическое положение, чтобы интерполировать между ними.
    // Чтобы упростить, давайте будем интерполировать только голову,
    // а остальные сегменты будут просто следовать за предыдущим сегментом,
    // но с задержкой в один шаг.
    // Это делает движение более "реалистичным" и избегает сложных вычислений для каждого сегмента.

    // Учитываем, что змейка ещё не движется, если dx=0 и dy=0 (на старте)
    if (dx === 0 && dy === 0) {
      element.style.left = `${snake[index].x * gridSize}px`;
      element.style.top = `${snake[index].y * gridSize}px`;
    } else {
      // Для головы:
      if (index === 0) {
        // Предыдущая позиция головы (если она двигалась)
        const prevHeadX = snake[0].x - dx;
        const prevHeadY = snake[0].y - dy;

        // Текущая визуальная позиция головы, интерполированная между старой и новой логической клеткой
        element.style.left = `${
          (prevHeadX + dx * interpolationFactor) * gridSize
        }px`;
        element.style.top = `${
          (prevHeadY + dy * interpolationFactor) * gridSize
        }px`;
      } else {
        // Для остальных сегментов:
        // Их текущая логическая позиция snake[index]
        // Их предыдущая логическая позиция snake[index-1] (или откуда они пришли)
        // Но для плавности мы хотим, чтобы они следовали за предыдущим сегментом
        // с *задержкой*.
        // Самый простой способ: каждый сегмент тела просто движется в позицию,
        // которая была у предыдущего сегмента на *предыдущем* логическом шаге.
        // Это достигается за счет того, что snake[index] уже содержит *целевую* клетку,
        // а interpolationFactor показывает, насколько далеко мы продвинулись к этой клетке.
        // ВНИМАНИЕ: Если мы просто интерполируем snake[index] к snake[index],
        // то сегменты будут просто перепрыгивать.
        // Чтобы была "волна", нужно:
        // Визуальное положение сегмента N = интерполяция между (логическая_позиция_сегмента_N_на_предыдущем_шаге)
        // и (логическая_позиция_сегмента_N-1_на_текущем_шаге)
        //
        // Это очень усложнит `snake` массив, добавив `prevX`, `prevY` для каждого сегмента.
        // Давайте попробуем более прямой подход, который выглядит очень хорошо:
        // Просто обновляем `left` и `top` основываясь на `snake[index]`
        // и пусть CSS transition делает работу.
        // А, нет, transition мы убрали. Значит, всю плавность делаем вручную.
        // Вот более рабочий и распространенный подход для сегментов тела:
        // Логическая позиция сегмента: snake[index]
        // Визуальная позиция сегмента N:
        // Интерполируем от (snake[index-1].prevX, snake[index-1].prevY) до (snake[index-1].x, snake[index-1].y)
        // Это приводит к тому, что каждый сегмент тела будет плавно двигаться к месту,
        // где был предыдущий сегмент.
        // Но нам нужно сохранить `prevX`, `prevY` для каждого сегмента в `snake` массиве.
        // Давайте обновим `snake` массив, чтобы хранить `prevX` и `prevY`.
      }
    }

    // Обновляем классы (голова/тело)
    if (index === 0) {
      element.classList.add("snake-head");
    } else {
      element.classList.remove("snake-head");
    }
  });
}

// --- НОВАЯ СТРУКТУРА ДАННЫХ ДЛЯ snake (с prevX, prevY) ---
// Это позволит нам интерполировать позиции каждого сегмента
// в `drawSnakeVisual`
let snakeWithPrev = [{ x: 10, y: 10, prevX: 10, prevY: 10 }]; // Изначально prev == current

// --- Обновленная initGame ---
function initGame() {
  snakeWithPrev = [{ x: 10, y: 10, prevX: 10, prevY: 10 }]; // Сброс данных змейки
  snake = snakeWithPrev; // Для совместимости с остальным кодом, который использует 'snake'
  dx = 0;
  dy = 0;
  score = 0;
  scoreDisplay.textContent = `Счет: ${score}`;
  isGameOver = false;
  gameOverMessage.classList.add("hidden");
  gameSpeed = 150;
  timeSinceLastMove = 0;

  while (gameBoard.firstChild) {
    gameBoard.removeChild(gameBoard.firstChild);
  }
  snakeElements = [];

  snake.forEach((segment, index) => {
    const snakeElement = document.createElement("div");
    snakeElement.classList.add("snake");
    if (index === 0) {
      snakeElement.classList.add("snake-head");
    }
    snakeElement.style.left = `${segment.x * gridSize}px`;
    snakeElement.style.top = `${segment.y * gridSize}px`;
    gameBoard.appendChild(snakeElement);
    snakeElements.push(snakeElement);
  });

  generateFood();
  drawFood();

  if (animationId) cancelAnimationFrame(animationId);
  lastFrameTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

// --- Обновленная moveSnakeLogic ---
function moveSnakeLogic() {
  if (
    dx === 0 &&
    dy === 0 &&
    snake.length === 1 &&
    snake[0].x === 10 &&
    snake[0].y === 10
  ) {
    return;
  }

  // Сохраняем текущие положения как предыдущие для следующего кадра
  for (let i = 0; i < snake.length; i++) {
    snake[i].prevX = snake[i].x;
    snake[i].prevY = snake[i].y;
  }

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  if (head.x < 0 || head.x >= maxCells || head.y < 0 || head.y >= maxCells) {
    endGame();
    return;
  }

  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      endGame();
      return;
    }
  }

  // Добавляем новую голову в массив данных
  snake.unshift({
    x: head.x,
    y: head.y,
    prevX: head.x - dx,
    prevY: head.y - dy,
  });
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
  const interpolationFactor = timeSinceLastMove / gameSpeed; // От 0 до 1

  snakeElements.forEach((element, index) => {
    const segmentData = snake[index];
    let currentVisualX, currentVisualY;

    // Если это голова и она начала движение, или любой другой сегмент
    // интерполируем между предыдущей и текущей логической позицией
    currentVisualX =
      segmentData.prevX +
      (segmentData.x - segmentData.prevX) * interpolationFactor;
    currentVisualY =
      segmentData.prevY +
      (segmentData.y - segmentData.prevY) * interpolationFactor;

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

// --- changeDirection (без изменений) ---
function changeDirection(event) {
  if (changingDirection) return;
  changingDirection = true;

  const keyPressed = event.keyCode;
  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingLeft = dx === -1;
  const goingRight = dx === 1;

  if (keyPressed === 37 && !goingRight) {
    dx = -1;
    dy = 0;
  } else if (keyPressed === 38 && !goingDown) {
    dx = 0;
    dy = -1;
  } else if (keyPressed === 39 && !goingLeft) {
    dx = 1;
    dy = 0;
  } else if (keyPressed === 40 && !goingUp) {
    dx = 0;
    dy = 1;
  }
}

// --- Обработчики событий ---
document.addEventListener("keydown", changeDirection);
restartButton.addEventListener("click", initGame);

// --- Запуск игры при загрузке страницы ---
initGame();
