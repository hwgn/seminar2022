<template>
  <!-- websocket connecting alert -->
  <v-alert v-model="wsConnecting" type="info" elevation="2">
    <v-progress-circular indeterminate size="20" class="mr-4" />
    Connecting to websocket...
  </v-alert>
  <!-- websocket error alert -->
  <v-alert v-model="wsError" type="error" elevation="2">
    <span>WebSocket error</span>
  </v-alert>
</template>

<script setup lang="ts">
import { ref, nextTick, onUnmounted, defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

const wsConnecting = ref(true);
const wsError = ref(false);

const emit = defineEmits(["appendMessages"]);

const sendMessage = async (msg: Message) => {
  ws.send(
    JSON.stringify({
      type: "message",
      data: msg,
    })
  );
  emit("appendMessages", [msg]);
  await nextTick();
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
};

const ws = new WebSocket("ws://localhost:8081");

ws.onmessage = async (event) => {
  const reader = new FileReader();
  reader.readAsText(event.data);
  reader.onload = async () => {
    const msg = JSON.parse(reader.result as string);
    console.log("Received message", msg);
    emit("appendMessages", [msg.data]);
    await nextTick();
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };
};

ws.onopen = () => {
  console.log("Connected to websocket");
  wsConnecting.value = false;
};

ws.onerror = (error) => {
  console.log("WebSocket error", error);
};

onUnmounted(() => {
  ws.close();
});

defineExpose({
  sendMessage,
});
</script>
