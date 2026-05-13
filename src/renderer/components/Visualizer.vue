<script setup lang="ts">
import { onMounted, ref, onUnmounted } from "vue";
import type { IpcRendererEvent } from "electron";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const audioData = ref<number[]>([]);

onMounted(() => {
  window.ytmd.handleAudioData((_event: IpcRendererEvent, data: number[]) => {
    audioData.value = data;
    draw();
  });
});

onUnmounted(() => {
  // We should probably add a remove listener if needed, but handleAudioData sets one.
});

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const data = audioData.value;
  const barWidth = width / data.length;

  data.forEach((value, i) => {
    const barHeight = (value / 255) * height;
    ctx.fillStyle = `rgba(255, 255, 255, ${value / 255})`;
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
  });
}
</script>

<template>
  <canvas ref="canvasRef" class="visualizer" width="200" height="30"></canvas>
</template>

<style scoped>
.visualizer {
  pointer-events: none;
}
</style>
