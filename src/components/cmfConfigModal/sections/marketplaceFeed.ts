
export class MarketplaceFeed {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">Marketplace Feed</span>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="MP_SPONSORED" value="MP_SPONSORED">Sponsored </label>
        </div>
        <br>
        <strong>Text filter:</strong>
        <div>
          <label disabled="disabled">
            <input type="checkbox" cbtype="M" name="MP_BLOCKED_FEED" value="0" disabled="">Marketplace Feed </label>
        </div>
        <br>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="MP_BLOCKED_ENABLED" value="MP_BLOCKED_ENABLED">Enabled </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="MP_BLOCKED_RE" value="MP_BLOCKED_RE">Regular Expressions (RegExp) </label>
        </div>
        <strong>Prices: </strong>
        <br>
        <small>(Separate words or phrases with a line break, Regular Expressions are supported)</small>
        <textarea name="MP_BLOCKED_TEXT"></textarea>
        <br>
        <br>
        <strong>Description: </strong>
        <br>
        <small>(Separate words or phrases with a line break, Regular Expressions are supported)</small>
        <textarea name="MP_BLOCKED_TEXT_DESCRIPTION"></textarea>
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

export const marketplaceFeed = new MarketplaceFeed();