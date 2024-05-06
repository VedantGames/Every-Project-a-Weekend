class Scene {
  spheres = [];
  lights = [];

  constructor() {

  }

  sphere(pos, r, c, roughness, specular) {
    this.spheres.push(new Sphere(pos, r, c, roughness, specular));
  }
  light(type, i) {
    this.lights.push(new Light(type, i, 0));
  }
  
    light(type, i, pos) {
      this.lights.push(new Light(type, i, pos));
    }
}