import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Brightness from 'expo-brightness'

type BrightnessSnapshot = {
  brightness: number
  wasUsingSystemBrightness: boolean | null
}

async function applyBrightnessSnapshot(snapshot: BrightnessSnapshot) {
  if (Platform.OS === 'android' && snapshot.wasUsingSystemBrightness) {
    await Brightness.restoreSystemBrightnessAsync()

    return
  }

  await Brightness.setBrightnessAsync(snapshot.brightness)
}

export function useQrPresentationBrightness(isOpen: boolean) {
  const snapshotRef = useRef<BrightnessSnapshot | null>(null)

  useEffect(() => {
    async function restoreBrightness() {
      const snapshot = snapshotRef.current

      if (!snapshot) {
        return
      }

      snapshotRef.current = null

      try {
        await applyBrightnessSnapshot(snapshot)
      } catch {
        // QR presentation should continue even if brightness restoration fails.
      }
    }

    if (!isOpen) {
      void restoreBrightness()

      return
    }

    let isCancelled = false

    void (async () => {
      try {
        const isAvailable = await Brightness.isAvailableAsync()

        if (!isAvailable || isCancelled) {
          return
        }

        const brightness = await Brightness.getBrightnessAsync()
        let wasUsingSystemBrightness: boolean | null = null

        if (Platform.OS === 'android') {
          try {
            wasUsingSystemBrightness =
              await Brightness.isUsingSystemBrightnessAsync()
          } catch {
            wasUsingSystemBrightness = null
          }
        }

        if (isCancelled) {
          return
        }

        const nextSnapshot = { brightness, wasUsingSystemBrightness }

        snapshotRef.current = nextSnapshot
        await Brightness.setBrightnessAsync(1)

        if (isCancelled) {
          if (snapshotRef.current === nextSnapshot) {
            snapshotRef.current = null
          }

          await applyBrightnessSnapshot(nextSnapshot)
        }
      } catch {
        snapshotRef.current = null
      }
    })()

    return () => {
      isCancelled = true
      void restoreBrightness()
    }
  }, [isOpen])
}
