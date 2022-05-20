import { ProtoFacePanel } from '@/model/ProtoFacePanel'

export class ProtoFace {
  private readonly _panels: Array<ProtoFacePanel> = [];

  public get panels () { return this._panels }

  constructor () {
    this._panels = [
      // This is for demo only
      // Nose R
      new ProtoFacePanel().moveTo(32, -50),
      // Nose L
      new ProtoFacePanel().moveTo(-32, -50),
      // Mouth L
      new ProtoFacePanel().moveTo(-128, 0),
      new ProtoFacePanel().moveTo(-96, 0),
      new ProtoFacePanel().moveTo(-64, 0),
      new ProtoFacePanel().moveTo(-32, 0),
      // Mouth R
      new ProtoFacePanel().moveTo(32, 0),
      new ProtoFacePanel().moveTo(64, 0),
      new ProtoFacePanel().moveTo(96, 0),
      new ProtoFacePanel().moveTo(128, 0),
      // Eye R
      new ProtoFacePanel().moveTo(132, -70),
      new ProtoFacePanel().moveTo(100, -70),
      // Eye L
      new ProtoFacePanel().moveTo(-100, -70),
      new ProtoFacePanel().moveTo(-132, -70)
    ]
  }

  public getNumberOfLitLEDs () : number {
    let sum = 0
    for (const panel of this.panels) {
      sum += panel.ledStates.reduce((a, v) => { return v ? a + 1 : a })
    }
    return sum
  }

  public getFullFrame () : Array<boolean> {
    const frame: Array<boolean> = []
    for (const panel of this.panels) {
      frame.push(...panel.ledStates)
    }
    return frame
  }
}
