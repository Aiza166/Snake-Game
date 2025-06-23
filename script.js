let CELL_WIDTH = 20;
let TICK_RATE = 100;
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
let ROWS, COLS;

let game = null;
let highScore = localStorage.getItem("highScore") || 0;
const scoreBoard = document.getElementById("score");
scoreBoard.textContent = `Score: 0 | High Score: ${highScore}`;

const eatSound = document.getElementById("eat-sound");

document.getElementById("start").addEventListener("click", () => {
  setupSettings();
  document.getElementById("start").classList.add("hidden");
  document.getElementById("pause").classList.remove("hidden");
  document.querySelector(".settings").style.display = "none";
  startGame();
});

document.getElementById("play-again").addEventListener("click", () => {
  document.getElementById("game-over").classList.add("hidden");
  resetCanvas();
  document.getElementById("pause").classList.remove("hidden");
  startGame();
});

document.getElementById("pause").addEventListener("click", () => {
  if (!game) return;
  if (game.isPaused) {
    game.resume();
    document.getElementById("pause").textContent = "Pause";
  } else {
    game.pause();
    document.getElementById("pause").textContent = "Resume";
  }
});

document.getElementById("theme-switch").addEventListener("change", (e) => {
  document.body.classList.toggle("light-theme", e.target.checked);
});

function setupSettings() {
  CELL_WIDTH = parseInt(document.getElementById("grid-size").value);
  TICK_RATE = parseInt(document.getElementById("speed").value);
  ROWS = CANVAS_WIDTH / CELL_WIDTH;
  COLS = CANVAS_HEIGHT / CELL_WIDTH;
}

function startGame() {
  game = new Game();
  game.start();
}

function resetCanvas() {
  const ctx = document.getElementById("canvas").getContext("2d");
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

class Game {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.snake = new Snake(this.ctx);
    this.food = new Food(this.ctx);
    this.interval = null;
    this.direction = { x: 1, y: 0 };
    this.isRunning = false;
    this.isPaused = false;
    this.score = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.snake.draw();
    this.food.draw(this.snake);

    this.interval = setInterval(() => {
      if (!this.isPaused) {
        this.snake.move(
          this.direction.x * CELL_WIDTH,
          this.direction.y * CELL_WIDTH,
          this.checkCollision.bind(this),
          this.food
        );
        scoreBoard.textContent = `Score: ${this.score} | High Score: ${highScore}`;
      }
    }, TICK_RATE);

    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  handleKeyDown(event) {
    const keyMap = {
      37: { x: -1, y: 0 },
      38: { x: 0, y: -1 },
      39: { x: 1, y: 0 },
      40: { x: 0, y: 1 },
    };
    const newDir = keyMap[event.keyCode];
    if (!newDir) return;
    const opposite = (a, b) => a.x === -b.x && a.y === -b.y;
    if (!opposite(newDir, this.direction)) {
      this.direction = newDir;
    }
  }

  checkCollision(newHead) {
    if (
      newHead.x < 0 || newHead.x >= CANVAS_WIDTH ||
      newHead.y < 0 || newHead.y >= CANVAS_HEIGHT
    ) {
      this.endGame();
      return false;
    }

    if (this.snake.body.some(part => part.x === newHead.x && part.y === newHead.y)) {
      this.endGame();
      return false;
    }

    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score++;
      if (document.getElementById("sound-toggle").checked) eatSound.play();
      if (this.score > highScore) {
        highScore = this.score;
        localStorage.setItem("highScore", highScore);
      }
      return true;
    }

    return false;
  }

  endGame() {
    clearInterval(this.interval);
    this.isRunning = false;
    this.isPaused = false;
    document.getElementById("pause").classList.add("hidden");
    document.getElementById("pause").textContent = "Pause";
    document.getElementById("final-score").textContent = this.score;
    document.getElementById("final-high-score").textContent = highScore;
    document.getElementById("game-over").classList.remove("hidden");
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }
}

class Snake {
  constructor(ctx) {
    this.ctx = ctx;
    this.body = [{ x: 0, y: 0 }];
  }

  draw() {
    this.body.forEach(({ x, y }) => {
      this.ctx.fillStyle = "rgba(92, 229, 250)";
      this.ctx.fillRect(x, y, CELL_WIDTH, CELL_WIDTH);
    });
  }

  clear() {
    this.body.forEach(({ x, y }) => {
      this.ctx.clearRect(x, y, CELL_WIDTH, CELL_WIDTH);
    });
  }

  move(dx, dy, checkCollision, food) {
    this.clear();
    const newHead = {
      x: this.body[0].x + dx,
      y: this.body[0].y + dy,
    };

    const grow = checkCollision(newHead);
    const newBody = [newHead, ...this.body];
    if (!grow) newBody.pop();

    this.body = newBody;
    this.draw();

    if (grow) food.draw(this);
  }
}

class Food {
  constructor(ctx) {
    this.ctx = ctx;
    this.x = 0;
    this.y = 0;
  }

  draw(snake) {
    let overlap = true;
    while (overlap) {
      this.x = Math.floor(Math.random() * ROWS) * CELL_WIDTH;
      this.y = Math.floor(Math.random() * COLS) * CELL_WIDTH;
      overlap = snake.body.some(part => part.x === this.x && part.y === this.y);
    }

    this.ctx.fillStyle = "#ef2d56";
    this.ctx.fillRect(this.x, this.y, CELL_WIDTH, CELL_WIDTH);
  }
}
