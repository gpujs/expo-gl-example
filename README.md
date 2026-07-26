# GPU.js on Expo — example

[![CI](https://github.com/gpujs/expo-gl-example/actions/workflows/ci.yml/badge.svg)](https://github.com/gpujs/expo-gl-example/actions/workflows/ci.yml)

A minimal Expo app that runs [GPU.js](https://gpu.rocks) kernels on the device
GPU through [`@gpujs/expo-gl`](https://github.com/gpujs/expo-gl).

## Running it

```sh
npm install
npx expo start
```

Then open it on a device or simulator (`i` for iOS, `a` for Android). Expo Go is
enough — no custom native build is required.

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
