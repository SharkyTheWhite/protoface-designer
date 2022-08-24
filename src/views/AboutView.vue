<template>
  <div class="about">
    <h1>ProtoFace Designer</h1>
    <p>
      A tool to easily create facial expressions for your pixel-based visor.<br>
      <a href="https://github.com/SharkyTheWhite/protoface-designer">Show project on GitHub</a>
    </p>
    <p class="warning">Draft Project - limited functionality - use at your own risk</p>
    <p>
      Use this QR Code to start the ProtoFace Designer from github pages:<br>
      <img alt="QR Code to start ProtoFace Designer" :src="require('@/assets/ghpages-qrcode.png')" class="qrcode"><br>
      QR-Code Links to: <a href="https://sharkythewhite.github.io/protoface-designer/">sharkythewhite.github.io/protoface-designer</a>
    </p>
  </div>
</template>

<style scoped>
.warning {
  color: crimson; font-weight: bold; font-style: italic
}
.qrcode {
  width: 80vw;
  height: 80vh;
  max-height: 20em;
  max-width: 20em;
  object-fit: contain;
}
</style>
