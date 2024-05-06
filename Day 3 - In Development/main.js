'use strict';

var Demo;

function Init() {
  var canvas = document.getElementById('canvas');
  var gl = canvas.getContext('webgl');
  if (!gl) {
    console.log('Failed to load WebGl, trying to load experimental context');
    gl = canvas.getContext('experimental-webgl');
  }
  if (!gl) {
    console.log('Failed to load WebGl');
    return;
  }

  Demo = new LightMapDemoScene(gl);
  Demo.Load(function (demoLoadError) {
    if (demoLoadError) {
      alert('could not load demo')
      console.log(demoLoadError);
    } else {
      Demo.Begin();
    }
  })
}