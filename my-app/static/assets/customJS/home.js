// Evitar múltiples ejecuciones si el script se incluye más de una vez
if (!window.__HOME_JS_INIT_DONE__) {
  window.__HOME_JS_INIT_DONE__ = true;

  document.addEventListener("DOMContentLoaded", function () {
    const loaderOut = document.querySelector("#loader-out");
    function fadeOut(element) {
      if (!element) return;
      let opacity = 1;
      let last = performance.now();
      function step(now) {
        const delta = Math.min(1, (now - last) / 200); // control suave
        last = now;
        opacity = opacity - opacity * 0.1 * delta;
        if (opacity <= 0.05) {
          element.style.opacity = "0";
          element.style.display = "none";
          return;
        }
        element.style.opacity = String(opacity);
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    fadeOut(loaderOut);
  });
}

function eliminarEmpleado(id_empleado, foto_empleado) {
  if (confirm("¿Estas seguro que deseas Eliminar el empleado?")) {
    let url = `/borrar-empleado/${id_empleado}/${foto_empleado}`;
    if (url) {
      window.location.href = url;
    }
  }
}
