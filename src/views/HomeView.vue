<template>
  <div class="home">
    <!--<img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>-->
    <div class="-view">
      <ProtoFaceView/>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ProtoFaceView from '@/components/ProtoFaceView.vue'
// import HelloWorld from '@/components/HelloWorld.vue' // @ is an alias to /src

export default defineComponent({
  name: 'HomeView',
  components: {
    ProtoFaceView
    // HelloWorld
  }
})
</script>

<style scoped>
.-view {
  height: 70vh;
  width: 70vw;
  margin: auto;
}
</style>
