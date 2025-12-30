from controllers.funciones_login import *
from app import app
from flask import render_template, request, flash, redirect, url_for, session,  jsonify
from mysql.connector.errors import Error


# Importando cenexión a BD
from controllers.funciones_home import *

@app.route('/lista-de-areas', methods=['GET'])
def lista_areas():
    if 'conectado' in session:
        return render_template('public/usuarios/lista_areas.html', areas=lista_areasBD(), dataLogin=dataLoginSesion())
    else:
        flash('primero debes iniciar sesión.', 'error')
        return redirect(url_for('inicio'))

@app.route("/lista-de-usuarios", methods=['GET'])
def usuarios():
    if 'conectado' in session:
        return render_template('public/usuarios/lista_usuarios.html',  resp_usuariosBD=lista_usuariosBD(), dataLogin=dataLoginSesion(), areas=lista_areasBD(), roles = lista_rolesBD())
    else:
        return redirect(url_for('inicioCpanel'))

#Ruta especificada para eliminar un usuario
@app.route('/borrar-usuario/<string:id>', methods=['GET'])
def borrarUsuario(id):
    resp = eliminarUsuario(id)
    if resp:
        flash('El Usuario fue eliminado correctamente', 'success')
        return redirect(url_for('usuarios'))
    
    
@app.route('/borrar-area/<string:id_area>/', methods=['GET'])
def borrarArea(id_area):
    resp = eliminarArea(id_area)
    if resp:
        flash('El Empleado fue eliminado correctamente', 'success')
        return redirect(url_for('lista_areas'))
    else:
        flash('Hay usuarios que pertenecen a esta área', 'error')
        return redirect(url_for('lista_areas'))


@app.route("/descargar-informe-accesos/", methods=['GET'])
def reporteBD():
    if 'conectado' in session:
        return generarReporteExcel()
    else:
        flash('primero debes iniciar sesión.', 'error')
        return redirect(url_for('inicio'))
    
@app.route("/reporte-accesos", methods=['GET'])
def reporteAccesos():
    if 'conectado' in session:
        userData = dataLoginSesion()
        return render_template('public/perfil/reportes.html',  reportes=dataReportes(),lastAccess=lastAccessBD(userData.get('cedula')), dataLogin=dataLoginSesion())

@app.route("/interfaz-clave", methods=['GET','POST'])
def claves():
    return render_template('public/usuarios/generar_clave.html', dataLogin=dataLoginSesion())
    
@app.route('/generar-y-guardar-clave/<string:id>', methods=['GET','POST'])
def generar_clave(id):
    print(id)
    clave_generada = crearClave()  # Llama a la función para generar la clave
    guardarClaveAuditoria(clave_generada,id)
    return clave_generada
#CREAR AREA
@app.route('/crear-area', methods=['GET','POST'])
def crearArea():
    if request.method == 'POST':
        area_name = request.form['nombre_area']  # Asumiendo que 'nombre_area' es el nombre del campo en el formulario
        resultado_insert = guardarArea(area_name)
        if resultado_insert:
            # Éxito al guardar el área
            flash('El Area fue creada correctamente', 'success')
            return redirect(url_for('lista_areas'))
            
        else:
            # Manejar error al guardar el área
            return "Hubo un error al guardar el área."
    return render_template('public/usuarios/lista_areas')

##ACTUALIZAR AREA
@app.route('/actualizar-area', methods=['POST'])
def updateArea():
    if request.method == 'POST':
        nombre_area = request.form['nombre_area']  # Asumiendo que 'nuevo_nombre' es el nombre del campo en el formulario
        id_area = request.form['id_area']
        resultado_update = actualizarArea(id_area, nombre_area)
        if resultado_update:
           # Éxito al actualizar el área
            flash('El actualizar fue creada correctamente', 'success')
            return redirect(url_for('lista_areas'))
        else:
            # Manejar error al actualizar el área
            return "Hubo un error al actualizar el área."

    return redirect(url_for('lista_areas'))

# ============================================
# API de Notificaciones - Sistema Toast
# ============================================

# Almacenamiento temporal de solicitudes de acceso (en producción usar base de datos)
solicitudes_acceso = []

@app.route('/api/notificaciones', methods=['GET'])
def api_notificaciones():
    """Obtener notificaciones pendientes para el usuario actual"""
    if 'conectado' not in session:
        return jsonify({'notifications': []}), 401
    
    userData = dataLoginSesion()
    notifications = []
    
    # Solo admins reciben solicitudes de acceso
    if userData.get('rol') == 1:
        for sol in solicitudes_acceso:
            if not sol.get('processed'):
                notifications.append({
                    'type': 'access-request',
                    'title': 'Solicitud de Acceso',
                    'message': f"{sol.get('userName', 'Usuario')} solicita autorización",
                    'requestId': sol.get('id'),
                    'userId': sol.get('userId'),
                    'userName': sol.get('userName'),
                    'code': sol.get('code')
                })
    
    return jsonify({'notifications': notifications})

@app.route('/api/solicitar-acceso', methods=['POST'])
def api_solicitar_acceso():
    """Usuario solicita autorización de acceso al admin"""
    if 'conectado' not in session:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    
    userData = dataLoginSesion()
    data = request.get_json() or {}
    
    import random
    import string
    
    # Generar código de 4 dígitos
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    
    # Crear solicitud
    nueva_solicitud = {
        'id': len(solicitudes_acceso) + 1,
        'userId': userData.get('id'),
        'userName': userData.get('nombre'),
        'code': code,
        'processed': False,
        'approved': None
    }
    solicitudes_acceso.append(nueva_solicitud)
    
    return jsonify({
        'success': True, 
        'code': code,
        'requestId': nueva_solicitud['id'],
        'message': 'Solicitud enviada al administrador'
    })

@app.route('/aprobar-acceso/<int:request_id>', methods=['POST'])
def aprobar_acceso(request_id):
    """Admin aprueba una solicitud de acceso"""
    if 'conectado' not in session:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    
    userData = dataLoginSesion()
    if userData.get('rol') != 1:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403
    
    for sol in solicitudes_acceso:
        if sol.get('id') == request_id:
            sol['processed'] = True
            sol['approved'] = True
            return jsonify({
                'success': True, 
                'message': 'Acceso aprobado',
                'userId': sol.get('userId')
            })
    
    return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404

@app.route('/rechazar-acceso/<int:request_id>', methods=['POST'])
def rechazar_acceso(request_id):
    """Admin rechaza una solicitud de acceso"""
    if 'conectado' not in session:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    
    userData = dataLoginSesion()
    if userData.get('rol') != 1:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403
    
    for sol in solicitudes_acceso:
        if sol.get('id') == request_id:
            sol['processed'] = True
            sol['approved'] = False
            return jsonify({
                'success': True, 
                'message': 'Acceso rechazado'
            })
    
    return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404

@app.route('/api/estado-solicitud/<int:request_id>', methods=['GET'])
def api_estado_solicitud(request_id):
    """Verificar el estado de una solicitud de acceso"""
    for sol in solicitudes_acceso:
        if sol.get('id') == request_id:
            return jsonify({
                'success': True,
                'processed': sol.get('processed'),
                'approved': sol.get('approved')
            })
    
    return jsonify({'success': False, 'error': 'Solicitud no encontrada'}), 404

# ============================================
# API IoT - ESP32 / Node-RED
# ============================================

@app.route('/api/log-acceso', methods=['POST'])
def api_log_acceso():
    """Registrar evento de acceso desde ESP32"""
    data = request.get_json() or {}
    
    rfid = data.get('rfid', 'desconocido')
    estado = data.get('estado', 'desconocido')
    fecha = data.get('fecha')
    
    # TODO: Guardar en base de datos
    print(f"[IOT] Acceso: RFID={rfid}, Estado={estado}, Fecha={fecha}")
    
    # Enviar notificación toast a admins conectados
    if estado == 'concedido':
        # Agregar a notificaciones para que los admins vean
        pass
    
    return jsonify({
        'success': True,
        'message': 'Log registrado'
    })

@app.route('/api/validar-clave', methods=['POST'])
def api_validar_clave():
    """Validar clave ingresada en el teclado matricial"""
    data = request.get_json() or {}
    
    rfid = data.get('rfid', '')
    clave = data.get('clave', '')
    
    print(f"[IOT] Validando clave: RFID={rfid}, Clave={clave}")
    
    # Buscar la clave en las claves generadas (en memoria por ahora)
    # En producción, verificar contra la tabla de auditoría en BD
    
    # Por ahora, validar contra las solicitudes de acceso aprobadas
    for sol in solicitudes_acceso:
        if sol.get('code') == clave and sol.get('approved') == True:
            return jsonify({
                'valido': True,
                'clave': clave,
                'mensaje': 'Clave válida'
            })
    
    return jsonify({
        'valido': False,
        'clave': clave,
        'mensaje': 'Clave inválida o expirada'
    })

@app.route('/api/abrir-puerta', methods=['POST'])
def api_abrir_puerta():
    """Enviar comando para abrir puerta (llama a Node-RED)"""
    if 'conectado' not in session:
        return jsonify({'success': False, 'error': 'No autenticado'}), 401
    
    userData = dataLoginSesion()
    if userData.get('rol') != 1:
        return jsonify({'success': False, 'error': 'Sin permisos'}), 403
    
    import requests
    
    try:
        # Llamar a Node-RED para que envíe el comando MQTT
        response = requests.post(
            'http://192.168.1.17:1880/api/abrir-puerta',
            json={'origen': 'webapp', 'usuario': userData.get('name')},
            timeout=5
        )
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'Comando enviado al ESP32'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al comunicar con Node-RED'
            }), 500
            
    except Exception as e:
        print(f"[IOT] Error al abrir puerta: {e}")
        return jsonify({
            'success': False,
            'error': 'Error de conexión con el controlador'
        }), 500
    