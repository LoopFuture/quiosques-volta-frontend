const originalWarn = console.warn.bind(console)

jest.spyOn(console, 'warn').mockImplementation((message, ...args) => {
  if (
    typeof message === 'string' &&
    message.includes("Must call import '@tamagui/native/setup-zeego'")
  ) {
    return
  }

  originalWarn(message, ...args)
})
