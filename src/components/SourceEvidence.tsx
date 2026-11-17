import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { archiveById, sourceById } from '../machines/archive'
import { assetUrl } from '../machines/profiles'
import evidence from '../../data/archive/evidence.json'
import verification from '../../public/models/source-conformance.json'

type Reference = {
  label: string; kind: string; source?: string; href?: string
  localImage?: string; preview?: string; imagePreview?: string; alt?: string
}
type Evidence = { references: Reference[]; matches: string; limits: string }
const entries: Record<string,Evidence> = evidence

function defaultReference(source:string):Reference {
  const item=sourceById.get(source)!
  const url=new URL(item.url)
  const videoId=url.hostname==='www.youtube.com'?url.searchParams.get('v'):null
  return {source,label:item.title,kind:item.type,preview:videoId?`https://www.youtube-nocookie.com/embed/${videoId}`:undefined}
}

export function SourceEvidence({id,drawing}:{id:string;drawing?:string}) {
  const record=archiveById.get(id)
  const entry=entries[id]
  const [choice,setChoice]=useState(drawing&&(!entry?.references.length||record?.kind==='Project assembly')?'drawing':'0')
  const [preview,setPreview]=useState('')
  const references=entry?.references??record?.sourceIds.map(defaultReference)??[]
  const reference:Reference|undefined=references[Number(choice)]
  const href=reference?.href??(reference?.source?sourceById.get(reference.source)?.url:undefined)
  const local=choice==='drawing'?drawing:reference?.localImage
  const external=preview===choice?reference?.preview:undefined
  const externalImage=preview===choice?reference?.imagePreview:undefined
  const checks=verification.configurations.find(item=>item.id===id)?.checks??[]
  return <aside className="panel source-evidence" aria-label="Source comparison">
    <div className="panel-title"><BookOpen size={16}/><h2>{drawing?'Source comparison':'Source evidence'}</h2></div>
    <div className="source-evidence-body">
      {(references.length>0||drawing)&&<label className="reference-picker">Reference<select value={references.length===0?'drawing':choice} onChange={event=>{
        setChoice(event.target.value);setPreview('')
      }}>
        {references.map((item,i)=><option key={item.label} value={i}>{item.label}</option>)}
        {drawing&&<option value="drawing">Project CAD drawing</option>}
      </select></label>}
      {local&&<a className="source-preview" href={assetUrl(local)} target="_blank" rel="noreferrer">
        <img src={assetUrl(local)} alt={reference?.alt??record?.code+' project CAD drawing'} loading="lazy"/>
      </a>}
      {external&&<iframe className="source-preview external-preview" src={external} title={reference!.label} referrerPolicy="no-referrer" loading="lazy" allowFullScreen />}
      {externalImage&&<a className="source-preview" href={href} target="_blank" rel="noreferrer">
        <img src={externalImage} alt={reference?.alt??reference?.label} referrerPolicy="no-referrer" />
      </a>}
      {choice==='drawing'?<p className="source-caption">Dimensioned project drawing · {record?.code}</p>:reference&&<div className="source-caption">
        <span>{reference.kind}</span>
        {href&&<a href={href} target="_blank" rel="noreferrer">Open source</a>}
        {(reference.preview||reference.imagePreview)&&!external&&!externalImage&&<button className="text-button" type="button" onClick={()=>setPreview(choice)}>Load source preview</button>}
      </div>}
      {(entry||record?.gap)&&<dl className="evidence-findings">
        {entry&&<div><dt>{drawing?'Basis in the source':'What the source contains'}</dt><dd>{entry.matches}</dd></div>}
        <div><dt>{drawing?'Estimates and open items':'Evidence limits'}</dt><dd>{entry?.limits??record?.gap}</dd></div>
      </dl>}
      {checks.length>0&&<details className="source-checks" open>
        <summary>Checked against CAD</summary>
        <table><thead><tr><th scope="col">Requirement</th><th scope="col">Source</th><th scope="col">CAD</th></tr></thead>
          <tbody>{checks.map(check=><tr key={check.feature}><th scope="row">{check.feature}</th><td>{check.target}</td><td className={check.status==='PASS'?'check-pass':'check-open'}>{check.actual} <small>{check.status==='PASS'?'Matches':check.status==='WITHIN'?'Within target':'Open'}</small></td></tr>)}</tbody>
        </table>
      </details>}
    </div>
  </aside>
}
