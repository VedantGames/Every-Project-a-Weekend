var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var lightList = document.getElementById('lightList');
var objList = document.getElementById('objList');

var Cw = canvas.width;
var Ch = canvas.height;

var Vw = 1.26;
var Vh = 1;
var d = 1;

var O = [0, 0, 0];

var scene = new Scene();
scene.sphere([0, 1, 5], 1, [255, 0, 0], 0.2, 500);
scene.sphere([2, 0, 7], 1, [0, 0, 255], 0.3, 500);
scene.sphere([-2, 0, 7], 1, [0, 255, 0], 0.4, 100000);
scene.sphere([0, 5001, 0], 5000, [255, 255, 0], 0.1, 1000);

scene.light('ambient', 0.2);
scene.light('point', 0.6, [1, -5, 10]);
scene.light('directional', 0.2, [0, 5, -4]);

// scene.sphere([-7, -1, 10], 2, [255, 0, 0], 0, 2);

// scene.light('point', 0.6, [1, 5, 7]);

var sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
var dot = (a, b) => (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
var length = a => Math.sqrt((a[0] * a[0]) + (a[1] * a[1]) + (a[2] * a[2]));
var reflectRay = (R, N) => [2*N[0]*dot(N, R)-R[0], 2*N[1]*dot(N, R)-R[1], 2*N[2]*dot(N, R)-R[2]];

function canvasToViewoprt(x, y) {
  return [x*Vw/Cw, y*Vh/Ch, d];
}

function intersectRaySphere(O, D, sphere) {
  let r = sphere.r;
  let C0 = sub(O, sphere.pos);

  let a = dot(D, D);
  let b = 2 * dot(C0, D);
  let c = dot(C0, C0) - r*r;

  let dis = b*b - 4*a*c;
  if (dis < 0) {
    return [null, null];
  }

  let t1 = (-b + Math.sqrt(dis)) / (2*a);
  let t2 = (-b - Math.sqrt(dis)) / (2*a);

  return [t1, t2];
}

function computeLight(P, N, V, s) {
  let i = 0;
  let L;
  scene.lights.map(light => {
    let tMax;
    if (light.type == 'ambient') {
      i += light.i;
    } else {
      if (light.type == 'point') {
        L = sub(light.pos, P)
        tMax = 1;
      } else {
        L = light.pos;
        tMax = 99999999999;
      }

      let [shadowSphere, shadowT] = closestIntersection(P, L, 0.001, tMax);
      if (shadowSphere!= null) {
        return;
      }

      let nDotL = dot(N, L);
      if (nDotL > 0) {
        i += light.i * nDotL/(length(N) * length(L));
      }

      if (s != -1) {
        let R = reflectRay(L, N);
        let rDotV = dot(R, V);
        if (rDotV > 0) {
          i += light.i * Math.pow(rDotV / (length(R) * length(V)), s);
        }
      }
    }
  })
  return i;
}

function closestIntersection(O, D, tMin, tMax) {
  let closestT = tMax;
  let closestSphere = null;
  scene.spheres.map(sphere => {
    let [t1, t2] = intersectRaySphere(O, D, sphere);
    if ((t1 >= tMin && t1 <= tMax) && t1 < closestT) {
      closestT = t1;
      closestSphere = sphere;
    }
    if ((t2 >= tMin && t2 <= tMax) && t2 < closestT) {
      closestT = t2;
      closestSphere = sphere;
    }
  })
  return [closestSphere, closestT];
}

function traceRay(O, D, min, max, recursionDepth) {
  let [closestSphere, closestT] = closestIntersection(O, D, min, max);
  if (closestSphere == null) {
    return [0, 0, 0];
  }

  let P = [O[0] + closestT * D[0], O[1] + closestT * D[1], O[2] + closestT * D[2]];
  let N = sub(P, closestSphere.pos);
  let Nl = length(N);
  N = [N[0] / Nl, N[1] / Nl, N[2] / Nl];
  let c = closestSphere.color;
  let l = computeLight(P, N, [-D[0], -D[1], -D[2]], closestSphere.specular);
  let localColor = [c[0] * l, c[1] * l, c[2] * l];
  // return localColor;
  let r = closestSphere.roughness;
  if (recursionDepth <= 0 || r <= 0) {
    return localColor;
  }

  let R = reflectRay([-D[0], -D[1], -D[2]], N);
  let reflectedColor = traceRay(P, R, 0.001, 9999999, recursionDepth - 1);
  let lTr = [localColor[0] * (1-r), localColor[1] * (1-r), localColor[2] * (1-r)];
  let rTr = [reflectedColor[0] * r, reflectedColor[1] * r, reflectedColor[2] * r];
  return [lTr[0] + rTr[0], lTr[1] + rTr[1], lTr[2] + rTr[2]];
}

function putPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

// console.log();

let recursionDepth = 10;

window.requestAnimationFrame(render);

var lastLoop = new Date();
var fpsDisplay = document.getElementById('fps');
var fps = 0;
var frameCount = 0;
var lastSecond = new Date();

document.getElementById("list").addEventListener("mousedown", () => {
  list();
  console.log("sadf");
})

function list() {
  let l;
  let m
  let h1;
  let del;
  lightList.innerHTML = "";
  objList.innerHTML = "";
  scene.lights.map((light, i) => {
    m = document.createElement('div');
    m.style = "display: flex; justify-content: space-between;"
    l = document.createElement('div');
    l.style = "display: flex";
    h1 = document.createElement('h1');
    h1.style = "font-size: 1.5rem; color: #bfbfbf;";
    h1.textContent = light.type + ": " + (light.type !== "ambient" ? "Pos:  " + light.pos + "," : "") + " I: " + light.i;
    l.appendChild(h1);
    del = document.createElement('button');
    del.textContent = "X";
    del.style = "background-color: transparent; border: none; color: tomato; padding-right: 3rem;";
    del.onclick = () => {
      scene.lights.filter(lightDel => lightDel != scene.lights[i])
      console.log(scene.lights, i, scene.lights[i]);
    };
    m.appendChild(l);
    m.appendChild(del);
    lightList.appendChild(m);
  })
  scene.spheres.map(sphere => {
    m = document.createElement('div');
    m.style = "display: flex; justify-content: space-between;"
    l = document.createElement('div');
    l.style = "display: flex";
    h1 = document.createElement('h1');
    h1.textContent = "Sphere : Pos: " + sphere.pos + ", R: " + sphere.r;
    h1.style = "font-size: 1.5rem; color: #bfbfbf;";
    l.appendChild(h1);
    del = document.createElement('button');
    del.textContent = "X";
    del.style = "background-color: transparent; border: none; color: tomato; padding-right: 3rem;";
    // del.onclick = 
    m.appendChild(l);
    m.appendChild(del);
    objList.appendChild(m);
  })
}

function render() {
  list();
  // let pos = scene.spheres[0].pos;
  // scene.spheres[0].pos = [pos[0]+2, pos[1], pos[2]];
  for (let x = -(Cw/2); x < Cw/2; x++) {
    for (let y = -Ch/2; y < Ch/2; y++) {
      let D = canvasToViewoprt(x, y);
      let color = traceRay(O, D, 1, 100000, recursionDepth);
      let colorF = 'rgb('+color[0]+','+color[1]+','+color[2]+')';
      putPixel(x+Cw/2, y+Ch/2, colorF);
    }
  }
  let pos = scene.lights[1].pos
  scene.lights[1].pos = [pos[0], pos[1], pos[2]-2];
  // scene.spheres[0].pos[0] += 0.05;

  var thisLoop = new Date();
  var elapsed = thisLoop - lastLoop;
  lastLoop = thisLoop;
  
  fps = 1000 / elapsed;
  frameCount++;

  if (thisLoop - lastSecond >= 200) {
    fpsDisplay.textContent = fps + ', . S:' + 1 / fps;
    frameCount = 0;
    lastSecond = thisLoop;
  }

  window.requestAnimationFrame(render);
}