
export class GroupFeed {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">Groups Feed</span>
        <div>
          <label>
          <input type="checkbox" cbtype="T" name="GF_SPONSORED" value="GF_SPONSORED">Sponsored </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_PAID_PARTNERSHIP" value="GF_PAID_PARTNERSHIP">Paid partnership </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_SUGGESTIONS" value="GF_SUGGESTIONS">Suggestions / Recommendations </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_SHORT_REEL_VIDEO" value="GF_SHORT_REEL_VIDEO">Reel/short video </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_ANIMATED_GIFS_POSTS" value="GF_ANIMATED_GIFS_POSTS">Animated GIFs </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_ANIMATED_GIFS_PAUSE" value="GF_ANIMATED_GIFS_PAUSE">Pause animated GIFs </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_SHARES" value="GF_SHARES"># shares </label>
        </div>
        <br>
        <strong>Text filter:</strong>
        <div>
          <label>
            <input type="checkbox" cbtype="M" name="GF_BLOCKED_FEED" value="0">News Feed </label>
        </div>
        <div>
          <label disabled="disabled">
            <input type="checkbox" cbtype="M" name="GF_BLOCKED_FEED" value="1" disabled="">Groups Feed </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="M" name="GF_BLOCKED_FEED" value="2">Videos Feed </label>
        </div>
        <br>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_BLOCKED_ENABLED" value="GF_BLOCKED_ENABLED">Enabled </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="GF_BLOCKED_RE" value="GF_BLOCKED_RE">Regular Expressions (RegExp) </label>
        </div>
        <small>(Separate words or phrases with a line break, Regular Expressions are supported)</small>
        <textarea name="GF_BLOCKED_TEXT"></textarea>
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

export const groupFeed = new GroupFeed();