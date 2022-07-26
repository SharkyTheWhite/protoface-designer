/*
 * Using: 8x8 LED Matrix with MAX7219-compatible Drivers
 * Board: ESP-WROOM-32 on Core_Board_v2
 *
 * Pinout:
 * GPIO18 ("VSPI_SCK") --> to CLK of first Module
 * GPIO23 ("VSPI_MOSI") --> to DIN of first Module
 * GPIO5  ("VSPI_SS") --> to CS of first Module
 *
 * Module Information
 * Looking onto top (LED) side:
 * DIN --> DOUT
 *  |76543210|
 *  |......98|
 *
 * Possible Sensors:
 * - Cap. Touch for Boop
 * - RFID or NFC Tags (Props like RAM, own Paws, ...)
 * - RF Remote for self in Pocket/Paw Buttons or Handler
 * - IR Reflex and Remote Protocols
 * - Ambient Light (blinded, night, rave-sync, ...)
 * - Gyro/Accel for Head Gestures
 * - Hall Sensor Jaw Detection
 * - UV Teeth Sensor
 *
 */

#include <SPI.h>
//#include "faces.h"
#include <stdint.h>

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID        "c6bcb95f-a2d6-46c7-bc16-e7fa574f8066"
#define CHARACTERISTIC_UUID "21ec8f97-a2a8-4c8f-aeb9-fd30959d4ca5"


// How many LED modules do we have?
#define MATRIX_COUNT 14
// A memory for all LED states
volatile uint8_t framebuffer[MATRIX_COUNT*8];

// MAX7219 supports at max 10 MHz, we use 4 MHz
#define SPI_MAX_SPEED 4000000

#define SPI_CS_PIN 5

SPIClass * vspi = NULL;

// Function to send out the framebuffer to the LED modules via SPI
void SendFrameBuffer() {
  for (uint8_t row = 0; row < 8; row++) {
    // Begin shifting
    vspi->beginTransaction(SPISettings(SPI_MAX_SPEED, MSBFIRST, SPI_MODE0));
    digitalWrite(SPI_CS_PIN, LOW);
    // Need to send in reverse so 0 is first module...
    for (int module = MATRIX_COUNT-1; module >= 0; module--) {
        // Address 0x01 to 0x08 for row 0 to 7
        vspi->transfer(row + 1);
        // Data
        vspi->transfer(framebuffer[row + (module*8)]);
    }
    // Latch to LEDs
    digitalWrite(SPI_CS_PIN, HIGH);
    vspi->endTransaction();
    delay(1);
  }
}

#define CMD_NOOP         0x00
#define CMD_DECODE_MODE  0x09
#define CMD_INTENSITY    0x0A
#define CMD_SCAN_LIMIT   0x0B
#define CMD_SHUTDOWN     0x0C
#define CMD_DISPLAY_TEST 0x0F


// Function to send one "command" to all modules
void SendToAll(uint8_t address, uint8_t value) {
  // Begin shifting
    vspi->beginTransaction(SPISettings(SPI_MAX_SPEED, MSBFIRST, SPI_MODE0));
    digitalWrite(SPI_CS_PIN, LOW);
    for (uint8_t module = 0; module < MATRIX_COUNT; module++) {
        // Address
        vspi->transfer(address);
        // Data
        vspi->transfer(value);
    }
    // Latch
    digitalWrite(SPI_CS_PIN, HIGH);
    vspi->endTransaction();
    delay(2);
}

volatile uint8_t bright = 2;

void ConfigureLEDs() {
  SendToAll(CMD_SHUTDOWN, 0); // Turn Off
  SendToAll(CMD_DISPLAY_TEST, 0); // Test Mode Off
  SendToAll(CMD_DECODE_MODE, 0); // No Decoding
  SendToAll(CMD_INTENSITY, bright); // Medium Brightness
  SendToAll(CMD_SCAN_LIMIT, 7); // Scan all 8 rows
}

void ReConfigureLEDs() {
  SendToAll(CMD_DISPLAY_TEST, 0); // Test Mode Off
  SendToAll(CMD_DECODE_MODE, 0); // No Decoding
  SendToAll(CMD_INTENSITY, bright); // Medium Brightness
  SendToAll(CMD_SCAN_LIMIT, 7); // Scan all 8 rows
  SendToAll(CMD_SHUTDOWN, 1); // Turn On
}


void ClearFrameBuffer() {
   for(int i = 0; i < sizeof(framebuffer); i++) {
      framebuffer[i] = 0;
   }
}

void ShutDownLEDs() {
  SendToAll(CMD_SHUTDOWN, 0); // Turn Off
}

void PowerUpLEDs() {
  SendToAll(CMD_SHUTDOWN, 1); // Normal Mode
}

/**
 * @param brightness Intensity from 0 to 255 (will shifted adjusted to 4-Bit value)
 */
static inline void SetBrightness(uint8_t brightness) {
  bright = brightness>>4;
}



BLEServer *pServer;
BLEService *pService;
BLECharacteristic *pCharacteristic;

uint8_t mode = 0;
uint8_t iobuff[64];
uint8_t *ioptr = iobuff;

uint8_t iohexdec(uint8_t* str) {
  uint8_t v = 0;
  if (*str >= 'A') v = (*str)-'A'+10;
  else v = ((*str)-'0');
  v <<= 4;
  str++;
  if (*str >= 'A') v |= ((*str)-'A'+10);
  else v |= ((*str)-'0');
  return v;
}

// !! NO SPI INSIDE HERE!
void processProtoCommand(uint8_t* cmd, uint8_t cmdlen, void (*writeCb)(const char*)) {
  switch (cmd[0]) {
        case 'T': {mode = 0; writeCb(":\n");} break;
        case 'C': {mode = 1; ClearFrameBuffer(); writeCb(":C\n");} break;
        case 'B': {
          if (cmdlen >=3) {
             SetBrightness(iohexdec(cmd+1));
             writeCb(":B\n");
          }
        } break;
        case 'W': {
          uint8_t addr = iohexdec(cmd+1);
          uint8_t len = (cmdlen-3)/2;
          if ((addr+len) > sizeof(framebuffer)) {
            len = sizeof(framebuffer) - addr;
          }
          if (addr < sizeof(framebuffer)) {
            for (uint8_t i = 0; i < len; i++) {
              framebuffer[addr+i] = iohexdec(cmd+3+i*2);
            }
          }
          writeCb(":W\n");
        } break;
        case '?': {writeCb(":PROTO=Marc\n");} break;
        default: {writeCb("!E\n");} break;
      }
}

void writeCbBLE(const char* resp) {
  pCharacteristic->setValue((uint8_t*)resp, strlen(resp));
  pCharacteristic->notify();
}

void writeCbSerial(const char* resp) {
  Serial.write(resp);
}

class MyCharacteristicCallback : public BLECharacteristicCallbacks {
  void onRead(BLECharacteristic* pCharacteristic) {

  }
  void onWrite(BLECharacteristic* pCharacteristic) {
    std::string cmd = pCharacteristic->getValue();
    processProtoCommand((uint8_t*)cmd.data(), cmd.length(), &writeCbBLE);
  }
};



void setup() {
  // put your setup code here, to run once:
  /*
  pinMode(SPI_CLK_PIN, OUTPUT); // CLK
  pinMode(SPI_MOSI_PIN, OUTPUT); // MOSI
  pinMode(SPI_CS_PIN, OUTPUT); // CS
  */
  vspi = new SPIClass(VSPI);
  vspi->begin();
  pinMode(vspi->pinSS(), OUTPUT);

  Serial.begin(115200);

  delay(5);
  ShutDownLEDs();
  delay(25);
  ShutDownLEDs();
  delay(250);
  ConfigureLEDs();
  delay(5);
  ClearFrameBuffer();
  SendFrameBuffer();
  PowerUpLEDs();

  Serial.write("!BOOT\n");
  //Serial.setTimeout(1000);

  BLEDevice::init("MarCarbon Steel");
  pServer = BLEDevice::createServer();
  pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ |
                                         BLECharacteristic::PROPERTY_WRITE |
                                         BLECharacteristic::PROPERTY_NOTIFY
                                       );

  pCharacteristic->setCallbacks(new MyCharacteristicCallback());
  pCharacteristic->setValue("!BOOT");
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

}

void loop() {
  // put your main code here, to run repeatedly:

  if (mode == 0) {
    static int i=0, k=0;
    static bool up=true;
    static uint8_t bri=1;

    // Toggle LED "i" (0..7) in ROW "k" (0..7 first Module, 8..15 second Module, ...)
    for (k = 0; k < sizeof(framebuffer); k++) {
    framebuffer[k] = (1<<((i+k)%16));
    }
    i++;
    if (i >= 16) {
      i = 0;
    }
    delay(2);
  }
  ReConfigureLEDs();
  SendFrameBuffer();
  while (Serial.available() > 0) {
    *ioptr = Serial.read();
    if (*ioptr == '\n') {
      processProtoCommand(iobuff,ioptr-iobuff,&writeCbSerial);
      ioptr = iobuff;
      break;
    }
    ioptr++;
    if (ioptr >= &iobuff[sizeof(iobuff)]) {
      ioptr = iobuff;
    }
  }
}
