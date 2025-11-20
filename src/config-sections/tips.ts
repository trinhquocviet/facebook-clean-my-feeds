
import { cmfFieldsetSectionTag } from 'components/fieldsetSection';
import { BaseConfigSection } from './base';

export class TipsSection extends BaseConfigSection {
  protected override componentContent(): string {
    return `
      <${cmfFieldsetSectionTag} part="config-section">
        <span slot="title">Tips</span>
        <span>Clearing your browser's cache will reset your settings to their default values. Use the "Export" and "Import" buttons to backup and restore your customised settings.</span>
      </${cmfFieldsetSectionTag}>
    `;
  }
}

const htmlTag = 'tips-section';
customElements.define(htmlTag, TipsSection);
export { htmlTag as tipsSectionTag };
