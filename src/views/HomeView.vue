<template>
  <div class="home">
    <!--<img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>-->
    <div class="-view">
      <ProtoFaceView/>
    </div>
    <div>
      <a download="face.h" :href="faceHDataURI">Save <code>face.h</code> File ...</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProtoFaceView from '@/components/ProtoFaceView.vue'
import { computed } from 'vue'
import { FaceH } from '@/model/FaceH'

const faceH = new FaceH()

const faceHDataURI = computed(() => {
  const content = faceH.getHFileContent()
  return 'data:text/plain;base64,' + btoa(content)
})

</script>

<style scoped>
.-view {
  height: 70vh;
  width: 95vw;
  margin: auto;
}
</style>
