var gpu = new GPU.GPU();


// var scene = new Scene();


function sub(a, b) {return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]};
function dotP(a, b) {return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2])};
function lengthG(a) {return Math.sqrt((a[0] * a[0]) + (a[1] * a[1]) + (a[2] * a[2]))};
function reflectRay(R, N) {return [2*N[0]*dotP(N, R)-R[0], 2*N[1]*dotP(N, R)-R[1], 2*N[2]*dotP(N, R)-R[2]]};

function canvasToViewport(x, y, Cw, Ch, Vw, Vh, d) {
  return [x*Vw/Cw, y*Vh/Ch, d];
}

function intersectRaySphere(O, D, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI) {
  let r = sphereRadius;
  let C0 = sub(O, spherePos);

  let a = dotP(D, D);
  let b = 2 * dotP(C0, D);
  let c = dotP(C0, C0) - r*r;

  let dis = b*b - 4*a*c;
  if (dis < 0) {
    return [0, 0];
  }
  
  let t1 = (-b + Math.sqrt(dis)) / (2*a);
  let t2 = (-b - Math.sqrt(dis)) / (2*a);

  return [t1, t2];
}

function computeLight(P, N, V, s, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI) {
  let i = 0;
  // let L;
  // scene.lights.map(light => {
  //   let tMax;
  //   if (light.type == 'ambient') {
  //     i += light.i;
  //   } else {
  //     if (light.type == 'point') {
        var L = sub(lightPos, P)
        var tMax = 1;
  //     } else {
  //       L = light.pos;
  //       tMax = 99999999999;
  //     }

      // let [shadowSphere, shadowT] = closestIntersection(P, L, 0.001, tMax);
      // if (shadowSphere != 0) {
      //   return 0;
      // }

      let nDotL = dotP(N, L);
      if (nDotL > 0) {
        i += lightI * nDotL/(lengthG(N) * lengthG(L));
      }
      if (s != -1) {
        let R = [2*N[0]*dotP(N, L)-L[0], 2*N[1]*dotP(N, L)-L[1], 2*N[2]*dotP(N, L)-L[2]];//reflectRay(L, N);
        let rDotV = dotP(R, V);
        if (rDotV > 0) {
          i += lightI * ((rDotV / (lengthG(R) * lengthG(V))) ** s);
        }
      }
  //   }
  // })
  return i;
}

function closestIntersection(O, D, tMin, tMax, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI) {
  let closestT = tMax;
  let closestSphere = 0;
  // scene.spheres.map(function(sphere, i) {
    let [t1, t2] = intersectRaySphere(O, D, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI);
    if ((t1 >= tMin && t1 <= tMax) && t1 < closestT) {
      closestT = t1;
      closestSphere = 1;
    }
    if ((t2 >= tMin && t2 <= tMax) && t2 < closestT) {
      closestT = t2;
      closestSphere = 1;
    }
  // })
  // var a = scene;
  return [closestSphere, closestT];
}

function traceRay(O, D, min, max, recursionDepth, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI) {
  let [closestSphere, closestT] = closestIntersection(O, D, min, max, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI);
  if (closestSphere == 0) {
    return [0, 0, 0];
  }
  
  let P = [O[0] + closestT * D[0], O[1] + closestT * D[1], O[2] + closestT * D[2]];
  let N = sub(P, spherePos);
  let Nl = lengthG(N);
  N = [N[0] / Nl, N[1] / Nl, N[2] / Nl];
  let c = sphereCol;
  let l = computeLight(P, N, [-D[0], -D[1], -D[2]], sphereSpec, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI);
  let localColor = [c[0] * l, c[1] * l, c[2] * l];
  return localColor;
  let r = sphereRough;
  if (recursionDepth <= 0 || r <= 0) {
    return localColor;
  }

  let R = reflectRay([-D[0], -D[1], -D[2]], N);
  // let reflectedColor = traceRay(P, R, 0.001, 9999999, recursionDepth - 1);
  // let lTr = [localColor[0] * (1-r), localColor[1] * (1-r), localColor[2] * (1-r)];
  // let rTr = [reflectedColor[0] * r, reflectedColor[1] * r, reflectedColor[2] * r];
  // return [lTr[0] + rTr[0], lTr[1] + rTr[1], lTr[2] + rTr[2]];
  return O;
}

function putPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

var render = gpu.createKernel(function(spX, spY, spZ) {

  var Cw = 1900;
  var Ch = 890;
  
  var Vw = 2.1348;
  var Vh = 1;
  var d = 1;
  var [x, y] = [this.thread.x-Cw/2, this.thread.y-Ch/2];

  var spherePos = [spX, spY, spZ]
  var sphereCol = [1, 0, 0]
  var sphereSpec = 2;
  var sphereRough = 0;
  var sphereRadius = 2;

  var lightPos = [1, 2, 7]
  var lightI = 0.6;
  
  var O = [0, 0, 0];
  var recursionDepth = 0;

  var D =  canvasToViewport(x, y, Cw, Ch, Vw, Vh, d);
  var color = traceRay(O, D, 1, 100000, recursionDepth, spherePos, sphereCol, sphereSpec, sphereRough, sphereRadius, lightPos, lightI);
  this.color(color[0], color[1], color[2]);
  return 0;
})
.setGraphical(true)
.setFunctions([
  canvasToViewport, traceRay, closestIntersection, 
  intersectRaySphere, sub, dotP, lengthG, reflectRay,
  computeLight
])
.setOutput([1900, 890]);
var scene = [[
  [[0, 1, 5], 1, [255, 0, 0], 0.2, 500],
  [[2, 0, 7], 1, [0, 0, 255], 0.3, 500],
  [[-2, 0, 7], 1, [0, 255, 0], 0.4, 100000],
  [[0, 5001, 0], 5000, [255, 255, 0], 0.1, 1000]
],
[
  [0, 0.2],
  [1, 0.6, [1, -5, 10]],
  [2, 0.2, [0, 5, -4]]
]];

var spheres = [
  [[0, 1, 5], 1, [255, 0, 0], 0.2, 500],
  [[2, 0, 7], 1, [0, 0, 255], 0.3, 500],
  [[-2, 0, 7], 1, [0, 255, 0], 0.4, 100000],
  [[0, 5001, 0], 5000, [255, 255, 0], 0.1, 1000]
]
var spherePos = [-7, -1, 10]

requestAnimationFrame(update);

var lastLoop = new Date();
var fpsDisplay = document.getElementById('fps');
var fps = 0;
var frameCount = 0;
var lastSecond = new Date();

var m = [0, 0];
var s = 0.1;

document.getElementsByTagName('body')[0].addEventListener('keydown', e => {
  if (e.key == 'w') m[0] = s;
  if (e.key == 's') m[0] = -s;
  if (e.key == 'a') m[1] = -s;
  if (e.key == 'd') m[1] = s;
})
document.getElementsByTagName('body')[0].addEventListener('keyup', e => {
  if (e.key == 'w' || e.key == 's') m[0] = 0;
  if (e.key == 'd' || e.key == 'a') m[1] = 0;
})

function update() {
  render(spherePos[0], spherePos[1], spherePos[2]);
  spherePos[0] += m[1];
  spherePos[1] += m[0];
  document.getElementsByTagName('body')[0].appendChild(render.canvas);

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


  requestAnimationFrame(update);
}