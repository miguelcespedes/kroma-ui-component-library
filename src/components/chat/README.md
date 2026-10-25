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
| `disableHistoryControls()` | Mark current transcript controls completed when the host advances to a new interaction stage. |
| `setError(message)` | Show or clear a composer error. |
| `mode` | Typed `"default" | "kitchen"` property reflected by the `mode` attribute. Changing it rebuilds the transcript. |
| `interactionMode` | Typed `"guided" | "free-text"` property for the composer. Defaults to `guided` and changes without rebuilding the transcript. |

Component listeners are disposed when the element disconnects and reinitialized if it is connected again.

The `mode`, `chat-title`, `subtitle`, `avatar`, `status`, `messages-label`, `empty-state`, `input-label`, `placeholder`, `send-label`, and `typing-label` attributes configure the element. The conversation starts in `guided`; the empty composer surface is always visible, and clicking it enters `free-text` without changing or rebuilding the message history. The composer shows no placeholder or instructional text. All text entry uses the existing `simple-keyboard` 3.8.199 instance; KromaChat has no editable composer control that can open the iPhone/Android system keyboard. Conversational form fields are read-only entry targets with `inputmode="none"` and route input through that same keyboard instance. Hiding the virtual keyboard does not clear text. The virtual keyboard opens only on explicit text entry or selection of a form entry target; it does not open while navigating message controls. Hosts can call `disableHistoryControls()` after a stage transition so stale actions stay visible as completed history but cannot be repeated. KromaChat bundles the Inter Variable font locally under the SIL Open Font License; the system stack is only a deliberate fallback. The dependency's default stylesheet is imported through the Vite entry; KromaChat constrains the engine to its visual theme. The `options` message remains an alias for the original QuickReplies contract.

## Local voice dictation

Dictation uses `browser-whisper` 2.x with the multilingual `whisper-tiny` model and Whisper language ID `es`. After critical page work, a shared background service asks the library to verify/reuse its local OPFS or Cache API copy and prepare the engine; missing model files are fetched once and cached by the library. This preparation does not access the microphone, interrupt chat input, or display progress or installation controls. The browser asks for microphone permission only after the user activates the ready microphone button. Microphone audio is captured for at most 30 seconds and transcribed locally. Audio and recognized text are not uploaded or logged. Transcription is final-only: the user can edit the inserted text with the physical or virtual keyboard and must submit it manually.

Automatic preparation is deferred on Save-Data/2G connections and skipped when the browser reports at most 2 GB of device memory. Storage estimates are advisory because the library must first probe its own cache (a valid cached model can be reused even with little free space); quota or download failures remain silent and leave text entry available. In these cases the dictation button stays hidden until preparation succeeds.

The chat page must be served in a secure context. `browser-whisper` uses WebGPU when available and can use threaded WASM as a fallback; that fallback requires `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`. The Vite development and preview middleware applies these headers only to `/chat/`, not the full cheatsheet. Hosts such as GitHub Pages that cannot set these response headers may still support dictation through WebGPU; otherwise preparation fails silently and the microphone remains hidden while text entry stays available.

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

Changing the development `mode` rebuilds the transcript. Kitchen Mode loads its catalog asynchronously from the optional `kitchen/` module, leaves the composer visible but disabled, presents the virtual keyboard's alphabetic, shifted, numeric, and composer examples, and suppresses host action, send, quantity and form-submit events. QuickReplies and ChoiceList may still show a local selected state without adding user messages. It does not run the host's commerce journey or call services. Kitchen Mode and the guided/free-text composer mode are independent; the Cheatsheet's extended capture page remains the visual-inspection mode for the complete conversation history.

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
- `layout/` owns the header, message history and composer; `input/` contains local audio capture, the lazy `browser-whisper` adapter, speech-session controller, per-composer simple-keyboard adapter, Spanish layout configuration, keyboard-mode controller and virtual text projection. The composer coordinates guided/free-text entry and routes composer/form fields through one virtual keyboard instance. Form targets use `readonly` and `inputmode="none"`; no editable native composer or native-keyboard mode is exposed. Keyboard instances use unique input and root names, disable cross-instance input synchronization, and are destroyed with their composer. The Whisper engine is shared while chats are mounted; its workers are disposed when the final composer is destroyed.
- `messages/`, `navigation/`, `catalog/`, `commerce/`, `forms/`, and `feedback/` contain their named presentation controls.
- `shared/` contains reusable action, icon, image and formatting primitives.
- `kroma-chat.scss` is the stylesheet entry point; `styles/` separates token aliases, local font-face, layout, messages, navigation, catalog, commerce, forms, feedback and state families.

Control modules receive structured data and callbacks. Only the host decides which message or journey step comes next.
