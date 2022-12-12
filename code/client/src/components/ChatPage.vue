<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="my-3">
        <v-card v-if="!tab">
          <v-card-title>Choose a chat...</v-card-title>
          <v-card-actions>
            <v-btn @click="chooseChat('WebSocket')">Websocket</v-btn>
            <v-btn @click="chooseChat('Polling')">Polling</v-btn>
          </v-card-actions>
        </v-card>

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

        <v-window v-model="tab" class="my-3">
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
        </v-window>
        <div>
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
            <v-card-title>{{ message.sender }}</v-card-title>
            <v-card-text>{{ message.content }}</v-card-text>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <v-footer app :fixed="true" class="text-center">
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
import WebSocketChat from "@/components/WebSocketChat.vue";
import PollingChat from "@/components/PollingChat.vue";

const messages = ref<Message[]>([]);
const message = ref("");
const username = ref("");
const showAlert = ref(true);
const messagebox = ref(null);
const usernamebox = ref(null);
const tab = ref("");

const wsChatRef = ref(null) as Ref<typeof WebSocketChat | null>;
const pollingChatRef = ref(null) as Ref<typeof PollingChat | null>;

const chooseChat = async (chat: string) => {
  tab.value = chat;
  await nextTick();
  usernamebox.value?.focus();
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
  messages.value = [...messages.value, ...newMessages];
  await nextTick();
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
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
  }

  message.value = "";
};
</script>
