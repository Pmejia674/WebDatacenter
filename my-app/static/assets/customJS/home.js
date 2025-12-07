// Evitar dobles ejecuciones
if (!window.__HOME_JS_INIT_DONE__) {
  window.__HOME_JS_INIT_DONE__ = true;

  document.addEventListener("DOMContentLoaded", function () {
    const loaderOut = document.querySelector("#loader-out");
    if (!loaderOut) return;

    let opacity = 1;

    function fade() {
      opacity -= opacity * 0.15; // 🔥 reducción más rápida
      if (opacity <= 0.1) {       // 🔥 desaparece más pronto
        loaderOut.style.opacity = "0";
        loaderOut.style.display = "none";
        return;
      }
      loaderOut.style.opacity = opacity;
      requestAnimationFrame(fade);
    }

    requestAnimationFrame(fade);
  });
}

function eliminarEmpleado(id_empleado, foto_empleado) {
  if (confirm("¿Estas seguro que deseas Eliminar el empleado?")) {
    window.location.href = `/borrar-empleado/${id_empleado}/${foto_empleado}`;
  }
}
