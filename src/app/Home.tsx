import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Box, Drill, Eye, FileText, FlaskConical, Pause, Play } from 'lucide-react'
import { ExplodeSlider } from '../components/ExplodeSlider'
import { LabWordmark } from '../components/LabWordmark'
import { archiveById, archiveHref, contributeConfigurationUrl, workbenchHref } from '../machines/archive'
import { assetUrl, machineRoute, machines } from '../machines/profiles'
import type { DisplayProfile } from '../machines/profiles'
import { InspectionViewport } from './AssemblyComparison'
import te01Image from '../../docs/media/te01-assembly.png'
import re01Image from '../../docs/media/re01-assembly.png'
import me01Image from '../../docs/media/me01-assembly.png'

const repository = 'https://github.com/RRG314/encabulator-lab'
const metachronic: DisplayProfile = { ...machines.me01, href: path => machineRoute('me01', path) }
const primaryAssemblies = [
  { machine: machines.te01, image: te01Image, focus: 'Rotor dynamics', description: 'A six-vane rotor on twin journals with independent cooling and a guarded load bench.' },
  { machine: machines.re01, image: re01Image, focus: 'Reciprocating fluid delivery', description: 'An industrial motor drive and crank-slider coupled to a metered, low-head water loop.' },
  { machine: machines.me01, image: me01Image, focus: 'Differential synchronization', description: 'Concentric shafts, variable vane pitch, active radial stabilization, and regenerative power management.' },
]
const historicalRecords = [
  ['ge-1962', '1962 catalog scan and CAD reconstruction'],
  ['chrysler', 'Transmission CAD reconstruction'],
  ['micro-2016', 'Enclosure CAD and electrical study'],
  ['electro-2021', 'Instrument CAD and resonator study'],
  ['magneto-2022', 'Carrier CAD and magnetic coupling study'],
  ['hyper-2022', 'Technical record and interlock study'],
  ['crypto-2019', 'Functional diagram and process study'],
  ['mini-2022', 'Original schematic and LED study'],
] as const
const laboratory = [
  { title: 'Exploded assembly', description: 'Separate the assemblies, isolate components, and inspect the model against its drawings.', href: metachronic.href('explorer'), Icon: Box },
  { title: 'Operating simulation', description: 'Apply a host load and follow calculated shaft speed, vane pitch, cooling, and regenerative power.', href: metachronic.href('simulation'), Icon: FlaskConical },
  { title: 'Technical documentation', description: 'Review CAD exports, assembly drawings, parts records, and verification reports.', href: metachronic.href('engineering/downloads'), Icon: FileText },
  { title: 'Installation laboratory', description: 'Compare direct drive and two vane-pitch configurations across modeled external loads.', href: metachronic.href('installation'), Icon: Drill },
]

function AssemblyPreview({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const station = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [onScreen, setOnScreen] = useState(true)
  const [orbit, setOrbit] = useState(true)
  const [xray, setXray] = useState(false)
  const [amount, setAmount] = useState(0)
  const [motion, setMotion] = useState<{ from: number; to: number } | null>(null)
  const physicalParts = metachronic.registry.parts.filter(part => part.kind !== 'logical')
  const activePart = physicalParts.find(part => part.id === selected) ?? metachronic.registry.partById.get(metachronic.defaultPart)!
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', change)
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    if (station.current) observer.observe(station.current)
    return () => {
      preference.removeEventListener('change', change)
      observer.disconnect()
    }
  }, [])
  useEffect(() => {
    if (!motion || reducedMotion) return
    const start = performance.now()
    let frame: number
    const update = (time: number) => {
      const t = Math.min(1, (time - start) / 1850)
      setAmount(motion.from + (motion.to - motion.from) * t * t * (3 - 2 * t))
      if (t < 1) frame = requestAnimationFrame(update)
      else setMotion(null)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [motion, reducedMotion])
  const change = (next: number) => { setMotion(null); setAmount(next); setOrbit(false) }
  const toggle = () => {
    if (motion) { setMotion(null); return }
    setOrbit(false)
    const destination = amount >= 99.9 ? 0 : 100
    if (reducedMotion) change(destination)
    else setMotion({ from: amount, to: destination })
  }
  return <div className="portal-stage" ref={station}>
    <InspectionViewport machine={metachronic} fraction={amount / 100} preset="Iso" cameraTick={0}
      selectedPart={activePart.id} onSelectPart={onSelect} autoOrbit={orbit && onScreen && amount === 0}
      reducedMotion={reducedMotion} opacity={xray ? .24 : 1} labels poster={me01Image}>
      <div className="portal-preview-controls">
        <label>Preview component<select value={activePart.id} onChange={event => onSelect(event.target.value)}>
          {physicalParts.map(part => <option key={part.id} value={part.id}>{part.id} · {part.name}</option>)}
        </select></label>
        <div className="portal-preview-buttons">
          <button className="secondary-button" type="button" aria-pressed={xray} onClick={() => setXray(value => !value)}><Eye size={15}/> X-ray</button>
          <button className="secondary-button" type="button" aria-pressed={orbit && !reducedMotion && amount === 0}
            disabled={reducedMotion || amount > 0} onClick={() => setOrbit(value => !value)}>
            {orbit && !reducedMotion ? <Pause size={15}/> : <Play size={15}/>} Auto-orbit
          </button>
        </div>
      </div>
      <ExplodeSlider amount={amount} change={change} running={!!motion && !reducedMotion} toggle={toggle} reset={() => change(0)}/>
    </InspectionViewport>
  </div>
}

export default function Home({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return <div className="portal">
    <section className="portal-hero" aria-labelledby="portal-title">
      <div className="portal-width portal-hero-grid">
        <div className="portal-intro">
          <LabWordmark large/>
          <h1 id="portal-title">Advanced encabulation and differential synchronization</h1>
          <p>Research into rotor dynamics, phase regulation, and coupled electromechanical systems.</p>
          <div className="portal-hero-links">
            <a className="portal-primary" href={metachronic.href('explorer')}>Open engineering workbench <ArrowRight size={17}/></a>
            <a className="portal-source" href={repository}>Technical repository <ArrowUpRight size={15}/></a>
          </div>
        </div>
        <AssemblyPreview selected={selected} onSelect={onSelect}/>
      </div>
    </section>

    <section className="portal-width portal-section" aria-labelledby="program-assemblies">
      <div className="portal-section-heading"><h2 id="program-assemblies">Program assemblies</h2><a href="#/comparison">Compare assemblies <ArrowRight size={15}/></a></div>
      <div className="portal-assembly-grid">
        {primaryAssemblies.map(({machine,image,focus,description}) => <article className="portal-machine" key={machine.key}>
          <img src={image} alt={`${machine.name} ${machine.code} CAD assembly`} loading="lazy"/>
          <div className="portal-machine-record">
            <span className="portal-classification">{focus}</span>
            <h3>{machine.name} <span>{machine.code}</span></h3>
            <p>{description}</p>
            <a href={machineRoute(machine.key,'explorer')}>Inspect {machine.code} <ArrowRight size={15}/></a>
          </div>
        </article>)}
      </div>
    </section>

    <section className="portal-width portal-section" aria-labelledby="lab-index">
      <div className="portal-section-heading"><h2 id="lab-index">Engineering laboratory</h2></div>
      <div className="portal-laboratory">
        {laboratory.map(({ title, description, href, Icon }) => <a className="portal-lab-record" href={href} key={title}>
          <Icon size={23} strokeWidth={1.55} aria-hidden="true"/>
          <div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight size={17} aria-hidden="true"/>
        </a>)}
      </div>
    </section>

    <section className="portal-width portal-section" aria-labelledby="archive-index">
      <div className="portal-section-heading"><h2 id="archive-index">Historical machine archive</h2><a href={archiveHref()}>View complete archive <ArrowRight size={15}/></a></div>
      <div className="portal-archive">
        <table><thead><tr><th scope="col">Configuration</th><th scope="col">Designation</th><th scope="col">Primary resource</th></tr></thead>
          <tbody>{historicalRecords.map(([id,resource]) => {
            const record = archiveById.get(id)!
            return <tr key={id}><th scope="row"><a href={workbenchHref(record) ?? archiveHref(id)}>{record.name}</a></th>
              <td>{record.code}</td><td>{resource}</td></tr>
          })}</tbody>
        </table>
      </div>
    </section>

    <section className="portal-width portal-section portal-references" aria-labelledby="portal-evidence">
      <div><h2 id="portal-evidence">Verification and source records</h2><p>Consult the measured CAD dimensions, placement audits, and original references for each configuration.</p></div>
      <nav aria-label="Verification and contribution links">
        <a href={assetUrl('models/source-conformance.json')}>Source conformance</a>
        <a href={assetUrl('models/assembly-conformance.json')}>Assembly verification</a>
        <a href={contributeConfigurationUrl}>Contribute a configuration <ArrowUpRight size={14}/></a>
      </nav>
    </section>
  </div>
}
