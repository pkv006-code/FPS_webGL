'use strict';

console.log('[Index] Загрузка');

function populateMapSelector() {
  const selector = document.getElementById('mapSelector');
  if (!selector) return;

  const maps = MapRegistry.getList();
  console.log('[Index] Список карт загружен:', maps);

  selector.innerHTML = '';
  maps.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    selector.appendChild(opt);
  });

  if (maps.length > 0) {
    selector.value = maps[0];
    console.log('[Index] Выбрана карта:', selector.value);
  }
}

function startGame() {
  const selector = document.getElementById('mapSelector');
  if (!selector) {
    console.error('[Index] mapSelector не найден');
    return;
  }

  const mapId = selector.value;
  if (!MapRegistry.has(mapId)) {
    console.error('[Index] Карта не найдена:', mapId);
    return;
  }

  MapRegistry.setActive(mapId);
  console.log('[Index] Игра запущена с картой:', mapId);

  // скрываем меню после запуска
  const menu = document.getElementById('menu');
  if (menu) {
    menu.style.display = 'none';
  }

  if (typeof initGame === 'function') {
    initGame();
  }
}

function toggleMenu() {
  const menu = document.getElementById('menu');
  if (!menu) return;
  const visible = menu.style.display !== 'none';
  menu.style.display = visible ? 'none' : 'block';
  console.log('[Index] Меню:', visible ? 'скрыто' : 'показано');
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    toggleMenu();
  }
});

window.addEventListener('load', () => {
  populateMapSelector();
});
