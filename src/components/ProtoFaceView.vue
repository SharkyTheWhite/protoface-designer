<template>
  <svg xmlns="http://www.w3.org/2000/svg"
       :viewBox="`${faceSize.x} ${faceSize.y} ${faceSize.w} ${faceSize.h}`"
       :style="{background: 'black'}"
       @mouseup="mouseUp"
  >
    <g v-for="(panel, i) in panels" :key="i" :transform="`translate(${panel.x - panel.moduleWidth / 2}, ${panel.y - panel.moduleHeight / 2})`">
      <rect :height="panel.moduleHeight" :width="panel.moduleWidth" fill="#111111" stroke="#333333" stroke-width="0.5"
            @mousedown="mouseDownOnPanel()"
      />
      <circle v-for="(led, j) in panel.getLedCoordinates()" :key="j"
              :cx="led.x" :cy="led.y" :r="panel.ledSize/2" :fill="panel.getLedState(j) ? 'lime' : 'black'"
              @mouseover="mouseEnterPixel(i, j)" @mousedown="mouseDownOnPixel(i, j)"
      />
    </g>
    <line v-if="mirrorMode" x1="0" x2="0" :y1="faceSize.y" :y2="faceSize.y+faceSize.w"
          stroke="cyan" stroke-width="0.5" />
  </svg>
</template>

<script setup lang="ts">
import { ProtoFace } from '@/model/ProtoFace'
import { computed, defineEmits, defineProps, reactive } from 'vue'

const props = defineProps<{
  face: ProtoFace,
  mirrorMode?: boolean
}>()

const emit = defineEmits<{(e: 'ledsUpdated'): void }>()

const panels = reactive(props.face.panels)

function internalSetPixel (panelIndex: number, ledIndex: number, color: boolean) {
  panels[panelIndex].setLedState(ledIndex, color)
  if (props.mirrorMode) {
    // Hardcoded for Demo
    const flipColumnIndex = (i: number) => {
      let c = i & 7
      c = 7 - c
      return (i & ~7) | c
    }
    if (panelIndex < 8) panels[7 - panelIndex].setLedState(flipColumnIndex(ledIndex), color)
    else panels[(13 - panelIndex) + 8].setLedState(flipColumnIndex(ledIndex), color)
  }
}

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
    internalSetPixel(panelIndex, ledIndex, mode.color)
    emit('ledsUpdated')
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
    xMin = Math.min(xMin, panel.x - panel.moduleWidth / 2)
    yMin = Math.min(yMin, panel.y - panel.moduleHeight / 2)
    xMax = Math.max(xMax, panel.x + panel.moduleWidth / 2)
    yMax = Math.max(yMax, panel.y + panel.moduleHeight / 2)
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
