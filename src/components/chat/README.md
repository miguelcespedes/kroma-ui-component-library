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
| `mode` | Typed `"default" | "kitchen"` property reflected by the `mode` attribute. Changing it rebuilds the transcript. |
| `composerInputMode` | Typed `"native" | "virtual"` property reflected by `input-mode`; defaults to native. |

Component listeners are disposed when the element disconnects and reinitialized if it is connected again.

The `mode`, `input-mode`, `chat-title`, `subtitle`, `avatar`, `status`, `messages-label`, `empty-state`, `input-label`, `placeholder`, `send-label`, and `typing-label` attributes configure the element. `input-mode="virtual"` selects `simple-keyboard` 3.8.199 through KromaChat's private per-composer adapter; the visible composer switch can return to `native` at any time. The default `native` mode preserves the textarea, IME composition, dictation, and assistive-technology input. In virtual mode the library's internal value and caret are authoritative; the displayed div is only a projection and hardware-key bridge. The virtual surface intentionally does not emulate IME composition or system dictation. The dependency's default stylesheet is imported through the Vite entry; KromaChat constrains the engine to its composer flow without replacing its native theme. The `options` message remains an alias for the original QuickReplies contract.

## Kitchen Mode

Kitchen Mode is a static component-inspection conversation rendered by the same message list and renderers as the default chat. It is selected with the additive `mode` attribute or typed property; the default remains `default`.

```html
<kroma-chat mode="kitchen" chat-title="Asistente Kroma" avatar="K"></kroma-chat>
```

```ts
import type { ChatMode, KromaChat } from "./components/chat";

const chat = document.querySelector<KromaChat>("kroma-chat");
const mode: ChatMode = "kitchen";
if (chat) chat.mode = mode;
```

Changing mode rebuilds the transcript. Kitchen Mode loads its catalog asynchronously from the optional `kitchen/` module, leaves the composer visible but disabled, presents the virtual keyboard's alphabetic, shifted, numeric, and composer examples when virtual mode is selected, and suppresses host action, send, quantity and form-submit events. QuickReplies and ChoiceList may still show a local selected state without adding user messages. It does not run the host's commerce journey or call services.

The Cheatsheet's `/chat/` page provides the mode selector, clear/dark theme controls and responsive width/density controls. Its normal mode keeps the existing mock commerce journey; Kitchen Mode presents every example in order in that same `<kroma-chat>` instance.

### Catalog organization

- `kitchen/kitchen.fixtures.ts`: typed, fictional products, variants, categories, menu entries and cart lines. Product art is imported from local `src/assets/` files.
- `kitchen/kitchen.catalog.ts`: ordered component descriptions and real typed `ChatMessage` examples.
- `kitchen/kitchen.messages.ts`: adds the numbered Spanish introduction before each example and produces the transcript consumed by KromaChat.

To add a component example, add or reuse a typed fixture, then add an ordered entry in `kitchen.catalog.ts` using the component's existing message type. Composite internals are demonstrated through their owning renderer (for example, Cart Line Item through Cart Summary and Journey Option through Journey Menu); do not duplicate their markup. Status examples cover information, success, warning and error; the product and choice fixtures include selected and disabled states, and the static typing sample represents loading.

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

## Module map

- `kroma-chat.ts` composes the custom element; `index.ts` is the public TypeScript entry point.
- `core/` contains backend-agnostic models, event contracts and renderer dispatch.
- `layout/` owns the header, message history and composer; `input/` contains the per-composer simple-keyboard adapter, Spanish layout configuration, keyboard-mode controller and visual text projection. Virtual text and caret live in the single simple-keyboard instance; the display and native textarea are mode-specific views/inputs. Engine instances use unique input and root names, disable cross-instance input synchronization, and are destroyed with their composer.
- `messages/`, `navigation/`, `catalog/`, `commerce/`, `forms/`, and `feedback/` contain their named presentation controls.
- `shared/` contains reusable action, icon, image and formatting primitives.
- `kroma-chat.scss` is the stylesheet entry point; `styles/` separates token aliases and the layout, messages, navigation, catalog, commerce, forms, feedback and state families.

Control modules receive structured data and callbacks. Only the host decides which message or journey step comes next.
