import type { KromaChat } from "../../components/chat";

/** Kitchen is a cheatsheet consumer: it configures the public element and feeds it sample messages. */
export async function initializeKitchenLab(chat: KromaChat) {
  const { createKitchenMessages } = await import("./kitchen/kitchen.messages");
  chat.setComposerDisabled(true);
  createKitchenMessages().forEach((message) => chat.addMessage(message));
}
