import { MessageTypes, ProjectName } from "../constants";
import { MessageService } from "../message-service";

chrome.runtime.onInstalled.addListener(() => {
  // let you know that the service worker has been installed
  console.log(`[${ProjectName}][service-worker] Service Worker installed.`);
});

const messageService = new MessageService("service-worker");

messageService.on(MessageTypes.PopupServiceWorkerMessage, (content) => {
  void messageService.sendMessage(
    MessageTypes.ServiceWorkerToPopup,
    `Worker received: ${content}`,
  ).catch((error: unknown) => {
    console.error(`[${ProjectName}][service-worker] Could not notify the popup:`, error);
  });

  return "Hello from the service worker";
});

messageService.on(MessageTypes.ContentScriptReady, (_content, sender) => {
  const tabId = sender.tab?.id;

  if (tabId === undefined) {
    console.error(`[${ProjectName}][service-worker] Cannot message the content script: sender has no tab ID.`);
    return {};
  }

  void messageService.sendMessageToContentScript(
    tabId,
    MessageTypes.ServiceWorkerMessage,
    { value: "Hello from service worker" },
  ).catch((error: unknown) => {
    console.error(`[${ProjectName}][service-worker] Could not send message to tab ${tabId}:`, error);
  });

  return {};
});
