import styles from './styles.css' with { type: 'text' };

export class FieldsetSection extends HTMLElement {
  shadow: ShadowRoot;
  private isCollapsed: boolean = true;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback(): void {
    // We bind the event listener here, ensuring the element is attached and 
    // the DOM structure (from render() in the constructor) is available.
    const legendButton = this.shadow.querySelector('.fieldset-button');
    legendButton?.addEventListener('click', this.toggleCollapse.bind(this));
  }

  disconnectedCallback(): void {
    const legendButton = this.shadow.querySelector('.fieldset-button');
    legendButton?.removeEventListener('click', this.toggleCollapse.bind(this));
  }

  private toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    const fieldset = this.shadow.querySelector('div.fieldset');
    
    if (fieldset) {
      if (this.isCollapsed) {
        fieldset.classList.add('collapsed');
        fieldset.setAttribute('aria-expanded', 'false');
      } else {
        fieldset.classList.remove('collapsed');
        fieldset.setAttribute('aria-expanded', 'true');
      }
    }
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        ${styles}
      </style>

      <div class="fieldset collapsed" aria-expanded="false"> 
        <button class="fieldset-button">
          <span class="indicator"></span>
          <span class="title">
            <slot name="title"></slot>
          </span>
        </button>

        <div class="fieldset-content">
          <div class="fieldset-divider"></div>
          <div class="fieldset-inner">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}

const htmlTag = 'cmf-fieldset-section';
customElements.define(htmlTag, FieldsetSection);
export { htmlTag as cmfFieldsetSectionTag };