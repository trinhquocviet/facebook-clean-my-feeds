
export class Reels {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">Reels</span>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="REELS_CONTROLS" value="REELS_CONTROLS">Show video controls </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="REELS_DISABLE_LOOPING" value="REELS_DISABLE_LOOPING">Disable looping </label>
        </div>
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

export const reels = new Reels();