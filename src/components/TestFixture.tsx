import { useId } from 'react'

type Fixture = 'shaft' | 'fluid' | 'electrical'

export function TestFixture({fixture,name,activity,phase=0,flowPhase=phase*4,source='Encabulator',load}: {
  fixture:Fixture;name:string;activity:number;phase?:number;flowPhase?:number;source?:string;load:string
}) {
  const labelId=useId()
  const strength=Math.max(0,Math.min(1,activity))
  const degrees=phase*180/Math.PI%360
  return <figure className="test-fixture" aria-labelledby={labelId}>
    <figcaption id={labelId}>{name} <span>Simulated test fixture</span></figcaption>
    <svg viewBox="0 0 420 124" role="img" aria-label={`${source} coupled to ${load}`}>
      <path d="M17 97H404" className="fixture-datum"/>
      <rect x="24" y="38" width="103" height="48" rx="4" className="fixture-body"/>
      <path d="M32 46h8m-8 8h8m-8 8h8m-8 8h8m-8 8h8M41 86v11m69-11v11" className="fixture-detail"/>
      {fixture==='shaft'&&<>
        <path d="M127 62h148" className="fixture-axis"/>
        <path d="M139 52h17v20h-17zm24 0h17v20h-17z" className="fixture-body"/>
        <rect x="215" y="29" width="105" height="58" rx="7" className="fixture-body"/>
        <circle cx="267" cy="58" r="23" className="fixture-detail"/>
        <g transform={`rotate(${degrees} 267 58)`} className="fixture-rotor" data-testid="fixture-rotor">
          <path d="M267 37v42m-21-21h42m-36-15 30 30m-30 0 30-30"/><circle cx="267" cy="58" r="6"/>
        </g>
        <path d="M226 87v10m83-10v10" className="fixture-detail"/>
        <rect x="340" y="44" width="48" height="28" rx="3" className="fixture-body"/>
        <path d="M320 58h20" className="fixture-detail"/>
        <rect x="347" y="51" width={34*strength} height="14" rx="2" fill="#267d6d"/>
      </>}
      {fixture==='fluid'&&<>
        <path d="M127 61h61m51 0h100V20H81v18" className="fixture-pipe"/>
        <path d="M127 61h61m51 0h100V20H81v18" className="fixture-flow" strokeDashoffset={-flowPhase%26} opacity={strength}/>
        <path d="M180 52h59v18h-59zm19 0V37h19v15" className="fixture-body"/>
        <path d={`M${195+9*Math.cos(phase)} 55v12`} className="fixture-axis"/>
        <path d="M314 46v42h54V46" className="fixture-body"/>
        <path d="M318 70h46v14h-46z" fill="#5896af" opacity={.4+strength*.6}/>
      </>}
      {fixture==='electrical'&&<>
        <path d="M127 49h79m-79 26h79m2-26h42l8-10 10 20 10-20 10 20 10-10h52v26H208" className="fixture-wire"/>
        <path d="M206 39v45m10-45v45" className="fixture-axis"/>
        <path d="M127 49h79m10 26h134V49h-52" className="fixture-flow" strokeDashoffset={-phase%26} opacity={strength}/>
        <circle cx="350" cy="49" r="9" className="fixture-body"/>
        <circle cx="350" cy="49" r={4+4*strength} fill="#1b8c74" opacity={strength}/>
      </>}
      <text x="24" y="115">{source}</text><text x="396" y="115" textAnchor="end">{load}</text>
    </svg>
  </figure>
}
