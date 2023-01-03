<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card
          v-if="!chatChosen"
          style="position: fixed; top: 10; z-index: 1;"
          elevation="5"
        >
          <v-card-title class="ma-2 mb-0">Choose a chat...</v-card-title>
          <div class="ma-2 mt-0">
            <v-btn @click="chooseChat('WebSocket')" variant="text">Websocket</v-btn>
            <v-btn @click="chooseChat('Polling')" variant="text">Polling</v-btn>
            <v-btn @click="chooseChat('LongPolling')" variant="text">Long Polling</v-btn>
            <v-btn @click="chooseChat('Streaming')" variant="text">Streaming</v-btn>
            <!--v-btn @click="chooseChat('SSE')" variant="text">SSE</v-btn>
            <v-btn @click="chooseChat('ServerPush')" variant="text">Server Push</v-btn-->
          </div>
        </v-card>

        <v-alert
          v-model="chatChosen"
          elevation="5"
          :closable="true"
          close-icon="mdi-arrow-left"
          style="position: fixed; top: 10; z-index: 1"
        >
          <v-alert-title> {{ tab }} Chat </v-alert-title>
        </v-alert>

        <v-window v-if="chatChosen" v-model="tab">
          <v-window-item value="" />
          <v-window-item value="WebSocket">
            <web-socket-chat
              ref="wsChatRef"
              @append-messages="appendMessages"
            />
          </v-window-item>
          <v-window-item value="Polling">
            <polling-chat
              ref="pollingChatRef"
              @append-messages="appendMessages"
            />
          </v-window-item>
          <v-window-item value="LongPolling">
            <long-polling-chat
              ref="longPollingChatRef"
              @append-messages="appendMessages"
            />
          </v-window-item>
          <v-window-item value="Streaming">
            <streaming-chat
              ref="streamingChatRef"
              @append-messages="appendMessages"
            />
          </v-window-item>
        </v-window>
        <div style="margin-top: 2cm;">
          <v-card v-if="tab && !showAlert && messages.length < 1">
            <v-card-title> {{ tab }} chat </v-card-title>
            <v-card-text>
              Send your first message by typing in the chat window and pressing
              enter
            </v-card-text>
          </v-card>

          <v-card
            v-for="(message, index) in messages"
            :key="index"
            class="mt-2"
          >
            <v-card-text>
              <v-list-item class="w-100">
                <v-list-item-subtitle class="d-sm-none">
                  {{ new Date(message.timestamp).toLocaleTimeString() }} -
                  {{ message.protocol }}
                </v-list-item-subtitle>

                <v-list-item-title class="text-h6 font-weight-bold">
                  {{ message.sender }}
                </v-list-item-title>

                <v-list-item-media>{{ message.content }}</v-list-item-media>

                <template v-slot:append>
                  <div class="hidden-xs mr-3">
                    {{ new Date(message.timestamp).toLocaleTimeString() }}
                    <br />
                    {{ message.protocol }}
                  </div>
                </template>
              </v-list-item>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <v-footer app :fixed="true" class="text-center">
    <v-alert
      v-if="showAlert && tab"
      type="info"
      dismissible
      transition="scale-transition"
    >
      <v-text-field
        v-model="username"
        label="Choose your username (Press Enter to confirm)"
        outlined
        @keyup.enter="checkUsername"
        ref="usernamebox"
      />
    </v-alert>
    <v-textarea
      v-if="!showAlert"
      v-model="message"
      ref="messagebox"
      :label="'Send message as ' + username + ' via ' + tab + ' chat:'"
      outlined
      transition="scale-transition"
      @keyup.enter="sendMessage"
    />
  </v-footer>
</template>

<script setup lang="ts">
import { ref, nextTick, Ref } from "vue";
import { Message } from "@/types";
import WebSocketChat from "./WebSocketChat.vue";
import PollingChat from "./PollingChat.vue";
import LongPollingChat from "./LongPollingChat.vue";
import StreamingChat from "./StreamingChat.vue";

const messages = ref<Message[]>([]);
const message = ref("");
const username = ref("");
const showAlert = ref(true);
const messagebox = ref(null);
const usernamebox = ref(null);
const tab = ref("");
const chatChosen = ref(false);

const wsChatRef = ref(null) as Ref<typeof WebSocketChat | null>;
const pollingChatRef = ref(null) as Ref<typeof PollingChat | null>;
const longPollingChatRef = ref(null) as Ref<typeof LongPollingChat | null>;
const streamingChatRef = ref(null) as Ref<typeof StreamingChat | null>;

const chooseChat = async (chat: string) => {
  tab.value = chat;
  chatChosen.value = true;
  await nextTick();
  if (username.value.length === 0) {
    usernamebox.value?.focus();
  } else {
    messagebox.value?.focus();
  }
};

// eslint-disable-next-line no-unused-vars
const updateMessages = async (newMessages: Message[]) => {
  messages.value = newMessages;
  await nextTick();
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
};

const appendMessages = async (newMessages: Message[]) => {
  // add protocol to each message
  newMessages.forEach((msg) => (msg.protocol = tab.value));

  messages.value = [...messages.value, ...newMessages];

  if(newMessages.length > 0) {
    await nextTick();
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }
};

const isEmpty = (str: string) => str.trim().length === 0;

const checkUsername = async () => {
  if (isEmpty(username.value)) {
    return;
  }
  showAlert.value = false;
  await nextTick();
  messagebox.value?.focus();
};

const sendMessage = async () => {
  if (isEmpty(username.value)) {
    showAlert.value = true;
    return;
  } else if (isEmpty(message.value)) {
    return;
  }

  const msg: Message = {
    sender: username.value,
    content: message.value,
    timestamp: new Date().toISOString(),
  };

  switch (tab.value) {
    case "WebSocket":
      await wsChatRef.value?.sendMessage(msg);
      break;
    case "Polling":
      await pollingChatRef.value?.sendMessage(msg);
      break;
    case "LongPolling":
      await longPollingChatRef.value?.sendMessage(msg);
      break;
    case "Streaming":
      await streamingChatRef.value?.sendMessage(msg);
      break;
  }

  message.value = "";
};
</script>
