import images from 'constants/images';

export class ModalHeader {
  private htmlContent: string;
  public close: (() => void) | null = null;

  constructor() {
    this.htmlContent = this.generateHtml();
    this._close = this._close.bind(this);
  }

  private generateHtml(): string {
    const version = 'v' + GM.info.script.version.replaceAll('-', ' ');
    const title = GM.info.script.name || 'Clean my feeds';

    return `
      <div class="header">
        <div class="script-logo">${images.logo}</div>
        <div class="script-title">
          <p>${title}&nbsp;<small>(${version})</small></p>
        </div>
        <button class="btn-close-modal">
          ${images.iconClose}
        </button>
      </div>
    `;
  }

  public getHtml(): string {
    return this.htmlContent;
  }

  public attachEventListeners(
    containerElement: ShadowRoot | HTMLElement,
    callback: () => void
  ): void {
    this.close = callback;
    
    // Ensure 'this.close' is bound to the ModalHeader instance
    const closeButton = containerElement.querySelector('.btn-close-modal');
    closeButton?.addEventListener('click', this._close);
  }

  private _close(): void {
    if (this.close) {
      this.close();
    } else {
      console.error('ModalHeader: Close delegate function is not set.');
    }
  }
}

export const modalHeader = new ModalHeader();