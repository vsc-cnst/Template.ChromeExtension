import { EmptyMessage, MessageType } from "./message-service";

export const ProjectName = chrome.runtime.getManifest()["name"];

export class MessageTypes {
    static ContentScriptReady = new MessageType<EmptyMessage, EmptyMessage>("content-script-ready");

    static ServiceWorkerMessage = new MessageType<{ value: string }, string>("service-worker-message-example");
    static PopupServiceWorkerMessage = new MessageType<string, string>("popup-service-worker-message");
    static PopupContentScriptMessage = new MessageType<string, string>("popup-content-script-message");
    static ServiceWorkerToPopup = new MessageType<string, EmptyMessage>("service-worker-to-popup");
    static ContentScriptToPopup = new MessageType<string, EmptyMessage>("content-script-to-popup");
}