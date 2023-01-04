<template>
  <!-- we have no html content -->
  <p />
</template>

<script setup lang="ts">
import { defineExpose, defineEmits } from "vue";
import { Message } from "@/types";

const emit = defineEmits(["appendMessages"]);

const ws = new WebSocket("ws://localhost:8081");

const sendMessage = async (msg: Message) => {
  ws.send(
    JSON.stringify({
      type: "message",
      data: msg,
    })
  );
};

ws.onmessage = async (event) => {
  const reader = new FileReader();
  reader.readAsText(event.data);
  reader.onload = async () => {
    const msg = JSON.parse(reader.result as string);
    emit("appendMessages", [msg.data]);
  };
};

defineExpose({
  sendMessage,
});
</script>
