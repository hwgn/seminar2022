<template>
  <!-- streaming error -->
  <v-alert v-model="httpError" type="error" elevation="2">
    <td v-html="httpErrorMessage" />
  </v-alert>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

const httpError = ref(false);
const httpErrorMessage = ref<string>("");

const emit = defineEmits(["appendMessages"]);

const sendMessage = async (msg: Message) => {
  await fetch("http://localhost:8084/streaming/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
};

// add messages to array as soon as they are received
const fetchMessages = async () => {
  const response = await fetch("http://localhost:8084/streaming", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: new Date().toISOString(),
  });
  if (!response.ok || !response.body) {
    httpError.value = true;
    httpErrorMessage.value = await response.text();
  }
  const reader = response.body?.getReader() || undefined;

  const read = async () => {
    const { done, value } = await reader?.read() || { done: true, value: undefined };
    if (done) {
      return;
    }
    const messages = new TextDecoder("utf-8").decode(value);
    emit("appendMessages", JSON.parse(messages));
    read();
  };

  read();
};

fetchMessages();

defineExpose({
  sendMessage,
});
</script>
