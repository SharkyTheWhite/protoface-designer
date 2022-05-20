<template>
  <div class="home">
    <!--<img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>-->
    <div class="-view">
      <ProtoFaceView :face="face" @ledsUpdated="onFaceLedUpdated"/>
    </div>
    <div>
      <a download="face.h" :href="faceHDataURI">Save <code>face.h</code> File ...</a>
      <br><br>
      <button v-if="serialSupported & isConnected" @click="disconnectSerialPort">Disonnect Serial Port</button>
      <button v-else-if="serialSupported" @click="connectSerialPort">Connect Serial Port</button>
      <em v-else style="color: gray;">(Serial Port not supported by Browser)</em>
      <span v-if="isConnected"><br>Connected to: <b>{{ proto.name }}</b></span>
      <br><br>
      <span>A total of <b>{{ totalLedsOn }} LEDs are lit</b></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProtoFaceView from '@/components/ProtoFaceView.vue'
import { computed, ref } from 'vue'
import { FaceH } from '@/model/FaceH'
import { ProtoSerial } from '@/hardware/ProtoSerial'
import { ProtoFace } from '@/model/ProtoFace'

const face = new ProtoFace()

const faceH = new FaceH()

const faceHDataURI = computed(() => {
  const content = faceH.getHFileContent()
  return 'data:text/plain;base64,' + btoa(content)
})

const serialSupported = ProtoSerial.isBrowserSupported()

const proto = new ProtoSerial()

const totalLedsOn = ref(-1)

let serialUpdateRequired = true
let serialUpdateInProgress = false

function updateSerialProto () {
  serialUpdateRequired = true
  if (!proto.isConnected || serialUpdateInProgress) return
  serialUpdateInProgress = true
  serialUpdateRequired = false
  proto.writeFrame(face.getFullFrame(), 0, 64).finally(() => {
    serialUpdateInProgress = false
    if (serialUpdateRequired) {
      updateSerialProto()
    }
  })
}

function onFaceLedUpdated () {
  totalLedsOn.value = face.getNumberOfLitLEDs()
  updateSerialProto()
}

const isConnected = ref(false)

proto.addEventListener('connected', () => {
  isConnected.value = proto.isConnected; updateSerialProto()
})

proto.addEventListener('disconnected', () => {
  isConnected.value = proto.isConnected
})

function connectSerialPort () {
  proto.connect().catch((reason: DOMException) => {
    console.log({ ProtoSerialConnectError: reason.message })
  })
}

function disconnectSerialPort () {
  proto.disconnect().catch((reason: DOMException) => {
    console.log({ ProtoSerialDisconnectError: reason.message })
  })
}

</script>

<style scoped>
.-view {
  height: 70vh;
  width: 95vw;
  margin: auto;
}
</style>
