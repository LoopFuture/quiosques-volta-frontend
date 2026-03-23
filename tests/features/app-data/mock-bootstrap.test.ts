describe('mock api bootstrap', () => {
  const originalEvent = globalThis.Event
  const originalEventTarget = globalThis.EventTarget
  const originalMessageEvent = globalThis.MessageEvent
  const originalBroadcastChannel = globalThis.BroadcastChannel

  afterEach(() => {
    jest.resetModules()
    jest.unmock('@/features/app-data/api')
    jest.unmock('@/features/app-data/mock/server.native')

    if (typeof originalEvent === 'function') {
      Object.defineProperty(globalThis, 'Event', {
        configurable: true,
        value: originalEvent,
        writable: true,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'Event')
    }

    if (typeof originalEventTarget === 'function') {
      Object.defineProperty(globalThis, 'EventTarget', {
        configurable: true,
        value: originalEventTarget,
        writable: true,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'EventTarget')
    }

    if (typeof originalMessageEvent === 'function') {
      Object.defineProperty(globalThis, 'MessageEvent', {
        configurable: true,
        value: originalMessageEvent,
        writable: true,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'MessageEvent')
    }

    if (typeof originalBroadcastChannel === 'function') {
      Object.defineProperty(globalThis, 'BroadcastChannel', {
        configurable: true,
        value: originalBroadcastChannel,
        writable: true,
      })
    } else {
      Reflect.deleteProperty(globalThis, 'BroadcastChannel')
    }
  })

  it('polyfills MessageEvent before loading the native mock server', () => {
    const listen = jest.fn()
    let eventAtImport: unknown
    let eventTargetAtImport: unknown
    let messageEventAtImport: unknown
    let broadcastChannelAtImport: unknown

    Reflect.deleteProperty(globalThis, 'Event')
    Reflect.deleteProperty(globalThis, 'EventTarget')
    Reflect.deleteProperty(globalThis, 'MessageEvent')
    Reflect.deleteProperty(globalThis, 'BroadcastChannel')

    jest.doMock('@/features/app-data/api', () => ({
      getApiRuntimeConfig: () => ({
        mockingEnabled: true,
      }),
    }))
    jest.doMock('@/features/app-data/mock/server.native', () => {
      eventAtImport = globalThis.Event
      eventTargetAtImport = globalThis.EventTarget
      messageEventAtImport = globalThis.MessageEvent
      broadcastChannelAtImport = globalThis.BroadcastChannel

      return {
        nativeMockApiServer: {
          listen,
        },
      }
    })

    jest.isolateModules(() => {
      const bootstrapModule =
        require('@/features/app-data/mock/bootstrap') as typeof import('@/features/app-data/mock/bootstrap') // eslint-disable-line @typescript-eslint/no-require-imports
      const { initializeMockApiServer } = bootstrapModule

      initializeMockApiServer()
    })

    expect(typeof eventAtImport).toBe('function')
    expect(typeof eventTargetAtImport).toBe('function')
    expect(typeof messageEventAtImport).toBe('function')
    expect(typeof broadcastChannelAtImport).toBe('function')
    expect(typeof globalThis.Event).toBe('function')
    expect(typeof globalThis.EventTarget).toBe('function')
    expect(typeof globalThis.MessageEvent).toBe('function')
    expect(typeof globalThis.BroadcastChannel).toBe('function')

    const eventTarget = new globalThis.EventTarget()
    const listener = jest.fn()

    eventTarget.addEventListener('ready', listener)
    eventTarget.dispatchEvent(new globalThis.Event('ready'))

    expect(listener).toHaveBeenCalledTimes(1)

    const firstChannel = new globalThis.BroadcastChannel('mock-bootstrap')
    const secondChannel = new globalThis.BroadcastChannel('mock-bootstrap')
    const onMessage = jest.fn()

    secondChannel.addEventListener('message', onMessage)
    firstChannel.postMessage({ ready: true })

    expect(onMessage).toHaveBeenCalledTimes(1)
    expect(onMessage.mock.calls[0]?.[0].data).toEqual({
      ready: true,
    })

    firstChannel.close()
    secondChannel.close()

    expect(listen).toHaveBeenCalledWith({
      onUnhandledRequest: 'bypass',
    })
  })
})
