import { Pause, Play, RotateCcw } from 'lucide-react'

export function ExplodeSlider({ amount, change, running, toggle, reset }: {
  amount: number, change: (amount: number) => void, running: boolean, toggle: () => void, reset: () => void,
}) {
  return <section className="explode-controls" aria-label="Explosion controls">
    <div className="explode-heading">
      <label htmlFor="explode-amount">Exploded distance <output htmlFor="explode-amount">{Math.round(amount)}%</output></label>
      <div><button className="icon-button" type="button" aria-label={running ? 'Pause sequence' : 'Animate assembly sequence'} onClick={toggle}>
        {running ? <Pause size={15} /> : <Play size={15} />}</button>
      <button className="icon-button" type="button" aria-label="Reset assembly" onClick={reset}><RotateCcw size={15} /></button></div>
    </div>
    <input aria-label="Exploded distance" id="explode-amount" type="range" min="0" max="100" step="1" value={amount}
      onChange={event => change(Number(event.target.value))} />
    <div className="explode-labels"><button type="button" onClick={() => change(0)}>0% · Assembled</button><button type="button" onClick={() => change(100)}>100% · Exploded</button></div>
  </section>
}
