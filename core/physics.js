"use strict";

console.log("[Physics] Загрузка");

const Physics = (function () {

    let cfg = {
        gravity: -9.81,
        maxStepHeight: 0.0,   // Отключаем step-up (можно вернуть позже)
        skin: 0.001,
        cellSize: 4.0
    };

    let playerShape = {
        radius: 0.35,
        height: 1.75
    };

    // Статические AABB: { minX, maxX, minY, maxY, minZ, maxZ, solid: true/false, triggerId? }
    let _boxes = [];

    // Spatial grid: cellKey -> indices[]
    const _grid = new Map();

    // -----------------------------
    // PUBLIC
    // -----------------------------
    function init(params) {
        if (params && typeof params === "object") {
            if (typeof params.gravity === "number") cfg.gravity = params.gravity;
            if (typeof params.maxStepHeight === "number") cfg.maxStepHeight = params.maxStepHeight;
            if (typeof params.cellSize === "number") cfg.cellSize = params.cellSize;
            if (params.player && typeof params.player === "object") {
                if (typeof params.player.radius === "number") playerShape.radius = params.player.radius;
                if (typeof params.player.height === "number") playerShape.height = params.player.height;
            }
        }
        console.log("[Physics] Init: OK");
    }

    function setColliders(boxes) {
        _boxes = Array.isArray(boxes) ? boxes.slice() : [];
        _rebuildGrid();
        console.log("[Physics] setColliders():", _boxes.length);
    }

    /**
     * Основной шаг физики для игрока.
     * pos: {x,y,z}, vel: {x,y,z}, dtMs: миллисекунды
     */
    function resolvePlayer(pos, vel, dtMs) {
        const dt = Math.max(0.0001, dtMs / 1000);

        // gravity
        vel.y += cfg.gravity * dt;

        // желаемая позиция
        let desired = {
            x: pos.x + vel.x * dt,
            y: pos.y + vel.y * dt,
            z: pos.z + vel.z * dt
        };

        const candidates = _queryNearAABBs(desired.x, desired.y, desired.z, playerShape.radius, playerShape.height);

        // X -> Z -> Y
        desired.x = _sweepAxisX(pos, desired, playerShape, candidates);
        desired.z = _sweepAxisZ(pos, desired, playerShape, candidates);
        const yData = _sweepAxisY(pos, desired, playerShape, candidates);
        desired.y = yData.y;
        let grounded = yData.grounded;

        // step-up отключён (cfg.maxStepHeight = 0.0)
        // Если нужно, можно вернуть:
        // if (!grounded && cfg.maxStepHeight > 0.0) { ... }

        // триггеры
        const hits = [];
        for (const c of candidates) {
            const b = _boxes[c.index];
            if (!b || b.solid) continue;
            if (_capsuleAABBOverlap(desired, playerShape, b, cfg.skin)) {
                hits.push({ index: c.index, triggerId: b.triggerId });
            }
        }

        if (grounded && vel.y < 0) vel.y = 0;

        return { pos: desired, vel, grounded, hits };
    }

    // -----------------------------
    // INTERNAL
    // -----------------------------
    function _rebuildGrid() {
        _grid.clear();
        const cs = cfg.cellSize;
        for (let i = 0; i < _boxes.length; i++) {
            const b = _boxes[i];
            const minCX = Math.floor(b.minX / cs), maxCX = Math.floor(b.maxX / cs);
            const minCZ = Math.floor(b.minZ / cs), maxCZ = Math.floor(b.maxZ / cs);
            for (let cx = minCX; cx <= maxCX; cx++) {
                for (let cz = minCZ; cz <= maxCZ; cz++) {
                    const key = cx + "|" + cz;
                    let arr = _grid.get(key);
                    if (!arr) { arr = []; _grid.set(key, arr); }
                    arr.push(i);
                }
            }
        }
    }

    function _queryNearAABBs(x, y, z, r, h) {
        const cs = cfg.cellSize;
        const minCX = Math.floor((x - r) / cs), maxCX = Math.floor((x + r) / cs);
        const minCZ = Math.floor((z - r) / cs), maxCZ = Math.floor((z + r) / cs);
        const indicesSet = new Set();
        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cz = minCZ; cz <= maxCZ; cz++) {
                const key = cx + "|" + cz;
                const arr = _grid.get(key);
                if (!arr) continue;
                for (const idx of arr) indicesSet.add(idx);
            }
        }
        const out = [];
        for (const idx of indicesSet) out.push({ index: idx });
        return out;
    }

    function _capsuleAABBOverlap(pos, shape, box, skin) {
        const yMin = pos.y, yMax = pos.y + shape.height;
        if (yMax <= box.minY + skin || yMin >= box.maxY - skin) return false;

        const cx = Math.max(box.minX, Math.min(pos.x, box.maxX));
        const cz = Math.max(box.minZ, Math.min(pos.z, box.maxZ));
        const dx = pos.x - cx, dz = pos.z - cz;
        return (dx * dx + dz * dz) <= (shape.radius + skin) * (shape.radius + skin);
    }

    function _sweepAxisX(oldPos, desired, shape, candidates) {
        let x = desired.x;
        for (const c of candidates) {
            const b = _boxes[c.index];
            if (!b || !b.solid) continue;

            const yMin = desired.y, yMax = desired.y + shape.height;
            if (yMax <= b.minY || yMin >= b.maxY) continue;

            const pMinZ = desired.z - shape.radius;
            const pMaxZ = desired.z + shape.radius;
            if (pMaxZ <= b.minZ || pMinZ >= b.maxZ) continue;

            const pMinX_new = x - shape.radius;
            const pMaxX_new = x + shape.radius;
            if (pMaxX_new <= b.minX || pMinX_new >= b.maxX) continue;

            if (oldPos.x <= b.minX && x > oldPos.x) {
                x = b.minX - shape.radius - cfg.skin;
            } else if (oldPos.x >= b.maxX && x < oldPos.x) {
                x = b.maxX + shape.radius + cfg.skin;
            } else {
                const distLeft  = Math.abs((b.minX - shape.radius) - oldPos.x);
                const distRight = Math.abs((b.maxX + shape.radius) - oldPos.x);
                x = (distLeft < distRight) ? (b.minX - shape.radius - cfg.skin) : (b.maxX + shape.radius + cfg.skin);
            }
        }
        return x;
    }

    function _sweepAxisZ(oldPos, desired, shape, candidates) {
        let z = desired.z;
        for (const c of candidates) {
            const b = _boxes[c.index];
            if (!b || !b.solid) continue;

            const yMin = desired.y, yMax = desired.y + shape.height;
            if (yMax <= b.minY || yMin >= b.maxY) continue;

            const pMinX = desired.x - shape.radius;
            const pMaxX = desired.x + shape.radius;
            if (pMaxX <= b.minX || pMinX >= b.maxX) continue;

            const pMinZ_new = z - shape.radius;
            const pMaxZ_new = z + shape.radius;
            if (pMaxZ_new <= b.minZ || pMinZ_new >= b.maxZ) continue;

            if (oldPos.z <= b.minZ && z > oldPos.z) {
                z = b.minZ - shape.radius - cfg.skin;
            } else if (oldPos.z >= b.maxZ && z < oldPos.z) {
                z = b.maxZ + shape.radius + cfg.skin;
            } else {
                const distNear = Math.abs((b.minZ - shape.radius) - oldPos.z);
                const distFar  = Math.abs((b.maxZ + shape.radius) - oldPos.z);
                z = (distNear < distFar) ? (b.minZ - shape.radius - cfg.skin) : (b.maxZ + shape.radius + cfg.skin);
            }
        }
        return z;
    }

    function _sweepAxisY(oldPos, desired, shape, candidates) {
        let y = desired.y;
        let grounded = false;

        for (const c of candidates) {
            const b = _boxes[c.index];
            if (!b || !b.solid) continue;

            const pMinX = desired.x - shape.radius;
            const pMaxX = desired.x + shape.radius;
            const pMinZ = desired.z - shape.radius;
            const pMaxZ = desired.z + shape.radius;
            if (pMaxX <= b.minX || pMinX >= b.maxX) continue;
            if (pMaxZ <= b.minZ || pMinZ >= b.maxZ) continue;

            const yMin_new = y;
            const yMax_new = y + shape.height;

            // потолок (двигались вверх)
            if (oldPos.y + shape.height <= b.minY && yMax_new > b.minY) {
                y = b.minY - shape.height - cfg.skin;
            }
            // пол (двигались вниз)
            else if (oldPos.y >= b.maxY && yMin_new < b.maxY) {
                y = b.maxY + cfg.skin;
                grounded = true;
            }
            // внутреннее пересечение: решаем по направлению движения (фикс «взлёта»)
            else if (yMin_new < b.maxY && yMax_new > b.minY) {
                const movingUp = (desired.y - oldPos.y) > 0.0;
                if (movingUp) {
                    y = b.minY - shape.height - cfg.skin; // потолок
                } else {
                    y = b.maxY + cfg.skin;               // пол
                    grounded = true;
                }
            }
        }

        return { y, grounded };
    }

    return {
        init,
        setColliders,
        resolvePlayer
    };

})();
