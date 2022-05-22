export class ProtoFacePanel {
  x = 0;
  y = 0;
  rows = 8;
  columns = 8;
  ledSize = 3.0;
  moduleWidth = 32.0;
  moduleHeight = 32.0;

  ledStates = Array(this.rows * this.columns);

  public readonly mapping = {
    swapRowColumn: true,
    flipRows: false,
    flipColumns: false
  }

  constructor () {
    this.ledStates.fill(false)
  }

  public getLedCoordinates () {
    const leds = []
    const xStep = this.moduleWidth / (this.columns)
    const yStep = this.moduleHeight / (this.rows)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        let rr = r
        let cc = c
        if (this.mapping.flipRows) rr = this.rows - r - 1
        if (this.mapping.flipColumns) cc = this.columns - c - 1
        if (this.mapping.swapRowColumn) {
          const t = cc
          cc = rr
          rr = t
        }
        leds.push({ x: (cc + 0.5) * xStep, y: (rr + 0.5) * yStep })
      }
    }
    return leds
  }

  public moveTo (x: number, y: number) {
    this.x = x
    this.y = y
    return this
  }

  public mappingRotate (right: boolean) {
    if (this.mapping.swapRowColumn === right) this.mapping.flipRows = !this.mapping.flipRows
    else this.mapping.flipColumns = !this.mapping.flipColumns
    this.mapping.swapRowColumn = !this.mapping.swapRowColumn
    return this
  }

  public getLedState (index: number): boolean {
    return this.ledStates[index]
  }

  public setLedState (index: number, value: boolean) {
    this.ledStates[index] = value
  }
}
