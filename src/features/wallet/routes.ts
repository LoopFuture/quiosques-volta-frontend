export const walletRoutes = {
  movementDetail: (movementId: string) => ({
    params: { movementId },
    pathname: '/wallet/[movementId]' as const,
  }),
  movements: '/wallet/movements',
  transfer: '/wallet/transfer',
} as const
