import '../date-picker-input-surface/app-date-picker-input-surface.js';
import '../date-picker/app-date-picker.js';

import { TextField } from '@material/mwc-textfield';
import type { TemplateResult } from 'lit';
import { html, nothing } from 'lit';
import { property, queryAsync, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { DateTimeFormat } from '../constants.js';
import type { AppDatePicker } from '../date-picker/app-date-picker.js';
import type { AppDatePickerInputSurface } from '../date-picker-input-surface/app-date-picker-input-surface.js';
import { appDatePickerInputSurfaceName } from '../date-picker-input-surface/constants.js';
import { toResolvedDate } from '../helpers/to-resolved-date.js';
import { iconClose } from '../icons.js';
import { keyEnter, keySpace } from '../key-values.js';
import { DatePickerMinMaxMixin } from '../mixins/date-picker-min-max-mixin.js';
import { DatePickerMixin } from '../mixins/date-picker-mixin.js';
import { ElementMixin } from '../mixins/element-mixin.js';
import type { DatePickerMixinProperties } from '../mixins/typings.js';
import type { ChangedProperties, CustomEventDetail, DatePickerProperties } from '../typings.js';
import { appDatePickerInputClearLabel, appDatePickerInputType } from './constants.js';
import { datePickerInputStyling } from './stylings.js';

export class DatePickerInput extends ElementMixin(DatePickerMixin(DatePickerMinMaxMixin(TextField))) implements DatePickerMixinProperties {
  public override type = appDatePickerInputType;

  @property({ type: String }) public clearLabel = appDatePickerInputClearLabel;
  @queryAsync('.mdc-text-field__input') protected $input!: Promise<HTMLInputElement | null>;
  @queryAsync(appDatePickerInputSurfaceName) protected $inputSurface!: Promise<AppDatePickerInputSurface | null>;
  @state() private _open = false;
  @state() private _rendered = false;
  @state() private _valueText = '';

  #disconnect: () => void = () => undefined;
  #focusElement: HTMLElement | undefined = undefined;
  #isClearAction = false;
  #picker: AppDatePicker | undefined = undefined;
  #selectedDate!: Date;
  #valueFormatter = this.$toValueFormatter();

  public static override styles = [
    ...TextField.styles,
    datePickerInputStyling,
  ];

  public override async disconnectedCallback(): Promise<void> {
    super.disconnectedCallback();

    this.#disconnect();
  }

  public override async firstUpdated(): Promise<void> {
    super.firstUpdated();

    const input = await this.$input;
    if (input) {
      const onClick = () => this._open = true;
      const onKeyup = (ev: KeyboardEvent) => {
        if ([keySpace, keyEnter].some(n => n === ev.key)) {
          onClick();
        }
      };

      input.addEventListener('keyup', onKeyup);
      input.addEventListener('click', onClick);

      this.#disconnect = () => {
        input.removeEventListener('keyup', onKeyup);
        input.removeEventListener('click', onClick);
      };
    }
  }

  public override willUpdate(changedProperties: ChangedProperties<DatePickerProperties>) {
    super.willUpdate(changedProperties);

    if (changedProperties.has('locale')) {
      const newLocale = (
        this.locale || DateTimeFormat().resolvedOptions().locale
      ) as string;

      this.locale = newLocale;
      this.#valueFormatter = this.$toValueFormatter();

      if (this.value) {
        this._valueText = this.#valueFormatter.format(toResolvedDate(this.value));
      }
    }

    if (changedProperties.has('value') && this.value) {
      this._valueText = this.#valueFormatter.format(toResolvedDate(this.value));
    }

    if (!this._rendered && this._open) {
      this._rendered = true;
    }
  }

  public override render(): TemplateResult {
    return html`
    ${super.render()}
    ${
      this._rendered ?
        html`
        <app-date-picker-input-surface
          ?open=${this._open}
          ?stayOpenOnBodyClick=${true}
          .anchor=${this as HTMLElement}
          @closed=${this.#onClosed}
          @opened=${this.#onOpened}
        >
          <app-date-picker
            ?showWeekNumber=${this.showWeekNumber}
            .disabledDates=${this.disabledDates}
            .disabledDays=${this.disabledDays}
            .firstDayOfWeek=${this.firstDayOfWeek}
            .landscape=${this.landscape}
            .locale=${this.locale}
            .max=${this.max}
            .min=${this.min}
            .nextMonthLabel=${this.nextMonthLabel}
            .previousMonthLabel=${this.previousMonthLabel}
            .selectedDateLabel=${this.selectedDateLabel}
            .startView=${this.startView}
            .value=${this.value}
            .weekLabel=${this.weekLabel}
            .weekNumberType=${this.weekNumberType}
            .yearDropdownLabel=${this.yearDropdownLabel}
            @date-updated=${this.#onDatePickerDateUpdated}
            @first-updated=${this.#onDatePickerFirstUpdated}
          ></app-date-picker>
        </app-date-picker-input-surface>
        ` :
        nothing
    }`;
  }

  public closePicker() {
    this._open = false;
  }

  public showPicker() {
    this._open = true;
  }

  protected override renderInput(shouldRenderHelperText: boolean): TemplateResult {
    /**
     * NOTE: All these code are copied from original implementation.
     */
    const autocapitalizeOrUndef = this.autocapitalize ?
        this.autocapitalize as (
            'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters') :
        undefined;
    const showValidationMessage = this.validationMessage && !this.isUiValid;
    const ariaLabelledbyOrUndef = this.label ? 'label' : undefined;
    const ariaControlsOrUndef =
        shouldRenderHelperText ? 'helper-text' : undefined;
    const ariaDescribedbyOrUndef =
        this.focused || this.helperPersistent || showValidationMessage ?
        'helper-text' :
        undefined;

    return html`
      <input
        ?disabled=${this.disabled}
        ?readonly=${true}
        ?required=${this.required}
        .value=${this._valueText}
        @blur=${this.onInputBlur}
        @focus=${this.onInputFocus}
        aria-controls=${ifDefined(ariaControlsOrUndef)}
        aria-describedby=${ifDefined(ariaDescribedbyOrUndef)}
        aria-labelledby=${ifDefined(ariaLabelledbyOrUndef)}
        autocapitalize=${ifDefined(autocapitalizeOrUndef)}
        class=mdc-text-field__input
        inputmode=${ifDefined(this.inputMode)}
        name=${ifDefined(this.name === '' ? undefined : this.name)}
        placeholder=${this.placeholder}
        type=text
      >`;
  }

  protected override renderTrailingIcon(): TemplateResult {
    return html`
    <mwc-icon-button
      @click=${this.#onClearClick}
      aria-label=${this.clearLabel}
      class="mdc-text-field__icon mdc-text-field__icon--trailing"
    >
      ${iconClose}
    </mwc-icon-button>
    `;
  }

  protected $toValueFormatter(): Intl.DateTimeFormat {
    return DateTimeFormat(this.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  #onClearClick()  {
    this.#isClearAction = true;

    this.value = this._valueText = '';
  }

  #onClosed(): void {
    this._open = false;
  }

  async #onDatePickerDateUpdated(ev: CustomEvent<CustomEventDetail['date-updated']['detail']>): Promise<void> {
    const {
      isKeypress,
      key,
      valueAsDate,
    } = ev.detail;

    /**
     * NOTE: When the input date is cleared, the date picker's `date` will be updated and `#isClearAction`
     * is used to prevent `valueAsDate` from updating empty `value`.
     *
     * The flow of execution is as follows:
     *
     * 1. Clear input value
     * 2. Set `#isClearAction=true`
     * 3. `date` updated but `#isClearAction` is true so do nothing and reset `#isClearAction`
     * 4. At this point, new value can be set via keyboard or mouse
     */
    if (!this.#isClearAction) {
      this.#selectedDate = valueAsDate;

      if (!isKeypress || (key === keyEnter || key === keySpace)) {
        this.value = this.#valueFormatter.format(this.#selectedDate);

        isKeypress && (await this.$inputSurface)?.close();
      }
    } else {
      this.#isClearAction = false;
    }
  }

  #onDatePickerFirstUpdated({
    currentTarget,
    detail: {
      focusableElements: [focusableElement],
      valueAsDate,
    },
  }: CustomEvent<CustomEventDetail['first-updated']['detail']>): void {
    this.#focusElement = focusableElement;
    this.#picker = currentTarget as AppDatePicker;
    this.#selectedDate = valueAsDate;
  }

  async #onOpened(): Promise<void> {
    await this.#picker?.updateComplete;
    await this.updateComplete;

    this.#focusElement?.focus();
  }
}

// FIXME: Esc does not close input surface
// FIXME: No focus trap in input surface or close input surface when focus is outside
// FIXME: Support valueAsDate:null and valueAsNumber:NaN just like native input[type=date]
