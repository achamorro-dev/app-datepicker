import { TextField } from '@material/mwc-textfield';
import type { TemplateResult } from 'lit';
import { html, nothing } from 'lit';
import { property, queryAsync, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { until } from 'lit/directives/until.js';

import { DateTimeFormat } from '../constants.js';
import type { AppDatePicker } from '../date-picker/app-date-picker.js';
import type { AppDatePickerInputSurface } from '../date-picker-input-surface/app-date-picker-input-surface.js';
import { appDatePickerInputSurfaceName } from '../date-picker-input-surface/constants.js';
import { slotDatePicker } from '../helpers/slot-date-picker.js';
import { toDateString } from '../helpers/to-date-string.js';
import { warnUndefinedElement } from '../helpers/warn-undefined-element.js';
import { iconClear } from '../icons.js';
import { keyEnter, keyEscape, keySpace, keyTab } from '../key-values.js';
import { DatePickerMinMaxMixin } from '../mixins/date-picker-min-max-mixin.js';
import { DatePickerMixin } from '../mixins/date-picker-mixin.js';
import { ElementMixin } from '../mixins/element-mixin.js';
import type { DatePickerMixinProperties } from '../mixins/typings.js';
import { baseStyling } from '../stylings.js';
import type { ChangedProperties, CustomEventDetail, DatePickerProperties } from '../typings.js';
import { appDatePickerInputClearLabel, appDatePickerInputType } from './constants.js';
import { datePickerInputStyling } from './stylings.js';

export class DatePickerInput extends ElementMixin(DatePickerMixin(DatePickerMinMaxMixin(TextField))) implements DatePickerMixinProperties {
  public override iconTrailing = 'clear';

  /**
   * NOTE(motss): Public method to lazy load `app-date-picker-input-surface`.
   */
  public lazyLoading?(): Promise<void>;

  public override type = appDatePickerInputType;

  public get valueAsDate(): Date | null {
    return this.#valueAsDate || null;
  }

  public get valueAsNumber(): number {
    return Number(this.#valueAsDate || NaN);
  }

  @property({ type: String }) public clearLabel = appDatePickerInputClearLabel;
  @queryAsync('.mdc-text-field__input') protected $input!: Promise<HTMLInputElement | null>;
  @queryAsync(appDatePickerInputSurfaceName) protected $inputSurface!: Promise<AppDatePickerInputSurface | null>;
  @state() private _open = false;
  // @state() private _rendered = false;
  @state() private _ready = false;
  @state() private _valueText = '';

  #disconnect: () => void = () => undefined;
  #focusElement: HTMLElement | undefined = undefined;
  #isClearAction = false;
  #picker: AppDatePicker | undefined = undefined;
  #selectedDate: Date | undefined;
  // #surfaceReady = false;
  #valueAsDate: Date | undefined;
  #valueFormatter = this.$toValueFormatter();

  public static override styles = [
    ...TextField.styles,
    baseStyling,
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
      const onBodyKeyup = async (ev: KeyboardEvent) => {
        if (ev.key === keyEscape) {
          this.closePicker();
        } else if (ev.key === keyTab) {
          const inputSurface = await this.$inputSurface;
          const isTabInsideInputSurface = (ev.composedPath() as HTMLElement[]).find(
            n => n.nodeType === Node.ELEMENT_NODE &&
            n.isEqualNode(inputSurface)
          );

          if (!isTabInsideInputSurface) this.closePicker();
        }
      };
      const onClick = () => this._open = true;
      const onKeyup = (ev: KeyboardEvent) => {
        if ([keySpace, keyEnter].some(n => n === ev.key)) {
          onClick();
        }
      };

      document.body.addEventListener('keyup', onBodyKeyup);
      input.addEventListener('keyup', onKeyup);
      input.addEventListener('click', onClick);

      this.#disconnect = () => {
        document.body.removeEventListener('keyup', onBodyKeyup);
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
      this.#updateValues(this.value);
    }

    if (changedProperties.has('value')) {
      this.#updateValues(this.value);
    }

    // if (!this._rendered && this._open) {
    //   this._rendered = true;
    // }
  }

  public override render(): TemplateResult {
    const content = html`
    <app-date-picker-input-surface
      @opened=${this.#onOpened}
      ?open=${this._open}
      ?stayOpenOnBodyClick=${true}
      .anchor=${this as HTMLElement}
      @closed=${this.#onClosed}
    >${this._open && this._ready ? this.$renderSlot() : nothing}</app-date-picker-input-surface>
    `;

    if (!globalThis.customElements.get(appDatePickerInputSurfaceName)) {
      warnUndefinedElement(appDatePickerInputSurfaceName);
      this._open && this.#lazyLoading();
    }

    until;

    // ${until(this.$renderContent())}
    return html`
    ${super.render()}
    ${content}
    `;
  }

  public closePicker(): void {
    this._open = false;
  }

  public reset(): void {
    this.#onResetClick();
  }

  public showPicker(): void {
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
        .value=${live(this._valueText)}
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
      @click=${this.#onResetClick}
      aria-label=${this.clearLabel}
      class="mdc-text-field__icon mdc-text-field__icon--trailing"
    >
      ${iconClear}
    </mwc-icon-button>
    `;
  }

  protected async $renderContent() {
    // console.debug('0', {
    //   a: this.#surfaceReady,
    //   b: this._open,
    // });

    if (!this._ready && !this._open) return nothing;

    // console.debug('1', {
    //   a: this.#surfaceReady,
    //   b: this._open,
    // });

    if (globalThis.customElements.get(appDatePickerInputSurfaceName)) {
      this._ready = true;

      // console.debug('2', {
      //   a: this.#surfaceReady,
      //   b: this._open,
      // });

      // const surface = await this.$inputSurface;
      // if (surface) {
      //   surface.setAttribute('aria-hidden', this._open ? 'false' : 'true');
      //   surface.setAttribute('aria-expanded', this._open ? 'true' : 'false');
      // }
      return html`
      <app-date-picker-input-surface
        @opened=${this.#onOpened}
        ?open=${false}
        ?stayOpenOnBodyClick=${true}
        .anchor=${this as HTMLElement}
        @closed=${this.#onClosed}
      ></app-date-picker-input-surface>
      `;
    } else {
      this.#lazyLoading();

      return nothing;
    }

    // if (!this._open) return nothing;

    // warnUndefinedElement(appDatePickerInputSurfaceName);

    // /**
    //  * NOTE(motss): `.updateComplete` is required here to resolve a rendering bug where ripple
    //  * inside a `mwc-icon-button` where the ripple appears to be smaller than expected and
    //  * is placed at the top-left of its parent.
    //  */
    // await this.updateComplete;

    // if (!this.#surfaceReady && globalThis.customElements.get(appDatePickerInputSurfaceName)) {
    //   debugger;

    //   this.#surfaceReady = true;

    //   return html`
      // <app-date-picker-input-surface
      //   @opened=${this.#onOpened}
      //   ?open=${this._open}
      //   ?stayOpenOnBodyClick=${true}
      //   .anchor=${this as HTMLElement}
      //   @closed=${this.#onClosed}
      // >${this.$renderSlot()}</app-date-picker-input-surface>
    //   `;
    // }

    // this.#lazyLoading();
  }

  protected $renderSlot(): TemplateResult {
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

    return slotDatePicker({
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
    });
  }

  protected $toValueFormatter(): Intl.DateTimeFormat {
    return DateTimeFormat(this.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async #lazyLoading(): Promise<void> {
    console.debug('lazyLoading');

    const task = globalThis.customElements.whenDefined(appDatePickerInputSurfaceName);

    await this.lazyLoading?.();
    await task;

    console.debug(globalThis.customElements.get(appDatePickerInputSurfaceName));

    // if (this.lazyLoading == null) {
    //   warnUndefinedElement(appDatePickerInputSurfaceName);
    // } else {

    //   await this.lazyLoading();

    //   this.requestUpdate();

    //   // console.debug('1');

    //   // await this.updateComplete;

    //   // console.debug('2');

    //   // this.requestUpdate();
    //   // await this.updateComplete;

      const inputSurface = (await this.$inputSurface);

    //   inputSurface?.requestUpdate();
    //   inputSurface?.requestUpdate();
    //   inputSurface?.requestUpdate();

    //   this.requestUpdate();
    //   this.requestUpdate();
    //   this.requestUpdate();

      this._ready = true;

      await inputSurface?.updateComplete;
      await this.updateComplete;

      console.debug('3', inputSurface);

      // inputSurface?.show();
    // }
  }

  #onResetClick()  {
    this.#isClearAction = true;
    this.#selectedDate = this.#valueAsDate = undefined;

    this.value = this._valueText = '';
  }

  #onClosed({ detail }: CustomEvent): void {
    this._open = false;
    this.#picker && (this.#picker.startView = 'calendar');
    this.fire({ detail, type: 'closed' });
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
        this.value = toDateString(this.#selectedDate);
        // isKeypress && (await this.$inputSurface)?.close();
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

  async #onOpened({ detail }: CustomEvent): Promise<void> {
    await this.#picker?.updateComplete;
    await this.updateComplete;

    this.#focusElement?.focus();
    this.fire({ detail, type: 'opened' });
  }

  #updateValues(value: string): void {
    if (value) {
      const valueDate = new Date(value);

      this.#selectedDate = this.#valueAsDate = valueDate;
      this._valueText = this.#valueFormatter.format(valueDate);
    } else {
      this.#onResetClick();
    }
  }
}
