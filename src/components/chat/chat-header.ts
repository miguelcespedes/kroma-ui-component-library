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

  constructor(options: ChatHeaderOptions) {
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
    this.element.append(avatar, heading, this.actionsElement);
    this.setStatus(options.status || null);
  }

  setStatus(status: string | null) {
    this.statusElement.textContent = status || "";
    this.statusElement.hidden = !status;
  }

  setActions(actions: ChatHeaderAction[], onAction: (action: ChatHeaderAction) => void) {
    this.actionsElement.replaceChildren();
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "kroma-chat__header-action";
      button.textContent = action.label;
      button.disabled = Boolean(action.disabled);
      button.addEventListener("click", () => onAction(action));
      this.actionsElement.append(button);
    });
  }
}
