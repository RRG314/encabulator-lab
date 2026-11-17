import { Component } from 'lucide-react'

export function LabWordmark({ large = false }: { large?: boolean }) {
  return <span className="lab-wordmark" data-large={large || undefined}>
    <span className="lab-wordmark-symbol" aria-hidden="true"><Component strokeWidth={1.6}/></span>
    <span className="lab-wordmark-text"><span>Encabulation</span>{' '}<span>Systems <small>Inc</small></span></span>
  </span>
}
