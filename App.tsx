import React, { useCallback, useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GLView } from 'expo-gl';
import { GPU } from '@gpujs/expo-gl';

// Deliberately a diagnostic rather than a minimal demo: each stage of bringing
// GPU.js up on Expo is reported separately, so a failure on a device says which
// stage broke rather than just "it didn't work".
type StageState = 'pending' | 'running' | 'done' | 'failed';

interface Stage {
  name: string;
  state: StageState;
  detail?: string;
}

const STAGES = [
  'Create GL context',
  'Create GPU',
  'Detect features',
  'Compile kernel',
  'Run kernel',
] as const;

const SIZE = 512;

export default function App() {
  const [stages, setStages] = useState<Stage[]>(
    STAGES.map(name => ({ name, state: 'pending' }))
  );
  const [kernel, setKernel] = useState<((...args: any[]) => any) | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [milliseconds, setMilliseconds] = useState<number | null>(null);

  const update = useCallback((index: number, state: StageState, detail?: string) => {
    setStages(current => current.map((stage, i) => (
      i === index ? { ...stage, state, detail } : stage
    )));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let stage = 0;
      try {
        update(stage, 'running');
        const context = await GLView.createContextAsync();
        if (cancelled) return;
        update(stage, 'done', `contextId ${(context as any).contextId}`);

        stage = 1;
        update(stage, 'running');
        const gpu = new GPU({ context });
        update(stage, 'done', gpu.Kernel?.name ?? 'kernel selected');

        stage = 2;
        update(stage, 'running');
        // features are detected lazily, and detection itself compiles and runs
        // a probe kernel — so this stage exercises real GL work
        const features = (gpu.Kernel as any).features;
        update(stage, 'done', `float read ${features?.isFloatRead}, max texture ${features?.maxTextureSize}`);

        stage = 3;
        update(stage, 'running');
        const built = gpu.createKernel(function (a: number[][], b: number[][]) {
          let sum = 0;
          for (let i = 0; i < 512; i++) {
            sum += a[this.thread.y][i] * b[i][this.thread.x];
          }
          return sum;
        }).setOutput([SIZE, SIZE]);
        update(stage, 'done', `${SIZE}x${SIZE} matrix multiply`);

        if (!cancelled) setKernel(() => built);
      } catch (error: any) {
        if (!cancelled) update(stage, 'failed', String(error?.message ?? error));
      }
    })();

    return () => { cancelled = true; };
  }, [update]);

  const run = useCallback(() => {
    if (!kernel) return;
    update(4, 'running');
    try {
      const a = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => Math.random()));
      const b = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => Math.random()));
      const start = Date.now();
      const output = kernel(a, b) as number[][];
      const elapsed = Date.now() - start;
      setMilliseconds(elapsed);
      setResult(`${output.length}x${output[0].length}, [0][0] = ${output[0][0].toFixed(4)}`);
      update(4, 'done', `${elapsed} ms`);
    } catch (error: any) {
      update(4, 'failed', String(error?.message ?? error));
    }
  }, [kernel, update]);

  const failed = stages.some(stage => stage.state === 'failed');

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>GPU.js on Expo</Text>
      <ScrollView style={styles.stages} contentContainerStyle={styles.stagesContent}>
        {stages.map(stage => (
          <View key={stage.name} style={styles.stage}>
            <Text style={styles.marker}>{marker(stage.state)}</Text>
            <View style={styles.stageText}>
              <Text style={stage.state === 'failed' ? styles.failed : styles.name}>{stage.name}</Text>
              {stage.detail ? <Text style={styles.detail}>{stage.detail}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <Button title={kernel ? 'Run kernel' : 'Preparing…'} onPress={run} disabled={!kernel} />

      {result ? (
        <Text style={styles.result}>{result}{milliseconds !== null ? ` in ${milliseconds} ms` : ''}</Text>
      ) : null}
      {failed ? (
        <Text style={styles.hint}>
          Report this at github.com/gpujs/expo-gl/issues, including the failing stage above.
        </Text>
      ) : null}
    </View>
  );
}

function marker(state: StageState) {
  switch (state) {
    case 'done': return '✓';
    case 'failed': return '✗';
    case 'running': return '…';
    default: return '·';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 72 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  stages: { flexGrow: 0, marginBottom: 20 },
  stagesContent: { gap: 12 },
  stage: { flexDirection: 'row', gap: 10 },
  marker: { width: 16, fontSize: 15 },
  stageText: { flex: 1 },
  name: { fontSize: 15 },
  failed: { fontSize: 15, color: '#b00020', fontWeight: '600' },
  detail: { fontSize: 12, color: '#666', marginTop: 2 },
  result: { marginTop: 16, fontSize: 14 },
  hint: { marginTop: 16, fontSize: 12, color: '#666' },
});
