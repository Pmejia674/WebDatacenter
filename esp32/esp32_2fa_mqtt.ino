/*
 * ESP32 2FA - Data Center (Simple)
 * RFID + Teclado 4x4 + MQTT
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Keypad.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <PubSubClient.h>

// WiFi
const char* ssid = "TU_WIFI";
const char* pass = "TU_PASSWORD";

// MQTT
const char* mqtt_server = "192.168.1.17";
WiFiClient espClient;
PubSubClient mqtt(espClient);

// RFID
#define SS_PIN 10
#define RST_PIN 9
MFRC522 rfid(SS_PIN, RST_PIN);
String uid = "";
bool rfidOK = false;

// Teclado 4x4
char keys[4][4] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};
byte rowPins[4] = {2, 3, 4, 5};
byte colPins[4] = {6, 7, 8, 14};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, 4, 4);
String pin = "";

// Servo
Servo servo;
#define SERVO_PIN 18

void setup() {
  Serial.begin(115200);
  
  // WiFi
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println("WiFi OK");
  
  // MQTT
  mqtt.setServer(mqtt_server, 1883);
  mqtt.setCallback(callback);
  
  // RFID
  SPI.begin(12, 13, 11, 10);
  rfid.PCD_Init();
  
  // Servo
  servo.attach(SERVO_PIN);
  servo.write(0);
  
  Serial.println("Listo");
}

void loop() {
  if (!mqtt.connected()) conectarMQTT();
  mqtt.loop();
  
  leerRFID();
  leerTeclado();
}

void conectarMQTT() {
  while (!mqtt.connected()) {
    if (mqtt.connect("ESP32")) {
      mqtt.subscribe("datacenter/puerta");
      mqtt.subscribe("datacenter/clave/resp");
    } else {
      delay(3000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int len) {
  String msg = "";
  for (int i = 0; i < len; i++) msg += (char)payload[i];
  
  // Comando abrir puerta
  if (String(topic) == "datacenter/puerta" && msg == "abrir") {
    abrirPuerta();
  }
  
  // Respuesta validación clave
  if (String(topic) == "datacenter/clave/resp" && msg == "ok") {
    abrirPuerta();
  }
}

void leerRFID() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  
  uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  rfidOK = true;
  
  Serial.println("RFID: " + uid);
  mqtt.publish("datacenter/rfid", uid.c_str());
  
  rfid.PICC_HaltA();
}

void leerTeclado() {
  char key = keypad.getKey();
  if (!key) return;
  
  if (key == '*') {  // Validar
    if (rfidOK && pin.length() == 4) {
      String msg = uid + "," + pin;
      mqtt.publish("datacenter/clave", msg.c_str());
      Serial.println("Enviado: " + msg);
    }
    pin = "";
    rfidOK = false;
  }
  else if (key == '#') {  // Borrar
    pin = "";
  }
  else if (pin.length() < 4) {
    pin += key;
    Serial.print("*");
  }
}

void abrirPuerta() {
  Serial.println("ABRIENDO");
  servo.write(90);
  delay(3000);
  servo.write(0);
  Serial.println("CERRADO");
}
