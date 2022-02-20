import { customElement } from 'lit/decorators.js';

import { appDatePickerInputSurfaceBaseName } from './constants.js';
import { DatePickerInputSurfaceBase } from './date-picker-input-surface-base.js';

@customElement(appDatePickerInputSurfaceBaseName)
export class AppDatePickerInputSurfaceBase extends DatePickerInputSurfaceBase {}

declare global {
  interface HTMLElementTagNameMap {
    [appDatePickerInputSurfaceBaseName]: AppDatePickerInputSurfaceBase;
  }
}
