<template>
  <div class="home">
    <!--<img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>-->
    <div>
      <label><input type="checkbox" v-model="mirrorMode" /> Mirror Mode</label>
      &middot;
    </div>
    <div class="-view">
      <ProtoFaceView :face="face" :mirror-mode="mirrorMode" @ledsUpdated="onFaceLedUpdated"/>
    </div>
    <div>
      <div>
        <a download="face.h" :href="faceHDataURI">Save <code>face.h</code> File ...</a>
        <br><br>
        <span>A total of <b>{{ totalLedsOn }} LEDs are lit</b></span>
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
  </div>
</template>

<script setup lang="ts">
import ProtoFaceView from '@/components/ProtoFaceView.vue'
import { computed, ref, watch } from 'vue'
import { FaceH } from '@/model/FaceH'
import { ProtoSerial } from '@/hardware/ProtoSerial'
import { ProtoFace } from '@/model/ProtoFace'
import { ProtoGATT } from '@/hardware/ProtoGATT'
import { Proto } from '@/hardware/Proto'

const face = new ProtoFace()

const faceH = new FaceH()

const faceHDataURI = computed(() => {
  const content = faceH.getHFileContent()
  return 'data:text/plain;base64,' + btoa(content)
})

const serialSupported = ProtoSerial.isBrowserSupported()
const bluetoothSupported = ProtoGATT.isBrowserSupported()

const totalLedsOn = ref(-1)

const serialUpdateRequired = ref(true)
const serialUpdateInProgress = ref(false)
const serialError = ref('')

const brightnessSlider = ref(32)

const mirrorMode = ref(false)

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
    proto.writeFrame(face.getFullFrame()).catch((reason) => {
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
  totalLedsOn.value = face.getNumberOfLitLEDs()
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
  proto?.disconnect().catch((reason: DOMException) => {
    console.log({ ProtoSerialDisconnectError: reason.message })
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
