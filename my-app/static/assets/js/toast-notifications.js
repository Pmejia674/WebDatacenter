/**
 * InfraNova - Toast Notification System
 * Sistema de notificaciones en tiempo real
 */

const ToastNotifications = (function () {
    let container = null;
    let notifications = [];
    let nextId = 1;

    // Crear el contenedor de toasts
    function init() {
        if (container) return;

        container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    // Iconos por tipo
    const icons = {
        info: 'bi-info-circle-fill',
        success: 'bi-check-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        error: 'bi-x-circle-fill',
        'access-request': 'bi-person-badge-fill'
    };

    /**
     * Crear una notificación toast
     * @param {Object} options - Opciones del toast
     * @param {string} options.type - Tipo: info, success, warning, error, access-request
     * @param {string} options.title - Título
     * @param {string} options.message - Mensaje
     * @param {number} options.duration - Duración en ms (0 = persistente)
     * @param {boolean} options.dismissible - Permite cerrar manualmente
     * @param {Array} options.actions - Botones de acción [{text, type, callback}]
     */
    function show(options) {
        init();

        const id = nextId++;
        const defaults = {
            type: 'info',
            title: 'Notificación',
            message: '',
            duration: 5000,
            dismissible: true,
            actions: [],
            data: {}
        };

        const config = { ...defaults, ...options, id };

        const toast = createToastElement(config);
        container.appendChild(toast);
        notifications.push({ id, element: toast, config });

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-dismiss
        if (config.duration > 0) {
            setTimeout(() => {
                dismiss(id);
            }, config.duration);
        }

        // Actualizar badge del navbar
        updateNotificationBadge();

        return id;
    }

    function createToastElement(config) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${config.type}`;
        toast.dataset.id = config.id;

        const icon = icons[config.type] || icons.info;

        let actionsHtml = '';
        if (config.actions && config.actions.length > 0) {
            actionsHtml = `
        <div class="toast-actions">
          ${config.actions.map(action => `
            <button class="toast-btn ${action.type || ''}" data-action="${action.action || ''}">${action.text}</button>
          `).join('')}
        </div>
      `;
        }

        toast.innerHTML = `
      <div class="toast-icon">
        <i class="bi ${icon}"></i>
      </div>
      <div class="toast-content">
        <p class="toast-title">${config.title}</p>
        ${config.message ? `<p class="toast-message">${config.message}</p>` : ''}
        <p class="toast-time">Ahora mismo</p>
        ${actionsHtml}
      </div>
      ${config.dismissible ? `
        <button class="toast-close" aria-label="Cerrar">
          <i class="bi bi-x-lg"></i>
        </button>
      ` : ''}
      ${config.duration > 0 ? `
        <div class="toast-progress">
          <div class="toast-progress-bar" style="animation-duration: ${config.duration}ms"></div>
        </div>
      ` : ''}
    `;

        // Event listeners
        if (config.dismissible) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn?.addEventListener('click', () => dismiss(config.id));
        }

        // Action buttons
        if (config.actions) {
            config.actions.forEach(action => {
                const btn = toast.querySelector(`[data-action="${action.action}"]`);
                if (btn && action.callback) {
                    btn.addEventListener('click', () => {
                        action.callback(config.data);
                        dismiss(config.id);
                    });
                }
            });
        }

        return toast;
    }

    function dismiss(id) {
        const index = notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const { element } = notifications[index];
        element.classList.add('removing');
        element.classList.remove('show');

        setTimeout(() => {
            element.remove();
            notifications.splice(index, 1);
            updateNotificationBadge();
        }, 400);
    }

    function dismissAll() {
        [...notifications].forEach(n => dismiss(n.id));
    }

    function updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const count = notifications.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Helpers para tipos comunes
    function info(title, message, options = {}) {
        return show({ type: 'info', title, message, ...options });
    }

    function success(title, message, options = {}) {
        return show({ type: 'success', title, message, ...options });
    }

    function warning(title, message, options = {}) {
        return show({ type: 'warning', title, message, ...options });
    }

    function error(title, message, options = {}) {
        return show({ type: 'error', title, message, ...options });
    }

    /**
     * Mostrar solicitud de acceso que requiere aprobación
     */
    function showAccessRequest(data) {
        return show({
            type: 'access-request',
            title: 'Solicitud de Acceso',
            message: `${data.userName || 'Un usuario'} solicita autorización para acceder`,
            duration: 0, // Persistente
            dismissible: true,
            data: data,
            actions: [
                {
                    text: 'Aprobar',
                    type: 'approve',
                    action: 'approve',
                    callback: (data) => approveAccess(data)
                },
                {
                    text: 'Rechazar',
                    type: 'reject',
                    action: 'reject',
                    callback: (data) => rejectAccess(data)
                }
            ]
        });
    }

    // Funciones de aprobación/rechazo
    function approveAccess(data) {
        fetch('/aprobar-acceso/' + (data.requestId || ''), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                success('Acceso Aprobado', 'La autorización ha sido concedida');
            })
            .catch(err => {
                console.error('Error al aprobar:', err);
                error('Error', 'No se pudo procesar la solicitud');
            });
    }

    function rejectAccess(data) {
        fetch('/rechazar-acceso/' + (data.requestId || ''), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(result => {
                info('Acceso Rechazado', 'La solicitud ha sido denegada');
            })
            .catch(err => {
                console.error('Error al rechazar:', err);
                error('Error', 'No se pudo procesar la solicitud');
            });
    }

    /**
     * Polling para obtener notificaciones del servidor
     */
    let pollingInterval = null;

    function startPolling(interval = 10000) {
        if (pollingInterval) return;

        pollingInterval = setInterval(checkNotifications, interval);
        checkNotifications(); // Primera verificación inmediata
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }

    function checkNotifications() {
        fetch('/api/notificaciones')
            .then(response => response.json())
            .then(data => {
                if (data.notifications && data.notifications.length > 0) {
                    data.notifications.forEach(notif => {
                        if (notif.type === 'access-request') {
                            showAccessRequest(notif);
                        } else {
                            show(notif);
                        }
                    });
                }
            })
            .catch(err => {
                // Silencioso - no mostrar error en polling
                console.log('Polling check:', err.message);
            });
    }

    // API pública
    return {
        show,
        dismiss,
        dismissAll,
        info,
        success,
        warning,
        error,
        showAccessRequest,
        startPolling,
        stopPolling,
        init
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    ToastNotifications.init();

    // Iniciar polling solo si el usuario está logueado (verificar si existe el menú de usuario)
    if (document.getElementById('userToggle')) {
        ToastNotifications.startPolling(15000); // Cada 15 segundos
    }
});

// Exportar para uso global
window.Toast = ToastNotifications;
