<template>
  <!-- we have no html content -->
  <p />
</template>

<script setup lang="ts">
import { defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

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
  if(!response.ok || !response.body) {
    console.log("Error fetching messages");
    return;
  }

  const reader = response.body.getReader();

  const read = async () => {
    const { done, value } = await reader.read();
    if (done) 
      return;
    
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
