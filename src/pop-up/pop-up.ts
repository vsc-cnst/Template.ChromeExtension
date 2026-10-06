import { MessageTypes, ProjectName } from "../constants";
import { MessageService } from "../message-service";

const messageService = new MessageService("pop-up");
const status = document.getElementById("message-status")!;
const events = document.getElementById("message-events")!;
const serviceWorkerButton = document.getElementById("message-service-worker")!;
const contentScriptButton = document.getElementById("message-content-script")!;

function logReceivedMessage(from: string, content: string): void {
  const item = document.createElement("li");
  item.textContent = `${from}: ${content}`;
  events.append(item);
}

messageService.on(MessageTypes.ServiceWorkerToPopup, (content) => {
  logReceivedMessage("Service worker", content);
  return {};
});

messageService.on(MessageTypes.ContentScriptToPopup, (content) => {
  logReceivedMessage("Content script", content);
  return {};
});

serviceWorkerButton.addEventListener("click", () => {
  status.textContent = "Sending message to the service worker...";

  void messageService.sendMessage(
    MessageTypes.PopupServiceWorkerMessage,
    "Hello from the popup",
  ).then((response) => {
    status.textContent = `Service worker replied: ${response ?? "no response"}`;
  }).catch((error: unknown) => {
    console.error(`[${ProjectName}][pop-up] Could not message the service worker:`, error);
    status.textContent = "Could not reach the service worker.";
  });
});

contentScriptButton.addEventListener("click", () => {
  status.textContent = "Finding the active tab...";

  void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab?.id === undefined) {
      throw new Error("No active tab is available.");
    }

    return messageService.sendMessageToContentScript(
      tab.id,
      MessageTypes.PopupContentScriptMessage,
      "Hello from the popup",
    );
  }).then((response) => {
    status.textContent = `Content script replied: ${response ?? "no response"}`;
  }).catch((error: unknown) => {
    console.error(`[${ProjectName}][pop-up] Could not message the active tab's content script:`, error);
    status.textContent = "Could not reach the content script. Try a page where the extension is enabled.";
  });
});