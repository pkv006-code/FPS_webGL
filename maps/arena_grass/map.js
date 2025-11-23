"use strict";

console.log("[arena_grass] Файл карты загружается…");

const arena_grass = {
    name: "Green Arena",
    playerStart: { x: 0, y: 1.8, z: 0, yaw: 0 },
    floorTexture: "maps/arena_grass/textures/floor_diffuse.png",

    build: function (verts, cols, norms, uvs) {
        console.log("[arena_grass.build] старт…");

        const colliders = [];

        // === пол 100×100 с повторяющейся текстурой ===
        verts.push(-50, 0, -50,   50, 0, -50,   50, 0, 50);
        verts.push(-50, 0, -50,   50, 0, 50,   -50, 0, 50);

        for (let i = 0; i < 6; i++) {
            cols.push(0.3, 0.8, 0.3);
            norms.push(0, 1, 0);
        }

        // плитка 20×20
        uvs.push(0, 0,   20, 0,   20, 20);
        uvs.push(0, 0,   20, 20,   0, 20);

        // === AABB пола (толщина 1 по Y) ===
        colliders.push({
            minX: -50, maxX: 50,
            minY: -1,  maxY: 0,   // плита чуть ниже 0
            minZ: -50, maxZ: 50,
            solid: true
        });

        // === стены по периметру (геометрия + AABB) ===
        function addWall(x1, z1, x2, z2, h, thick = 0.5) {
            // геометрия (двухтреугольный прямоугольник)
            verts.push(x1,0,z1, x2,0,z2, x2,h,z2);
            verts.push(x1,0,z1, x2,h,z2, x1,h,z1);
            for (let i=0;i<6;i++) {
                cols.push(0.6,0.6,0.6);
                norms.push(0,0,1);
                uvs.push(0,0);
            }
            // AABB стены: делаем толщину thick по перпендикуляру
            if (z1 === z2) {
                // стена вдоль X (по Z узкая)
                const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
                colliders.push({
                    minX, maxX,
                    minY: 0, maxY: h,
                    minZ: z1 - thick, maxZ: z1 + thick,
                    solid: true
                });
            } else if (x1 === x2) {
                // стена вдоль Z (по X узкая)
                const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);
                colliders.push({
                    minX: x1 - thick, maxX: x1 + thick,
                    minY: 0, maxY: h,
                    minZ, maxZ,
                    solid: true
                });
            } else {
                // диагональ (редко) — расширим AABB по минимальному и максимальному
                colliders.push({
                    minX: Math.min(x1, x2), maxX: Math.max(x1, x2),
                    minY: 0, maxY: h,
                    minZ: Math.min(z1, z2), maxZ: Math.max(z1, z2),
                    solid: true
                });
            }
        }
        addWall(-50,-50, 50,-50, 5);
        addWall(-50, 50, 50, 50, 5);
        addWall(-50,-50, -50,50, 5);
        addWall( 50,-50,  50,50, 5);

        // === кубы (объёмные, CCW) + AABB ===
        function addCube(x, y, z, size) {
            const h = size / 2;
            const faces = [
                { n:[0,1,0],   v:[[ -h,h,-h],[ h,h,-h],[ h,h, h],[ -h,h,-h],[ h,h, h],[ -h,h, h]] }, // top
                { n:[0,-1,0],  v:[[ -h,-h,-h],[ h,-h, h],[ h,-h,-h],[ -h,-h,-h],[ -h,-h, h],[ h,-h, h]] }, // bottom
                { n:[0,0,1],   v:[[ -h,-h,h],[ h,-h,h],[ h,h,h],[ -h,-h,h],[ h,h,h],[ -h,h,h]] }, // front
                { n:[0,0,-1],  v:[[ -h,-h,-h],[ h,-h,-h],[ h,h,-h],[ -h,-h,-h],[ h,h,-h],[ -h,h,-h]] }, // back
                { n:[1,0,0],   v:[[ h,-h,-h],[ h,-h,h],[ h,h,h],[ h,-h,-h],[ h,h,h],[ h,h,-h]] }, // right
                { n:[-1,0,0],  v:[[ -h,-h,-h],[ -h,-h,h],[ -h,h,h],[ -h,-h,-h],[ -h,h,h],[ -h,h,-h]] } // left
            ];
            for (const face of faces) {
                for (const v of face.v) {
                    verts.push(x+v[0], y+v[1], z+v[2]);
                    cols.push(0.8,0.2,0.2);
                    norms.push(...face.n);
                    uvs.push(0,0);
                }
            }
            // AABB куба
            colliders.push({
                minX: x - h, maxX: x + h,
                minY: y - h, maxY: y + h,
                minZ: z - h, maxZ: z + h,
                solid: true
            });
        }

        addCube(-30, 1, -30, 2);
        addCube(25,  1, -35, 3);
        addCube(-35, 1,  25, 1);
        addCube(35,  1,  35, 4);
        addCube(0,   1,  40, 2);

        // === рампа из ступенек (геометрия + AABB) ===
        function addStep(x, z, w, d, h) {
            // геометрия клина как два треугольника
            verts.push(x,0,z, x+w,0,z, x+w,h,z+d);
            verts.push(x,0,z, x+w,h,z+d, x,h,z+d);
            for (let i=0;i<6;i++) {
                cols.push(0.4,0.4,0.8);
                norms.push(0,1,0);
                uvs.push(0,0);
            }
            // AABB ступеньки (простая коробка)
            colliders.push({
                minX: Math.min(x, x+w), maxX: Math.max(x, x+w),
                minY: 0, maxY: h,
                minZ: Math.min(z, z+d), maxZ: Math.max(z, z+d),
                solid: true
            });
        }
        for (let i=0; i<5; i++) {
            addStep(-10, -45 + i*3, 20, 3, i+1);
        }

        console.log("[arena_grass.build] Готово. verts=", verts.length, " colliders=", colliders.length);

        return {
            colliders,
            playerStart: this.playerStart
        };
    }
};

MapRegistry.register("arena_grass", arena_grass);
MapRegistry.setActive("arena_grass");

console.log("[arena_grass] Готово.");
