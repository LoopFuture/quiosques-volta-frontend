import '@tanstack/react-query'

export type AppReactQueryMeta = {
  feature: string
  operation: string
  redactKeys?: readonly string[]
  tags?: Record<string, boolean | number | string>
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: AppReactQueryMeta
    queryMeta: AppReactQueryMeta
  }
}
