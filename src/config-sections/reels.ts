
import { cmfFieldsetSectionTag } from 'components/fieldsetSection';
import { BaseConfigSection } from './base';

export class ReelsSection extends BaseConfigSection {
  protected override componentContent(): string {
    return `
      <${cmfFieldsetSectionTag} part="config-section">
        <span slot="title">Reels</span>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="REELS_CONTROLS" value="REELS_CONTROLS">Show video controls </label>
        </div>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="REELS_DISABLE_LOOPING" value="REELS_DISABLE_LOOPING">Disable looping </label>
        </div>
      </${cmfFieldsetSectionTag}>
    `;
  }
}

const htmlTag = 'reels-section';
customElements.define(htmlTag, ReelsSection);
export { htmlTag as reelsSectionTag };
