<script setup lang="ts">
import { onMounted, ref } from "vue";
import ChatMessage from "./components/ChatMessage.vue";
import Alert from "./components/Alert.vue";
import {
  broadcasterIdFromURL,
  connectModeFromURL,
  debugModeFromURL,
  hexBackgroundColourFromURL,
  hexForegroundColourFromURL,
  hostFromURL,
  messageVisibilityMilliseconds,
  portFromURL,
  shouldHideErrorConfigFromURL,
  sslFromURL,
  tokenFromURL,
} from "./utils/url-utils.ts";
import {
  AbstractrrrHealthResponse,
  connectToChatWs,
  connectToChatSSE,
} from "./utils/networking-utils.ts";
import {
  ChatBadgeLookup,
  ChatBadgesResponse,
  getTwitchUserAvatar,
  IRCData,
  ircDataToTwitchChatMessage,
  transformChatBadgesResponseToLookup,
  TwitchChatMessage,
} from "./utils/twitch-chat-utils.ts";
import { AbstractrrrApiClient } from "./utils/AbstractrrrApiClient.ts";
import {
  getPronounsAsKeyToDisplayMap,
  getUserPronoun,
  Pronoun,
} from "./utils/pronouns.ts";

// Configuration
const token = tokenFromURL()
const port = portFromURL()
const debug = debugModeFromURL()
const host = hostFromURL()
const useSSL = sslFromURL()
const bgColour = hexBackgroundColourFromURL()
const fgColour = hexForegroundColourFromURL()
const broadcasterId = broadcasterIdFromURL()
const messageVisibility = messageVisibilityMilliseconds()
const hideError = shouldHideErrorConfigFromURL()
const MAX_RETRIES = 20
const RETRY_INTERVAL_MS = 1000

const apiClient = new AbstractrrrApiClient({
  host,
  port,
  token: token,
  broadcasterId,
  ssl: useSSL,
})

// region State management

// region Error states

// this error will always show
const noTokenError = ref<boolean>(!token)

// this error will always show
const noBroadcasterIdError = ref<boolean>(!broadcasterId)

// this error will show unless hide_error=1|true
const abstractrrrConnectionError = ref<boolean>(false)

// endregion Error states


// region Messages

const visibleMessages = ref<TwitchChatMessage[]>([])
// const visibleMessages = ref<TwitchChatMessage[]>(sampleVisibleMessagesData)
const enqueuedMessages = ref<IRCData[]>([])
const chatBadgeLookup = ref<ChatBadgeLookup>({ bits: {}, subscriber: {} })
const pronounsKeyToDisplayMap = ref<Record<string, string>>({})
const retryCount = ref<number>(0)
const retryTimeoutId = ref<number | null>(null)

const onNewMessage = async () => {
  const nextMessage: IRCData = enqueuedMessages.value[0]

  if (!nextMessage) return

  let pronouns: Pronoun | null = null
  try {
    const userPronoun = await getUserPronoun(nextMessage.user.name)

    if (userPronoun) {
      pronouns = {
        name: userPronoun,
        display: pronounsKeyToDisplayMap.value[userPronoun] || userPronoun
      }
    }
  } catch (e) {
    if (debug) {
      console.error("Failed to fetch pronouns", e)
    }
  }

  // Get profile image
  const avatarUrl = await getTwitchUserAvatar(nextMessage.user.id, apiClient)

  const nextMessageForUI = ircDataToTwitchChatMessage({
    data: nextMessage,
    chatBadgeLookup: chatBadgeLookup.value,
    pronouns,
    avatarUrl,
  });

  enqueuedMessages.value = enqueuedMessages.value.slice(1)

  visibleMessages.value = [
    ...visibleMessages.value,
    nextMessageForUI,
  ]

  setTimeout(() => {
    // Remove the first item
    visibleMessages.value = visibleMessages.value.slice(1)
  }, messageVisibility)
}

// endregion Messages


// endregion State management

const initChatConnection = async ({
  token,
  port,
  host,
}: {
  token: string,
  port: string,
  host: string
}) => {

  /**
   * tracks the retry count and retries if within the retry configuration
   */
  const retryConnection = () => {
    // if a retry is already in progress, clear it and make a new one
    if (typeof retryTimeoutId.value === 'number') {
      clearTimeout(retryTimeoutId.value)

      if (retryCount.value > MAX_RETRIES) {
        console.error(`retries exhausted at ${retryCount.value} attempts`)
        clearTimeout(retryTimeoutId.value)
        return
      }
    }

    // increment the retry count
    retryCount.value++
    if (debug) {
      console.log(`retry attempt: ${retryCount.value}`)
    }

    // start retry interval
    retryTimeoutId.value = setTimeout(() => {
      initChatConnection({ token, port, host })
    }, RETRY_INTERVAL_MS)
  }

  // Load up badges in lookup table
  try {
    const { data } = await apiClient.makeGet<AbstractrrrHealthResponse>('/health')
    if (data.data.service !== "abstractrrr") {
      throw new Error(`unknown service ${data.data.service}`)
    }
  } catch (e) {
    console.error(e)

    if (!hideError) {
      abstractrrrConnectionError.value = true
    }

    retryConnection()
    return
  }

  apiClient
    .makeGet<ChatBadgesResponse>(
      `/v1/api/helix/chat/badges?broadcaster_id=${broadcasterId}`
    )
    .then(({ data }) => {
      chatBadgeLookup.value = transformChatBadgesResponseToLookup(data)
      abstractrrrConnectionError.value = false
    })

  const connectToChat = connectModeFromURL() === 'sse' ? connectToChatSSE : connectToChatWs

  // Connect to chat
  connectToChat({
    port,
    token,
    host,
    onConnect() {
      retryCount.value = 0
    },
    onClearChat(data) {
      // Remove all messages from enqueued
      if (data.target_user_id) {
        enqueuedMessages.value = enqueuedMessages.value
          .filter(message => message.user.id !== data.target_user_id)

        // Remove all messages from the UI
        visibleMessages.value = visibleMessages.value
          .filter(message => message.username.toLowerCase() !== data.target_username.toLowerCase())
      } else {
        enqueuedMessages.value = []
        visibleMessages.value = []
      }
    },
    onChat(data) {
      if (debug) {
        console.log('onChat', data)
      }

      enqueuedMessages.value = [
        ...enqueuedMessages.value,
        data
      ]
      onNewMessage()
    },
    onError(e) {
      console.error('onError', e)
      abstractrrrConnectionError.value = true;
    },
    onClose(e) {
      console.error('onClose', e)
      abstractrrrConnectionError.value = true;

      retryConnection()
    },
  })
}

onMounted(async () => {
  if (!port) return
  if (!token) return
  if (!host) return

  initChatConnection({ token, port, host })

  if (bgColour) {
    document.body.style.setProperty("background-color", bgColour)
  } else {
    document.body.style.removeProperty("background-color")
  }

  getPronounsAsKeyToDisplayMap()
    .then(data => {
      pronounsKeyToDisplayMap.value = data
    })
})
</script>

<template>
  <!-- region Alerts / Errors -->

  <Alert v-if="noTokenError" message="Query param `token` required" type="error" />
  <Alert v-if="noBroadcasterIdError" message="Query param `broadcaster_id` required" type="error" />
  <Alert
    v-if="abstractrrrConnectionError && !hideError"
    message="chat error: tell streamer chat is broken"
    type="error"
  />

  <!-- endregion Alerts / Errors -->

  <div class="horizontal-layout" :style="{ color: fgColour }">
    <div v-for="message in visibleMessages" class="horizontal-layout__item">
      <ChatMessage
        :pronouns="message.pronouns"
        :sub-badge="message.subBadgeUrl"
        :bits-badge="message.bitsBadgeUrl"
        :gift-badge="message.giftBadgeUrl"
        :broadcaster="message.broadcaster"
        :color="message.color"
        :message="message.message"
        :mod="message.moderator"
        :vip="message.vip"
        :username="message.username"
        :avatar-url="message.avatarUrl"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.horizontal-layout {
  white-space: nowrap;
  overflow: hidden;
}

.horizontal-layout__item {
  margin-right: 0.5rem;
  display: inline-block;
}
</style>
