<template>
  <!-- we have no html content -->
  <p />
</template>

<script setup lang="ts">
import { defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

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

const fetchMessages = async () => {
  const response = await fetch("http://localhost:8082/polling", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: lastMessageTimestamp, // send the last message timestamp to the server
  });

  if (response.ok) {
    const newMessages = await response.json();
    emit("appendMessages", newMessages); // append the new messages to the chat

    // update the last message timestamp to the timestamp of the last message, if there are any
    if (newMessages.length > 0)
      lastMessageTimestamp = newMessages[newMessages.length - 1].timestamp;
  }
};

// we fetch new messages every 2 seconds, regardless of how long the previous request took
setInterval(fetchMessages, 2000);

defineExpose({
  sendMessage,
});
</script>
