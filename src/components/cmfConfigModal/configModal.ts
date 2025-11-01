import images from 'constants/images';

export class CMFConfigModal extends HTMLElement {
  shadow: ShadowRoot;
  private isModalOpen: boolean = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });

    // Immediately render the component structure
    this.render();
    
    // Bind event listeners after rendering
    this.connectedCallback();
  }

  public open(): void {
    if (this.isModalOpen) return;
    const modal = this.shadow.querySelector('.cmf-config-modal') as HTMLDivElement;
    if (modal) {
      modal.classList.add('open');
      this.isModalOpen = true;
    }
  }

  public close(): void {
    if (!this.isModalOpen) return;
    const modal = this.shadow.querySelector('.cmf-config-modal') as HTMLDivElement;
    if (modal) {
      modal.classList.remove('open');
      this.isModalOpen = false;
    }
  }

  public toggle(): void {
    if (this.isModalOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  connectedCallback() {
    const closeButton = this.shadow.querySelector('.btn-close');
    
    if (closeButton) {
      closeButton.addEventListener('click', this.toggle.bind(this));
    }
    
    // Add logic to listen for custom events from the main page if necessary,
    // though the public method approach is usually cleaner.
  }

  render() {
    const version = 'v' + GM.info.script.version.replaceAll('-', ' ');
    const title = GM.info.script.name || 'Clean my feeds';

    this.shadow.innerHTML = `
      <style>
        .cmf-config-modal {
          --modal-spacing: 1rem;

          position: fixed;
          top: 0.15rem;
          left: 4.25rem;
          bottom: 0.15rem;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 30rem;
          padding: calc(var(--modal-spacing) / 2) var(--modal-spacing);
          z-index: 5;
          box-shadow: 0 12px 28px 0 var(--shadow-2),
                      0 2px 4px 0 var(--shadow-1),
                      inset 0 0 0 1px var(--shadow-inset);
          border-radius: 0.5rem;
          opacity: 0;
          visibility: hidden;
          color: var(--primary-text);
          background-color: var(--card-background);
          transition: opacity 0.3s ease-in-out,
                      visibility 0.3s ease-in-out;
          
          &.open {
            opacity: 1;
            visibility: visible;
          }

          .header, .body, footer {
            padding-top: calc(var(--modal-spacing) / 2);
            padding-bottom: calc(var(--modal-spacing) / 2);
          }
          
          .header, .footer {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
          }

          .header {
            align-items: stretch;
          }

          .body {
            flex-grow: 1;
          }

          .script-logo {
            svg {
              width: 4rem;
              height: 4rem;
            }
          }

          .script-title {
            flex-grow: 1;
            align-self: center;
            text-align: center;

            p {
              margin: 0;
              font-size: 1.35rem;
              font-weight: 700;
              text-align: center;

              small {
                font-size: 0.85rem;
                font-weight: 400;
              }
            }
          }

          .btn-close {
            align-self: start;
            padding: 0;
            border: none;
            background-color: transparent;
            cursor: pointer;
            width: 2.25rem;
            aspect-ratio: 1 / 1;

            height: 2.25rem;
            transition-property: color, fill, stroke;
            transition-timing-function: var(--fds-soft);
            transition-duration: var(--fds-fast);
            border-radius: 50%;
            border: none;
            color: var(--secondary-icon);

            &:hover {
              background-color: var(--hover-overlay);
            }
          }
        }
      </style>

      <div id="cmfConfigModal" class="cmf-config-modal">
        <div class="header">
          <div class="script-logo">${images.logo}</div>
          <div class="script-title">
            <p>${title}&nbsp;<small>(${version})</small></p>
          </div>
          <button class="btn-close">
            ${images.iconClose}
          </button>
        </div>
        <div class="body">
          <slot name="content">content</slot>
        </div>
        <div class="footer">
          <button id="BTNSave">Save</button>
          <button id="BTNExport">Export</button>
          <button id="BTNImport">Import</button>
          <button id="BTNReset">Reset</button>
          <input type="file" id="FIcmfr" class="fileInput">
          <div class="fileResults">&nbsp;</div>
        </div>
      </div>
    `;
  }
}

const htmlTag = 'cmf-config-modal';
customElements.define(htmlTag, CMFConfigModal);
export { htmlTag as cmfConfigModalTag };