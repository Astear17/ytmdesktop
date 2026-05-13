<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Settings from "./Settings.vue";

const { t } = useI18n();

onMounted(() => {
  if (window.ytmd.getAccentColor) {
    window.ytmd.getAccentColor().then(color => {
      if (color) {
        document.body.style.setProperty("--system-accent-color", `#${color}`);
      }
    });
  }
});
</script>

<template>
  <div class="container">
    <Suspense>
      <Settings class="settings" />
      <template #fallback>
        <div class="loading">{{ t("settings_window_loading") }}</div>
      </template>
    </Suspense>
  </div>
</template>

<style>
html,
body {
  height: 100%;
  margin: 0;
}

/* app.css sets body { overflow: hidden }; keep chrome stable but allow the app root to flex-shrink for inner scroll */
#app {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>

<style scoped>
.settings {
  background-color: #000000;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.container {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #000000;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbbbbb;
}
</style>
