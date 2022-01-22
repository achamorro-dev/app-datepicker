import { css, unsafeCSS } from 'lit';

import { appDatePickerDialogName } from './constants.js';

export const datePickerDialogDialogStyling = css`
:host {
  display: block;

  --mdc-dialog-min-width: 256px;
  --mdc-dialog-content-ink-color: var(--base-primary-color);
  --mdc-theme-primary: var(--base-primary-color);
}
.mdc-dialog .mdc-dialog__surface,
.mdc-dialog .mdc-dialog__content {
  overflow: initial;
}

.mdc-dialog .mdc-dialog__content {
  background-color: inherit;
  padding: 0;
}
`;

export const datePickerDialogStyling = css`
${unsafeCSS(appDatePickerDialogName)} {
  display: block;
}

${unsafeCSS(appDatePickerDialogName)} app-date-picker {
  background-color: var(--mdc-theme-surface);
}

${unsafeCSS(appDatePickerDialogName)} .secondary-actions mwc-button + mwc-button {
  margin: 0 0 0 8px;
}
`;
