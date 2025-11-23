"use strict";

console.log("[Renderer] Загрузка");

const Renderer = (function () {
    let gl = null;
    let canvas = null;

    let program = null;

    let aPos, aColor, aUV;
    let uProj, uView, uDiffuseTex, uUseTex, uTexScale;

    let vboPos = null;
    let vboColor = null;
    let vboUV = null;

    let vertexCountFloor = 0;
    let vertexCountTotal = 0;

    let floorTexture = null;
    let floorReady = false;

    function init(canvasId) {
        canvas = document.getElementById(canvasId);
        if (!canvas) { console.error("[Renderer] Canvas не найден"); return; }

        gl = canvas.getContext("webgl2", { antialias: true });
        if (!gl) { console.error("[Renderer] WebGL2 не поддерживается"); return; }

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // ❌ отключаем отбрасывание задних граней
        gl.disable(gl.CULL_FACE);

        const vsSrc = `#version 300 es
        precision highp float;
        in vec3 a_pos;
        in vec3 a_color;
        in vec2 a_texcoord;
        uniform mat4 u_proj;
        uniform mat4 u_view;
        out vec3 v_color;
        out vec2 v_uv;
        void main() {
            v_color = a_color;
            v_uv = a_texcoord;
            gl_Position = u_proj * u_view * vec4(a_pos, 1.0);
        }`;

        const fsSrc = `#version 300 es
        precision highp float;
        in vec3 v_color;
        in vec2 v_uv;
        uniform sampler2D u_diffuseTex;
        uniform int u_useTexture;
        uniform vec2 u_texScale;
        out vec4 outColor;
        void main() {
            vec3 base = (u_useTexture == 1)
                ? texture(u_diffuseTex, v_uv * u_texScale).rgb
                : v_color;
            outColor = vec4(base, 1.0);
        }`;

        program = _createProgram(gl, vsSrc, fsSrc);
        if (!program) { console.error("[Renderer] Программа не создана"); return; }

        aPos   = gl.getAttribLocation(program, "a_pos");
        aColor = gl.getAttribLocation(program, "a_color");
        aUV    = gl.getAttribLocation(program, "a_texcoord");

        uProj      = gl.getUniformLocation(program, "u_proj");
        uView      = gl.getUniformLocation(program, "u_view");
        uDiffuseTex= gl.getUniformLocation(program, "u_diffuseTex");
        uUseTex    = gl.getUniformLocation(program, "u_useTexture");
        uTexScale  = gl.getUniformLocation(program, "u_texScale");

        resize();
        console.log("[Renderer] Init: OK");
    }

    function _compile(gl, type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error("[Renderer] Shader ERROR:", gl.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    }

    function _createProgram(gl, vsSrc, fsSrc) {
        const vs = _compile(gl, gl.VERTEX_SHADER, vsSrc);
        const fs = _compile(gl, gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;
        const pr = gl.createProgram();
        gl.attachShader(pr, vs);
        gl.attachShader(pr, fs);
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
            console.error("[Renderer] Program LINK ERROR:", gl.getProgramInfoLog(pr));
            return null;
        }
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return pr;
    }

    function setGeometry(verts, cols, norms, uvs) {
        try {
            const posA = new Float32Array(verts);
            const colA = new Float32Array(cols);
            const uvA  = new Float32Array(uvs);

            vertexCountTotal = posA.length / 3;
            vertexCountFloor = 6;

            vboPos = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vboPos);
            gl.bufferData(gl.ARRAY_BUFFER, posA, gl.STATIC_DRAW);

            vboColor = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vboColor);
            gl.bufferData(gl.ARRAY_BUFFER, colA, gl.STATIC_DRAW);

            vboUV = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vboUV);
            gl.bufferData(gl.ARRAY_BUFFER, uvA, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            console.log("[Renderer] Геометрия: OK");
        } catch (err) {
            console.error("[Renderer] setGeometry ERROR:", err);
        }
    }

    function setFloorTexture(tex) {
        floorTexture = tex;
        floorReady = !!tex;
        console.log("[Renderer] Текстура пола:", floorReady ? "OK" : "нет");
    }

    function render(params) {
        if (!vboPos) return;
        const v = params && params.viewMatrix;
        const p = params && params.projMatrix;
        if (!v || !p) return;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.45,0.55,0.65,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniformMatrix4fv(uProj, false, p);
        gl.uniformMatrix4fv(uView, false, v);

        gl.bindBuffer(gl.ARRAY_BUFFER, vboPos);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vboColor);
        gl.enableVertexAttribArray(aColor);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vboUV);
        gl.enableVertexAttribArray(aUV);
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

        if (floorReady) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, floorTexture);
            gl.uniform1i(uDiffuseTex, 0);
            gl.uniform1i(uUseTex, 1);
            gl.uniform2f(uTexScale, 1, 1);
        } else {
            gl.uniform1i(uUseTex, 0);
        }

        gl.drawArrays(gl.TRIANGLES, 0, vertexCountFloor);

        gl.uniform1i(uUseTex, 0);
        gl.drawArrays(gl.TRIANGLES, vertexCountFloor, vertexCountTotal - vertexCountFloor);
    }

    function resize() {
        if (!canvas) return;
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        canvas.width  = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }

    return {
        init,
        setGeometry,
        setFloorTexture,
        render,
        resize
    };
})();
