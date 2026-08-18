const MILLISECONDS_PER_MINUTE = 60_000;

export function toLocalDateTimeInputValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localTime =
    date.getTime() - date.getTimezoneOffset() * MILLISECONDS_PER_MINUTE;
  return new Date(localTime).toISOString().slice(0, 16);
}

export function toOptionalIsoDateTime(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}
