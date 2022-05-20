/*
 * ProtoFace Example
 *
 * Using: 8x8 LED Matrix with MAX7219-compatible Drivers
 * Board: Arduino Uno compatible
 *
 * Pinout:
 * D13 ("SCK") --> to CLK of first Module
 * D11 ("MOSI"/"COPI") --> to DIN of first Module
 * D10 ("SS") --> to CS of first Module
 *
 */

#include <SPI.h>
#include <stdint.h>

// How many LED modules do we have?
#define MATRIX_COUNT 1
// A memory for all LED states
uint8_t framebuffer[MATRIX_COUNT*8];

// MAX7219 supports at max 10 MHz
#define SPI_MAX_SPEED 10000

#define SPI_CLK_PIN 13
#define SPI_MOSI_PIN 11
#define SPI_CS_PIN 10

// Function to send out the framebuffer to the LED modules via SPI
void SendFrameBuffer() {
  for (uint8_t row = 0; row < 8; row++) {
    // Begin shifting
    SPI.beginTransaction(SPISettings(SPI_MAX_SPEED, MSBFIRST, SPI_MODE0));
    digitalWrite(SPI_CS_PIN, LOW);
    // Need to send in reverse so 0 is first module...
    for (int module = MATRIX_COUNT-1; module >= 0; module--) {
        // Address 0x01 to 0x08 for row 0 to 7
        SPI.transfer(row + 1);
        // Data
        SPI.transfer(framebuffer[row + (module*8)]);
    }
    // Latch to LEDs
    digitalWrite(SPI_CS_PIN, HIGH);
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
    SPI.beginTransaction(SPISettings(SPI_MAX_SPEED, MSBFIRST, SPI_MODE0));
    digitalWrite(SPI_CS_PIN, LOW);
    for (uint8_t module = 0; module < MATRIX_COUNT; module++) {
        // Address
        SPI.transfer(address);
        // Data
        SPI.transfer(value);
    }
    // Latch
    digitalWrite(SPI_CS_PIN, HIGH);
    delay(2);
}

void ConfigureLEDs() {
  SendToAll(CMD_SHUTDOWN, 0); // Turn Off
  SendToAll(CMD_DISPLAY_TEST, 0); // Test Mode Off
  SendToAll(CMD_DECODE_MODE, 0); // No Decoding
  SendToAll(CMD_INTENSITY, 2); // Medium Brightness
  SendToAll(CMD_SCAN_LIMIT, 7); // Scan all 8 rows
}

void ReConfigureLEDs() {
  SendToAll(CMD_DISPLAY_TEST, 0); // Test Mode Off
  SendToAll(CMD_DECODE_MODE, 0); // No Decoding
  SendToAll(CMD_INTENSITY, 2); // Medium Brightness
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
  SendToAll(CMD_INTENSITY, brightness>>4); // Medium Brightness
}

void setup() {
  // put your setup code here, to run once:
  pinMode(SPI_CLK_PIN, OUTPUT); // CLK
  pinMode(SPI_MOSI_PIN, OUTPUT); // MOSI
  pinMode(SPI_CS_PIN, OUTPUT); // CS

  Serial.begin(460800);

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

}

uint8_t mode = 0;
uint8_t iobuff[64];
uint8_t *ioptr = iobuff;

uint8_t iohexdec(int pos) {
  uint8_t v = 0;
  if (iobuff[pos] >= 'A') v = (iobuff[pos]-'A'+10);
  else v = (iobuff[pos]-'0');
  v <<= 4;
  pos++;
  if (iobuff[pos] >= 'A') v |= (iobuff[pos]-'A'+10);
  else v |= (iobuff[pos]-'0');
  return v;
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
      switch (iobuff[0]) {
        case 'T': {mode = 0; Serial.write(":\n");} break;
        case 'C': {mode = 1; ClearFrameBuffer(); Serial.write(":\n");} break;
        case 'W': {
          uint8_t addr = iohexdec(1);
          uint8_t len = ((ioptr - iobuff)-3)/2;
          if ((addr+len) > sizeof(framebuffer)) {
            len = sizeof(framebuffer) - addr;
          }
          if (addr < sizeof(framebuffer)) {
            for (uint8_t i = 0; i < len; i++) {
              framebuffer[addr+i] = iohexdec(3+i*2);
            }
          }
          Serial.write(":\n");
        } break;
        case '?': {mode=1; Serial.write(":PROTO=DemoProto\n");} break;
        default: {Serial.write("!ERR\n");} break;
      }
      ioptr = iobuff;
      break;
    }
    ioptr++;
    if (ioptr >= &iobuff[sizeof(iobuff)]) {
      ioptr = iobuff;
    }
  }
}
