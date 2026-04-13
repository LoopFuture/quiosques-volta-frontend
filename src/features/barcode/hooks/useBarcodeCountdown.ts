import { useEffect, useMemo, useState } from 'react'
import type { BarcodeResponse } from '../models'

type BarcodeCountdownSource = Pick<BarcodeResponse, 'code' | 'expiresAt'>

type BarcodeCountdownSnapshot = {
  expiresAtMs: number
  initialRemainingMs: number
  payloadKey: string | null
}

export type BarcodeCountdownState = {
  formattedRemaining: string
  isExpired: boolean
}

function getCountdownSnapshot(
  source?: BarcodeCountdownSource | null,
): BarcodeCountdownSnapshot {
  if (!source) {
    return {
      expiresAtMs: 0,
      initialRemainingMs: 0,
      payloadKey: null,
    }
  }

  const parsedExpiresAtMs = Date.parse(source.expiresAt)
  const expiresAtMs = Number.isFinite(parsedExpiresAtMs) ? parsedExpiresAtMs : 0
  const nowMs = Date.now()

  return {
    expiresAtMs,
    initialRemainingMs: Math.max(expiresAtMs - nowMs, 0),
    payloadKey: `${source.code}:${source.expiresAt}`,
  }
}

function formatRemainingTime(remainingSeconds: number) {
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function useBarcodeCountdown(source?: BarcodeCountdownSource | null) {
  const [snapshot, setSnapshot] = useState(() => getCountdownSnapshot(source))
  const [nowMs, setNowMs] = useState(() => Date.now())
  const sourceExpiresAt = source?.expiresAt ?? null
  const sourceCode = source?.code ?? null

  useEffect(() => {
    setSnapshot(
      getCountdownSnapshot(
        sourceExpiresAt && sourceCode
          ? {
              code: sourceCode,
              expiresAt: sourceExpiresAt,
            }
          : null,
      ),
    )
    setNowMs(Date.now())
  }, [sourceCode, sourceExpiresAt])

  useEffect(() => {
    if (!snapshot.payloadKey || snapshot.initialRemainingMs <= 0) {
      return
    }

    const interval = setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [snapshot.initialRemainingMs, snapshot.payloadKey])

  return useMemo<BarcodeCountdownState>(() => {
    if (!snapshot.payloadKey) {
      return {
        formattedRemaining: formatRemainingTime(0),
        isExpired: false,
      }
    }

    const remainingMs = Math.max(snapshot.expiresAtMs - nowMs, 0)
    const remainingSeconds = Math.max(Math.ceil(remainingMs / 1000), 0)

    return {
      formattedRemaining: formatRemainingTime(remainingSeconds),
      isExpired: remainingMs <= 0,
    }
  }, [nowMs, snapshot.expiresAtMs, snapshot.payloadKey])
}
