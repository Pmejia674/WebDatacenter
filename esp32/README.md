# ESP32 + MQTT + Node-RED - Sistema 2FA Data Center

## Arquitectura

```
┌─────────────┐     MQTT      ┌───────────┐     HTTP      ┌─────────────┐
│   ESP32     │ ───────────── │  Node-RED │ ───────────── │  Flask App  │
│ RFID+Keypad │               │  Broker   │               │ 192.168.1.17│
└─────────────┘               └───────────┘               └─────────────┘
```

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `esp32_2fa_mqtt.ino` | Código Arduino para ESP32 |
| `nodered_flow_datacenter.json` | Flujo Node-RED (importar) |

## Configuración ESP32

1. Abrir `esp32_2fa_mqtt.ino` en Arduino IDE
2. Cambiar las credenciales WiFi:
   ```cpp
   const char* ssid = "TU_WIFI_SSID";
   const char* password = "TU_WIFI_PASSWORD";
   ```
3. Verificar IP del broker MQTT:
   ```cpp
   const char* mqtt_server = "192.168.1.17";
   ```
4. Subir al ESP32

## Configuración Node-RED

1. Abrir Node-RED en `http://192.168.1.17:1880`
2. Menú → Import → Seleccionar archivo `nodered_flow_datacenter.json`
3. Hacer Deploy

## Topics MQTT

| Topic | Dirección | Descripción |
|-------|-----------|-------------|
| `datacenter/acceso` | ESP32 → Server | Eventos de acceso (concedido/denegado) |
| `datacenter/clave/validar` | ESP32 → Server | Solicitud validar PIN |
| `datacenter/clave/respuesta` | Server → ESP32 | Respuesta validación |
| `datacenter/puerta` | Server → ESP32 | Comando abrir puerta |
| `datacenter/estado` | ESP32 → Server | Estado del dispositivo |

## Flujo de Operación

### 1. Acceso con RFID + PIN
```
Usuario presenta tarjeta → ESP32 valida RFID localmente
Usuario ingresa PIN 4 dígitos → ESP32 envía a Node-RED
Node-RED consulta Flask → Flask valida contra BD
Respuesta regresa → ESP32 abre/cierra puerta
```

### 2. Apertura Remota (desde webapp)
```
Admin aprueba acceso → Flask llama /api/abrir-puerta
Node-RED recibe → Publica en datacenter/puerta
ESP32 escucha → Abre puerta por 3 segundos
```

## APIs Flask Necesarias

Agregar en `router_home.py`:

```python
@app.route('/api/log-acceso', methods=['POST'])
def api_log_acceso():
    # Registrar acceso en BD
    pass

@app.route('/api/validar-clave', methods=['POST'])  
def api_validar_clave():
    # Validar clave contra tabla de claves generadas
    pass

@app.route('/api/abrir-puerta', methods=['POST'])
def api_abrir_puerta():
    # Enviar comando a Node-RED para abrir puerta
    pass
```

## Dependencias

### ESP32 (Arduino IDE)
- ESP32 Board Package
- MFRC522
- Keypad
- ESP32Servo
- PubSubClient
- ArduinoJson

### Servidor
- Mosquitto MQTT Broker
- Node-RED
- Flask (ya instalado)
