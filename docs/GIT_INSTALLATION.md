# Instalación de KromaChat desde Git

El paquete se distribuye desde este repositorio, no desde npm Registry. El build GitHub Pages sigue siendo independiente. El paquete incluye KromaChat, declaraciones TypeScript, CSS, Inter Variable, imágenes de Kitchen Mode y los temas Dracula y Kroma Entrepreneur. `simple-keyboard` se incorpora al bundle; no hace falta instalar Bootstrap.

## Instalar una versión

En la aplicación consumidora, fija una etiqueta publicada manualmente:

```sh
npm install github:miguelcespedes/kroma-ui-component-library#v1.0.0
```

También se puede fijar un commit completo para una prueba reproducible:

```sh
npm install github:miguelcespedes/kroma-ui-component-library#<commit-sha>
```

No se crean ni actualizan tags automáticamente. Para actualizar, cambia la referencia explícita y ejecuta el comando de instalación; confirma el `package-lock.json` resultante. `npm update @kroma/ui-component-library` puede mantener la referencia actual y no sustituye cambiar la etiqueta o SHA fijados.

Las instalaciones Git ejecutan `prepare` y compilan `lib-dist/chat` durante la preparación. No se necesita publicar `lib-dist/` ni ejecutar una compilación manual en la aplicación consumidora.

### npm 12

La instalación Git se verificó localmente con npm 11.16.0. npm 12 no está instalado en este entorno, así que no se afirma que se haya comprobado su política de permisos. Si npm 12 bloquea la preparación por `allow-git`, limita la autorización al repositorio consumidor mediante su `.npmrc` (no la configures globalmente):

```ini
allow-git=github:miguelcespedes/kroma-ui-component-library
```

Verifica el nombre y formato admitidos por la versión concreta con `npm config get allow-git` y la documentación de `npm help config` antes de desplegar.

## Next.js App Router

Importa el CSS desde el layout raíz y carga el módulo del Web Component solo en el cliente. La definición extiende `HTMLElement`; no debe importarse estáticamente en un módulo que Next pueda evaluar durante SSR.

`app/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import "@kroma/ui-component-library/chat/styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-kroma-theme="kroma-entrepreneur" data-bs-theme="light">
      <body>{children}</body>
    </html>
  );
}
```

`app/KromaChatClient.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { KromaChat } from "@kroma/ui-component-library/chat";

export default function KromaChatClient() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let chat: KromaChat | undefined;
    const listeners = new AbortController();

    void import("@kroma/ui-component-library/chat").then(({ KromaChat: ChatElement }) => {
      if (!active || !host.current) return;

      chat = document.createElement("kroma-chat") as KromaChat;
      chat.setAttribute("chat-title", "Asistente Kroma");
      chat.setAttribute("avatar", "K");
      chat.classList.add("kroma-chat--fullscreen");
      chat.addEventListener("kroma-chat-send", (event) => {
        const { message } = (event as CustomEvent<{ message: string }>).detail;
        console.log("Mensaje del usuario:", message);
      }, { signal: listeners.signal });
      chat.addEventListener("kroma-chat-option-select", (event) => {
        const { value } = (event as CustomEvent<{ value: string }>).detail;
        console.log("Opción seleccionada:", value);
      }, { signal: listeners.signal });
      chat.addEventListener("kroma-chat-action", (event) => {
        const { actionId, data } = (event as CustomEvent<{ actionId: string; data?: unknown }>).detail;
        console.log("Acción solicitada:", actionId, data);
      }, { signal: listeners.signal });
      chat.addEventListener("kroma-chat-quantity-change", (event) => {
        const { productId, quantity } = (event as CustomEvent<{ productId?: string; quantity: number }>).detail;
        console.log("Cantidad:", productId, quantity);
      }, { signal: listeners.signal });
      chat.addEventListener("kroma-chat-form-submit", (event) => {
        const { values } = (event as CustomEvent<{ values: Record<string, string> }>).detail;
        console.log("Formulario:", values);
      }, { signal: listeners.signal });

      host.current.replaceChildren(chat);
      chat.addMessage({ author: "assistant", type: "text", text: "Hola, ¿cómo puedo ayudarte?" });
      void ChatElement; // La importación registra el custom element.
    });

    return () => {
      active = false;
      listeners.abort();
      chat?.remove();
    };
  }, []);

  return <div ref={host} />;
}
```

Inclúyelo en cualquier página o layout cliente/servidor:

```tsx
import KromaChatClient from "./KromaChatClient";

export default function Page() {
  return <KromaChatClient />;
}
```

Los eventos son eventos DOM con `detail`; el host conserva el estado y la lógica de negocio. También están disponibles `kroma-chat-rich-action` y `kroma-chat-option-select`. Para variantes, elige `data-kroma-theme="dracula"` o `"kroma-entrepreneur"`; usa `data-bs-theme="light"`/`"dark"` solo para el contraste. No hace falta importar Bootstrap.

## Verificar el paquete instalado

```sh
npm ls @kroma/ui-component-library
npm pack --dry-run github:miguelcespedes/kroma-ui-component-library#v1.0.0
```

En el paquete instalado deben existir `lib-dist/chat/index.js`, `index.d.ts`, `styles.css`, una fuente `.woff2`, imágenes `.png` y chunks de JavaScript bajo `lib-dist/chat/`. `styles.css` referencia la fuente como recurso relativo al paquete. En DevTools → Network, confirma que las solicitudes CSS, WOFF2 e imágenes responden correctamente.

## Problemas frecuentes

- **SSR menciona `HTMLElement`, `window` o `document`:** quita el import de ejecución estático del componente y cárgalo dentro de `useEffect`, como arriba. El import de CSS puede permanecer en el layout raíz.
- **La fuente no aparece:** confirma que se importó `chat/styles.css`, que `styles.css` y el `.woff2` están en `node_modules`, y que no hay 404 de fuente en Network. La fuente se sirve desde el CSS del paquete, no desde una URL del cheatsheet.
- **El script de preparación Git no se ejecutó:** revisa los permisos de lifecycle scripts y la configuración `allow-git` de npm 12 en el proyecto consumidor; no actives permisos globales sin necesidad.
- **Cambios de versión no llegan:** actualiza la etiqueta/SHA de la dependencia Git y el lockfile; limpiar solo la caché no cambia una referencia fijada.

## Validación en este repositorio

`npm run test:package` verifica `npm pack --dry-run`, la instalación del tarball, `prepare` desde un repositorio Git local temporal, tipos TypeScript y el consumo en Chromium. El fixture `test/package-consumer-next/` contiene un consumidor App Router; un build real de Next.js y una instalación desde GitHub requieren ejecutar la validación en un entorno con Next.js instalado y acceso al repositorio remoto.
