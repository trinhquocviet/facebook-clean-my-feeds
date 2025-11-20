
# Migration Guidelines for AI Assistants

This document provides instructions, context, and guidelines for migrating the "FB Clean My Feeds" userscript from its legacy vanilla JavaScript implementation to a modern, modular architecture using TypeScript and Web Components.

## 1. Project Overview

The "FB Clean My Feeds" userscript is a browser extension that enhances the Facebook user experience by hiding sponsored posts, suggested content, and other visual clutter from various Facebook feeds.

The primary goal of this migration is to refactor the existing monolithic JavaScript codebase into a more maintainable, scalable, and type-safe application using modern web technologies. This will make it easier to add new features, fix bugs, and improve the overall quality of the code.

## 2. Tech Stack

The migrated codebase will use the following technologies:

- **TypeScript:** For static typing and improved code quality.
- **Web Components:** For creating encapsulated, reusable UI components with the Shadow DOM.
- **Bun:** As the primary tool for building, bundling, and running development scripts.
- **idb-keyval:** For storing user settings in IndexedDB.
- **Greasemonkey/Tampermonkey APIs:** For interacting with the browser and the host page (Facebook).

## 3. Development Workflow

The following scripts are available in `package.json` to streamline the development process:

- `bun watch`: This is the primary development command. It will watch for file changes in the `src` directory and automatically rebuild the userscript.
- `bun run build`: This command will create a production-ready build of the userscript in the `dist` directory.
- `bun run type-check`: This command will run the TypeScript compiler to check for type errors in the codebase.

## 4. Coding Style and Conventions

To ensure consistency and maintainability, please adhere to the following coding style and conventions:

### 4.1. File and Folder Structure

- All new TypeScript code should be placed in the `src` directory.
- Reusable UI components should be placed in the `src/components` directory, with each component in its own subdirectory.
- Utility functions and modules should be placed in the `src/utils` directory.
- Constants, such as image assets or magic strings, should be placed in the `src/constants` directory.

### 4.2. Web Components

- All UI elements should be implemented as custom elements (Web Components) that extend `HTMLElement`.
- Use the Shadow DOM (`this.attachShadow({ mode: 'open' })`) to encapsulate component styles and markup.
- Define component-specific styles within a `<style>` tag in the component's shadow root. You can import CSS files as text.
- Render component markup in a `render()` method, and call this method from the `connectedCallback()` lifecycle method.
- Use `observedAttributes` and `attributeChangedCallback` to react to changes in component attributes.
- Define custom elements using `customElements.define()`.

### 4.3. TypeScript

- **Enable Strict Mode:** For all new code, `strict` mode in `tsconfig.json` should be enabled to enforce strong typing and prevent common errors.
- **Typing:** Provide explicit types for all variables, function parameters, and return values. Avoid using `any` whenever possible.
- **Modules:** Use ES modules (`import` and `export`) to organize your code into logical units.
- **Classes:** Use classes to define the structure and behavior of your web components.

### 4.4. Naming Conventions

- **Component Classes:** Use PascalCase for component class names (e.g., `CMFConfigModal`).
- **Component HTML Tags:** Use kebab-case for custom element HTML tags (e.g., `cmf-config-modal`).
- **Files and Folders:** Use camelCase or kebab-case for file and folder names (e.g., `cmfToggleBtn` or `cmf-toggle-btn`).

## 5. Migration-Specific Instructions

The migration process will involve converting the legacy vanilla JavaScript code from `src/index.ts` into a collection of modern TypeScript web components.

### 5.1. General Approach

1.  **Identify Functionality:** Analyze the `src/index.ts` file and identify distinct pieces of functionality (e.g., hiding a specific type of post, building a section of the settings UI).
2.  **Create a Component:** For each piece of functionality, create a new web component in the `src/components` directory.
3.  **Migrate Logic:** Carefully migrate the relevant JavaScript logic from `src/index.ts` to the new component, rewriting it in TypeScript and adhering to the coding conventions outlined above.
4.  **Refactor and Replace:** Once the component is complete and tested, replace the corresponding legacy code in `src/index.ts` with the new component.

### 5.2. State Management

The legacy code uses a global `VARS` object to store state. In the new architecture, we will use a combination of component-level state and the `idb-keyval` library for persistent settings.

- **Component-Level State:** For state that is specific to a single component, use private class properties.
- **Global Settings:** For user settings that need to be shared across components, use the `idb-keyval` library to store and retrieve them from IndexedDB. Create a dedicated module for managing these settings.

## 6. Example Migration

Here's a small example of how to migrate a piece of legacy code to the new architecture.

**Legacy Code (from `src/index.ts`):**

```javascript
// This is a simplified example
function showWelcomeMessage() {
  const message = 'Welcome to FB Clean My Feeds!';
  const messageElement = document.createElement('div');
  messageElement.className = 'welcome-message';
  messageElement.textContent = message;
  document.body.appendChild(messageElement);
}
```

**Migrated Code (as a Web Component):**

**`src/components/welcomeMessage/index.ts`**
```typescript
import styles from './styles.css' with { type: 'text' };

export class WelcomeMessage extends HTMLElement {
  shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const message = this.getAttribute('message') || 'Welcome to FB Clean My Feeds!';

    this.shadow.innerHTML = `
      <style>
        ${styles}
      </style>
      <div class="welcome-message">
        <p>${message}</p>
      </div>
    `;
  }
}

const htmlTag = 'welcome-message';
customElements.define(htmlTag, WelcomeMessage);
export { htmlTag as welcomeMessageTag };
```

**`src/components/welcomeMessage/styles.css`**
```css
.welcome-message {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem;
  background-color: #f0f2f5;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
```

By following these guidelines, you will be able to effectively contribute to the migration of the "FB Clean My Feeds" userscript to a modern, maintainable, and scalable codebase.
