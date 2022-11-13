<template>
  <v-container id="chat">
    <v-row>
      <v-col cols="12">
        <v-card class="my-2" v-for="(message, index) in messages" :key="index">
          <v-card-title>{{ message.sender }}</v-card-title>
          <v-card-text>{{ message.content }}</v-card-text>
        </v-card>
        <!-- websocket connecting alert -->
        <v-alert v-model="connecting" type="info" elevation="2">
          <v-row>
            <v-col cols="11">
              <span>WebSocket connecting...</span>
            </v-col>
            <v-col cols="1">
              <v-progress-circular indeterminate color="white" size="20"></v-progress-circular>
            </v-col>
          </v-row>
        </v-alert>
        <!-- websocket error alert -->
        <v-alert v-model="error" type="error" elevation="2">
          <span>WebSocket error</span>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
  <v-footer
      app
      :fixed="true"
      class="text-center"
  >
    <v-alert
        v-model="showAlert"
        type="info"
        dismissible
        transition="scale-transition"
    >
      <v-text-field
          v-model="username"
          label="Choose your username"
          outlined
          @keyup.enter="checkUsername"
      />
    </v-alert>
    <v-textarea
        v-if="!showAlert"
        v-model="message"
        ref="messagebox"
        label="Type your message here"
        outlined
        @keyup.enter="sendMessage"
    />
  </v-footer>
</template>

<script setup lang="ts">
import {ref, nextTick} from 'vue';
import {Message} from '@/types';

const messages = ref<Message[]>([]);
const message = ref('');
const username = ref('');
const showAlert = ref(true);
const messagebox = ref(null);
const connecting = ref(true);
const error = ref(false);

const isEmpty = (str: string) => str.trim().length === 0;

const checkUsername = async () => {
  if (isEmpty(username.value)) {
    return;
  }
  showAlert.value = false;
  await nextTick();
  if(messagebox.value) {
    messagebox.value.focus();
  }
};

const sendMessage = async () => {
  if (isEmpty(username.value)) {
    showAlert.value = true;
    return;
  }
  if (!isEmpty(message.value)) {
    const msg = {
      sender: username.value,
      content: message.value,
    };
    await ws.send(JSON.stringify({
      type: 'message',
      data: {
        sender: username.value,
        content: message.value,
      },
    }));
    messages.value.push(msg);
    message.value = '';
    await nextTick();
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  }
};

const ws = new WebSocket('ws://localhost:8081');

ws.onmessage = async (event) => {
  const reader = new FileReader();
  await reader.readAsText(event.data);
  reader.onload = async () => {
    const msg = JSON.parse(reader.result as string);
    console.log('Received message', msg);
    messages.value.push(msg.data);
    await nextTick()
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };
};

ws.onopen = () => {
  console.log('Connected to websocket');
  connecting.value = false;
};

ws.onerror = (error) => {
  console.log('WebSocket error', error);
};

</script>
