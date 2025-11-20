
export class Customisations {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <cmf-fieldset-section>
        <span slot="title">Customisations</span>
        <span>Location of Clean my feeds' button:</span>
        <div>
          <label>
            <input type="radio" name="CMF_BTN_OPTION" value="0">bottom left </label>
        </div>
        <div>
          <label>
            <input type="radio" name="CMF_BTN_OPTION" value="1">top right </label>
        </div>
        <div>
          <label>
            <input type="radio" name="CMF_BTN_OPTION" value="2">disabled (use "Settings" in User Script Commands menu") </label>
        </div>
        <br>
        <span>Location of Clean my feeds' dialog box:</span>
        <div>
          <label>
            <input type="radio" name="CMF_DIALOG_OPTION" value="0">left side </label>
        </div>
        <div>
          <label>
            <input type="radio" name="CMF_DIALOG_OPTION" value="1">right side </label>
        </div>
        <br>
        <div>
          <label>Border colour: <br>
            <input type="text" name="CMF_BORDER_COLOUR">
          </label>
        </div>
        <br>
        <div>
          <label>Clean my feeds' dialog-box language: <br>
            <select name="CMF_DIALOG_LANGUAGE">undefined <option value="en" selected="">English</option>undefined <option value="ar">العربية</option>undefined <option value="bg">Български</option>undefined <option value="cs">Čeština</option>undefined <option value="de">Deutsch</option>undefined <option value="el">Ελληνικά</option>undefined <option value="es">Español</option>undefined <option value="fi">Suomi</option>undefined <option value="fr">Français</option>undefined <option value="he">עִבְרִית</option>undefined <option value="id">Bahasa Indonesia</option>undefined <option value="it">Italiano</option>undefined <option value="ja">日本語</option>undefined <option value="lv">Latviešu</option>undefined <option value="nl">Nederlands</option>undefined <option value="pl">Polski</option>undefined <option value="pt">Português</option>undefined <option value="ru">Русский</option>undefined <option value="tr">Türkçe</option>undefined <option value="uk">Українська</option>undefined <option value="vi">Tiếng Việt</option>undefined <option value="zh-Hans">中文（简体）</option>undefined <option value="zh-Hant">中文（繁體）</option>
            </select>
          </label>
        </div>
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

export const customisations = new Customisations();