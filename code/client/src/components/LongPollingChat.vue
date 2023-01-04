<template>
  <!-- we have no html content -->
  <p />
</template>

<script setup lang="ts">
import { onMounted, defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

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

// fetch messages from server as soon as last message is received
const fetchMessages = async () => {
  const response = await fetch("http://localhost:8083/long-polling", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: lastMessageTimestamp,
  });
  if (response.ok) {
    const messages = await response.json();
    emit("appendMessages", messages);

    // update last message timestamp to the timestamp of the last message
    lastMessageTimestamp = messages[messages.length - 1].timestamp;
  }
  fetchMessages();
};

defineExpose({
  sendMessage,
});

onMounted(() => {
  fetchMessages();
});
</script>
