<template>
  <svg xmlns="http://www.w3.org/2000/svg"
       :viewBox="`${faceSize.x} ${faceSize.y} ${faceSize.w} ${faceSize.h}`"
       :style="{background: 'black'}"
       @mouseup="mouseUp"
  >
    <g v-for="(panel, i) in panels" :key="i" :transform="`translate(${panel.x}, ${panel.y})`">
      <rect :height="panel.moduleHeight" :width="panel.moduleWidth" fill="#111111" stroke="#333333" stroke-width="0.5"
            @mousedown="mouseDownOnPanel()"
      />
      <circle v-for="(led, j) in panel.getLedCoordinates()" :key="j"
              :cx="led.x" :cy="led.y" :r="panel.ledSize/2" :fill="panel.getLedState(j) ? 'lime' : 'black'"
              @mouseover="mouseEnterPixel(i, j)" @mousedown="mouseDownOnPixel(i, j)"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { ProtoFacePanel } from '@/model/ProtoFacePanel'
import { computed, reactive } from 'vue'

const panels = reactive([
  // This is for demo only
  new ProtoFacePanel().moveTo(-128, 0),
  new ProtoFacePanel().moveTo(-96, 0),
  new ProtoFacePanel().moveTo(-64, 0),
  new ProtoFacePanel().moveTo(-32, 0),

  new ProtoFacePanel().moveTo(32, 0),
  new ProtoFacePanel().moveTo(64, 0),
  new ProtoFacePanel().moveTo(96, 0),
  new ProtoFacePanel().moveTo(128, 0),

  new ProtoFacePanel().moveTo(132, -70),
  new ProtoFacePanel().moveTo(100, -70),

  new ProtoFacePanel().moveTo(32, -50),

  new ProtoFacePanel().moveTo(-32, -50),

  new ProtoFacePanel().moveTo(-100, -70),
  new ProtoFacePanel().moveTo(-132, -70)
])

function mouseDownOnPixel (panelIndex: number, ledIndex: number) {
  mode.drawing = true
  mode.color = !panels[panelIndex].getLedState(ledIndex)
  mouseEnterPixel(panelIndex, ledIndex)
}

function mouseDownOnPanel () {
  mode.drawing = true
  mode.color = true
}

function mouseUp () {
  mode.drawing = false
}

function mouseEnterPixel (panelIndex: number, ledIndex: number) {
  if (mode.drawing) {
    panels[panelIndex].setLedState(ledIndex, mode.color)
  }
}

const mode = reactive({
  drawing: false,
  color: false
})

const faceSize = computed(() => {
  let xMin = 0.0
  let yMin = 0.0
  let xMax = 0.0
  let yMax = 0.0
  const margin = 3.0
  for (const panel of panels) {
    xMin = Math.min(xMin, panel.x)
    yMin = Math.min(yMin, panel.y)
    xMax = Math.max(xMax, panel.x + panel.moduleWidth)
    yMax = Math.max(yMax, panel.y + panel.moduleHeight)
  }
  return {
    x: xMin - margin,
    y: yMin - margin,
    w: xMax - xMin + 2 * margin,
    h: yMax - yMin + 2 * margin
  }
})

</script>

<style scoped>

</style>
