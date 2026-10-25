import type { ChatFormSubmitDetail } from "../core/chat.events";
import type { ChatFormField, ConversationalFormMessage } from "../core/chat.types";

type FormHandler = (detail: ChatFormSubmitDetail) => void;
type FormInputFocusHandler = (input: HTMLInputElement) => void;

function createFormField(messageId: string, field: ChatFormField, onInputFocus: FormInputFocusHandler) {
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
  input.readOnly = true;
  input.inputMode = "none";
  input.value = field.value || "";
  input.placeholder = field.placeholder || "";
  if (field.autocomplete) input.setAttribute("autocomplete", field.autocomplete);
  if (field.min !== undefined) input.min = String(field.min);
  if (field.max !== undefined) input.max = String(field.max);
  if (field.pattern) input.pattern = field.pattern;
  input.className = "kroma-chat__form-input";
  input.addEventListener("focus", () => onInputFocus(input));
  if (field.errorMessage) {
    input.setCustomValidity(field.errorMessage);
    input.addEventListener("input", () => input.setCustomValidity(""));
  }
  group.append(label, input);
  return { group, input };
}

function getFieldError(field: ChatFormField, input: HTMLInputElement) {
  const value = input.value.trim();
  if (field.required && !value) return field.errorMessage || `${field.label} es obligatorio.`;
  if (!value) return null;
  if (field.pattern) {
    try {
      if (!new RegExp(`^(?:${field.pattern})$`, "u").test(value)) return field.errorMessage || `Revisa ${field.label.toLocaleLowerCase("es")}.`;
    } catch {
      return "La validación de este campo no está configurada correctamente.";
    }
  }
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return field.errorMessage || "Introduce un correo electrónico válido.";
  if (field.type === "url") {
    try {
      new URL(value);
    } catch {
      return field.errorMessage || "Introduce una URL válida.";
    }
  }
  if (field.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return field.errorMessage || `Introduce un número válido para ${field.label.toLocaleLowerCase("es")}.`;
    if (field.min !== undefined && number < Number(field.min)) return field.errorMessage || `El valor mínimo es ${field.min}.`;
    if (field.max !== undefined && number > Number(field.max)) return field.errorMessage || `El valor máximo es ${field.max}.`;
  }
  if (field.type === "date" && Number.isNaN(Date.parse(`${value}T00:00:00`))) return field.errorMessage || "Introduce una fecha válida.";
  return null;
}

export function createConversationalForm(messageId: string, message: ConversationalFormMessage, onInputFocus: FormInputFocusHandler, onSubmit: FormHandler) {
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
    const control = createFormField(messageId, field, onInputFocus);
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
  const validationError = document.createElement("p");
  validationError.id = `${messageId}-form-validation-error`;
  validationError.className = "kroma-chat__error";
  validationError.setAttribute("role", "alert");
  validationError.hidden = true;
  form.insertBefore(validationError, submit);
  let dispatchingSubmit = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (hasDuplicateNames || dispatchingSubmit) return;
    const invalidField = message.fields.find((field) => {
      const input = controls.get(field.name);
      return input && Boolean(getFieldError(field, input));
    });
    if (invalidField) {
      const input = controls.get(invalidField.name);
      const error = input ? getFieldError(invalidField, input) : null;
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", validationError.id);
        input.focus();
      }
      validationError.textContent = error || "Revisa los datos del formulario.";
      validationError.hidden = false;
      return;
    }
    form.querySelectorAll<HTMLInputElement>("input[aria-invalid='true']").forEach((input) => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
    validationError.hidden = true;
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
