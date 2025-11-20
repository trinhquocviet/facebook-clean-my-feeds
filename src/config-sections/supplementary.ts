
import { cmfFieldsetSectionTag } from 'components/fieldsetSection';
import { BaseConfigSection } from './base';

export class SupplementarySection extends BaseConfigSection {
  protected override componentContent(): string {
    return `
      <${cmfFieldsetSectionTag} part="config-section">
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
      </${cmfFieldsetSectionTag}>
    `;
  }
}

const htmlTag = 'supplementary-section';
customElements.define(htmlTag, SupplementarySection);
export { htmlTag as supplementarySectionTag };
