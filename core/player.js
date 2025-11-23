const Player = (() => {
  let pos = { x: 0, y: 1.8, z: 0 };
  let vel = { x: 0, y: 0, z: 0 };
  let yaw = 0;
  let pitch = 0;

  function init(spawn) {
    pos.x = spawn.x || 0;
    pos.y = spawn.y || 1.8;
    pos.z = spawn.z || 0;
    yaw   = spawn.yaw || 0;
    pitch = spawn.pitch || 0;
    vel.x = vel.y = vel.z = 0;
    console.log("[Player] Init:", { pos, yaw, pitch });
  }

  function update(dt, move, rot) {
    if (!move || !rot) {
      console.warn("[Player] update: move/rot отсутствует");
      return;
    }

    // обновляем углы
    yaw   += rot.yaw * 0.002;
    pitch -= rot.pitch * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

    // направление движения
    const speed = 5.0;
    const dx = move.x * speed;
    const dy = move.y * speed;
    const dz = move.z * speed;

    // преобразуем в мировые координаты
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);

    const vx = dx * cosYaw - dz * sinYaw;
    const vz = dx * sinYaw + dz * cosYaw;

    vel.x = vx;
    vel.y = dy;
    vel.z = vz;

    // применяем физику
    Physics.resolvePlayer(pos, vel, dt);

    // лог для отладки
    console.log("[Player] update:", {
      pos: { ...pos },
      vel: { ...vel },
      yaw: yaw.toFixed(2),
      pitch: pitch.toFixed(2)
    });
  }

  function getCameraState() {
    if (!isFinite(yaw) || !isFinite(pitch)) {
      console.warn("[Player] Камера: некорректные углы", { yaw, pitch });
      return null;
    }

    const dir = {
      x: Math.cos(pitch) * Math.sin(yaw),
      y: Math.sin(pitch),
      z: Math.cos(pitch) * Math.cos(yaw)
    };

    return {
      px: pos.x,
      py: pos.y,
      pz: pos.z,
      tx: pos.x + dir.x,
      ty: pos.y + dir.y,
      tz: pos.z + dir.z,
      ux: 0,
      uy: 1,
      uz: 0
    };
  }

  function getState() {
    return {
      hp: 100,
      ammo: 30
    };
  }

  return {
    init,
    update,
    getCameraState,
    getState
  };
})();
