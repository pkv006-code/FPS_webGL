"use strict";

console.log("[test_flat] Файл карты загружается…");

const test_flat = {
    name: "Test Flat",
    playerStart: { x: 0, y: 0.5, z: 0, yaw: 0 },

    build: function (verts, cols, norms, uvs) {
        console.log("[test_flat.build] старт…");

        const colliders = [];

        // === ПОЛ 40×40 ===
        verts.push(-20, 0, -20,   20, 0, -20,   20, 0, 20);
        verts.push(-20, 0, -20,   20, 0, 20,   -20, 0, 20);
        for (let i = 0; i < 6; i++) {
            cols.push(0.3, 0.8, 0.3);
            norms.push(0, 1, 0);
        }
        uvs.push(0, 0, 4, 0, 4, 4, 0, 0, 4, 4, 0, 4);

        // === AABB пола ===
        colliders.push({
            minX: -20, maxX: 20,
            minY: -5,  maxY: 0,
            minZ: -20, maxZ: 20,
            solid: true
        });

        // === Один куб в центре ===
        const x = 5, y = 1, z = 5, s = 2, h = s / 2;
        const faces = [
            { n:[0,1,0],   v:[[ -h,h,-h],[ h,h,-h],[ h,h, h],[ -h,h,-h],[ h,h, h],[ -h,h, h]] },
            { n:[0,-1,0],  v:[[ -h,-h,-h],[ h,-h, h],[ h,-h,-h],[ -h,-h,-h],[ -h,-h, h],[ h,-h, h]] },
            { n:[0,0,1],   v:[[ -h,-h,h],[ h,-h,h],[ h,h,h],[ -h,-h,h],[ h,h,h],[ -h,h,h]] },
            { n:[0,0,-1],  v:[[ -h,-h,-h],[ h,-h,-h],[ h,h,-h],[ -h,-h,-h],[ h,h,-h],[ -h,h,-h]] },
            { n:[1,0,0],   v:[[ h,-h,-h],[ h,-h,h],[ h,h,h],[ h,-h,-h],[ h,h,h],[ h,h,-h]] },
            { n:[-1,0,0],  v:[[ -h,-h,-h],[ -h,-h,h],[ -h,h,h],[ -h,-h,-h],[ -h,h,h],[ -h,h,-h]] }
        ];
        for (const face of faces) {
            for (const v of face.v) {
                verts.push(x+v[0], y+v[1], z+v[2]);
                cols.push(0.8,0.2,0.2);
                norms.push(...face.n);
                uvs.push(0,0);
            }
        }
        colliders.push({
            minX: x - h, maxX: x + h,
            minY: y - h, maxY: y + h,
            minZ: z - h, maxZ: z + h,
            solid: true
        });

        console.log("[test_flat.build] ГОТОВО. verts =", verts.length, "colliders =", colliders.length);

        return {
            colliders,
            playerStart: this.playerStart
        };
    }
};

MapRegistry.register("test_flat", test_flat);
MapRegistry.setActive("test_flat");

console.log("[test_flat] Готово.");
