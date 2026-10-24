import type { ChatFormSubmitDetail } from "../core/chat.events";
import type { ChatFormField, ConversationalFormMessage } from "../core/chat.types";

type FormHandler = (detail: ChatFormSubmitDetail) => void;

function createFormField(messageId: string, field: ChatFormField) {
  const inputId = `${messageId}-field-${field.id}`;
  const group = document.createElement("div");
  group.className = "kroma-chat__form-field";
  const label = document.createElement("label");
  label.htmlFor = inputId;
  label.textContent = field.label;
  const input = document.createElement("input");
  input.id = inputId;
  input.name = field.name;
  input.type = field.type;
  input.required = Boolean(field.required);
  input.disabled = Boolean(field.disabled);
  input.value = field.value || "";
  input.placeholder = field.placeholder || "";
  if (field.autocomplete) input.setAttribute("autocomplete", field.autocomplete);
  if (field.min !== undefined) input.min = String(field.min);
  if (field.max !== undefined) input.max = String(field.max);
  if (field.pattern) input.pattern = field.pattern;
  input.className = "kroma-chat__form-input";
  if (field.errorMessage) {
    input.setCustomValidity(field.errorMessage);
    input.addEventListener("input", () => input.setCustomValidity(""));
  }
  group.append(label, input);
  return { group, input };
}

export function createConversationalForm(messageId: string, message: ConversationalFormMessage, onSubmit: FormHandler) {
  const wrapper = document.createElement("section");
  wrapper.className = "kroma-chat__conversational-form";
  if (message.title) {
    const title = document.createElement("h3");
    title.className = "kroma-chat__form-title";
    title.textContent = message.title;
    wrapper.append(title);
  }
  const form = document.createElement("form");
  form.className = "kroma-chat__form-fields";
  const controls = new Map<string, HTMLInputElement>();
  const fieldNames = new Set<string>();
  let hasDuplicateNames = false;
  message.fields.forEach((field) => {
    if (fieldNames.has(field.name)) hasDuplicateNames = true;
    fieldNames.add(field.name);
    const control = createFormField(messageId, field);
    if (!controls.has(field.name)) controls.set(field.name, control.input);
    form.append(control.group);
  });
  if (hasDuplicateNames) {
    form.dataset.definitionError = "duplicate-field-names";
    const definitionError = document.createElement("p");
    definitionError.className = "kroma-chat__error";
    definitionError.setAttribute("role", "alert");
    definitionError.textContent = "This form has duplicate field names and cannot be submitted.";
    form.append(definitionError);
  }
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "kroma-chat__journey-action kroma-chat__form-submit";
  submit.textContent = message.submitLabel;
  submit.disabled = hasDuplicateNames;
  form.append(submit);
  let dispatchingSubmit = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (hasDuplicateNames || dispatchingSubmit || !form.reportValidity()) return;
    const values: Record<string, string> = {};
    controls.forEach((input, name) => { values[name] = input.value.trim(); });
    // Guard only synchronous/reentrant submissions; async processing belongs to the host.
    dispatchingSubmit = true;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      onSubmit({ messageId, values });
    } finally {
      dispatchingSubmit = false;
      submit.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });
  wrapper.append(form);
  return wrapper;
}
