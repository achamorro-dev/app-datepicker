import './app-date-picker-input-surface-base.js';

import { html } from 'lit';
import { property } from 'lit/decorators/property.js';

import { slotDatePicker } from '../helpers/slot-date-picker.js';
import type { SlotDatePickerInit } from '../helpers/typings.js';
import { DatePickerMinMaxMixin } from '../mixins/date-picker-min-max-mixin.js';
import { DatePickerMixin } from '../mixins/date-picker-mixin.js';
import type { DatePickerMixinProperties } from '../mixins/typings.js';
import { RootElement } from '../root-element/root-element.js';

export class DatePickerInputSurface extends DatePickerMixin(DatePickerMinMaxMixin(RootElement)) implements DatePickerMixinProperties {
  // public static override styles = [
  //   ...MenuSurface.styles,
  //   baseStyling,
  //   resetShadowRoot,
  //   DatePickerInputSurfaceBaseStyling,
  // ];

  @property({ type: Object }) anchor?: HTMLElement;
  @property({ type: Object }) datePickerDateUpdated?: SlotDatePickerInit['onDatePickerDateUpdated'];
  @property({ type: Object }) datePickerFirstUpdated?: SlotDatePickerInit['onDatePickerFirstUpdated'];
  @property({ type: Boolean }) open = false;

  protected override render() {
    const {
      chooseMonthLabel,
      chooseYearLabel,
      disabledDates,
      disabledDays,
      firstDayOfWeek,
      landscape,
      locale,
      max,
      min,
      nextMonthLabel,
      previousMonthLabel,
      selectedDateLabel,
      selectedYearLabel,
      shortWeekLabel,
      showWeekNumber,
      startView,
      todayDateLabel,
      todayYearLabel,
      value,
      weekLabel,
      weekNumberTemplate,
      weekNumberType,
    } = this;

    return html`
    <app-date-picker-input-surface-base
      ?open=${this.open}
      ?stayOpenOnBodyClick=${true}
      .anchor=${this as HTMLElement}
    >${slotDatePicker({
      chooseMonthLabel,
      chooseYearLabel,
      disabledDates,
      disabledDays,
      firstDayOfWeek,
      landscape,
      locale,
      max,
      min,
      nextMonthLabel,
      onDatePickerDateUpdated: this.#onDatePickerDateUpdated,
      onDatePickerFirstUpdated: this.#onDatePickerFirstUpdated,
      previousMonthLabel,
      selectedDateLabel,
      selectedYearLabel,
      shortWeekLabel,
      showWeekNumber,
      startView,
      todayDateLabel,
      todayYearLabel,
      value,
      weekLabel,
      weekNumberTemplate,
      weekNumberType,
    })}</app-date-picker-input-surface-base>
    `;
  }

  #onDatePickerDateUpdated: SlotDatePickerInit['onDatePickerDateUpdated'] = (ev) => {
    return this.datePickerDateUpdated?.(ev);
  };

  #onDatePickerFirstUpdated: SlotDatePickerInit['onDatePickerFirstUpdated'] = (ev) => {
    return this.#onDatePickerFirstUpdated?.(ev);
  };
}
