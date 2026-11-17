import { createContext, useContext, useMemo } from 'react'
import { machineRoute, machines } from './profiles'

export const MachineContext = createContext(machines.te01)
export function useMachine() {
  const profile = useContext(MachineContext)
  return useMemo(()=>({ ...profile, href: (path: string) => machineRoute(profile.key,path) }),[profile])
}
