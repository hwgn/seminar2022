<template>
  <!-- tabs to switch between websocket and polling chat -->
  <v-tabs
      v-model="tab"
      fixed-tabs
      dark
      bg-color="surface"
      color="primary"
      class="position-fixed"
      style="z-index: 1; top: 0; left: 0; right: 0;"
  >
    <v-tab value="websocket">Websocket</v-tab>
    <v-tab value="polling">Polling</v-tab>
  </v-tabs>

  <!-- websocket chat -->
  <v-window v-model="tab" class="mt-10" style="margin-bottom: 150px">
    <v-window-item value="websocket">
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-card class="my-2" v-for="(message, index) in wsMessages" :key="index">
              <v-card-title>{{ message.sender }}</v-card-title>
              <v-card-text>{{ message.content }}</v-card-text>
            </v-card>
            <!-- websocket connecting alert -->
            <v-alert v-model="wsConnecting" type="info" elevation="2">
              <v-progress-circular
                  indeterminate
                  size="20"
                  class="mr-4"
              />
              Connecting to websocket...
            </v-alert>
            <!-- websocket error alert -->
            <v-alert v-model="wsError" type="error" elevation="2">
              <span>WebSocket error</span>
            </v-alert>
          </v-col>
        </v-row>
      </v-container>

    </v-window-item>
    <!-- polling chat -->
    <v-window-item value="polling">
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-card class="my-2" v-for="(message, index) in httpMessages" :key="index">
              <v-card-title>{{ message.sender }}</v-card-title>
              <v-card-text>{{ message.content }}</v-card-text>
            </v-card>
            <!-- polling error -->
            <v-alert v-model="httpError" type="error" elevation="2">
              <td v-html="httpErrorMessage"></td>
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-window-item>
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
          :label="'Send message as ' + username"
          outlined
          @keyup.enter="sendMessage"
      />
    </v-footer>
  </v-window>
</template>

<script setup lang="ts">
import {ref, nextTick, onUnmounted} from 'vue';
import {Message} from '@/types';

const wsMessages = ref<Message[]>([]);
const httpMessages = ref<Message[]>([]);
const message = ref('');
const username = ref('');
const showAlert = ref(true);
const messagebox = ref(null);
const wsConnecting = ref(true);
const wsError = ref(false);
const httpError = ref(false);
const httpErrorMessage = ref<string>('');
const tab = ref('websocket');

const isEmpty = (str: string) => str.trim().length === 0;

const checkUsername = async () => {
  if (isEmpty(username.value)) {
    return;
  }
  showAlert.value = false;
  await nextTick();
  if (messagebox.value) {
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
      timestamp: new Date().toISOString(),
    };
    if (tab.value === 'websocket') {
      await ws.send(JSON.stringify({
        type: 'message',
        data: msg,
      }));
      wsMessages.value.push(msg);
    } else {
      await fetch('http://localhost:8082/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(msg),
      });
    }

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
    wsMessages.value.push(msg.data);
    await nextTick()
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };
};

ws.onopen = () => {
  console.log('Connected to websocket');
  wsConnecting.value = false;
};

ws.onerror = (error) => {
  console.log('WebSocket error', error);
};

let lastMessageTimestamp = new Date().toISOString();

// fetch messages from server every 2 seconds
const fetchMessages = async () => {
  if(httpError.value) { // slow down polling if there is an error
    clearInterval(interval);
    interval = setInterval(fetchMessages, timeout *= 2);
  }
  const nextTimestamp = new Date().toISOString();
  const response = await fetch('http://localhost:8082/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: lastMessageTimestamp,
  });
  if (response.ok) {
    timeout = 2000;
    if(httpError.value) {
      clearInterval(interval);
      interval = setInterval(fetchMessages, timeout);
      httpError.value = false;
    }
    const messages = await response.json();
    httpMessages.value = httpMessages.value.concat(messages);
    lastMessageTimestamp = nextTimestamp;
    await nextTick()
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  } else {
    httpError.value = true;
    httpErrorMessage.value = await response.text();
  }
};

let timeout = 2000;
let interval = setInterval(fetchMessages, 2000);


onUnmounted(() => {
  ws.close();
  clearInterval(interval);
});

</script>
