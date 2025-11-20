
export class Tips {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">Tips</span>
        <span>Clearing your browser's cache will reset your settings to their default values. Use the "Export" and "Import" buttons to backup and restore your customised settings.</span>
      </cmf-fieldset-section>
    `;
  }

  public getHtml(): string {
    return this.htmlContent;
  }

  public attachEventListeners(containerElement: ShadowRoot | HTMLElement): void {
    // 
  }
}

export const tips = new Tips();