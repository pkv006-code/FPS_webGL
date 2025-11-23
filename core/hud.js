'use strict';

console.log('[HUD] Загрузка');

const Hud = (function () {

    let canvas = null;
    let ctx = null;

    let currentState = null;
    let currentFps = 0;
    let currentFrameTime = 0;

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        canvas = document.getElementById('hudcanvas');
        if (!canvas) {
            console.error('[HUD] Canvas не найден');
            return;
        }

        ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('[HUD] Контекст 2D не получен');
            return;
        }

        resize();
        console.log('[HUD] Init: OK');
    }

    // ============================================================
    // RESIZE
    // ============================================================
    function resize() {
        if (!canvas) return;
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ============================================================
    // SETTERS
    // ============================================================
    function setState(state) {
        currentState = state;
    }

    function setFps(fps) {
        currentFps = fps;
    }

    function setFrameTime(ms) {
        currentFrameTime = ms;
    }

    // ============================================================
    // RENDER
    // ============================================================
    function render() {
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // === FPS / FrameTime ===
        ctx.font = '16px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`FPS: ${currentFps.toFixed(0)}`, 20, 30);
        ctx.fillText(`FT: ${currentFrameTime.toFixed(0)} ms`, 20, 50);

        // === HP ===
        if (currentState && typeof currentState.hpCurrent === 'number') {
            ctx.fillStyle = '#ff4444';
            ctx.fillText(`HP: ${currentState.hpCurrent}/${currentState.hpMax}`, 20, canvas.height - 20);
        }

        // === Ammo ===
        if (currentState && typeof currentState.ammoCurrent === 'number') {
            ctx.fillStyle = '#ffff66';
            ctx.fillText(`Ammo: ${currentState.ammoCurrent}/${currentState.ammoMax}`, canvas.width - 160, canvas.height - 20);
        }

        // === Crosshair ===
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 10);
        ctx.stroke();
    }

    // ============================================================
    // EXPORT
    // ============================================================
    return {
        init,
        resize,
        setState,
        setFps,
        setFrameTime,
        render
    };

})();
