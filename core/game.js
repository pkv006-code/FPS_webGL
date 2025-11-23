'use strict';

console.log('[Game] Загрузка');

let lastTimestamp = 0;
let fpsSmoother = 0;

let projMatrix = Math3D.createMat4();
let viewMatrix = Math3D.createMat4();

function initGame() {
    try {
        const glcanvas  = document.getElementById('glcanvas');
        const hudcanvas = document.getElementById('hudcanvas');
        if (!glcanvas || !hudcanvas) {
            console.error('[Game] Canvas не найден');
            return;
        }

        glcanvas.width  = window.innerWidth;
        glcanvas.height = window.innerHeight;
        hudcanvas.width = window.innerWidth;
        hudcanvas.height = window.innerHeight;

        Renderer.init('glcanvas');
        console.log('[Game] Renderer: OK');

        const gl = glcanvas.getContext('webgl2');
        if (!gl) {
            console.error('[Game] WebGL2 контекст не получен');
            return;
        }

        Assets.init(gl);
        console.log('[Game] Assets: OK');

        Input.init('glcanvas');
        console.log('[Game] Input: OK');

        const activeMap = MapRegistry.getActive();
        if (!activeMap) {
            console.error('[Game] Активная карта не найдена');
            return;
        }

        let verts = [], cols = [], norms = [], uvs = [];
        const mapData = activeMap.build(verts, cols, norms, uvs);

        Renderer.setGeometry(verts, cols, norms, uvs);
        console.log('[Game] Геометрия загружена:', verts.length / 3, 'вершин');

        Physics.init({
            gravity: -9.81,
            maxStepHeight: 0.0, // фикс: отключаем step-up
            cellSize: 4.0,
            player: { radius: 0.35, height: 1.75 }
        });
        Physics.setColliders(mapData.colliders || []);

        const spawn = mapData.playerStart || { x: 0, y: 1.8, z: 0, yaw: 0, pitch: 0 };
        Player.init(spawn);
        console.log('[Game] Player: OK');

        Hud.init();
        console.log('[Game] Hud: OK');

        window.addEventListener('resize', () => {
            Renderer.resize();
            Hud.resize();
            updateProjection();
        });
        Renderer.resize();
        Hud.resize();

        updateProjection();

        const startLoop = () => {
            lastTimestamp = performance.now();
            requestAnimationFrame(mainLoop);
            console.log('[Game] Main loop: START');
        };

        if (activeMap.floorTexture) {
            Assets.setFloorTexturePath(activeMap.floorTexture);
            Assets.loadFloorTexture(function(tex) {
                if (tex) {
                    Renderer.setFloorTexture(tex);
                    console.log('[Game] Текстура пола: OK');
                } else {
                    console.warn('[Game] Текстура пола не загружена');
                }
                startLoop();
            });
        } else {
            startLoop();
        }

    } catch (err) {
        console.error('[Game] initGame() ERROR:', err);
    }
}

function updateProjection() {
    try {
        const aspect = window.innerWidth / window.innerHeight;
        Math3D.perspective(projMatrix, Math.PI / 3, aspect, 0.1, 1000.0);
    } catch (err) {
        console.error('[Game] updateProjection() ERROR:', err);
    }
}

function isValidNumber(n) { return typeof n === 'number' && isFinite(n); }
function isValidCam(cam) {
    return cam && ['px','py','pz','tx','ty','tz','ux','uy','uz'].every(k => isValidNumber(cam[k]));
}

function mainLoop(ts) {
    let dt = ts - lastTimestamp;
    if (dt <= 0) dt = 16.67;
    lastTimestamp = ts;

    const fps = 1000 / dt;
    fpsSmoother = fpsSmoother * 0.9 + fps * 0.1;

    try {
        // управление
        const move = Input.getMovement();
        const rot = Input.getRotation();
        Player.update(dt, move, rot);

        const cam = Player.getCameraState();
        if (!isValidCam(cam)) {
            console.error('[Game] Некорректное состояние камеры', cam);
            Math3D.identity(viewMatrix);
        } else {
            Math3D.lookAt(viewMatrix,
                cam.px, cam.py, cam.pz,
                cam.tx, cam.ty, cam.tz,
                cam.ux, cam.uy, cam.uz
            );
        }

        Renderer.render({ viewMatrix, projMatrix });

        Hud.setState(Player.getState());
        Hud.setFps(fpsSmoother);
        Hud.setFrameTime(dt);
        Hud.render();

    } catch (err) {
        console.error('[Game] mainLoop() ERROR:', err);
    }

    requestAnimationFrame(mainLoop);
}

window.addEventListener('load', () => {
    if (typeof initGame === 'function') initGame();
});
