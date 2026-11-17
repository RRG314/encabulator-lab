import { createContext, useContext, useMemo } from 'react'
import { machineRoute, machines } from './profiles'
import type { DisplayProfile } from './profiles'

export const MachineContext = createContext(machines.te01)
export const AssemblyContext = createContext<DisplayProfile|null>(null)
export function useMachine() {
  const profile = useContext(MachineContext)
  return useMemo(()=>({ ...profile, href: (path: string) => machineRoute(profile.key,path) }),[profile])
}

export function useAssembly(){
  const current=useContext(AssemblyContext)
  const machine=useMachine()
  return current??machine
}
