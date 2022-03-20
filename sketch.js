let water;

let c = 40;     // wave celerity
let dt = 1 / 60;   // time delta

let diag, centerX, centerY;

let mouse_spd;

let obstacle = [];

let illum = false;

function setup() {
  cnv = createCanvas(400, 400);
  previous = createGraphics(400, 400);
  frameRate(1 / dt);

  cnv.mousePressed(centerUpdate);

  centerX = width / 2;
  centerY = height / 2;

  water = new surface();
  water.add_wave(createVector(centerX, centerY), 5, 1000);

  for (let i = 0; i < 5; i++) {
    let x1 = floor(random(100, width - 100));
    let y1 = floor(random(100, height - 100));
    let w = floor(random(100));
    let h = floor(random(100));
    obstacle[i] = new wall(x1, y1, w, h);
  }
}

function draw() {

  water.update();
  water.show();

  if (illum) {
    blendMode(ADD);
    image(previous, 0, 0);
  }

  blendMode(BLEND);
  for (let i = 0; i < obstacle.length; i++) {
    obstacle[i].show();
  }
  if (illum) {
    previous.copy(cnv, 0, 0, width, height, 0, 0, width, height);
  }

  // text description
  textAlign(LEFT);
  fill(255);
  text("the 2D wave equation is :", 20, 25);
  text("d²u/dt² = c² (d²u/dx² + d²u/dy²)", 20, 40);
  text("press 'r' or touch the screen to randomize\npress 'a' to restart current \npress 'i' to illumination", 20, 55);
}

function reset() {
  water = new surface();
  water.add_wave(createVector(centerX, centerY), 5, 1000);
  previous = createGraphics(400, 400);
}

function keyPressed() {
  if (key == 'r') {
    water.add_random(-255, 255);
    return false;
  }
  if (key == 'i') {
    illum = !illum;
    return false;
  }
  if (key == 'a') {
    reset();
    return false;
  }
}

function centerUpdate() {
  centerX = mouseX;
  centerY = mouseY;
  reset();
  return false;
}

class wall {
  constructor(x1, y1, w, h) {
    this.x1 = x1;
    this.y1 = y1;
    this.w = w;
    this.h = h;

    this.x2 = x1 + w;
    this.y2 = y1 + h;

    this.show = function () {
      push();
      stroke(255);
      fill(0);
      rect(this.x1, this.y1, this.w, this.h);
      pop();
    }
  }
}


class surface {
  constructor() {

    // temporal derivation
    this.u = [];
    this.du = [];
    this.d2u = [];

    // spatial derivation
    this.dudx = [];
    this.dudy = [];

    this.d2udx2 = [];
    this.d2udy2 = [];

    // initialization
    for (let x = 0; x < width; x++) {
      this.u[x] = [];
      this.du[x] = [];
      this.d2u[x] = [];

      this.dudx[x] = [];
      this.dudy[x] = [];

      this.d2udx2[x] = [];
      this.d2udy2[x] = [];
      for (let y = 0; y < height; y++) {
        this.u[x][y] = 0;
        this.du[x][y] = 0;
        this.d2u[x][y] = 0;

        this.dudx[x][y] = 0;
        this.dudy[x][y] = 0;

        this.d2udx2[x][y] = 0;
        this.d2udy2[x][y] = 0;
      }

    }

    this.reflexion = function (walls) {
      for (let w = 0; w < walls.length; w++) {
        for (let x = walls[w].x1; x < walls[w].x2; x++) {
          for (let y = walls[w].y1; y < walls[w].y2; y++) {
            this.u[x][y] = 0;
            this.u[x][y] = 0;
          }
        }

        // left & right boudaries
        for (let y = walls[w].y1; y < walls[w].y2; y++) {
          this.u[walls[w].x1 - 1][y] = this.u[walls[w].x1 - 2][y];
          this.u[walls[w].x2 + 1][y] = this.u[walls[w].x2 + 2][y];
        }

        // up & down boundaries
        for (let x = walls[w].x1; x < walls[w].x2; x++) {
          this.u[x][walls[w].y1 - 1] = this.u[x][walls[w].y1 - 2];
          this.u[x][walls[w].y2 + 1] = this.u[x][walls[w].y1 + 2];
        }

        // corners
        this.u[walls[w].x1 - 1][walls[w].y1 - 1] = (this.u[walls[w].x1 - 2][walls[w].y1 - 1] + this.u[walls[w].x1 - 1][walls[w].y1 - 2]) / 2;
        this.u[walls[w].x1 - 1][walls[w].y2 + 1] = (this.u[walls[w].x1 - 2][walls[w].y2 + 1] + this.u[walls[w].x1 - 1][walls[w].y2 + 2]) / 2;
        //this.u[walls[w].x2+1][walls[w].y2+1] = (this.u[walls[w].x2+2][walls[w].y2+1] + this.u[walls[w].x2+1][walls[w].y2+2])/2;
        this.u[walls[w].x2 + 1][walls[w].y1 - 1] = (this.u[walls[w].x2 + 2][walls[w].y1 - 1] + this.u[walls[w].x2 + 1][walls[w].y1 - 2]) / 2;


      }
    }

    // spatial derivation
    this.calculate_spatial = function () {
      for (let x = 1; x < width - 1; x++) {
        for (let y = 1; y < height - 1; y++) {
          this.d2udx2[x][y] = this.u[x - 1][y] - 2 * this.u[x][y] + this.u[x + 1][y];
          this.d2udy2[x][y] = this.u[x][y - 1] - 2 * this.u[x][y] + this.u[x][y + 1];

          /*
          this.dudx[x][y] = this.u[x - 1][y] - this.u[x + 1][y];
          this.dudy[x][y] = this.u[x][y - 1] - this.u[x][y + 1];
          */
        }
      }
      // right & left boundaries
      for (let y = 1; y < height - 1; y++) {
        this.d2udx2[0][y] = this.u[0][y] - 2 * this.u[1][y] + this.u[2][y];
        this.d2udx2[width - 1][y] = this.u[width - 1][y] - 2 * this.u[width - 2][y] + this.u[width - 3][y];

        this.d2udy2[0][y] = this.u[0][y - 1] - 2 * this.u[0][y] + this.u[0][y + 1];
        this.d2udy2[width - 1][y] = this.u[width - 1][y - 1] - 2 * this.u[width - 1][y] + this.u[width - 1][y + 1];
      }

      // up & down boundaries
      for (let x = 1; x < width - 1; x++) {
        this.d2udx2[x][0] = this.u[x - 1][0] - 2 * this.u[x][0] + this.u[x + 1][0];
        this.d2udx2[x][height - 1] = this.u[x - 1][height - 1] - 2 * this.u[x][height - 1] + this.u[x + 1][height - 1];

        this.d2udy2[x][0] = this.u[x][0] - 2 * this.u[x][1] + this.u[x][2];
        this.d2udy2[x][height - 1] = this.u[x][height - 1] - 2 * this.u[x][height - 2] + this.u[x][height - 3];
      }

      // corners
      this.d2udx2[0][0] = (this.d2udx2[1][0] + this.d2udx2[0][1]) / 2;
      this.d2udy2[0][0] = (this.d2udy2[1][0] + this.d2udy2[0][1]) / 2;

      this.d2udx2[width - 1][0] = (this.d2udx2[width - 2][0] + this.d2udx2[width - 1][1]) / 2;
      this.d2udy2[width - 1][0] = (this.d2udy2[width - 2][0] + this.d2udy2[width - 1][1]) / 2;

      this.d2udx2[width - 1][height - 1] = (this.d2udx2[width - 2][height - 1] + this.d2udx2[width - 1][height - 2]) / 2;
      this.d2udy2[width - 1][height - 1] = (this.d2udy2[width - 2][height - 1] + this.d2udy2[width - 1][height - 2]) / 2;

      this.d2udx2[0][height - 1] = (this.d2udx2[1][height - 1] + this.d2udx2[0][height - 2]) / 2;
      this.d2udy2[0][height - 1] = (this.d2udy2[1][height - 1] + this.d2udy2[0][height - 2]) / 2;
    }

    this.calculate_d2u = function () {
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          this.d2u[x][y] = sq(dt) * sq(c) * (this.d2udx2[x][y] + this.d2udy2[x][y]);
        }
      }
    }

    this.integrate_d2u = function () {
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          this.du[x][y] += this.d2u[x][y];
          this.u[x][y] += this.du[x][y];
          //this.u[x][y] *= 0.999;
        }
      }
    }

    /*
    the 2D wave equation is :
    d²u/dt² = c²(d²u/dx² + d²u/dy²)
    
    so we calculate :
    d²u = dt² c² (d²u/dx² + d²u/dy²)

    and integrate two time d²u to get du
    */

    this.update = function () {
      this.calculate_spatial();
      this.calculate_d2u();
      this.integrate_d2u();
      this.reflexion(obstacle);
    }

    this.add_wave = function (pos, radius, force) {
      for (let x = pos.x - radius; x < pos.x + radius; x++) {
        for (let y = pos.y - radius; y < pos.y + radius; y++) {
          let dist = sqrt(sq(x - pos.x) + sq(y - pos.y));
          if (dist < radius) {
            this.u[x][y] = force * map(dist, 0, radius, 1, 0);
          }
        }
      }
    }

    this.add_random = function (vmin, vmax) {

      for (let i = 0; i < 25; i++) {
        let x = floor(random(50, width - 50));
        let y = floor(random(50, height - 50));
        this.add_wave(createVector(x, y), floor(random(2, 10)), random(vmin, vmax));
      }
    }

    this.show = function () {
      loadPixels();
      if (illum) {
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            set(x, y, abs(this.u[x][y]) / 20);
          }
        }
      } else {
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            set(x, y, 127 + this.u[x][y]);
          }
        }
      }
      updatePixels();
    }

  }
}