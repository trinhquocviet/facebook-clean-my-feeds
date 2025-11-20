## 🚀 FB Clean My Feeds Migration Project Profile

The "FB Clean My Feeds" userscript is undergoing a crucial migration to transform its legacy vanilla JavaScript codebase into a modern, scalable, and type-safe application.

---

### 🎯 Core Project Goal

To refactor the existing monolithic JavaScript codebase, which currently hides sponsored posts and visual clutter from various Facebook feeds, into a modular, maintainable, and modern architecture.

### 💻 Key Technologies (The Migrated Stack)

| Technology | Role | Convention/Requirement |
| :--- | :--- | :--- |
| **TypeScript** | Primary language for static typing. | Strict mode must be enabled; explicit typing required. |
| **Web Components** | Creating encapsulated, reusable UI components. | Must use the Shadow DOM (`mode: 'open'`). |
| **Bun** | Build, bundling, and running development scripts. | Development commands include `bun watch` and `bun run build`. |
| **idb-keyval** | Persistent storage for user settings. | Managed via the new `ConfigManager` class. |
| **ES Modules** | Code organization and dependency management. | Use `import` and `export`. |

### 🛠️ Development Workflow

The following scripts are available in `package.json` to streamline the development process:

- `bun watch`: This is the primary development command. It will watch for file changes in the `src` directory and automatically rebuild the userscript.
- `bun run build`: This command will create a production-ready build of the userscript in the `dist` directory.
- `bun run type-check`: This command will run the TypeScript compiler to check for type errors in the codebase.

### 📏 Coding Standards & Conventions

#### File & Folder Structure

- **`src/components`**: Reusable UI components, with each component in its own subdirectory.
- **`src/utils`**: Utility functions and modules.
- **`src/constants`**: Constants, such as image assets or magic strings.
- **`src/modules`**: Core business logic modules (e.g., `config.ts`, `language.ts`).

#### Web Components

- **Base Class**: All UI elements should extend `HTMLElement`.
- **Shadow DOM**: Use `this.attachShadow({ mode: 'open' })` to encapsulate styles and markup.
- **Styling**: Define component-specific styles within a `<style>` tag in the component's shadow root.
- **Rendering**: Render component markup in a `render()` method, called from `connectedCallback()`.
- **Attributes**: Use `observedAttributes` and `attributeChangedCallback` for reactivity.
- **HTML Attributes**: Use double quotes for HTML attribute values (e.g., `class="container"`).

#### TypeScript Guidelines

- **Strict Mode**: Enabled in `tsconfig.json` to enforce strong typing.
- **Explicit Typing**: Provide explicit types for variables, parameters, and return values. Avoid `any`.
- **Modules**: Use ES modules (`import` / `export`) for code organization.
- **Imports**: Use single quotes for import paths (e.g., `import { foo } from './bar';`).

#### Naming Conventions

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **Component Classes** | PascalCase | `CMFConfigModal` |
| **Component HTML Tags** | kebab-case | `cmf-config-modal` |
| **Files & Folders** | camelCase or kebab-case | `cmfToggleBtn` or `cmf-toggle-btn` |

### 💾 State Management

- **Component-Level State**: Use private class properties for state specific to a single component.
- **Global Settings**: Use the `ConfigManager` (backed by `idb-keyval`) for user settings that need to be shared across components.

### ✅ Migration Progress and Achievements

The core, non-UI functionality has been successfully migrated.

* **Configuration & Storage System:** Migrated to a type-safe `ConfigManager` using IndexedDB for persistent storage. Supports async/await operations, default settings, and import/export functionality.
* **Language System:** A complete, modular, and type-safe translation infrastructure has been implemented.
* **Main Script (`src/index.ts`):** Updated to integrate the new type-safe modules and includes enhanced post-hiding logic with reason tracking.

### ⏭️ Next Steps

The project is currently ready for UI development. The primary remaining tasks include:

1.  **Implementing the Settings UI:** Developing the UI/Dialog system for settings, ideally as a Web Component.
2.  **Developing Remaining Feed Processors:** Creating additional feed processing functions and components.