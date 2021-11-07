import '../../year-grid-button/app-year-grid-button';

import { expect, fixture, html } from '@open-wc/testing';

import type { AppYearGridButton } from '../../year-grid-button/app-year-grid-button';
import { appYearGridName } from '../../year-grid-button/constants';

describe(appYearGridName, () => {
  it('renders', async () => {
    const el = await fixture<AppYearGridButton>(
      html`<app-year-grid-button label="test"></app-year-grid-button>`
    );

    expect(el.query(`button[aria-label="test"]`)).exist;
  });

});
