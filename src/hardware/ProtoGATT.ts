import { Proto } from '@/hardware/Proto'

/**
 * @class ProtoGATT
 * @brief Handle connection to Hardware via client-side bluetooth low energy GATT
 */
export class ProtoGATT extends Proto {
  public static isBrowserSupported () : boolean {
    return 'bluetooth' in navigator
  }

  static readonly UUIDService = 'c6bcb95f-a2d6-46c7-bc16-e7fa574f8066'
  static readonly UUIDCharacteristic = '21ec8f97-a2a8-4c8f-aeb9-fd30959d4ca5'

  private enc = new TextEncoder()
  private dec = new TextDecoder()

  // Also gives access to the device via gatt.device
  private gatt?: BluetoothRemoteGATTServer
  // Also gives access to service by characteristic.service
  private characteristic?: BluetoothRemoteGATTCharacteristic

  public async connect () {
    if (this.isConnected) await this.disconnect()
    await navigator.bluetooth.requestDevice({
      filters: [{ services: [ProtoGATT.UUIDService] }]
    }).then(async (device: BluetoothDevice) => {
      if (!device.gatt) throw Error('Expected GATT on device but got none.')
      const gatt = await device.gatt.connect()
      const service = await gatt.getPrimaryService(ProtoGATT.UUIDService)
      const characteristic = await service.getCharacteristic(ProtoGATT.UUIDCharacteristic)
      await characteristic.writeValueWithResponse(this.enc.encode('?'))
      const response = await characteristic.readValue()
      const nameInfo = this.dec.decode(response)
      // Check if Name is valid
      if (nameInfo.startsWith(':PROTO=')) {
        // Add an event handler for the hardware disconnect
        device.addEventListener('gattserverdisconnected', () => {
          this.gatt = undefined
          this.characteristic = undefined
          this.name = undefined
          this.emitDisconnected()
        })
        this.name = nameInfo.substring(7).trimEnd()
        this.gatt = gatt
        this.characteristic = characteristic
        this.emitConnected()
      } else {
        // Forward error to catch below
        // noinspection ExceptionCaughtLocallyJS
        throw new Error('Incompatible Proto. Got ' + nameInfo)
      }
    }).catch((reason) => {
      console.log(`ProtoGATT Connect Failed: ${reason}`)
    })
  }

  public async disconnect () {
    if (!this.gatt) return
    try {
      // If possible, send proto back into test mode
      await this.sendCommand('T')
    } catch (e) {
      // ignore
    }
    this.gatt.disconnect()
    this.gatt = undefined
    this.characteristic = undefined
    this.name = undefined
    this.emitDisconnected()
  }

  get isConnected (): boolean {
    return !!(this.gatt)
  }

  protected get frameWriteBlockSize () { return 128 }

  protected async sendCommand (command: string) {
    if (!this.characteristic) throw new Error('Proto not connected')
    await this.characteristic.writeValueWithResponse(this.enc.encode(command))
    const response = await this.characteristic.readValue()
    return this.dec.decode(response)
  }
}
