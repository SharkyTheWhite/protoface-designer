import { Proto } from '@/hardware/Proto'

/**
 * @class ProtoSerial
 * @brief Handle connection to Hardware via client-side serial port
 */
export class ProtoSerial extends Proto {
  private port?: SerialPort
  private writer?: WritableStreamDefaultWriter

  private enc = new TextEncoder()

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
    this.emitDisconnected()
  }

  protected async sendCommand (command: string) {
    if (!this.port) throw new Error('Proto not connected')
    await this.writer?.write(this.enc.encode(command + '\n'))
    return await ProtoSerial.readLine(this.port.readable, 1000)
  }

  public async connect () {
    if (this.isConnected) await this.disconnect()
    await navigator.serial.requestPort({
      filters: [
        // { usbVendorId: 0x2341 } // Arduino
      ]
    }).then(async (port) => {
      await port.open({
        baudRate: 115200, // 460800,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
        bufferSize: 128
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
            for (let i = 0; i < 16; i++) {
              await ProtoSerial.readLine(port.readable, 200)
            }
          } catch (e) {
            // ignore initial read
          }

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
            this.emitConnected()
          } else {
            // Forward error to catch below
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Incompatible Proto. Got ' + nameInfo)
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
