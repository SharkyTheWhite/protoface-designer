# Get Started with ProtoFace for Arduino

***:warning: This project is in early development - limited functionality, unstable code! :warning:***

The most current prototype is in [bluetooth_proto_3](bluetooth_proto_3).
I made this version for a friend of mine who already successfully integrated into his fursuit head.

The code is somewhat self documenting but in an early proof-of-concept phase.
Better documentation and a more generic version are planned for the future.

---

## Preparation

This is only required once per machine you want to develop on.

### Install Arduino IDE

If you do not have it yet, you can download and install the the Arduino IDE 
from the [arduino.cc](https://www.arduino.cc/en/software) website.

This tutorial has been tested with _Arduino 1.8.19_ on _Windows 11_.

### Add the ESP32 Board Dependencies

Add the Espressif board list json as explained in the manual at
[docs.espressif.com/projects/arduino-esp32](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html).

Install the **esp32** Board library.
This tutorial has been tested with version _2.0.4_ of that board package.

## Selecting the Board

Every time you switch to working on this project (e.g. first time or when switching from another board).

For my development I use an older ESP32 Dev Board (*ESP32_Core_board_V2* is printed on the backside)
with an **ESP-WROOM-32** Module on it.

My Arduino Board settings used:
- Board: "ESP32 Dev Module"
- Upload Speed: "921600"
- CPU Frequency: "240MHz (WiFi/BT)"
- Flash Frequency: "80MHz"
- Flash Mode: "QIO"
- Flash Size: "4MB (32Mb)"
- Partition Scheme: "Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)"
- Core Debug Level: "None"
- PSRAM: "Disabled"
- Arduino Runs On: "Core 1"
- Events Run On: "Core 1"






