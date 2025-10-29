import images from 'constants/images';

export class CMFToggleBtn extends HTMLElement {
  shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  public get buttonElement(): HTMLButtonElement | null {
    return this.shadow.querySelector('button') as HTMLButtonElement | null;
  }

  static get observedAttributes() {
    return ['title'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'title' && oldValue !== newValue) {
      // Re-render the component if the title attribute is changed dynamically
      this.render();
    }
  }

  render() {
    const title = this.getAttribute('title') || 'CMF Toggle Button';

    this.shadow.innerHTML = `
      <style>
        .cmf-toggle {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          z-index: 999;

          background: var(--secondary-button-background-floating);
          padding: 0.5rem;
          width: 3rem;
          height: 3rem;
          border: 0;
          border-radius: 1.5rem;

          box-shadow: 0 2px 4px var(--shadow-1), 0 12px 28px var(--shadow-2);

          &:hover {
            cursor:pointer;
          }

          svg {
            height: 95%;
            aspect-ratio : 1 / 1;
          }
        }
      </style>
      <button
        title="${title}"
        class="cmf-toggle"
      >
          ${images.logo}
      </button> 
    `;
  }
}
export const htmlTag = 'cmf-toggle-btn';

customElements.define(htmlTag, CMFToggleBtn);