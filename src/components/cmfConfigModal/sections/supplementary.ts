
export class Supplementary {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">Supplementary / information section</span>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="OTHER_INFO_BOX_CORONAVIRUS" value="OTHER_INFO_BOX_CORONAVIRUS">Coronavirus (information box) </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="OTHER_INFO_BOX_CLIMATE_SCIENCE" value="OTHER_INFO_BOX_CLIMATE_SCIENCE">Climate Science (information box) </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="OTHER_INFO_BOX_SUBSCRIBE" value="OTHER_INFO_BOX_SUBSCRIBE">Subscribe (information box) </label>
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

export const supplementary = new Supplementary();