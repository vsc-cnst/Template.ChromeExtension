"use strict";
(() => {
  // src/message-service.ts
  var _MessageType = class _MessageType {
    constructor(code) {
      this.code = code;
      if (code.trim().length === 0) {
        throw new Error("MessageType code must not be empty.");
      }
      if (_MessageType.codes.has(code)) {
        throw new Error(`MessageType code "${code}" is already registered.`);
      }
      _MessageType.codes.add(code);
    }
  };
  _MessageType.codes = /* @__PURE__ */ new Set();
  var MessageType = _MessageType;
  var MessageService = class {
    /** Identifier included in this service's log messages. */
    constructor(code) {
      this.code = code;
      this.handlers = /* @__PURE__ */ new Map();
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (typeof message !== "object" || message === null || !("type" in message) || typeof message.type !== "string" || !("content" in message)) {
          console.error(`[${ProjectName}][${this.code}] Invalid message received:`, { message, sender });
          return;
        }
        console.log(`[${ProjectName}][${this.code}] Message received:`, { message, sender });
        const handler = this.handlers.get(message.type);
        if (!handler) {
          return;
        }
        sendResponse(handler(message.content, sender));
      });
    }
    /**
     * Registers a handler for a message type. A type may only be registered once per
     * context; duplicate codes throw rather than silently replacing a handler.
     * @param messageType The message type to handle.
     * @param handler Handles the typed request content and returns the typed response content.
     */
    on(messageType, handler) {
      if (this.handlers.has(messageType.code)) {
        throw new Error(`[${ProjectName}][${this.code}] Handler already registered for message type "${messageType.code}".`);
      }
      this.handlers.set(messageType.code, handler);
    }
    /**
     * Sends a message through the extension runtime.
     * @param messageType The message type, including its request and response types.
     * @param content The request content.
     * @returns A promise resolving to the response content, or undefined if no response was sent.
     */
    sendMessage(messageType, content) {
      const message = { type: messageType.code, content };
      console.log(`[${ProjectName}][${this.code}] Sending runtime message:`, message);
      return chrome.runtime.sendMessage(message).then((response) => {
        console.log(`[${ProjectName}][${this.code}] Response received:`, { originalMessage: message, response });
        return response;
      });
    }
    /**
     * Sends a message to a content script in the specified tab.
     * @param tabId The ID of the tab containing the receiving content script.
     * @param messageType The message type, including its request and response types.
     * @param content The request content.
     * @returns A promise resolving to the content script's response content, or undefined if none was sent.
     */
    sendMessageToContentScript(tabId, messageType, content) {
      const message = { type: messageType.code, content };
      console.log(`[${ProjectName}][${this.code}] Sending message to tab ${tabId}:`, message);
      return chrome.tabs.sendMessage(tabId, message).then((response) => {
        console.log(`[${ProjectName}][${this.code}] Response received from tab ${tabId}:`, {
          originalMessage: message,
          response
        });
        return response;
      });
    }
  };

  // src/constants.ts
  var ProjectName = chrome.runtime.getManifest()["name"];
  var MessageTypes = class {
  };
  MessageTypes.ContentScriptReady = new MessageType("content-script-ready");
  MessageTypes.ServiceWorkerMessage = new MessageType("service-worker-message-example");
  MessageTypes.PopupServiceWorkerMessage = new MessageType("popup-service-worker-message");
  MessageTypes.PopupContentScriptMessage = new MessageType("popup-content-script-message");
  MessageTypes.ServiceWorkerToPopup = new MessageType("service-worker-to-popup");
  MessageTypes.ContentScriptToPopup = new MessageType("content-script-to-popup");

  // src/background/service-worker.ts
  chrome.runtime.onInstalled.addListener(() => {
    console.log(`[${ProjectName}][service-worker] Service Worker installed.`);
  });
  var messageService = new MessageService("service-worker");
  messageService.on(MessageTypes.PopupServiceWorkerMessage, (content) => {
    void messageService.sendMessage(
      MessageTypes.ServiceWorkerToPopup,
      `Worker received: ${content}`
    ).catch((error) => {
      console.error(`[${ProjectName}][service-worker] Could not notify the popup:`, error);
    });
    return "Hello from the service worker";
  });
  messageService.on(MessageTypes.ContentScriptReady, (_content, sender) => {
    var _a;
    const tabId = (_a = sender.tab) == null ? void 0 : _a.id;
    if (tabId === void 0) {
      console.error(`[${ProjectName}][service-worker] Cannot message the content script: sender has no tab ID.`);
      return {};
    }
    void messageService.sendMessageToContentScript(
      tabId,
      MessageTypes.ServiceWorkerMessage,
      { value: "Hello from service worker" }
    ).catch((error) => {
      console.error(`[${ProjectName}][service-worker] Could not send message to tab ${tabId}:`, error);
    });
    return {};
  });
})();
//# sourceMappingURL=service-worker.global.js.map