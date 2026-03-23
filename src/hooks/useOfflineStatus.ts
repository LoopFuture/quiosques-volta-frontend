import { useContext } from 'react'
import { ConnectivityContext } from '@/components/Provider'

export function useOfflineStatus() {
  return useContext(ConnectivityContext)
}
