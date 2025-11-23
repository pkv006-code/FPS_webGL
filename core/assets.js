"use strict";

console.log("[Assets] Загрузка");

const Assets = (function () {

    let gl = null;

    // путь к текстуре пола
    let floorTexturePath = null;

    // WebGL-текстура
    let floorTexture = null;

    // ============================================================
    // INIT
    // ============================================================
    function init(glContext) {
        gl = glContext;
        if (!gl) {
            console.error("[Assets] Init ERROR: контекст не получен");
            return;
        }
        console.log("[Assets] Init: OK");
    }

    // ============================================================
    // SET FLOOR TEXTURE PATH
    // ============================================================
    function setFloorTexturePath(path) {
        floorTexturePath = path;
        console.log("[Assets] Путь к текстуре пола:", path);
    }

    function getFloorTexturePath() {
        return floorTexturePath;
    }

    // ============================================================
    // LOAD FLOOR TEXTURE
    // ============================================================
    function loadFloorTexture(onDone) {
        if (!gl) {
            console.error("[Assets] loadFloorTexture ERROR: gl == null");
            if (onDone) onDone(null);
            return;
        }
        if (!floorTexturePath) {
            console.error("[Assets] loadFloorTexture ERROR: путь пустой");
            if (onDone) onDone(null);
            return;
        }

        const tex = gl.createTexture();
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.texImage2D(gl.TEXTURE_2D, 0,
                gl.RGBA, gl.RGBA,
                gl.UNSIGNED_BYTE, img);

            // Проверка на power-of-two
            function isPowerOf2(value) {
                return (value & (value - 1)) === 0;
            }

            if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.bindTexture(gl.TEXTURE_2D, null);

            floorTexture = tex;
            console.log("[Assets] Текстура пола: OK");

            if (onDone) onDone(tex);
        };

        img.onerror = function () {
            console.error("[Assets] Ошибка загрузки файла:", floorTexturePath);
            if (onDone) onDone(null);
        };

        img.src = floorTexturePath;
    }

    // ============================================================
    // PUBLIC GETTER
    // ============================================================
    function getFloorTexture() {
        return floorTexture;
    }

    // ============================================================
    // EXPORT
    // ============================================================
    return {
        init,
        setFloorTexturePath,
        getFloorTexturePath,
        loadFloorTexture,
        getFloorTexture
    };

})();
