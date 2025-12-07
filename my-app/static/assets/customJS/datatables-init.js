// Inicialización global de DataTables para cualquier tabla con clase .js-datatable
// Configurado en español y con tema Bootstrap 5

(function ($) {
  $(document).ready(function () {
    var defaultOptions = {
      language: {
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ registros",
        info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
        infoEmpty: "Mostrando 0 a 0 de 0 registros",
        infoFiltered: "(filtrado de _MAX_ registros totales)",
        paginate: {
          first: "Primero",
          last: "Último",
          next: "Siguiente",
          previous: "Anterior",
        },
        emptyTable: "No hay datos disponibles",
        zeroRecords: "No se encontraron resultados",
        loadingRecords: "Cargando...",
        processing: "Procesando...",
      },
      pageLength: 10,
      responsive: true,
      dom:
        '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rt<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
    };

    // Inicializar todas las tablas marcadas con .js-datatable
    // Evitar múltiples ejecuciones si el archivo es incluido más de una vez
    if (window.__DT_GLOBAL_INIT_DONE__) {
      return;
    }
    window.__DT_GLOBAL_INIT_DONE__ = true;

    $("table.js-datatable").each(function () {
      var $table = $(this);
      var options = { ...defaultOptions };

      // Permitir opciones personalizadas vía data-options (JSON)
      var dataOptions = $table.attr("data-options");
      if (dataOptions) {
        try {
          var parsed = JSON.parse(dataOptions);
          options = { ...options, ...parsed };
        } catch (e) {
          console.warn("DataTables: opciones inválidas en data-options", e);
        }
      }

      // Última columna no ordenable (acciones) si se marca data-has-actions
      if ($table.attr("data-has-actions") === "true") {
        options.columnDefs = options.columnDefs || [];
        options.columnDefs.push({ targets: -1, orderable: false });
      }

      // Orden por la primera columna si no se especifica
      if (!options.order) {
        options.order = [[0, "asc"]];
      }

      // Limpieza defensiva si la tabla ya está envuelta por DataTables
      if ($table.parent().hasClass('dataTables_wrapper')) {
        var $wrapper = $table.parent();
        // Reemplazar el wrapper por la tabla original para dejar el DOM limpio
        $wrapper.before($table);
        $wrapper.remove();
      }

      // Evitar doble inicialización por tabla
      if ($table.data("dt-initialized")) {
        return;
      }

      if ($.fn.DataTable.isDataTable($table)) {
        $table.DataTable().destroy();
      }

      $table.DataTable(options);
      $table.data("dt-initialized", true);
    });
  });
})(jQuery);
