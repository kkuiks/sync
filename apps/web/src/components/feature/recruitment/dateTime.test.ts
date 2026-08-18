import { afterEach, describe, expect, it, vi } from 'vitest';

import { toLocalDateTimeInputValue } from './dateTime';

describe('구인 마감 시간 변환', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('서버 시간을 브라우저의 로컬 datetime-local 값으로 변환한다', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-9 * 60);

    expect(toLocalDateTimeInputValue('2026-08-19T03:30:00Z')).toBe(
      '2026-08-19T12:30',
    );
  });

  it('유효하지 않은 서버 시간은 빈 입력값으로 처리한다', () => {
    expect(toLocalDateTimeInputValue('invalid-date')).toBe('');
  });
});
