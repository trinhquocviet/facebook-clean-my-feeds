import styles from './styles.css' with { type: 'text' };

export abstract class BaseConfigSection extends HTMLElement {
  shadow: ShadowRoot;
  defaultStyles = styles;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  protected get componentStyles(): string {
    return '';
  }

  protected abstract componentContent(): string;

  protected render(): void {
    this.shadow.innerHTML = `
      <style>
        ${styles}
        ${this.componentStyles}
      </style>
      ${this.componentContent()}
    `;
  }
}