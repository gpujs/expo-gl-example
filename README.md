# GPU.js on Expo — example

[![CI](https://github.com/gpujs/expo-gl-example/actions/workflows/ci.yml/badge.svg)](https://github.com/gpujs/expo-gl-example/actions/workflows/ci.yml)

A minimal Expo app that runs [GPU.js](https://gpu.rocks) kernels on the device
GPU through [`@gpujs/expo-gl`](https://github.com/gpujs/expo-gl).

## Running it

This needs a **development build**, not Expo Go. Expo Go on the App Store tracks
an older SDK and cannot open an SDK 57 project.

```sh
npm install
npx expo run:ios      # or: npx expo run:android
```

That prebuilds the native project, compiles it, and installs it on a connected
device or simulator. iOS needs Xcode and a signing identity; the first build
takes several minutes, later ones are quick.

On a simulator the GPU is emulated in software, so kernels are correct but
extremely slow — a 512x512 multiply took ~28 seconds on an iPhone 17 Pro
simulator versus **71 ms on the physical device**. Benchmark on hardware.

The app is deliberately a **diagnostic** rather than a minimal demo. It reports
each stage separately:

1. **Create GL context** — `GLView.createContextAsync()`
2. **Create GPU** — `new GPU({ context })`, which selects the Expo kernel
3. **Detect features** — compiles and runs a probe kernel, so this is the first
   real GL work
4. **Compile kernel** — a 512×512 matrix multiply
5. **Run kernel** — press the button; reports elapsed milliseconds

If something breaks, the failing stage and its error appear on screen, which is
far more useful in a bug report than "it didn't work".

## Kernels are strings here

React Native runs on Hermes, which discards function source, so a kernel written
as a function cannot be compiled — see
[@gpujs/expo-gl](https://github.com/gpujs/expo-gl#kernels-must-be-strings). This
app passes its kernel as a template string for that reason.

## Web is not supported

`@gpujs/expo-gl` targets Expo's native GL. On web, use GPU.js directly — it
already runs on WebGL there.

## What CI can and cannot check

CI typechecks and runs `expo export`, which makes Metro resolve and compile
every import. That catches a broken shim, a GPU.js that will not bundle for
React Native, and version drift against the Expo SDK.

It cannot run a kernel: there is no Node implementation of Expo's GL. Anything
past "it bundles" has to be verified on a device — which is the reason this app
exists.
