import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { assemblies, parts } from './data'

createRoot(document.getElementById('root')!).render(
  <StrictMode><main><h1>Turbo Encabulator TE-01</h1><p>{parts.length} component records · {assemblies.length} assemblies</p><ul>{parts.map(part => <li key={part.id}>{part.id} · {part.name}</li>)}</ul></main></StrictMode>,
)
