import { ProtoFacePanel } from '@/model/ProtoFacePanel'

export class ProtoFace {
  private readonly _panels: Array<ProtoFacePanel> = [];

  public get panels () { return this._panels }

  constructor () {
    this._panels = [
      // This is static for now. L and R looking face-on at proto
      // Mouth L RR
      new ProtoFacePanel().moveTo(-128, 0).mappingRotate(true),
      new ProtoFacePanel().moveTo(-96, 0).mappingRotate(true),
      new ProtoFacePanel().moveTo(-64, 0).mappingRotate(true),
      new ProtoFacePanel().moveTo(-32, 0).mappingRotate(true),
      // Mouth R RR
      new ProtoFacePanel().moveTo(32, 0).mappingRotate(true),
      new ProtoFacePanel().moveTo(64, 0).mappingRotate(true),
      new ProtoFacePanel().moveTo(96, 0).mappingRotate(true),
      new ProtoFacePanel().moveTo(128, 0).mappingRotate(true),
      // Eye R RL
      new ProtoFacePanel().moveTo(132, -70).mappingRotate(false),
      new ProtoFacePanel().moveTo(100, -70).mappingRotate(false),
      // Nose R RL
      new ProtoFacePanel().moveTo(32, -50).mappingRotate(false),
      // Nose L RL
      new ProtoFacePanel().moveTo(-32, -50).mappingRotate(false),
      // Eye L RL
      new ProtoFacePanel().moveTo(-100, -70).mappingRotate(false),
      new ProtoFacePanel().moveTo(-132, -70).mappingRotate(false)
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

  public setFullFrame (frame : boolean[]) {
    let i = 0
    for (const panel of this.panels) {
      for (const k in panel.ledStates) {
        panel.ledStates[k] = frame[i++]
      }
    }
  }
}
