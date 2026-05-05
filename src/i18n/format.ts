type CurrencyFormatOptions = {
  compact?: boolean
  maximumFractionDigits?: number
  minimumFractionDigits?: number
}

function getSafeLocale(locale: string) {
  return locale.trim().length > 0 ? locale : 'pt'
}

function getDate(value: string) {
  return new Date(value)
}

export function formatCurrencyFromCents(
  amountCents: number,
  locale: string,
  options: CurrencyFormatOptions = {},
) {
  const resolvedLocale = getSafeLocale(locale)
  const {
    compact = false,
    maximumFractionDigits = compact ? 1 : 2,
    minimumFractionDigits = compact ? 0 : 2,
  } = options

  return new Intl.NumberFormat(resolvedLocale, {
    currency: 'EUR',
    maximumFractionDigits,
    minimumFractionDigits,
    notation: compact ? 'compact' : 'standard',
    style: 'currency',
  }).format(amountCents / 100)
}

export function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(getSafeLocale(locale)).format(value)
}

export function formatCompactNumber(value: number, locale: string) {
  return new Intl.NumberFormat(getSafeLocale(locale), {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value)
}

export function formatMonthYear(value: string, locale: string) {
  return new Intl.DateTimeFormat(getSafeLocale(locale), {
    month: 'short',
    year: 'numeric',
  }).format(getDate(value))
}

export function formatLongDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(getSafeLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(getDate(value))
}

export function formatShortDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(getSafeLocale(locale), {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(getDate(value))
}

export function formatShortTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(getSafeLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(getDate(value))
}
