import { ProjectName } from "./constants";

export type EmptyMessage = Record<string, never>;

export class MessageType<TRequest, TResponse> {
    private static readonly codes = new Set<string>();

    declare private readonly __types: (request: TRequest, response: TResponse) => [TRequest, TResponse];

    constructor(readonly code: string) {
        if (code.trim().length === 0) {
            throw new Error("MessageType code must not be empty.");
        }
        if (MessageType.codes.has(code)) {
            throw new Error(`MessageType code "${code}" is already registered.`);
        }

        MessageType.codes.add(code);
    }
}

interface Message<TContent> {
    type: string;
    content: TContent;
}

type MessageHandler = (
    content: unknown,
    sender: chrome.runtime.MessageSender,
) => unknown;

/**
 * Provides a shared messaging interface for extension contexts such as content scripts,
 * the service worker, and the popup.
 *
 * Each context creates one instance to register its runtime listener. Register handlers
 * with {@link on}; the message type's code is used to dispatch messages across Chrome's
 * structured-clone boundary. Codes must be stable and unique for each message type.
 *
 * Use {@link sendMessage} for runtime messages or {@link sendMessageToContentScript} to
 * target a content script in a tab. These methods preserve the request and response types
 * declared by the corresponding {@link MessageType}.
 */
export class MessageService {
    /** Identifier included in this service's log messages. */
    constructor(readonly code: string) {
        chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
            if (
                typeof message !== "object" ||
                message === null ||
                !("type" in message) ||
                typeof message.type !== "string" ||
                !("content" in message)
            ) {
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

    private readonly handlers = new Map<string, MessageHandler>();

    /**
     * Registers a handler for a message type. A type may only be registered once per
     * context; duplicate codes throw rather than silently replacing a handler.
     * @param messageType The message type to handle.
     * @param handler Handles the typed request content and returns the typed response content.
     */
    on<TRequest, TResponse>(
        messageType: MessageType<TRequest, TResponse>,
        handler: (content: TRequest, sender: chrome.runtime.MessageSender) => TResponse,
    ): void {
        if (this.handlers.has(messageType.code)) {
            throw new Error(`[${ProjectName}][${this.code}] Handler already registered for message type "${messageType.code}".`);
        }

        this.handlers.set(messageType.code, handler as MessageHandler);
    }

    /**
     * Sends a message through the extension runtime.
     * @param messageType The message type, including its request and response types.
     * @param content The request content.
     * @returns A promise resolving to the response content, or undefined if no response was sent.
     */
    sendMessage<TRequest, TResponse>(
        messageType: MessageType<TRequest, TResponse>,
        content: TRequest,
    ): Promise<TResponse | undefined> {
        const message: Message<TRequest> = { type: messageType.code, content };

        console.log(`[${ProjectName}][${this.code}] Sending runtime message:`, message);

        return chrome.runtime.sendMessage(message).then((response?: TResponse) => {
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
    sendMessageToContentScript<TRequest, TResponse>(
        tabId: number,
        messageType: MessageType<TRequest, TResponse>,
        content: TRequest,
    ): Promise<TResponse | undefined> {
        const message: Message<TRequest> = { type: messageType.code, content };

        console.log(`[${ProjectName}][${this.code}] Sending message to tab ${tabId}:`, message);

        return chrome.tabs.sendMessage(tabId, message).then((response?: TResponse) => {
            console.log(`[${ProjectName}][${this.code}] Response received from tab ${tabId}:`, {
                originalMessage: message,
                response,
            });
            return response;
        });
    }
}
