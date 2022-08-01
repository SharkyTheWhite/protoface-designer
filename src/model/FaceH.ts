import { useStore } from '@/store'

export class FaceH {
  private projectData : object = {
    generator: 'io.github.sharkythewhite.protoface-designer',
    version: '0.0.1'
  };

  private readonly store = useStore()

  public getHFileContent () : string {
    return `${this.getHeader()}

#ifndef PROTOFACE_H
#define PROTOFACE_H

${this.getCDefinitons()}

${this.getCData()}

#endif

// --- PROJECT DATA FOLLOWING, DO NOT EDIT ---
/*!! PROJECT DATA <--
${this.getProjectJSON()}
--> */

`
  }

  public getHeader () : string {
    return `/**
 * Generated using ProtoFace Designer
 *** DO NOT EDIT BY HAND! ***
 * Use https://sharkythewhite.github.io/protoface-designer/
 */`
  }

  public getProjectJSON () : string {
    return JSON.stringify(this.projectData, null, 0)
  }

  protected getCDefinitons () : string {
    return `
#include <stdint.h>

#ifndef PROTOFACE_INT
#define PROTOFACE_INT int
#endif

#ifndef PROTOFACE_BITMAP_SPEC
#define PROTOFACE_BITMAP_SPEC(name) const uint8_t name[]
#endif

#define PROTOFACE_MODULE_COUNT ${14}


`
  }

  public static getCName (name: string) : string {
    return name.replaceAll(' ', '_').toLowerCase()
  }

  public static getCHexIntBlock (data: number[], indent = '', wrapCount = 8) : string {
    let str = ''
    for (let i = 0; i < data.length; i++) {
      str += `0x${data[i].toString(16).padStart(2, '0').toUpperCase()},${(i % wrapCount) >= (wrapCount - 1) ? ('\n' + indent) : ' '}`
    }
    return str
  }

  public static parseCIntBlock (source: string, allowDecimal = true) : number[] {
    const parsePattern = allowDecimal ? /\s*(\d+|0x[\dA-Fa-f]+)\s*(?:,|$)/ig : /\s*(0x[\dA-Fa-f]+)\s*(?:,|$)/ig
    let limitDataCount = 1000
    let bodyMatch
    const data : number[] = []
    while (--limitDataCount && (bodyMatch = parsePattern.exec(source)) !== null) {
      data.push(parseInt(bodyMatch[1]))
    }
    return data
  }

  public static * parseFaceH (fileContent: string, allowNativeArrays = true) : Generator<[string, number[]]> {
    /* INTERMEDIATE CODE!
       Scan for well-formatted byte arrays written in decimal or hex as exported by us.
       We accept native arrays of 8-bit integer types (when allowNativeArrays) or our specification macro format.
       Result: nameNative|nameSpec hold the name, dataBody is parsed further.
     */
    const searchPatternForArrays = /(?:(?:u?int8_t|char|byte)\s+(?<nameNative>[a-z_][a-z\d_]*)\s*\[[\s\d]*]|PROTOFACE_BITMAP_SPEC\s*\((?<nameSpec>[a-z_][a-z\d_]*)\))\s*=\s*{(?<dataBody>(?:\s*(\d{1,3}|0x[\dA-Fa-f]{1,2})\s*,)+(?:\d{1,3}|0x[\dA-Fa-f]{1,2})?)\s*}\s*;/ig

    let limitPatternCount = 1000

    let arrayMatch
    while (--limitPatternCount && (arrayMatch = searchPatternForArrays.exec(fileContent)) !== null) {
      if (!arrayMatch.groups) continue
      const patternName = arrayMatch.groups.nameSpec ?? (allowNativeArrays ? arrayMatch.groups.nameNative : null)
      const patternBody = arrayMatch.groups.dataBody
      if (!patternName || !patternBody) continue
      const patternData = FaceH.parseCIntBlock(patternBody)
      yield [patternName, patternData]
    }
  }

  public static packBooleanStateToBitmap (frame : Array<boolean>): Array<number> {
    const buffer : Array<number> = []
    for (let i = 0; i < frame.length; i += 8) {
      let byte = 0
      for (let k = 0; k < 8; k++) {
        if (frame[i + k]) byte += (1 << k)
      }
      buffer.push(byte)
    }
    return buffer
  }

  public static unpackBitmapToBooleanStates (bitmap : number[]): boolean[] {
    const buffer : boolean[] = []
    for (const line of bitmap) {
      for (let k = 0; k < 8; k++) {
        buffer.push((line & (1 << k)) !== 0)
      }
    }
    return buffer
  }

  protected getCData () : string {
    const bitmaps = []
    if (this.store.face) {
      bitmaps.push({
        name: 'Face 1',
        data: FaceH.packBooleanStateToBitmap(this.store.face.getFullFrame())
      })
    }
    let str = ''
    for (const bitmap of bitmaps) {
      str += `
// Bitmap "${bitmap.name}"
PROTOFACE_BITMAP_SPEC(${FaceH.getCName(bitmap.name)}) = {
  ${FaceH.getCHexIntBlock(bitmap.data, '  ')}
};
`
    }
    return str
  }
}
