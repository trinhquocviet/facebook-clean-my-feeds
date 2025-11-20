Here is a profile of the "FB Clean My Feeds" userscript migration project based on the provided documents, formatted in Markdown.

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

### ✅ Migration Progress and Achievements

The core, non-UI functionality has been successfully migrated.

* **Configuration & Storage System:** Migrated to a type-safe `ConfigManager` using IndexedDB for persistent storage. Supports async/await operations, default settings, and import/export functionality.
* **Language System:** A complete, modular, and type-safe translation infrastructure has been implemented.
* **Main Script (`src/index.ts`):** Updated to integrate the new type-safe modules and includes enhanced post-hiding logic with reason tracking.

### 📐 Architectural & Coding Conventions

| Area | Convention | Example |
| :--- | :--- | :--- |
| **Component Classes** | Use PascalCase. | `CMFConfigModal` |
| **Component HTML Tags** | Use kebab-case. | `cmf-config-modal` |
| **File Structure** | Components in `src/components`, utilities in `src/utils`, constants in `src/constants`. | `src/components/welcomeMessage/index.ts` |
| **UI Implementation** | All UI elements must be implemented as custom elements (Web Components). | Styles defined in a `<style>` tag within the Shadow DOM. |

### ⏭️ Next Steps

The project is currently ready for UI development. The primary remaining tasks include:

1.  **Implementing the Settings UI:** Developing the UI/Dialog system for settings, ideally as a Web Component.
2.  **Developing Remaining Feed Processors:** Creating additional feed processing functions and components.

---

Would you like me to start by outlining the file structure for the main settings modal component (`cmf-settings-modal`)?