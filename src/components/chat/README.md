# KromaChat

`KromaChat` is a native, backend-agnostic Web Component registered as `<kroma-chat>`. Importing `src/components/chat` registers the element. The host owns conversation state, business rules, persistence and integrations.

```ts
import { KromaChat, type ChatMessage } from "./components/chat";

const chat = document.querySelector<KromaChat>("kroma-chat");
chat?.addMessage({ author: "assistant", type: "text", text: "Hello." });
```

## Public methods

| Method | Purpose |
| --- | --- |
| `addMessage(message)` | Append a typed or legacy-compatible message and return its stable ID. |
| `setTyping(active, label?)` | Set or clear the host-controlled typing indicator. |
| `setStatus(status)` | Update the optional header status. |
| `setHeaderActions(actions)` | Configure header buttons; selections emit `kroma-chat-action` with `control: "header"`. |
| `setComposerDisabled(disabled)` | Disable or enable the text composer. |
| `setOptionsDisabled(messageId, disabled)` | Disable one message's QuickReplies or ChoiceList. |
| `setError(message)` | Show or clear a composer error. |

Component listeners are disposed when the element disconnects and reinitialized if it is connected again.

The `chat-title`, `subtitle`, `avatar`, `status`, `messages-label`, `empty-state`, `input-label`, `placeholder`, `send-label`, and `typing-label` attributes configure presentation. The `options` message remains an alias for the original QuickReplies contract.

## Message contracts

`ChatMessage` is a discriminated union. It includes text, status, rich content, QuickReplies, ChoiceList, JourneyMenu, CategoryPicker, ProductCard, ProductList, ProductCarousel, ProductDetail, ProductVariantSelector, QuantitySelector, CartSummary, ConversationalForm, OrderReview and ConfirmationCard payloads. Legacy `info` and `options` messages remain supported; `confirmation` and `confirmation-card` render the same reusable confirmation presentation.

Structured controls render supplied data and emit semantic actions. They do not calculate commercial totals, choose journey transitions, persist information or call external services.

## Events

All events bubble and are composed so host applications can listen on the element or an ancestor.

| Event | Detail | Meaning |
| --- | --- | --- |
| `kroma-chat-send` | `{ message, source: "composer" }` | The user submitted text; the user bubble is already in the history. |
| `kroma-chat-option-select` | `{ message, messageId, optionId, value, label, control, option }` | A QuickReply or ChoiceList option was selected. It does not also emit `kroma-chat-send`. |
| `kroma-chat-action` | `{ messageId, control, actionId, label, value?, data? }` | A navigation or structured control action was selected. |
| `kroma-chat-rich-action` | `{ messageId, actionId, value? }` | An action attached to a RichMessage was selected. |
| `kroma-chat-quantity-change` | `{ messageId, controlId, productId?, quantity }` | A quantity control changed. The host remains responsible for state. |
| `kroma-chat-form-submit` | `{ messageId, values }` | A valid ConversationalForm was submitted. Values are emitted in memory only. |

The former `KromaChatElement` class export remains an alias of `KromaChat`; only the hyphenated `kroma-chat` tag is registered.
