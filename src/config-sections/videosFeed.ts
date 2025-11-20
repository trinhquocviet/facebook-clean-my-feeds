
import { cmfFieldsetSectionTag } from 'components/fieldsetSection';
import { BaseConfigSection } from './base';

export class VideosFeedSection extends BaseConfigSection {
  protected override componentContent(): string {
    return `
      <${cmfFieldsetSectionTag}>
        <span slot="title">Videos Feed</span>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VF_SPONSORED" value="VF_SPONSORED">Sponsored </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VF_LIVE" value="VF_LIVE">LIVE </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VF_INSTAGRAM" value="VF_INSTAGRAM">Instagram </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VF_DUPLICATE_VIDEOS" value="VF_DUPLICATE_VIDeos">Duplicate video </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VF_ANIMATED_GIFS_PAUSE" value="VF_ANIMATED_GIFS_PAUSE">Pause animated GIFs </label>
        </div>
        <br>
        <strong>Text filter:</strong>
        <div>
          <label>
            <input type="checkbox" cbtype="M" name="VF_BLOCKED_FEED" value="0">News Feed </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="M" name="VF_BLOCKED_FEED" value="1">Groups Feed </label>
        </div>
        <div>
          <label disabled="disabled">
            <input type="checkbox" cbtype="M" name="VF_BLOCKED_FEED" value="2" disabled="">Videos Feed </label>
        </div>
        <br>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VF_BLOCKED_ENABLED" value="VF_BLOCKED_ENABLED">Enabled </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VF_BLOCKED_RE" value="VF_BLOCKED_RE">Regular Expressions (RegExp) </label>
        </div>
        <small>(Separate words or phrases with a line break, Regular Expressions are supported)</small>
        <textarea name="VF_BLOCKED_TEXT"></textarea>
      </${cmfFieldsetSectionTag}>
    `;
  }
}

const htmlTag = 'videos-feed-section';
customElements.define(htmlTag, VideosFeedSection);
export { htmlTag as videosFeedSectionTag };
