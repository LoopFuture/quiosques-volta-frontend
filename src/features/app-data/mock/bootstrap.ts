import { getApiRuntimeConfig } from '@/features/app-data/api'

let mockApiServerInitialized = false

type EventPolyfillInit = EventInit

type MessageEventPolyfillInit = EventPolyfillInit & {
  data?: unknown
  lastEventId?: string
  origin?: string
  ports?: readonly unknown[]
  source?: unknown
}

let nativeMockApiServer:
  | (typeof import('./server.native'))['nativeMockApiServer']
  | null = null

function ensureNativeEventPolyfills() {
  const eventConstructor =
    typeof globalThis.Event === 'function'
      ? globalThis.Event
      : class EventPolyfill {
          static readonly NONE = 0
          static readonly CAPTURING_PHASE = 1
          static readonly AT_TARGET = 2
          static readonly BUBBLING_PHASE = 3

          readonly bubbles: boolean
          cancelBubble: boolean
          readonly cancelable: boolean
          readonly composed: boolean
          currentTarget: EventTarget | null
          defaultPrevented: boolean
          readonly eventPhase: number
          readonly isTrusted: boolean
          returnValue: boolean
          readonly target: EventTarget | null
          readonly timeStamp: number
          readonly type: string

          constructor(type: string, init: EventPolyfillInit = {}) {
            this.bubbles = init.bubbles ?? false
            this.cancelBubble = false
            this.cancelable = init.cancelable ?? false
            this.composed = init.composed ?? false
            this.currentTarget = null
            this.defaultPrevented = false
            this.eventPhase = 2
            this.isTrusted = false
            this.returnValue = true
            this.target = null
            this.timeStamp = Date.now()
            this.type = type
          }

          composedPath() {
            return this.target ? [this.target] : []
          }

          preventDefault() {
            if (!this.cancelable) {
              return
            }

            this.defaultPrevented = true
            this.returnValue = false
          }

          stopImmediatePropagation() {
            this.cancelBubble = true
          }

          stopPropagation() {
            this.cancelBubble = true
          }
        }

  if (typeof globalThis.Event !== 'function') {
    Object.defineProperty(globalThis, 'Event', {
      configurable: true,
      value: eventConstructor,
      writable: true,
    })
  }

  if (typeof globalThis.EventTarget !== 'function') {
    class EventTargetPolyfill {
      readonly #listeners = new Map<
        string,
        {
          callback: EventListenerOrEventListenerObject
          once: boolean
        }[]
      >()

      addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
      ) {
        if (!callback) {
          return
        }

        const once = typeof options === 'object' ? options.once === true : false
        const signal = typeof options === 'object' ? options.signal : undefined

        if (signal?.aborted) {
          return
        }

        const listeners = this.#listeners.get(type) ?? []

        if (listeners.some((listener) => listener.callback === callback)) {
          return
        }

        listeners.push({
          callback,
          once,
        })
        this.#listeners.set(type, listeners)

        signal?.addEventListener(
          'abort',
          () => {
            this.removeEventListener(type, callback)
          },
          { once: true },
        )
      }

      dispatchEvent(event: Event) {
        const listeners = this.#listeners.get(event.type)

        if (!listeners || listeners.length === 0) {
          return !event.defaultPrevented
        }

        Object.defineProperties(event, {
          currentTarget: {
            configurable: true,
            value: this,
            writable: true,
          },
          target: {
            configurable: true,
            value: this,
            writable: true,
          },
        })

        listeners.slice().forEach((listener) => {
          if (listener.once) {
            this.removeEventListener(event.type, listener.callback)
          }

          if (typeof listener.callback === 'function') {
            listener.callback.call(this, event)
            return
          }

          listener.callback.handleEvent(event)
        })

        return !event.defaultPrevented
      }

      removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
      ) {
        if (!callback) {
          return
        }

        const listeners = this.#listeners.get(type)

        if (!listeners) {
          return
        }

        this.#listeners.set(
          type,
          listeners.filter((listener) => listener.callback !== callback),
        )
      }
    }

    Object.defineProperty(globalThis, 'EventTarget', {
      configurable: true,
      value: EventTargetPolyfill,
      writable: true,
    })
  }

  if (typeof globalThis.MessageEvent === 'function') {
  } else {
    class MessageEventPolyfill extends eventConstructor {
      readonly data: unknown
      readonly lastEventId: string
      readonly origin: string
      readonly ports: readonly unknown[]
      readonly source: unknown

      constructor(type: string, init: MessageEventPolyfillInit = {}) {
        super(type, init)
        this.data = init.data
        this.lastEventId = init.lastEventId ?? ''
        this.origin = init.origin ?? ''
        this.ports = init.ports ?? []
        this.source = init.source ?? null
      }
    }

    Object.defineProperty(globalThis, 'MessageEvent', {
      configurable: true,
      value: MessageEventPolyfill,
      writable: true,
    })
  }

  if (typeof globalThis.BroadcastChannel === 'function') {
    return
  }

  const channelsByName = new Map<string, Set<BroadcastChannelPolyfill>>()

  class BroadcastChannelPolyfill extends globalThis.EventTarget {
    readonly name: string
    onmessage: ((event: MessageEvent) => void) | null = null

    constructor(name: string) {
      super()
      this.name = name

      const channels = channelsByName.get(name) ?? new Set()
      channels.add(this)
      channelsByName.set(name, channels)
    }

    close() {
      const channels = channelsByName.get(this.name)

      if (!channels) {
        return
      }

      channels.delete(this)

      if (channels.size === 0) {
        channelsByName.delete(this.name)
      }
    }

    postMessage(message: unknown) {
      const channels = channelsByName.get(this.name)

      if (!channels) {
        return
      }

      channels.forEach((channel) => {
        const event = new globalThis.MessageEvent('message', {
          data: message,
        })

        channel.dispatchEvent(event)
        channel.onmessage?.(event)
      })
    }

    unref() {}
  }

  Object.defineProperty(globalThis, 'BroadcastChannel', {
    configurable: true,
    value: BroadcastChannelPolyfill,
    writable: true,
  })
}

function getNativeMockApiServer() {
  ensureNativeEventPolyfills()

  if (!nativeMockApiServer) {
    ;({ nativeMockApiServer } =
      require('./server.native') as typeof import('./server.native')) // eslint-disable-line @typescript-eslint/no-require-imports
  }

  return nativeMockApiServer
}

export function initializeMockApiServer() {
  if (mockApiServerInitialized) {
    return
  }

  const runtimeConfig = getApiRuntimeConfig()

  if (!runtimeConfig.mockingEnabled) {
    return
  }

  getNativeMockApiServer().listen({
    onUnhandledRequest: 'bypass',
  })
  mockApiServerInitialized = true
}
