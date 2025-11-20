export class ModalFooter {
  private htmlContent: string;

  constructor() {
    this.htmlContent = this.generateHtml();
  }

  private generateHtml(): string {
    return `
      <div class="footer">
        <button id="BTNSave" class="cmf-button">Save</button>
        <button id="BTNExport" class="cmf-button">Export</button>
        <button id="BTNImport" class="cmf-button">Import</button>
        <button id="BTNReset" class="cmf-button">Reset</button>
        <input type="file" id="FIcmfr" class="fileInput" style="display: none;">
        <div class="fileResults">&nbsp;</div>
      </div>
    `;
  }

  public getHtml(): string {
    return this.htmlContent;
  }

  public attachEventListeners(containerElement: ShadowRoot | HTMLElement): void {
    containerElement.querySelector('#BTNSave')?.addEventListener('click', this.save);
    containerElement.querySelector('#BTNExport')?.addEventListener('click', this.export);
    containerElement.querySelector('#BTNImport')?.addEventListener('click', this.import);
    containerElement.querySelector('#BTNReset')?.addEventListener('click', this.reset);
  }

  private save(): void {
    console.log('Save button clicked. (Logic to be implemented)');
    // Implement save settings logic here
  }

  private export(): void {
    console.log('Export button clicked. (Logic to be implemented)');
    // Implement export settings logic here
  }

  private import(): void {
    console.log('Import button clicked. (Logic to be implemented)');
    // Trigger file input click or handle file selection logic here
  }

  private reset(): void {
    console.log('Reset button clicked. (Logic to be implemented)');
    // Implement reset settings logic here
  }
  
  // private handleFileChange(event: Event): void {
  //   const file = (event.target as HTMLInputElement).files?.[0];
  //   if (file) {
  //     console.log(`File selected for import: ${file.name}`);
  //     // Implement file reading/import logic here
  //   }
  // }
}

export const modalFooter = new ModalFooter();