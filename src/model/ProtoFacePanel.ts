export class ProtoFacePanel {
  x = 0;
  y = 0;
  rows = 8;
  columns = 8;
  ledSize = 3.0;
  moduleWidth = 32.0;
  moduleHeight = 32.0;

  public getLedCoordinates () {
    const leds = []
    const xStep = this.moduleWidth / (this.columns)
    const yStep = this.moduleHeight / (this.rows)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        leds.push({ x: (c + 0.5) * xStep, y: (r + 0.5) * yStep })
      }
    }
    return leds
  }

  public moveTo (x: number, y: number) {
    this.x = x
    this.y = y
    return this
  }
}
