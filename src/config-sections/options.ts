
import { cmfFieldsetSectionTag } from 'components/fieldsetSection';
import { BaseConfigSection } from './base';

export class OptionsSection extends BaseConfigSection {
  protected override componentContent(): string {
    return `
      <${cmfFieldsetSectionTag} part="config-section">
        <span slot="title">Options for Hidden Posts</span>
        <span>Show a label if a post is hidden:</span>
        <div>
          <label>
            <input type="radio" name="VERBOSITY_LEVEL" value="0">no label </label>
        </div>
        <div>
          <label>
            <input type="radio" name="VERBOSITY_LEVEL" value="1">Post hidden. Rule: ______ </label>
        </div>
        <div>
          <label>
            <input type="radio" name="VERBOSITY_LEVEL" value="2">7 posts hidden ~ (Groups Feed only) </label>
        </div>
        <br>
        <div>
          <label>Text colour: <br>
            <input type="text" name="VERBOSITY_MESSAGE_COLOUR">
          </label>
        </div>
        <div>
          <label>Background colour: <br>
            <input type="text" name="VERBOSITY_MESSAGE_BG_COLOUR">
          </label>
        </div>
        <br>
        <div>
          <label>
            <input type="checkbox" cbtype="T" name="VERBOSITY_DEBUG" value="VERBOSITY_DEBUG">Highlight "hidden" posts </label>
        </div>
      </${cmfFieldsetSectionTag}>
    `;
  }
}

const htmlTag = 'options-section';
customElements.define(htmlTag, OptionsSection);
export { htmlTag as optionsSectionTag };
