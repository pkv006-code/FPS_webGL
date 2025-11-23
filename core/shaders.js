"use strict";

console.log("[Shaders] Загрузка");

const ShaderLighting = (function () {

    function compile(gl, type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error("[Shaders] Компиляция ERROR:", gl.getShaderInfoLog(sh));
            console.log("=== SOURCE BEGIN ===\n" + src + "\n=== SOURCE END ===");
            gl.deleteShader(sh);
            return null;
        }
        return sh;
    }

    function createProgram(gl, vsSrc, fsSrc) {
        const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;

        const pr = gl.createProgram();
        gl.attachShader(pr, vs);
        gl.attachShader(pr, fs);
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
            console.error("[Shaders] Линковка ERROR:", gl.getProgramInfoLog(pr));
            gl.deleteProgram(pr);
            return null;
        }

        gl.deleteShader(vs);
        gl.deleteShader(fs);
        return pr;
    }

    function createMainProgram(gl) {
        const vsSrc = `#version 300 es
        precision highp float;
        in vec3 a_pos;
        in vec3 a_color;
        in vec3 a_normal;
        in vec2 a_texcoord;
        uniform mat4 u_proj;
        uniform mat4 u_view;
        uniform mat4 u_lightProj;
        uniform mat4 u_lightView;
        out vec3 v_color;
        out vec3 v_normal;
        out vec3 v_pos;
        out vec2 v_uv;
        out vec4 v_shadowCoord;
        void main() {
            vec4 worldPos = vec4(a_pos, 1.0);
            v_color = a_color;
            v_normal = a_normal;
            v_pos = worldPos.xyz;
            v_uv = a_texcoord;
            v_shadowCoord = u_lightProj * u_lightView * worldPos;
            gl_Position = u_proj * u_view * worldPos;
        }`;

        const fsSrc = `#version 300 es
        precision highp float;
        in vec3 v_color;
        in vec3 v_normal;
        in vec3 v_pos;
        in vec2 v_uv;
        in vec4 v_shadowCoord;
        uniform vec3 u_lightDir;
        uniform vec3 u_lightColor;
        uniform vec3 u_ambientColor;
        uniform sampler2D u_shadowMap;
        uniform sampler2D u_diffuseTex;
        uniform int      u_useTexture;
        uniform vec2     u_texScale;
        out vec4 outColor;
        float shadowCalc() {
            vec3 proj = v_shadowCoord.xyz / v_shadowCoord.w;
            proj = proj * 0.5 + 0.5;
            if (proj.x < 0.0 || proj.x > 1.0 || proj.y < 0.0 || proj.y > 1.0 || proj.z > 1.0) return 0.0;
            float closest = texture(u_shadowMap, proj.xy).r;
            float curr = proj.z;
            float bias = 0.003;
            return (curr - bias > closest) ? 1.0 : 0.0;
        }
        void main() {
            vec3 N = normalize(v_normal);
            vec3 L = normalize(-u_lightDir);
            float diff = max(dot(N, L), 0.0);
            float shadow = shadowCalc();
            vec3 base = v_color;
            if (u_useTexture == 1) {
                base = texture(u_diffuseTex, v_uv * u_texScale).rgb;
            }
            vec3 light = u_ambientColor + (1.0 - shadow) * diff * u_lightColor;
            vec3 finalColor = base * light;
            outColor = vec4(finalColor, 1.0);
        }`;

        const pr = createProgram(gl, vsSrc, fsSrc);
        if (!pr) { console.error("[Shaders] MainProgram ERROR"); return null; }

        const attribs = {
            pos: gl.getAttribLocation(pr, "a_pos"),
            color: gl.getAttribLocation(pr, "a_color"),
            normal: gl.getAttribLocation(pr, "a_normal"),
            texcoord: gl.getAttribLocation(pr, "a_texcoord")
        };
        const uniforms = {
            proj: gl.getUniformLocation(pr, "u_proj"),
            view: gl.getUniformLocation(pr, "u_view"),
            lightProj: gl.getUniformLocation(pr, "u_lightProj"),
            lightView: gl.getUniformLocation(pr, "u_lightView"),
            lightDir: gl.getUniformLocation(pr, "u_lightDir"),
            lightColor: gl.getUniformLocation(pr, "u_lightColor"),
            ambientColor: gl.getUniformLocation(pr, "u_ambientColor"),
            shadowMap: gl.getUniformLocation(pr, "u_shadowMap"),
            diffuseTex: gl.getUniformLocation(pr, "u_diffuseTex"),
            useTexture: gl.getUniformLocation(pr, "u_useTexture"),
            texScale: gl.getUniformLocation(pr, "u_texScale")
        };

        console.log("[Shaders] Main: OK");
        return { program: pr, attribs, uniforms };
    }

    function createDepthProgram(gl) {
        const vsSrc = `#version 300 es
        precision highp float;
        in vec3 a_pos;
        uniform mat4 u_lightProj;
        uniform mat4 u_lightView;
        void main() {
            gl_Position = u_lightProj * u_lightView * vec4(a_pos, 1.0);
        }`;

        const fsSrc = `#version 300 es
        precision highp float;
        void main() { }
        `;

        const pr = createProgram(gl, vsSrc, fsSrc);
        if (!pr) { console.error("[Shaders] DepthProgram ERROR"); return null; }

        const attribs = { pos: gl.getAttribLocation(pr, "a_pos") };
        const uniforms = {
            lightProj: gl.getUniformLocation(pr, "u_lightProj"),
            lightView: gl.getUniformLocation(pr, "u_lightView")
        };

        console.log("[Shaders] Depth: OK");
        return { program: pr, attribs, uniforms };
    }

    function getLighting() {
        let dir = [0.45, -1.0, 0.35];
        const L = Math.hypot(dir[0], dir[1], dir[2]) || 1.0;
        dir = [dir[0] / L, dir[1] / L, dir[2] / L];
        return {
            lightDir: dir,
            lightColor: [1.0, 1.0, 1.0],
            ambientColor: [0.22, 0.24, 0.28]
        };
    }

    return {
        createMainProgram,
        createDepthProgram,
        getLighting
    };
})();
