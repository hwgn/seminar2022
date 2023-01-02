<template>
  <!-- polling error -->
  <v-alert v-model="httpError" type="error" elevation="2">
    <td v-html="httpErrorMessage" />
  </v-alert>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

const httpError = ref(false);
const httpErrorMessage = ref<string>("");
let lastMessageTimestamp = new Date().toISOString();

const emit = defineEmits(["appendMessages"]);

const sendMessage = async (msg: Message) => {
  await fetch("http://localhost:8083/long-polling/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
};

let fetchNext = true; // flag to stop fetching messages

// fetch messages from server as soon as last message is received
const fetchMessages = async () => {
  if (!fetchNext) {
    return;
  }

  fetchNext = false;
  const response = await fetch("http://localhost:8083/long-polling", {
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
    const messages = await response.json();
    emit("appendMessages", messages);
    fetchNext = true;

    // update last message timestamp to the timestamp of the last message
    lastMessageTimestamp = messages[messages.length - 1].timestamp;

  } else {
    httpError.value = true;
    httpErrorMessage.value = await response.text();
    fetchNext = true;
  }
};

defineExpose({
  sendMessage,
});

let interval: number;

onMounted(() => {
  interval = setInterval(fetchMessages, 250);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>
