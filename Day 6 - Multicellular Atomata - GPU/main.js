//
// Rules
//

// Any live cell with fewer than two live neighbors dies, as if by underpopulation.
// Any live cell with two or three live neighbors lives on to the next generation.
// Any live cell with more than three live neighbors dies, as if by overpopulation.
// Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.

var gpu = new GPU.GPU();
var dimention = 500;

// var canvas = document.getElementById('canvas');
// var ctx = canvas.getContext('2d');

var [w, h] = [930, 930]
var [Sw, Sh] = [w/dimention, h/dimention];

var nextGeneration = gpu.createKernel(function(gen, dimention) {
  var [y, x] = [this.thread.x, this.thread.y];

  var cell = gen[x][y];

  var neighbors = 0;
  var r = 7
  for (var xi = -r; xi <= r; xi++)
    for (var yi = -r; yi <= r; yi++)
      if(!(xi == 0 && yi == 0))
        if(!((x == 0 && xi < 0) || (x == dimention - 1 && xi > 0)))
          if(!((y == 0 && yi < 0) || (y == dimention - 1 && yi > 0))) 
            (neighbors += gen[x+xi][y+yi]);

  // if (neighbors >= 0 && neighbors <= 1) return 0;
  // if (neighbors >= 3 && neighbors <= 3) return 1;
  // if (neighbors >= 4 && neighbors <= 8) return 0;
// return neighbors;
var u = 110;         // 110   100  90
var o = 220;        // 220   200 179
if (neighbors < u) return 0;
if (neighbors >= u && neighbors <= o) return 1;
if (neighbors < o) return 0;

  // if (cell == 1 && neighbors < u)
  //   return 0;
  // if (cell == 1 && (neighbors >= u && neighbors < o))
  //   return 1;
  // if (cell == 1 && neighbors > o)
  //   return 0;
  // if (cell == 0 && neighbors > o)
  //   return 1;

  // if (gen[x][y] ==)
  //   this.color(1, 1, 1);
  // else 
  //   this.color(0, 0, 0);
  return 0;
})
// .setGraphical(true)
.setOutput([dimention, dimention]);

var render = gpu.createKernel(function(gen, dimention) {
  var [y, x] = [this.thread.x, this.thread.y];

  if (gen[x][y] == 1)
    this.color(1, 1, 1);
  else 
    this.color(0, 0, 0);
})
.setGraphical(true)
.setOutput([dimention, dimention]);

function render2() {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'white';
  for (var x = 0; x < dimention; x++)
    for (var y = 0; y < dimention; y++)
      if (generation[x][y] == 1)
        ctx.fillRect(x*Sw, y*Sh, Sw-0.1, Sh-0.1);
}


var generation = Array(dimention).fill().map(() => Array(dimention).fill().map(e => Math.round(Math.random())));
// var generation = Array(dimention).fill().map(() => Array(dimention).fill(0));
// generation[15][2] = 1;
// generation[14][2] = 1;
// generation[13][2] = 1;

// generation[1][2] = 1;
// generation[2][3] = 1;
// generation[3][1] = 1;
// generation[3][2] = 1;
// generation[3][3] = 1;

// console.log(generation, generation.map((r, x) => r.map((e, y) => {
//   var n = 0;
//   for (var xi = -1; xi <= 1; xi++) {
//     for (var yi = -1; yi <= 1; yi++) {
//       // console.log(x, y, xi, yi, ((x == 0 && xi == -1) || (x == generation.length - 1 && xi == 1)));
//       !(xi == 0 && yi == 0) && !((x == 0 && xi == -1) || (x == generation.length - 1 && xi == 1)) && !((y == 0 && yi == -1) || (y == generation[x].length - 1 && yi == 1)) && (n += generation[x+xi][y+yi]);
//     }
//   }
//   return n;
// })));
// console.log(generation);
// console.log(nextGeneration(generation, dimention));

var lastLoop = new Date();
var fpsDisplay = document.getElementById('fps');
var fps = 0;
var frameCount = 0;
var lastSecond = new Date();

function run() {
  // render2();
  generation = nextGeneration(generation, dimention); 
  render(generation, dimention);
  render.canvas.style.height = '930px';
  render.canvas.style.width = '930px';
  document.getElementById('canvasContainer').appendChild(render.canvas);
}

// setInterval(() => {
//   run()
// }, 500);

requestAnimationFrame(run2)

function run2() {
  run();

  var thisLoop = new Date();
  var elapsed = thisLoop - lastLoop;
  lastLoop = thisLoop;
  
  fps = Math.round(1000 / elapsed);
  frameCount++;

  if (thisLoop - lastSecond >= 200) {
    fpsDisplay.textContent = fps + ', . S: ' + 1/fps;
    frameCount = 0;
    lastSecond = thisLoop;
  }

  requestAnimationFrame(run2);
}

//g.map((r, x) => r.map((e, y) => { var n = 0; for(var xi = -1; xi <= 1; xi++){ for (var yi = -1; yi <= 1; yi++) { console.log(x, y, xi, yi, (x == 0 && xi == -1), n); if ((x == 0 && xi == -1) || (x == g.length-1 && xi == 1) || (y == 0 && yi == -1) || (y == g[x].length-1 && yi == 1)) { n += 0 } else { n += g[x+xi][y+yi] } } return n }}))g.map((r, x) => r.map((e, y) => { var n = 0; for(var xi = -1; xi <= 1; xi++){ for (var yi = -1; yi <= 1; yi++) { console.log(x, y, xi, yi, (x == 0 && xi == -1), n); if ((x == 0 && xi == -1) || (x == g.length-1 && xi == 1) || (y == 0 && yi == -1) || (y == g[x].length-1 && yi == 1)) { n += 0 } else { n += g[x+xi][y+yi] } } return n }}))