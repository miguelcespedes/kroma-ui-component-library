import type { ChatMessage } from "../../../components/chat/core/chat.types";
import { kitchenCatalog } from "./kitchen.catalog";

/** Creates the static conversation used by Kitchen Mode through the existing chat renderer. */
export function createKitchenMessages(): ChatMessage[] {
  return kitchenCatalog.flatMap((section, index) => [
    {
      author: "assistant",
      type: "text",
      text: `${String(index + 1).padStart(2, "0")}. ${section.title}. ${section.description}`,
    },
    ...section.examples,
  ]);
}
