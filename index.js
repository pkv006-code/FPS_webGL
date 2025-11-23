// index.js — логика выбора карты и запуска игры

async function loadMapsList() {
  try {
    const resp = await fetch('/maps.json');
    const maps = await resp.json();

    const selector = document.getElementById('mapSelector');
    selector.innerHTML = "";

    for (const id of maps) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id;
      selector.appendChild(opt);
    }

    console.log("[Index] Список карт загружен:", maps);
  } catch (err) {
    console.error("[Index] Ошибка загрузки списка карт:", err);
  }
}

async function startGame() {
  const id = document.getElementById('mapSelector').value;
  if (!id) {
    console.error("[Index] Карта не выбрана");
    return;
  }

  console.log("[Index] Выбрана карта:", id);

  const script = document.createElement('script');
  script.src = `maps/${id}/map.js`;
  script.onload = () => {
    try {
      MapRegistry.setActive(id);
      initGame();
      console.log("[Index] Игра запущена с картой:", id);
    } catch (err) {
      console.error("[Index] Ошибка запуска игры:", err);
    }
  };
  script.onerror = () => {
    console.error("[Index] Не удалось загрузить карту:", id);
  };

  document.body.appendChild(script);
}

window.addEventListener('load', loadMapsList);
