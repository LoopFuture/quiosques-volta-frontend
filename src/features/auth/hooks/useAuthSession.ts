import { useContext } from 'react'
import { AuthSessionContext } from '@/features/auth/components/AuthSessionProvider'

export function useAuthSession() {
  const value = useContext(AuthSessionContext)

  if (!value) {
    throw new Error('useAuthSession must be used within AuthSessionProvider')
  }

  return value
}
