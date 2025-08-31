import {
  AbstractrrrEvent,
  IRCData,
  IRCEventClearChatData,
} from "./twitch-chat-utils.ts";
import { debugModeFromURL } from "./url-utils.ts";

type ConnectionConfig = {
  port: string;
  token: string;
  host: string;
  onClearChat: (irc_data: IRCEventClearChatData) => void;
  onChat: (irc_data: IRCData) => void;
  onError: (event: Event) => void;
  onClose: (event: CloseEvent) => void;
  onConnect: (event: Event) => void;
};

/**
 * Connects to chat using server-sent events (SSE)
 * @param param0
 */
export const connectToChatSSE = ({
  port,
  token,
  host,
  onChat,
  onError,
  // onClose,
  onClearChat,
  onConnect,
}: ConnectionConfig) => {
  const connectionUrl = `http://${host}:${port}/v1/sse?token=${token}`;
  const debug = debugModeFromURL();
  if (debug) {
    console.log(`Connecting with SSE at URL ${connectionUrl}`);
  }

  const eventSource = new EventSource(connectionUrl);

  if (debug) {
    eventSource.addEventListener("ping", (event) => {
      console.log("EventSource: received ping: ", event);
    });
  }

  eventSource.onerror = (err) => {
    if (debug) {
      console.error("EventSource error:", err);
    }
    onError(err);
    eventSource.close()
  };

  eventSource.onopen = (event) => {
    if (debug) {
      console.log("EventSource open:", event);
    }
    onConnect(event);
  };

  eventSource.addEventListener("message", (event) => {
    if (debug) {
      console.log("EventSource: event type: message", event);
    }

    const parsedData = JSON.parse(event.data) as AbstractrrrEvent;

    switch (parsedData.event_type) {
      case "auth":
        break;

      case "irc":
        switch (parsedData.event_data.irc_type) {
          case "PrivateMessage":
            onChat(parsedData.event_data.irc_data);
            break;
          case "PingMessage":
            break;
          case "ClearChatMessage":
            onClearChat(parsedData.event_data.irc_data);
            break;
          case "PongMessage":
            break;
        }
        break;
    }

    if (debug) {
      console.log(">> data → parsed", parsedData);

      const formattedData = JSON.stringify(parsedData, null, 2);
      console.log(">> data → JSON", formattedData);
    }
  });
};

/**
 * Connects to chat using web sockets
 */
export const connectToChatWs = ({
  port,
  token,
  host,
  onChat,
  onError,
  onClose,
  onClearChat,
  onConnect,
}: ConnectionConfig) => {
  const debug = debugModeFromURL();

  if (debug) {
    console.log(
      `Connecting to web sockets at URL ws://${host}:${port}/v1/subscribe with token: ${token}`
    );
  }

  // Create WebSocket connection.
  const socket = new WebSocket(`ws://${host}:${port}/v1/subscribe`);

  socket.addEventListener("close", (event) => {
    onClose(event);
  });

  socket.addEventListener("error", (event) => {
    onError(event);
  });

  socket.addEventListener("message", (event) => {
    if (debug) {
      console.log("event type: message", event);
    }

    const parsedData = JSON.parse(event.data) as AbstractrrrEvent;

    switch (parsedData.event_type) {
      case "auth":
        break;

      case "irc":
        switch (parsedData.event_data.irc_type) {
          case "PrivateMessage":
            onChat(parsedData.event_data.irc_data);
            break;
          case "PingMessage":
            break;
          case "ClearChatMessage":
            onClearChat(parsedData.event_data.irc_data);
            break;
          case "PongMessage":
            break;
        }
        break;
    }

    if (debug) {
      console.log(">> data → parsed", parsedData);

      const formattedData = JSON.stringify(parsedData, null, 2);
      console.log(">> data → JSON", formattedData);
    }
  });

  socket.addEventListener("open", (event) => {
    // Send the auth token
    if (debug) {
      console.log("Sending token payload:", { token });
    }

    socket.send(JSON.stringify({ token }));
    onConnect(event);
  });
};

export type AbstractrrrHealthResponse = {
  data: {
    date: string;
    service: string;
  };
  meta: {
    request_id: string;
  };
};
