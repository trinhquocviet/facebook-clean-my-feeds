import { modalHeader } from './modalHeader';
import { modalFooter } from './modalFooter';
import styles from './styles.css' with { type: 'text' };

export class CMFConfigModal extends HTMLElement {
  shadow: ShadowRoot;
  private isModalOpen: boolean = true;

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
    modalHeader.attachEventListeners(this.shadow, this.toggle.bind(this));
  }

  render() {
    const version = 'v' + GM.info.script.version.replaceAll('-', ' ');
    const title = GM.info.script.name || 'Clean my feeds';

    this.shadow.innerHTML = `
      <style>
        ${styles}
      </style>

      <div id="cmfConfigModal" class="cmf-config-modal">
        ${modalHeader.getHtml()}
        <div class="body">
          <div class="content">
            <slot></slot>
          </div>
        </div>
        ${modalFooter.getHtml()}
      </div>
    `;
  }
}

const htmlTag = 'cmf-config-modal';
customElements.define(htmlTag, CMFConfigModal);
export { htmlTag as cmfConfigModalTag };