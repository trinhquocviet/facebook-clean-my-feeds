
export class NewsFeed {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">News Feed</span>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_SPONSORED" value="NF_SPONSORED">Sponsored </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_TABLIST_STORIES_REELS_ROOMS" value="NF_TABLIST_STORIES_REELS_ROOMS">"Stories | Reels | Rooms" tabs list box </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_STORIES" value="NF_STORIES">Stories </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_SURVEY" value="NF_SURVEY">Survey </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_PEOPLE_YOU_MAY_KNOW" value="NF_PEOPLE_YOU_MAY_KNOW">People you may know </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_PAID_PARTNERSHIP" value="NF_PAID_PARTNERSHIP">Paid partnership </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_SPONSORED_PAID" value="NF_SPONSORED_PAID">Sponsored · Paid for by ______ </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_SUGGESTIONS" value="NF_SUGGESTIONS">Suggestions / Recommendations </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_FOLLOW" value="NF_FOLLOW">Follow </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_PARTICIPATE" value="NF_PARTICIPATE">Participate </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_REELS_SHORT_VIDEOS" value="NF_REELS_SHORT_VIDEOS">Reels and short videos </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_SHORT_REEL_VIDEO" value="NF_SHORT_REEL_VIDEO">Reel/short video </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_EVENTS_YOU_MAY_LIKE" value="NF_EVENTS_YOU_MAY_LIKE">Events you may like </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_ANIMATED_GIFS_POSTS" value="NF_ANIMATED_GIFS_POSTS">Animated GIFs </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_ANIMATED_GIFS_PAUSE" value="NF_ANIMATED_GIFS_PAUSE">Pause animated GIFs </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_SHARES" value="NF_SHARES"># shares </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_AUTO_REDIR_TO_MOST_RECENT" value="NF_AUTO_REDIR_TO_MOST_RECENT">Auto-redirect to "Most Recent" page </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_LIKES_MAXIMUM" value="NF_LIKES_MAXIMUM">Maximum number of Likes: <input type="text" name="NF_LIKES_MAXIMUM_COUNT" placeholder="1000" size="6">
          </label>
        </div>
        <br>
        <strong>Text filter:</strong>
        <div>
          <label disabled="disabled">
            <input type="checkbox" cbtype="M" name="NF_BLOCKED_FEED" value="0" disabled="">News Feed </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="M" name="NF_BLOCKED_FEED" value="1">Groups Feed </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="M" name="NF_BLOCKED_FEED" value="2">Videos Feed </label>
        </div>
        <br>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_BLOCKED_ENABLED" value="NF_BLOCKED_ENABLED">Enabled </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="NF_BLOCKED_RE" value="NF_BLOCKED_RE">Regular Expressions (RegExp) </label>
        </div>
        <small>(Separate words or phrases with a line break, Regular Expressions are supported)</small>
        <textarea name="NF_BLOCKED_TEXT"></textarea>
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

export const newsFeed = new NewsFeed();