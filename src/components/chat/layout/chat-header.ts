export type ChatHeaderOptions = {
  title: string;
  avatar?: string | null;
  subtitle?: string | null;
  status?: string | null;
};

export type ChatHeaderAction = {
  id: string;
  label: string;
  value?: string;
  disabled?: boolean;
};

/** Header presentation for the public KromaChat facade. */
export class ChatHeader {
  readonly element: HTMLElement;
  private readonly statusElement: HTMLElement;
  private readonly actionsElement: HTMLElement;
  private readonly speechToggle: HTMLButtonElement;
  private readonly speechSupported: boolean;

  constructor(options: ChatHeaderOptions, onSpeechToggle: (enabled: boolean) => void) {
    this.element = document.createElement("header");
    this.element.className = "kroma-chat__header";

    const avatar = document.createElement("span");
    avatar.className = "kroma-chat__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = options.avatar || "";
    avatar.hidden = !options.avatar;

    const heading = document.createElement("div");
    heading.className = "kroma-chat__heading";
    const title = document.createElement("h2");
    title.className = "kroma-chat__title";
    title.textContent = options.title;
    if (options.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.className = "kroma-chat__subtitle";
      subtitle.textContent = options.subtitle;
      heading.append(title, subtitle);
    } else {
      heading.append(title);
    }
    this.statusElement = document.createElement("p");
    this.statusElement.className = "kroma-chat__status";
    this.statusElement.hidden = true;
    heading.append(this.statusElement);

    this.actionsElement = document.createElement("div");
    this.actionsElement.className = "kroma-chat__actions";
    this.actionsElement.setAttribute("role", "group");
    this.actionsElement.setAttribute("aria-label", "Chat actions");
    this.actionsElement.dataset.chatActions = "";
    this.speechToggle = document.createElement("button");
    this.speechToggle.type = "button";
    this.speechToggle.className = "kroma-chat__header-action kroma-chat__speech-toggle";
    this.speechToggle.setAttribute("aria-pressed", "true");
    this.speechToggle.setAttribute("aria-label", "Desactivar lectura automática");
    this.speechToggle.title = "Desactivar lectura automática";
    this.speechSupported = typeof window !== "undefined"
      && typeof window.speechSynthesis !== "undefined"
      && typeof SpeechSynthesisUtterance !== "undefined";
    this.speechToggle.hidden = !this.speechSupported;
    this.createSpeechIcon();
    this.speechToggle.addEventListener("click", () => {
      const enabled = this.speechToggle.getAttribute("aria-pressed") !== "true";
      this.setSpeechEnabled(enabled);
      onSpeechToggle(enabled);
    });
    this.actionsElement.append(this.speechToggle);
    this.element.append(avatar, heading, this.actionsElement);
    this.updateActionsVisibility();
    this.setStatus(options.status || null);
  }

  setSpeechEnabled(enabled: boolean) {
    const label = `${enabled ? "Desactivar" : "Activar"} lectura automática`;
    this.speechToggle.setAttribute("aria-pressed", String(enabled));
    this.speechToggle.setAttribute("aria-label", label);
    this.speechToggle.title = label;
    this.speechToggle.dataset.speechEnabled = String(enabled);
    this.speechToggle.querySelector("[data-speech-muted]")?.toggleAttribute("hidden", enabled);
    this.speechToggle.querySelector("[data-speech-waves]")?.toggleAttribute("hidden", !enabled);
  }

  setSpeechToggleVisible(visible: boolean) {
    this.speechToggle.hidden = !visible || !this.speechSupported;
    this.updateActionsVisibility();
  }

  setStatus(status: string | null) {
    this.statusElement.textContent = status || "";
    this.statusElement.hidden = !status;
  }

  setActions(actions: ChatHeaderAction[], onAction: (action: ChatHeaderAction) => void) {
    this.actionsElement.replaceChildren(this.speechToggle);
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kroma-chat__header-action";
      button.textContent = action.label;
      button.disabled = Boolean(action.disabled);
      button.addEventListener("click", () => onAction(action));
      this.actionsElement.append(button);
    });
    this.updateActionsVisibility();
  }

  private updateActionsVisibility() {
    this.actionsElement.hidden = ![...this.actionsElement.children].some((child) => !(child as HTMLElement).hidden);
  }

  private createSpeechIcon() {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    const speaker = document.createElementNS("http://www.w3.org/2000/svg", "path");
    speaker.setAttribute("d", "M4 10v4h4l5 4V6l-5 4H4Z");
    const waves = document.createElementNS("http://www.w3.org/2000/svg", "path");
    waves.setAttribute("d", "M16 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12");
    waves.dataset.speechWaves = "";
    const muted = document.createElementNS("http://www.w3.org/2000/svg", "path");
    muted.setAttribute("d", "m16 9 5 6m0-6-5 6");
    muted.dataset.speechMuted = "";
    muted.setAttribute("hidden", "");
    icon.append(speaker, waves, muted);
    this.speechToggle.append(icon);
    this.setSpeechEnabled(true);
  }
}
