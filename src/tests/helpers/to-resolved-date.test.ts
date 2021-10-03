import { expect } from '@open-wc/testing';
import { toUTCDate } from 'nodemod/dist/calendar/helpers/to-utc-date.js';

import { toResolvedDate } from '../../helpers/to-resolved-date';
import type { MaybeDate } from '../../helpers/typings';
import { messageFormatter } from '../test-utils/message-formatter';

describe(toResolvedDate.name, () => {
  type A = [MaybeDate | undefined, Date];

  const today = new Date();
  const cases: A[] = [
    ['', toUTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())],
    ['2020-02-02', new Date('2020-02-02')],
    [+new Date('2020-02-02'), new Date('2020-02-02')],
    [new Date('2020-02-02'), new Date('2020-02-02')],
    [new Date('2020-02-02').toJSON(), new Date('2020-02-02')],
    [null, toUTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())],
    [undefined, toUTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())],
  ];

  cases.forEach((a) => {
    const [testDate, expected] = a;

    it(
      messageFormatter('returns resolved date (%s)', a),
      () => {
        const result = toResolvedDate(testDate);

        expect(result).deep.equal(expected);
      }
    );
  });

});
