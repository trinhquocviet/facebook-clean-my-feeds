/**
 * Returns CSS rules for the settings dialog and child elements.
 * @param {{ showAtt: string, iconNewWindowClass: string }} vars
 * @returns {{ selector: string, styles: string }[]}
 */
export function getDialogRules(vars) {
  const bColour = 'var(--divider)';
  const tColour = 'var(--primary-text)';

  return [
    // 1. Dialog container layout, appearance & background
    {
      selector: '.fb-cmf',
      styles: 'position:fixed; top:0.15rem; bottom:0.15rem; display:flex; flex-direction:column; width: 100%; max-width:30rem; padding:0 1rem; z-index:5; ' +
              'box-shadow: 0 12px 28px 0 var(--shadow-2), 0 2px 4px 0 var(--shadow-1), inset 0 0 0 1px var(--shadow-inset); ' +
              `border-radius: 0.5rem; opacity:0; visibility:hidden; color:${tColour}; background-color: var(--card-background);`,
    },
    // 3. Header container
    {
      selector: '.fb-cmf header',
      styles: 'display:flex; justify-content:space-between; direction:ltr;',
    },
    // 4. Header icon container
    {
      selector: '.fb-cmf header .fb-cmf-icon',
      styles: 'flex-grow:0; align-self:auto; width:75px; text-align:left; order:1;',
    },
    // 5. Header icon SVG
    {
      selector: '.fb-cmf header .fb-cmf-icon svg',
      styles: 'width:64px; height:64px; margin:2px 0;',
    },
    // 6. Header title
    {
      selector: '.fb-cmf header .fb-cmf-title',
      styles: 'flex-grow:2; align-self:auto; order:2;',
    },
    // 7. Script version
    {
      selector: '.fb-cmf header .fb-cmf-title .script-version',
      styles: 'font-size: 0.75rem; font-weight: normal;',
    },
    // 8. Lang 1 padding
    {
      selector: '.fb-cmf header .fb-cmf-lang-1',
      styles: 'padding-top:1.25rem;',
    },
    // 9. Lang 2 padding
    {
      selector: '.fb-cmf header .fb-cmf-lang-2',
      styles: 'padding-top:0.75rem;',
    },
    // 10. Title text
    {
      selector: '.fb-cmf header .fb-cmf-title > div',
      styles: 'font-size:1.35rem; font-weight: 700; text-align:center;',
    },
    // 11. Subtitle
    {
      selector: '.fb-cmf header .fb-cmf-title > small',
      styles: 'display:block; font-size:0.8rem; text-align:center;',
    },
    // 12. Close button container
    {
      selector: '.fb-cmf header .fb-cmf-close',
      styles: 'flex-grow:0; align-self:auto; width:75px; text-align:right; padding: 1.5rem 0 0 0; order:3;',
    },
    // 13. Close button
    {
      selector: '.fb-cmf header .fb-cmf-close button',
      styles: 'width: 2.25rem; height: 2.25rem; transition-property: color, fill, stroke; transition-timing-function: var(--fds-soft); transition-duration: var(--fds-fast); cursor: pointer; background-color: transparent; border-radius: 50%; border: none; color: var(--secondary-icon);',
    },
    // 14. Close button hover
    {
      selector: '.fb-cmf header .fb-cmf-close button:hover',
      styles: 'background-color: var(--hover-overlay);',
    },
    // 15. Content container
    {
      selector: '.fb-cmf div.content',
      styles: `flex:1; overflow: hidden auto; border:1px solid ${bColour}; border-radius:0.5rem; color: var(--primary-text);`,
    },
    // 16. Fieldset
    {
      selector: '.fb-cmf fieldset',
      styles: 'margin:0.5rem; padding:0.5rem; border-style: solid;',
    },
    // 17. Fieldset children font size
    {
      selector: '.fb-cmf fieldset *',
      styles: 'font-size: 0.8125rem;',
    },
    // 18. Fieldset legend
    {
      selector: '.fb-cmf fieldset legend',
      styles: 'font-size: 0.95rem; width: 95%; padding: 0 0.5rem 0.125rem 0.5rem; line-height: 2.5; border-width: 2px; border-style: solid; border-radius: 0.5rem 0.5rem 0 0 ;',
    },
    // 19. Legend and label hover
    {
      selector: '.fb-cmf fieldset legend:hover, .fb-cmf fieldset label:hover',
      styles: 'background-color: var(--hover-overlay); cursor: pointer;',
    },
    // 20. Fieldset visible border
    {
      selector: '.fb-cmf fieldset.visible, .fb-cmf fieldset.visible legend',
      styles: `border-color: ${bColour};`,
    },
    // 21. Fieldset hidden border
    {
      selector: '.fb-cmf fieldset.hidden, .fb-cmf fieldset.hidden legend',
      styles: 'border-color: LightGrey;',
    },
    // 22. Fieldset hidden content
    {
      selector: '.fb-cmf fieldset.hidden *:not(legend)',
      styles: 'display: none;',
    },
    // 23. Fieldset visible collapse symbol (-)
    {
      selector: '.fb-cmf fieldset.visible legend::after',
      styles: 'content: "\\2212"; float:right;',
    },
    // 24. Fieldset hidden expand symbol (+)
    {
      selector: '.fb-cmf fieldset.hidden legend::after',
      styles: 'content: "\\002B"; float:right;',
    },
    // 25. Fieldset label
    {
      selector: '.fb-cmf fieldset label',
      styles: 'display:inline-block; padding:0.125rem 0; color: var(--primary-text); font-weight: normal; width:100%;',
    },
    // 26. Fieldset label input
    {
      selector: '.fb-cmf fieldset label input',
      styles: 'margin: 0 0.5rem 0 0.5rem; vertical-align:baseline;',
    },
    // 27. Fieldset label disabled
    {
      selector: '.fb-cmf fieldset label[disabled]',
      styles: 'color:darkgrey;',
    },
    // 28. Fieldset textarea
    {
      selector: '.fb-cmf fieldset textarea',
      styles: 'width:100%; height:12rem;',
    },
    // 29. Fieldset select
    {
      selector: '.fb-cmf fieldset select',
      styles: 'border: 2px inset lightgray; margin: 0 0.5rem 0 0.5rem; vertical-align:baseline;',
    },
    // 30. Dark mode form controls
    {
      selector: '.__fb-dark-mode .fb-cmf fieldset textarea, .__fb-dark-mode .fb-cmf fieldset input[type="input"], .__fb-dark-mode .fb-cmf fieldset select',
      styles: 'background-color:var(--comment-background); color:var(--primary-text);',
    },
    // 31. Footer grid layout
    {
      selector: '.fb-cmf footer',
      styles: 'display: grid; justify-content: space-evenly; padding:1rem 0.25rem; text-align:center;',
    },
    // 32. Footer button margins
    {
      selector: '.fb-cmf .buttons button',
      styles: 'margin-left: 0.25rem; margin-right: 0.25rem;',
    },
    // 33. File input hidden
    {
      selector: '.fb-cmf .fileInput',
      styles: 'display:none;',
    },
    // 34. Import results display
    {
      selector: '.fb-cmf .fileResults',
      styles: 'grid-column-start: 1; grid-column-end: 6; font-style:italic; margin-top: 0.5rem;',
    },
    // 35. Reveal dialog box
    {
      selector: `.fb-cmf[${vars.showAtt}]`,
      styles: 'opacity:1; transform:scale(1); visibility:visible;',
    },
    // 36. New window icon container
    {
      selector: `.${vars.iconNewWindowClass}`,
      styles: 'width: 1rem; height: 1rem;',
    },
    // 37. New window link
    {
      selector: `.${vars.iconNewWindowClass} a`,
      styles: 'width: 1rem; position: relative; display: inline-block;',
    },
    // 38. New window SVG icon
    {
      selector: `.${vars.iconNewWindowClass} svg`,
      styles: 'position: absolute; top: -13.5px; stroke: rgb(101, 103, 107);',
    },
  ];
}
