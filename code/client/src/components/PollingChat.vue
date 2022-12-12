<template>
  <!-- polling error -->
  <v-alert v-model="httpError" type="error" elevation="2">
    <td v-html="httpErrorMessage" />
  </v-alert>
</template>

<script setup lang="ts">
import { ref, onUnmounted, defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

const httpError = ref(false);
const httpErrorMessage = ref<string>("");
let lastMessageTimestamp = new Date().toISOString();

const emit = defineEmits(["appendMessages"]);

const sendMessage = async (msg: Message) => {
  await fetch("http://localhost:8082/polling/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
};

// fetch messages from server every 2 seconds
const fetchMessages = async () => {
  const nextTimestamp = new Date().toISOString();
  const response = await fetch("http://localhost:8082/polling", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: lastMessageTimestamp,
  });
  if (response.ok) {
    if (httpError.value) {
      httpError.value = false;
    }
    
    emit("appendMessages", await response.json());
    lastMessageTimestamp = nextTimestamp;
  } else {
    httpError.value = true;
    httpErrorMessage.value = await response.text();
  }
};

const interval = setInterval(fetchMessages, 2000);

onUnmounted(() => {
  clearInterval(interval);
});

defineExpose({
  sendMessage,
});
</script>
