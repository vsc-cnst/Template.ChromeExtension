import { MessageTypes, ProjectName } from "../constants";
import { MessageService } from "../message-service";

console.log(`[${ProjectName}][content-script] Content script has started`)

const messageService = new MessageService("content-script");

messageService.on(
  MessageTypes.ServiceWorkerMessage,
  (content) => `Received service worker message: ${content.value}`,
);

messageService.on(MessageTypes.PopupContentScriptMessage, (content) => {
  void messageService.sendMessage(
    MessageTypes.ContentScriptToPopup,
    `Popup said: ${content}`,
  ).catch((error: unknown) => {
    console.error(`[${ProjectName}][content-script] Could not notify the popup:`, error);
  });

  return "Hello from the content script";
});

void messageService.sendMessage(MessageTypes.ContentScriptReady, {})
  .catch((error: unknown) => {
    console.error(`[${ProjectName}][content-script] Could not send ready message to the service worker:`, error);
  });
