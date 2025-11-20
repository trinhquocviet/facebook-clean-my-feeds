
export class ProfileAndPage {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">Profile / Page</span>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="PP_ANIMATED_GIFS_POSTS" value="PP_ANIMATED_GIFS_POSTS">Animated GIFs </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="PP_ANIMATED_GIFS_PAUSE" value="PP_ANIMATED_GIFS_PAUSE">Pause animated GIFs </label>
        </div>
        <br>
        <strong>Text filter:</strong>
        <div>
          <label disabled="disabled">
            <input type="checkbox" cbtype="M" name="PP_BLOCKED_FEED" value="0" disabled="">Profile page </label>
        </div>
        <br>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="PP_BLOCKED_ENABLED" value="PP_BLOCKED_ENABLED">Enabled </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="PP_BLOCKED_RE" value="PP_BLOCKED_RE">Regular Expressions (RegExp) </label>
        </div>
        <small>(Separate words or phrases with a line break, Regular Expressions are supported)</small>
        <textarea name="PP_BLOCKED_TEXT"></textarea>
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

export const profileAndPage = new ProfileAndPage();