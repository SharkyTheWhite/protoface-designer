# ProtoFace Designer

A tool to easily create facial expressions for your pixel-based visor.

***:warning: This project is in early development - limited functionality, no saving, unstable API! :warning:***



## Live Preview Build 
<img src="src/assets/ghpages-qrcode.png" align="right" width="200" height="200" alt="QR Code to launch ProtoFace Designer">

[![Deploy to GitHub Pages](https://github.com/SharkyTheWhite/protoface-designer/actions/workflows/deploy-gh-pages.yml/badge.svg)](https://github.com/SharkyTheWhite/protoface-designer/actions/workflows/deploy-gh-pages.yml)

You can see and try the current state of the tool in your browser here:

**:arrow_forward: [Start ProtoFace Designer](https://sharkythewhite.github.io/protoface-designer/)**

The Serial and Bluetooth connections are proof-of-concept level only, an example responder for ESP32 WROOM DevKit is found at [/arduino](/arduino).

## Progress

Every aspect of this project is subject to change - this is just a rough map of what is currently planned:

- [x] Basic rendering and editing of monocromic LED matrices
- [x] Basic Serial Port connection to Demo Hardware from client (browser)
- [x] Basic Bluetooth connection to Demo Hardware from client (browser)
- [x] Basic Mirror-Mode (currently just for a fixed demo)
- [ ] Export facial expression to C-Header-File
- [ ] Migrate state to Vuex/Pinia
- [ ] Export and re-import state via C-Header-File as Comment
- [ ] Add UI features to manage multiple faces in one project
- [ ] ... (more TBD)

---

## Arduino Hardware Project setup

There is a preliminary working example on what hardware has currently been used to develop this app.
It is only a proof-of-concept but there are some useful snippets already.

This documentation is in the [/arduino](arduino/getting_started.md) folder.

## Web Application Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Run your unit tests
```
yarn test:unit
```

### Lints and fixes files
```
yarn lint
```

<!-- The following is the default Vue CLI generated readme content for reference 
### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
-->
