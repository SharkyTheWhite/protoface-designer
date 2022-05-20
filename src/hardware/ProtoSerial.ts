export class ProtoSerial extends EventTarget {
  private port?: SerialPort
  private writer?: WritableStreamDefaultWriter
  public name?: string

  private enc = new TextEncoder()

  private _connected: Event = new Event('connected')
  private _disconnected: Event = new Event('disconnected')

  public static isBrowserSupported () : boolean {
    return 'serial' in navigator
  }

  public get isConnected () : boolean {
    return !!this.port
  }

  /**
   * @brief Asynchronously read a line from the serial stream.
   *
   * This promise returns the decoded line read from the stream.
   * A line must contain something - i.e. we will wait until there is a
   * newline ('\n') which is not the first byte received so far.
   *
   * @param stream The Serial.readable
   * @param timeout An optional timeout in milliseconds
   * @private
   */
  private static async readLine (stream: ReadableStream, timeout?: number) {
    const reader = stream.getReader()
    let cancel = false
    let buffer = ''
    const decoder = new TextDecoder()
    return new Promise<string>((resolve, reject) => {
      let timeoutHandle : number
      if (timeout) {
        timeoutHandle = setTimeout(async () => {
          cancel = true
          try {
            await reader.cancel()
          } finally {
            reader.releaseLock()
          }
          reject(new Error('Timeout, partial String:' + buffer))
        }, timeout)
      }
      const readLoop = (result: ReadableStreamDefaultReadResult<BufferSource>) => {
        if (cancel) return
        if (result.done) {
          if (timeout) clearTimeout(timeoutHandle)
          reader.releaseLock()
          reject(new Error('Unexpected end of stream'))
        }
        buffer += decoder.decode(result.value)
        if (buffer.lastIndexOf('\n') > 0) {
          if (timeout) clearTimeout(timeoutHandle)
          reader.releaseLock()
          resolve(buffer)
        } else reader.read().then(readLoop).catch(reject)
      }
      reader.read().then(readLoop).catch(reject)
    })
  }

  public async disconnect () {
    if (!this.port) return
    try {
      // If possible, send proto back into test mode
      await this.writer?.write(this.enc.encode('T\n'))
    } finally {
      this.writer?.releaseLock()
      await this.port?.close()
    }
    this.port = undefined
    this.writer = undefined
    this.name = undefined
    this.dispatchEvent(this._disconnected)
  }

  public async writeFrame (frame: Array<boolean>, offset = 0, length?:number) {
    if (!this.port) throw new Error('Proto not connected')
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
    const blockSize = 4
    for (let i = 0; i < buffer.length; i += blockSize) {
      let cmd = 'W' + (i + offset).toString(16).toUpperCase().padStart(2, '0')
      for (let k = 0; k < blockSize && k + i < buffer.length; k++) {
        cmd += buffer[i + k].toString(16).toUpperCase().padStart(2, '0')
      }
      await this.writer?.write(this.enc.encode(cmd + '\n'))
      const result = await ProtoSerial.readLine(this.port.readable, 1000)
      if (result.trim() !== ':') throw new Error('Proto did not ACK write command: ' + result)
    }
  }

  public async connect () {
    if (this.isConnected) await this.disconnect()
    await navigator.serial.requestPort({
      filters: [
        { usbVendorId: 0x2341 } // Arduino
      ]
    }).then(async (port) => {
      await port.open({
        baudRate: 460800,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      }).then(async () => {
        // If we cannot get a writer, we cannot do anything
        let wr
        try {
          wr = port.writable.getWriter()
        } catch (error) {
          await port.close()
          throw error
        }
        // Communicate with potential proto
        try {
          // Make some Dummy-IO to flush out any residue
          try {
            await wr.write(this.enc.encode('\n\n'))
            await ProtoSerial.readLine(port.readable, 10000)
          } finally {
            // ignore initial read
          }

          // Enter controlled mode, clear Framebuffer
          await wr.write(this.enc.encode('C\n'))
          await ProtoSerial.readLine(port.readable, 10000)

          // Read Proto Info
          await wr.write(this.enc.encode('?\n'))
          const nameInfo = (await ProtoSerial.readLine(port.readable, 2000)).trim()

          // Check if Name is valid
          if (nameInfo.startsWith(':PROTO=')) {
            // Add an event handler for the hardware disconnect
            port.addEventListener('disconnect', this.disconnect)
            this.name = nameInfo.substring(7).trimEnd()
            this.writer = wr
            this.port = port
            this.dispatchEvent(this._connected)
          } else {
            // Forward error to catch below
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Incompatible Proto')
          }
        } catch (error) {
          // In case of communication errors, try to send back into test mode
          try {
            await wr.write(this.enc.encode('T\n'))
          } finally {
            wr.releaseLock()
          }
          await port.close()
          throw error
        }
      })
    })
  }
}
