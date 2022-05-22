/**
 * @class Proto
 * @brief Base class for a connected proto
 */
export abstract class Proto extends EventTarget {
  public name?: string

  private _connected: Event = new Event('connected')
  private _disconnected: Event = new Event('disconnected')

  abstract get isConnected () : boolean

  abstract connect () : Promise<void>
  abstract disconnect () : Promise<void>

  protected get frameWriteBlockSize () { return 4 }

  public async writeFrame (frame: Array<boolean>, offset = 0, length?:number) {
    if (!this.isConnected) throw new Error('Proto not connected')
    if (undefined === length) {
      length = frame.length - offset
    }
    if (length < 0) return
    if (offset >= frame.length) return
    if (offset % 8 !== 0) throw new Error('Offset must be multiple of 8 or zero')

    const buffer : Array<number> = []
    for (let i = 0; i < length; i += 8) {
      let byte = 0
      for (let k = 0; k < 8; k++) {
        if (frame[i + k]) byte += (1 << k)
      }
      buffer.push(byte)
    }
    const blockSize = this.frameWriteBlockSize
    for (let i = 0; i < buffer.length; i += blockSize) {
      let cmd = 'W' + (i + offset).toString(16).toUpperCase().padStart(2, '0')
      for (let k = 0; k < blockSize && k + i < buffer.length; k++) {
        cmd += buffer[i + k].toString(16).toUpperCase().padStart(2, '0')
      }
      const result = await this.sendCommand(cmd)
      if (result.trim() !== ':W') throw new Error('Proto did not ACK write command: ' + result)
    }
  }

  public async enterControlMode () {
    if ((await this.sendCommand('C\n')).trim() !== ':C') throw Error('Cannot enter control mode')
  }

  public async setBrightness (brightness: number) {
    console.log({ brightness })
    if (brightness < 0) brightness = 0
    if (brightness > 255) brightness = 255
    const bri = brightness.toString(16).toUpperCase().padStart(2, '0')
    if ((await this.sendCommand('B' + bri + '\n')).trim() !== ':B') throw Error('Cannot change brightness')
  }

  protected abstract sendCommand(command: string) : Promise<string>

  protected emitConnected () : void {
    this.dispatchEvent(this._connected)
  }

  protected emitDisconnected () : void {
    this.dispatchEvent(this._disconnected)
  }
}
