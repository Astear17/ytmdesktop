<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  }
});
const emit = defineEmits(["update:modelValue", "change"]);

const keybindInput = ref(null);
const isEditing = ref(false);

const currentKeybind = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
    queueMicrotask(() => emit("change"));
  }
});

function startEditing() {
  isEditing.value = true;
  keybindInput.value?.focus();
}

function keybindInputFocused() {
  isEditing.value = true;
}

function keybindInputBlurred() {
  if (document.activeElement !== keybindInput.value) {
    isEditing.value = false;
  }
}

function isDisallowedKey(key: string) {
  return (
    key === "Meta" ||
    key === "Command" ||
    key === "Control" ||
    key === "Alt" ||
    key === "Shift" ||
    key === "AltGraph" ||
    key === "Pause" ||
    key === "Tab" ||
    key === "ContextMenu" ||
    key === "Cancel"
  );
}

function validateKey(event: KeyboardEvent) {
  if (event.key === "MediaPlayPause") return "MediaPlayPause";
  if (event.key === "MediaTrackNext") return "MediaNextTrack";
  if (event.key === "MediaTrackPrevious") return "MediaPreviousTrack";
  if (event.key === "MediaStop") return "MediaStop";
  if (event.key === "AudioVolumeUp") return "VolumeUp";
  if (event.key === "AudioVolumeDown") return "VolumeDown";
  if (event.key === "AudioVolumeMute") return "VolumeMute";
  if (event.key === " ") return "Space";
  if (event.code === "NumpadEnter") return "Enter";
  if (event.code === "NumpadAdd") return "numadd";
  if (event.code === "NumpadSubtract") return "numsub";
  if (event.code === "NumpadDecimal") return "numdec";
  if (event.code === "NumpadMultiply") return "nummult";
  if (event.code === "NumpadDivide") return "numdiv";
  if (event.code === "Numpad0") return "num0";
  if (event.code === "Numpad1") return "num1";
  if (event.code === "Numpad2") return "num2";
  if (event.code === "Numpad3") return "num3";
  if (event.code === "Numpad4") return "num4";
  if (event.code === "Numpad5") return "num5";
  if (event.code === "Numpad6") return "num6";
  if (event.code === "Numpad7") return "num7";
  if (event.code === "Numpad8") return "num8";
  if (event.code === "Numpad9") return "num9";
  if (event.code === "ArrowUp") return "Up";
  if (event.code === "ArrowDown") return "Down";
  if (event.code === "ArrowLeft") return "Left";
  if (event.code === "ArrowRight") return "Right";
  if (event.shiftKey && event.code === "Equal") return "Plus";
  if (event.keyCode >= 65 && event.keyCode <= 90) return event.key.toUpperCase();

  return event.key;
}

function keybindInputKeyDown(event: KeyboardEvent) {
  if (!isEditing.value) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape" || event.key === "Backspace" || event.key === "Delete") {
    currentKeybind.value = "";
    isEditing.value = false;
    keybindInput.value?.blur();
    return;
  }

  if (isDisallowedKey(event.key)) {
    return;
  }

  let newKeybind = "";

  if (event.metaKey) newKeybind += "Meta+";
  if (event.ctrlKey) newKeybind += "CmdOrCtrl+";
  if (event.altKey) newKeybind += "Alt+";
  if (event.shiftKey) newKeybind += "Shift+";

  newKeybind += validateKey(event);
  currentKeybind.value = newKeybind;
  isEditing.value = false;
  keybindInput.value?.blur();
}

function documentKeyDown(event: KeyboardEvent) {
  keybindInputKeyDown(event);
}

onMounted(() => {
  document.addEventListener("keydown", documentKeyDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", documentKeyDown, true);
});
</script>

<template>
  <div :class="{ 'keybind': true, 'is-editing': isEditing }" @click="startEditing">
    <p v-if="!currentKeybind" class="keybind-text" @click="startEditing">None</p>
    <p v-else class="keybind-text" @click="startEditing">{{ currentKeybind }}</p>
    <input
      ref="keybindInput"
      class="keybind-input"
      type="text"
      readonly
      @focus="keybindInputFocused"
      @blur="keybindInputBlurred"
      @keydown="keybindInputKeyDown"
    />
    <button class="remove" :disabled="!currentKeybind" @click.stop="currentKeybind = ''"><span class="material-symbols-outlined">delete</span></button>
  </div>
</template>

<style scoped>
.keybind {
  position: relative;
  user-select: none;
  cursor: pointer;
  display: flex;
  min-width: 0;
}

.keybind.is-editing {
  border: 2px solid #f44336;
}

.keybind-text {
  background-color: #212121;
  border: none;
  padding: 8px;
  border-radius: 4px;
  width: 216px;
  height: 20px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.keybind-input {
  width: 1px;
  height: 1px;
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  background: none;
  border: none;
  outline: none;
}

.remove {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #212121;
  border-color: #323232;
  border-style: solid;
  border-width: 0 0 0 1px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.remove:disabled {
  border-color: #323232;
  border-style: solid;
  border-width: 0 0 0 1px;
  cursor: not-allowed;
}
</style>
