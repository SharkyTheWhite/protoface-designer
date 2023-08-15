<template>
  <div class="home">
    <!--<img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>-->
    <div>
      <label><input type="checkbox" v-model="mirrorMode" /> Mirror Mode</label>
      &middot;
    </div>
    <div class="-view">
      <ProtoFaceView :face="store.face" :mirror-mode="mirrorMode" @ledsUpdated="onFaceLedUpdated"/>
    </div>
    <div>
      <div>
        <a download="face.h" :href="faceHDataURI">Save <code>face.h</code> File ...</a>
        &middot;
        <input type="file" @change="openHFileFromInput" ref="openHFileInput" style="visibility: hidden; width: 0; height: 0;" />
        <span @click="openHFileDialog">Open <code>face.h</code> File ...</span>
        &middot;
        <label><input type="checkbox" v-model="showFaceH"> Show face.h content</label>
        <br><br>
        <span>A total of <b>{{ store.totalLedsOn }} LEDs are lit</b></span>
      </div>
      <div v-if="isConnected">
        <span style="color:darkgreen;"><br>Connected to: <b>{{ protoName }}</b></span>
        &middot;
        <button v-if="serialSupported & isConnected" @click="disconnectProto">Disonnect Protogen</button>
        Brightness:
        <input type="range" min="0" max="256" step="16" v-model.number="brightnessSlider">
        <br>
        <span>Status: {{ serialUpdateRequired ? 'Changed' : (serialUpdateInProgress ? 'Updating' : 'OK') }}</span>
      </div>
      <div v-else-if="isConnecting">
        <span v-if="!serialError" style="color:darkgoldenrod;"><br>Connecting ...</span>
        <span v-else style="color:red;"><br>Connecting failed!</span>
        &middot;
        <button @click="disconnectProto">Cancel / Disonnect</button>
      </div>
      <div v-else>
        <button v-if="serialSupported" @click="connectSerialPort">Connect Proto via Serial Port</button>
        <em v-else style="color: gray;">(Serial Port not supported by Browser)</em>
        &middot;
        <button v-if="bluetoothSupported" @click="connectBluetooth">Connect Proto via Bluetooth</button>
        <em v-else style="color: gray;">(Bluetooth not supported by Browser)</em>
      </div>
      <div v-if="serialError" style="color:red; margin-top: 1em; font-weight: bold;">{{ serialError }}</div>
    </div>
    <div v-if="showFaceH" style="font-family: monospace; font-size: 10px; text-align: left; margin: 1em 5vw; background: lavender; padding: 1em;">
      <b>Face.h Content:</b><br>
      <pre>{{ faceHData }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProtoFaceView from '@/components/ProtoFaceView.vue'
import { computed, ref, watch } from 'vue'
import { FaceH } from '@/model/FaceH'
import { ProtoSerial } from '@/hardware/ProtoSerial'
import { ProtoGATT } from '@/hardware/ProtoGATT'
import { Proto } from '@/hardware/Proto'
import { useStore } from '@/store'

const store = useStore()

const faceH = new FaceH()

faceH.protoFace = store.face

const faceHData = computed(() => {
  return faceH.getHFileContent()
})

const faceHDataURI = computed(() => {
  return 'data:text/plain;base64,' + btoa(faceHData.value)
})

const openHFileInput = ref<HTMLInputElement>()
function openHFileDialog () {
  openHFileInput.value?.click()
}

async function openHFileFromInput () {
  const control = openHFileInput.value
  if (!control || control.files?.length !== 1) return
  const file = control.files[0]
  const text = await file.text()
  control.value = '' // Clear field, so we can reuse it to open the same file again
  const arrays = [...FaceH.parseFaceH(text)]

  if (!arrays.length) {
    alert('Could not find any patterns in the file you uploaded.')
    return
  }
  let i = 0
  if (arrays.length > 1) {
    const choice = arrays.reduce((x, v, i) => x + `\n${i}: ${v[0]}`, 'Please choose:')
    i = parseInt(prompt(choice) ?? '0')
  }
  if (i >= 0 && i < arrays.length) {
    const pattern = arrays[i][1]
    const frame = FaceH.unpackBitmapToBooleanStates(pattern)
    store.face.setFullFrame(frame)
  } else {
    alert('Invalid selection!')
  }
}

const serialSupported = ProtoSerial.isBrowserSupported()
const bluetoothSupported = ProtoGATT.isBrowserSupported()

const serialUpdateRequired = ref(true)
const serialUpdateInProgress = ref(false)
const serialError = ref('')

const brightnessSlider = ref(32)

const mirrorMode = ref(false)

const showFaceH = ref(false)

declare global {
  interface Window {
    protofaceDesignerConnectedProto?: Proto
  }
}

watch(brightnessSlider, () => {
  updateSerialProto()
})

function updateSerialProto () {
  const proto = window.protofaceDesignerConnectedProto

  serialUpdateRequired.value = true
  if (!proto || !proto.isConnected || serialUpdateInProgress.value) return
  serialUpdateInProgress.value = true
  serialUpdateRequired.value = false
  proto.setBrightness(brightnessSlider.value).then(() => {
    proto.writeFrame(store.face.getFullFrame()).catch((reason) => {
      serialError.value = reason.message
    }).then(() => {
      serialError.value = ''
      serialUpdateInProgress.value = false
      if (serialUpdateRequired.value) {
        updateSerialProto()
      }
    })
  })
}

function onFaceLedUpdated () {
  updateSerialProto()
}

const isConnecting = ref(false)
const _initialConnected = window.protofaceDesignerConnectedProto && window.protofaceDesignerConnectedProto.isConnected
const isConnected = ref(_initialConnected)
const _initialProtoName = window.protofaceDesignerConnectedProto?.name ?? ''
const protoName = ref(_initialProtoName)

if (_initialConnected) setInterval(updateSerialProto, 500)

function _connectProto () {
  const proto = window.protofaceDesignerConnectedProto
  if (!proto) return
  isConnecting.value = true
  serialError.value = ''

  proto.addEventListener('connected', () => {
    isConnected.value = true
    isConnecting.value = false
    protoName.value = proto.name ?? ''
    proto.enterControlMode().catch((reason) => {
      serialError.value = reason.message
    }).then(() => updateSerialProto())
  })

  proto.addEventListener('disconnected', () => {
    isConnected.value = false
    isConnecting.value = false
  })

  proto.connect().catch((reason: DOMException) => {
    serialError.value = reason.message
  })
}

function connectSerialPort () {
  let proto = window.protofaceDesignerConnectedProto
  if (proto && !isConnected.value) proto.disconnect()
  proto = new ProtoSerial()
  window.protofaceDesignerConnectedProto = proto
  _connectProto()
}

function connectBluetooth () {
  let proto = window.protofaceDesignerConnectedProto
  if (proto && !isConnected.value) proto.disconnect()
  proto = new ProtoGATT()
  window.protofaceDesignerConnectedProto = proto
  _connectProto()
}

function disconnectProto () {
  const proto = window.protofaceDesignerConnectedProto
  proto?.disconnect().catch((/* reason: DOMException */) => {
    // console.log({ ProtoSerialDisconnectError: reason.message })
  })
  isConnected.value = false
  isConnecting.value = false
  window.protofaceDesignerConnectedProto = undefined
  serialError.value = ''
}

</script>

<style scoped lang="scss">
.-view {
  margin: auto;
  svg {
    max-height: 70vh;
    max-width: 95vw;
  }
}
</style>
