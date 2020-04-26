const MAXWIDTH = 8;
const MAXHEIGHT = 16;

class GameTable {
  generateField = () => {
    let map = [];
    for (let i = 0; i < MAXHEIGHT + 1; i++) {
      map.push([]);
      for (let k = 0; k < MAXWIDTH + 1; k++) {
        map[i].push(0);
      }
    }
    return map;
  };

  constructor(kwargs) {
    this.renderer = new Renderer({ ctx: kwargs.ctx });
    this.currentFigure = undefined;
    this.tickNumber = 0;
    this.fallen = 0;
    this.linesCleared = 0;
    this.timesLinesCleared = 0;
    this.baseTickSpeed = 1000;
    this.minTickSpeed = 30;
    this.figurePosition = { x: 0, y: 0 };
    this.score = 0;

    this.gameField = this.generateField();

    this.tick = (forced = false) => {
      if (!this.isCurrentFigureGrounded()) {
        this.figurePosition.y += 1;
      } else {
        console.log("affixed");
        this.affixCurrentFigure();
        this.regenerateFigure();
      }
      this.tickNumber++;
      this.checkLines();
      this.renderer.renderGame(this);
      if (!forced) setTimeout(this.tick, this.calculateSpeed());
    };

    this.calculateSpeed = () => {
      return this.timesLinesCleared > this.minTickSpeed
        ? this.minTickSpeed
        : this.baseTickSpeed - this.timesLinesCleared;
    };

    this.tryRotate = () => {
      this.currentFigure.rotate();
      if (!this.wouldFigureCollide(this.currentFigure, this.figurePosition)) {
        this.renderer.renderGame(this);
      } else {
        this.currentFigure.rotate();
        this.currentFigure.rotate();
        this.currentFigure.rotate();
      }
      console.log(this.currentFigure.shape);
    };

    this.tryMoveFigure = x => {
      if (
        !this.wouldFigureCollide(this.currentFigure, {
          x: this.figurePosition.x + x,
          y: this.figurePosition.y
        })
      ) {
        this.figurePosition.x += x;
        this.renderer.renderGame(this);
      }
    };

    this.isCurrentFigureGrounded = () => {
      if (!this.currentFigure) return true;
      const ans = this.wouldFigureCollide(this.currentFigure, {
        x: this.figurePosition.x,
        y: this.figurePosition.y + 1
      });
      return ans;
    };

    this.wouldFigureCollide = (figure, source) => {
      for (let dot of figure.shape) {
        if (dot.y + source.y > MAXHEIGHT) return true;
        if (this.gameField[dot.y + source.y] === undefined) return true;
        if (this.gameField[dot.y + source.y][dot.x + source.x] === undefined)
          return true;
        if (this.gameField[dot.y + source.y][dot.x + source.x]) return true;
      }
      return false;
    };

    this.affixCurrentFigure = () => {
      if (this.currentFigure) {
        this.currentFigure.shape.forEach(dot => {
          if (this.gameField[this.figurePosition.y + dot.y])
            this.gameField[this.figurePosition.y + dot.y][
              this.figurePosition.x + dot.x
            ] = this.currentFigure.color;
        });
        this.fallen += 1;
      }
      this.currentFigure = null;
    };

    this.checkLines = () => {
      let chain = 0;
      let multiplier = 1;
      for (let i = 0; i < this.gameField.length; i++) {
        if (!(this.gameField[i].indexOf(0) + 1)) {
          for (let k = i; k > 0; k--) {
            this.gameField[k] = this.gameField[k - 1];
          }
          this.score += 1 * multiplier * chain;
          multiplier *= 2;
          this.linesCleared++;
        }
      }
      if (multiplier > 1) this.timesLinesCleared++;
    };

    this.regenerateFigure = () => {
      this.currentFigure = new Figure(Math.floor(Math.random() * 7), 1);
      this.figurePosition.x = 2 + Math.round(Math.random());
      this.figurePosition.y = 0;
      if (this.wouldFigureCollide(this.currentFigure, this.figurePosition))
        this.gameOver();
    };

    this.control = evt => {
      if (evt.code == "ArrowUp") {
        this.tryRotate();
      }
      if (evt.code == "ArrowLeft") {
        this.tryMoveFigure(-1);
      }
      if (evt.code == "ArrowRight") {
        this.tryMoveFigure(1);
      }
      if (evt.code == "ArrowDown") {
        this.tick(true);
      }
    };

    this.gameOver = () => {
      this.gameField = this.generateField();
      this.fallen = 0;
      console.log("Game Over");
    };
  }
}

class Renderer {
  constructor(kwargs) {
    this.ctx = kwargs.ctx;
    this.makeColor = (r, g, b) => {
      return "rgb(" + r + "," + g + "," + b + ")";
    };

    this.colorIndex = index => {
      switch (index) {
        case 1:
          return [this.makeColor(130, 10, 10), this.makeColor(170, 10, 10)];
        case 2:
          return [this.makeColor(10, 130, 10), this.makeColor(10, 170, 10)];
        case 3:
          return [this.makeColor(10, 10, 130), this.makeColor(10, 10, 170)];
        case 4:
          return [this.makeColor(130, 130, 10), this.makeColor(170, 170, 10)];
        case 5:
          return [this.makeColor(130, 10, 130), this.makeColor(170, 10, 170)];
        case 6:
          return [this.makeColor(140, 80, 10), this.makeColor(180, 120, 10)];
        case 7:
          return [this.makeColor(10, 130, 130), this.makeColor(10, 170, 170)];

        default:
          return [this.makeColor(0, 0, 0), this.makeColor(40, 40, 40)];
      }
    };

    this.clear = () => {
      this.ctx.beginPath();
      this.ctx.strokeStyle = "white";
      this.ctx.fillStyle = "white";
      this.ctx.rect(0, 0, 800, 600);
      this.ctx.fill();
    };

    this.renderGame = gameTable => {
      this.clear();

      for (let i = 0; i < gameTable.gameField.length; i++) {
        for (let k = 0; k < gameTable.gameField[i].length; k++) {
          if (gameTable.gameField[i][k] > 0) {
            let color = this.colorIndex(gameTable.gameField[i][k]);
            this.ctx.fillStyle = color[0];
            this.ctx.fillRect(k * 32, i * 32, 32, 32);
            this.ctx.fillStyle = color[1];
            this.ctx.fillRect(k * 32 + 4, i * 32 + 4, 24, 24);
            this.ctx.fillStyle = color[0];
            this.ctx.fillRect(k * 32 + 8, i * 32 + 8, 16, 16);
          }
        }
      }

      if (gameTable.currentFigure)
        gameTable.currentFigure.shape.forEach(dot => {
          let color = this.colorIndex(gameTable.currentFigure.color);
          this.ctx.fillStyle = color[0];
          const xpos = dot.x + gameTable.figurePosition.x;
          const ypos = dot.y + gameTable.figurePosition.y;
          this.ctx.fillRect(xpos * 32, ypos * 32, 32, 32);
          this.ctx.fillStyle = color[1];
          this.ctx.fillRect(xpos * 32 + 4, ypos * 32 + 4, 24, 24);
          this.ctx.fillStyle = color[0];
          this.ctx.fillRect(xpos * 32 + 8, ypos * 32 + 8, 16, 16);
        });
    };
  }
}

class Figure {
  constructor(type) {
    this.color = type + 1;
    this.rotation = 0;
    this.shape = [
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 1, y: 3 }
      ],
      [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 1 },
        { x: 2, y: 2 }
      ],
      [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 }
      ],
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 }
      ],
      [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 }
      ],
      [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 }
      ],
      [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 2 }
      ]
    ][type];

    this.rotate = () => {
      const PI = Math.PI;
      this.shape = this.shape.map(coord => {
        coord.x -= 1.5;
        coord.y -= 1.5;
        const origx = coord.x;
        const origy = coord.y;
        coord.x = origx * Math.cos(PI / 2) - origy * Math.sin(PI / 2);
        coord.y = origy * Math.cos(PI / 2) + origx * Math.sin(PI / 2);
        coord.x += 1.5;
        coord.y += 1.5;
        return { x: Math.round(coord.x), y: Math.round(coord.y) };
      });
    };
  }
}

window.onload = main = () => {
  const canvas = document.getElementById("tetris");
  const gameTable = new GameTable({ ctx: canvas.getContext("2d") });
  const buttons = {
    left: document.getElementById("btnLeft"),
    up: document.getElementById("btnUp"),
    down: document.getElementById("btnDown"),
    right: document.getElementById("btnRight")
  };
  document.addEventListener("keydown", gameTable.control);

  buttons.left.addEventListener("click", () =>
    gameTable.control({ code: "ArrowLeft" })
  );
  buttons.up.addEventListener("click", () =>
    gameTable.control({ code: "ArrowUp" })
  );
  buttons.down.addEventListener("click", () =>
    gameTable.control({ code: "ArrowDown" })
  );
  buttons.right.addEventListener("click", () =>
    gameTable.control({ code: "ArrowRight" })
  );
  setTimeout(gameTable.tick, 1000);
};
