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
