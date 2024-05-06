'use strict;'
// const { vec4 } = require("gl-matrix/gl-matrix");



var LightMapDemoScene = function (gl) {
  this.gl = gl;
};

LightMapDemoScene.prototype.Load = function (cb) {
  console.log('Loading demo scene...');

  var me = this;

  async.parallel({
    Models: function (callback) {
      async.map({
        RoomModel: 'Room.json'
      }, LoadJSONResource, callback);
    },
    ShaderCode: function (callback) {
      async.map({
        'NoShadow_VSText': 'shaders/NoShadow.vs.glsl',
        'NoShadow_FSText': 'shaders/NoShadow.fs.glsl'
      }, LoadTextResource, callback);
    }
  }, function (LoadErrors, loadResults) {
    if (LoadErrors){
      cb(LoadErrors);
      return;
    }


    for (var i = 0; i < loadResults.Models[0].meshes.length; i++) {
			var mesh = loadResults.Models[0].meshes[i];
			switch (mesh.name) {
				case 'MonkeyMesh':
					me.MonkeyMesh = new Model(
						me.gl,
						mesh.vertices,
						[].concat.apply([], mesh.faces),
						mesh.normals,
						vec4.fromValues(0.8, 0.8, 1.0, 1.0)
					);
					mat4.rotate(
						me.MonkeyMesh.world, me.MonkeyMesh.world,
						glMatrix.toRadian(94.87),
						vec3.fromValues(0, 0, -1)
					);
					mat4.translate(
						me.MonkeyMesh.world, me.MonkeyMesh.world,
						vec4.fromValues(2.07919, -0.98559, 1.75740)
					);
					break;
				case 'TableMesh':
					me.TableMesh = new Model(
						me.gl, mesh.vertices, [].concat.apply([], mesh.faces),
						mesh.normals, vec4.fromValues(1, 0, 1, 1)
					);
					mat4.translate(
						me.TableMesh.world, me.TableMesh.world,
						vec3.fromValues(1.57116, -0.79374, 0.49672)
					);
					break;
				case 'SofaMesh':
					me.SofaMesh = new Model(
						me.gl, mesh.vertices, [].concat.apply([], mesh.faces),
						mesh.normals, vec4.fromValues(0, 1, 1, 1)	
					);
					mat4.translate(
						me.SofaMesh.world, me.SofaMesh.world,
						vec3.fromValues(-3.28768, 0, 0.78448)
					);
					break;
				case 'LightBulbMesh':
					me.lightPosition = vec3.fromValues(0, 0.0, 2.58971);
					me.LightMesh = new Model(
						me.gl, mesh.vertices, [].concat.apply([], mesh.faces),
						mesh.normals, vec4.fromValues(4, 4, 4, 1)
					);
					mat4.translate(me.LightMesh.world, me.LightMesh.world,
						me.lightPosition
					);
					break;
				case 'WallsMesh':
					me.WallsMesh = new Model(
						me.gl, mesh.vertices, [].concat.apply([], mesh.faces),
						mesh.normals, vec4.fromValues(0.3, 0.3, 0.3, 1)
					);
					break;
			}
		}

		if (!me.MonkeyMesh) {
			cb('Failed to load monkey mesh'); return;
		}
		if (!me.TableMesh) {
			cb('Failed to load table mesh'); return;
		}
		if (!me.SofaMesh) {
			cb('Failed to load sofa mesh'); return;
		}
		if (!me.LightMesh) {
			cb('Failed to load light mesh'); return;
		}
		if (!me.WallsMesh) {
			cb('Failed to load walls mesh'); return;
		}
		me.Meshes = [
			me.MonkeyMesh,
			me.TableMesh,
			me.SofaMesh,
			me.LightMesh,
			me.WallsMesh
		];
    
    me.NoShadowProgram = CreateShaderProgram(
      me.gl, loadResults.ShaderCode[0],
      loadResults.ShaderCode[1]
    );
    if (me.NoShadowProgram.error) {
      cb(me.NoShadowProgram.error);
      return;
    }

    me.NoShadowProgram.uniforms = {
      mProj: me.gl.getUniformLocation(me.NoShadowProgram, 'mProj'),
      mView: me.gl.getUniformLocation(me.NoShadowProgram, 'mView'),
      mWorld: me.gl.getUniformLocation(me.NoShadowProgram, 'mWorld'),
      pointLightPosition: me.gl.getUniformLocation(me.NoShadowProgram, 'pointLightPosition'),
      meshColor: me.gl.getUniformLocation(me.NoShadowProgram, 'meshColor') 
    };
    me.NoShadowProgram.attribs = {
      vPos: me.gl.getAttribLocation(me.NoShadowProgram, 'vPos'),
      vNorm: me.gl.getAttribLocation(me.NoShadowProgram, 'vNorm'),
    };

    me.camera = new Camera(
      vec3.fromValues(0, 0, 1.85),
      vec3.fromValues(-0.3, -1, 1.85),
      vec3.fromValues(0, 0, 1)
    );

    me.projMatrix = mat4.create();
    me.viewMatrix = mat4.create();
    mat4.perspective(
      me.projMatrix,
      glMatrix.toRadian(90),
      me.gl.canvas.width / me.gl.canvas.height,
      0.35, 
      85.0
    );
    cb();
  });
};

LightMapDemoScene.prototype.Unload = function () {
  this.LightMesh = null;
  this.MonkeyMesh = null;
  this.TableMesh = null;
  this.SofaMesh = null;
  this.WallsMesh = null;

  this.NoShadowProgram = null;

  this.camera = null;
  this.lightPosition = null;

  this.Meshes = null;
};

LightMapDemoScene.prototype.Begin = function () {
  console.log("Begining Demo Scene");

  var me = this;

  var previousFrame = performance.now();
  var dt = 0;
  var loop = function (currentFrameTime) {
    dt = currentFrameTime - previousFrame;
    me._Update(dt);
    previousFrame = currentFrameTime;

    me._Render();
    // me.nextFrameHandle = requestAnimationFrame(loop);
  };
  me.nextFrameHandle = requestAnimationFrame(loop);
};

LightMapDemoScene.prototype.End = function () {
  if (me.nextFrameHandle)
    cancelAnimationFrame(me.nextFrameHandle);
};

LightMapDemoScene.prototype._Update = function (dt) {
  mat4.rotateZ(
    this.MonkeyMesh.world, this.MonkeyMesh.world,
    dt / 1000 * 2 * Math.PI * 0.3
  );

  this.camera.GetViewMatrix(this.viewMatrix);
};

LightMapDemoScene.prototype._Render = function () {
  var gl = this.gl;

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

  console.log(this.NoShadowProgram);
  console.log(this.projMatrix);
  console.log(this.viewMatrix);
  gl.useProgram(this.NoShadowProgram);
  gl.uniformMatrix4fv(this.NoShadowProgram.uniforms.mProj, gl.FALSE, this.projMatrix);
  gl.uniformMatrix4fv(this.NoShadowProgram.uniforms.mView, gl.FALSE, this.viewMatrix);
  gl.uniform3fv(this.NoShadowProgram.uniforms.pointLightPosition, this.lightPosition);
  console.log(gl.getError());
  for (var i = 0; i < this.Meshes.length; i++) {
    console.log(this.Meshes[i])
    gl.uniformMatrix4fv(
      this.NoShadowProgram.uniforms.mWorld, 
      gl.FALSE,
      this.Meshes[i].world
    );
    gl.uniform4fv(
      this.NoShadowProgram.uniforms.meshColo,
      this.Meshes[i].color
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, this.Meshes[i].vbo);
    gl.vertexAttribPointer(
      this.NoShadowProgram.attribs.vPos,
      3, gl.FLOAT, gl.FALSE,
      0, 0
    );
    gl.enableVertexAttribArray(this.NoShadowProgram.attribs.vPos);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.Meshes[i].nbo);
    gl.vertexAttribPointer(
      this.NoShadowProgram.attribs.vNorm,
      3, gl.FLOAT, gl.FALSE,
      0, 0
    );
    gl.enableVertexAttribArray(this.NoShadowProgram.attribs.vNorm)

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.Meshes[i].ibo);
    gl.drawElements(gl.TRIANGLES, this.Meshes[i].nPoints, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
};

