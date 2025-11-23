'use strict';

console.log("[MapRegistry] модуль загружен");

const MapRegistry = (function () {

    const registry = {};   // id → map object
    let activeId = null;

    function register(id, mapObj) {
        console.log("[MapRegistry.register] вызывается с:", id, mapObj);

        if (!id || typeof id !== 'string') {
            console.error("[MapRegistry.register] ERROR: некорректный id:", id);
            return;
        }
        if (!mapObj || typeof mapObj.build !== 'function') {
            console.error("[MapRegistry.register] ERROR: некорректный объект карты:", mapObj);
            return;
        }

        registry[id] = mapObj;
        console.log("[MapRegistry.register] УСПЕХ → карта добавлена:", id);
        console.log("[MapRegistry] Текущий список карт:", Object.keys(registry));
    }

    function has(id) {
        const exists = !!registry[id];
        console.log(`[MapRegistry.has] '${id}' →`, exists);
        return exists;
    }

    function get(id) {
        const exists = !!registry[id];
        console.log(`[MapRegistry.get] '${id}' exists=${exists}`);
        return exists ? registry[id] : null;
    }

    function listIds() {
        return Object.keys(registry);
    }

    function setActive(id) {
        console.log("[MapRegistry.setActive] попытка установить активную карту:", id);

        if (!has(id)) {
            console.error("[MapRegistry.setActive] ERROR: карты не существует:", id);
            return;
        }

        activeId = id;
        console.log("[MapRegistry.setActive] УСТАНОВЛЕНО! activeId =", activeId);

        // ВНИМАНИЕ: здесь больше НЕТ вызова Assets.setFloorTexturePath()
        // Его теперь выполняет game.js после загрузки карты.
    }

    function getActive() {
        console.log("[MapRegistry.getActive] вызван. Текущий activeId=", activeId);
        return activeId ? registry[activeId] : null;
    }

    return {
        register,
        has,
        get,
        setActive,
        getActive,
        listIds
    };

})();
