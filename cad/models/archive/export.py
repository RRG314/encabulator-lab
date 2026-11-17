"""Export part B-reps, triangulations, drawings, placement manifests and validation."""
import argparse
import csv
import json
from itertools import combinations
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile

import FreeCAD as App
import MeshPart
import Part
from cad.drawings.generate import sheet
from cad.glb import write_glb
from cad.materials import MATERIALS
from cad.shared.placement import placed, overlaps
from .configurations import CONFIGURATIONS

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT/'public/models/archive'
DATA = ROOT/'data/archive'
FINISH_MATERIAL = {
    'frame':('Coated aluminum candidate',2700), 'black':('Insulating polymer candidate',1250),
    'red':('Red nylon candidate',1150), 'blue':('Anodized aluminum candidate',2700),
    'board':('FR-4 laminate candidate',1850), 'gold':('Copper alloy candidate',8400),
    'amber':('Aluminum alloy candidate',2700),
}


def write_json(file, data):
    file.write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n')


def add_asset(assets, output, name, filename):
    path = output/filename
    if not path.is_file() or not path.stat().st_size:
        raise ValueError(f'Missing engineering file {path.name}')
    assets.append(dict(name=name,path=path.relative_to(ROOT/'public').as_posix()))


def export(slug, entry):
    code, bounds, axis, groups, build = entry
    items = build()
    prefix = code.split('-')[0]
    out = OUTPUT/slug
    drawings, part_dir = out/'drawings', out/'parts'
    for path in (out,drawings,part_dir):
        path.mkdir(parents=True,exist_ok=True)
    id_for = lambda i:f'{prefix}-{i:03}'
    group_for = lambda i:f'{prefix}-A{i+1}'
    by_id={id_for(i): item for i,item in enumerate(items,1)}
    shapes={}
    layout=[]
    parts=[]
    links=[]
    service={}
    for i, (id,item) in enumerate(by_id.items(),1):
        shapes[id]=[(item.finish,item.shape)]
        for j, pos in enumerate(item.stations,1):
            layout.append(dict(key=f'{id}:{j}',partId=id,origin=list(pos),offset=list(item.offset),
                stage=0 if item.cover else 3 if item.rotates else 2,rotation=0))
        if item.host:
            links.append(dict(id=f'{prefix}-IF-{i:03}',kind='mechanical',
                **{'from':id,'to':id_for(item.host)},label=item.interface))
    for id,item in by_id.items():
        shape=item.shape
        bb=shape.BoundBox
        dims=dict(length=round(bb.XLength,3),width=round(bb.YLength,3),height=round(bb.ZLength,3))
        material,density=FINISH_MATERIAL.get(item.finish,(MATERIALS[item.finish][0],MATERIALS[item.finish][-1]))
        mass=shape.Volume*density*1e-9
        linked=[x['from'] if x['to']==id else x['to'] for x in links if id in (x['from'],x['to'])]
        drawing=drawings/f'{id}.svg'
        step=part_dir/f'{id}.step'
        shape.exportStep(str(step))
        drawing.write_text(sheet(id,item.name,shape,item.interface,material,model=code,edge_only=True))
        parts.append(dict(id=id,name=item.name,assemblyId=group_for(item.group),revision='0.1',
            description=item.interface,function=item.interface,material=material,quantity=len(item.stations),massKg=mass,
            dimensionsMm=dims,mounting=item.interface,matingPartIds=linked,fastenerIds=[],sensors=[],ports=[],equations=[],
            limits='Nominal reconstruction dimensions. Operating limits require qualification.',
            safetyFlags=['Isolate before access'],
            maintenance=f'Inspect the {item.name.lower()} and its mating datum for movement, abrasion or damage before reassembly.',
            cadAssetPath=step.relative_to(ROOT/'public').as_posix(),diagramRefs=[drawing.relative_to(ROOT/'public').as_posix()],
            testEvidence=[],sourcing='Project-defined reconstruction',readiness='Preliminary',evidence='calculation',
            proposedSpecification=material,sourceAssembly=group_for(item.group),verification='Solid geometry verified. Physical qualification pending.',kind='physical'))
        service[id]=dict(failureMode='Loss of alignment, retention or electrical continuity at the specified interface.',
            tool=item.service,originSource=item.source or None,envelopeMm=list(dims.values()),classification='Nominal B-rep reconstruction')
    assembly=[]
    for i,name in enumerate(groups):
        id=group_for(i)
        assembly.append(dict(id=id,name=name,shortName=name,description=name,order=i+1,
            partIds=[p['id'] for p in parts if p['assemblyId']==id]))

    invalid=[id for id,rows in shapes.items() for _,shape in rows
             if not shape.Solids or not shape.isValid() or any(s.Volume <= 0 or not s.isClosed() for s in shape.Solids)]
    if invalid:
        raise ValueError(f'{code} invalid solids: {invalid}')
    states=[[(p['key'],placed(shapes[p['partId']],p,fraction)) for p in layout] for fraction in (0,1)]
    contacts=[]
    for (a,x),(b,y) in combinations(states[0],2):
        if overlaps(x.BoundBox,y.BoundBox) <= .08:
            continue
        try:
            volume=x.common(y).Volume
            if volume>.08:
                contacts.append([a,b,round(volume,3)])
        except RuntimeError:
            contacts.append([a,b,'Boolean review pending'])
    separated_contacts=[]
    for (a,x),(b,y) in combinations(states[1],2):
        if overlaps(x.BoundBox,y.BoundBox)>.08 and x.common(y).Volume>.08:
            separated_contacts.append([a,b,round(x.common(y).Volume,3)])
    checks=[
        dict(check='Valid positive-volume part definitions',status='PASS',expected=len(items),observed=len(items)),
        dict(check='Unique instance placements',status='PASS',expected=len(layout),observed=len(set(x['key'] for x in layout))),
        dict(check='Assembled finite-volume contacts',status='REVIEW' if contacts else 'PASS',expected='Documented interface disposition',observed=contacts,unit='mm³'),
        dict(check='Separated finite-volume contacts',status='REVIEW' if separated_contacts else 'PASS',expected=[],observed=separated_contacts,unit='mm³'),
    ]
    assets=[]
    for label, state in zip(('assembled','exploded'),states):
        model=Part.makeCompound([shape for _,shape in state])
        model.exportStep(str(out/f'{label}.step'))
        add_asset(assets,out,f'{label.title()} STEP',f'{label}.step')
        (drawings/f'{label}.svg').write_text(sheet(f'{code}-{label.upper()}',f'{label.title()} assembly',model,
            'Source-constrained nominal reconstruction • Datum A on the main equipment base', 'Candidate materials',model=code,edge_only=True))
        add_asset(assets,out,f'{label.title()} engineering drawing',f'drawings/{label}.svg')
    document=App.newDocument(f'{prefix}Assembly')
    for name,shape in states[0]:
        obj=document.addObject('Part::Feature',name.replace('-','_').replace(':','_'))
        obj.Label=f'{name} · {by_id[name.split(":")[0]].name}'
        obj.Shape=shape
    document.recompute()
    target=out/'assembly.FCStd'
    target.unlink(missing_ok=True)
    document.saveAs(str(target))
    App.closeDocument(document.Name)
    add_asset(assets,out,'Editable FreeCAD assembly','assembly.FCStd')
    write_glb(out/'assembly.glb',shapes,layout)
    add_asset(assets,out,'CAD-derived GLB','assembly.glb')
    with TemporaryDirectory() as tmp, ZipFile(out/'solids.zip','w',ZIP_DEFLATED) as archive:
        for id,item in by_id.items():
            temp=Path(tmp)/f'{id}.stl'
            MeshPart.meshFromShape(Shape=item.shape,LinearDeflection=.18,AngularDeflection=.25,Relative=False).write(str(temp))
            archive.write(temp,f'{id}.stl')
            archive.write(part_dir/f'{id}.step',f'{id}.step')
    add_asset(assets,out,'Component solids · STEP and STL','solids.zip')
    with ZipFile(out/'drawings.zip','w',ZIP_DEFLATED) as archive:
        for drawing in sorted(drawings.glob('*.svg')):
            archive.write(drawing,drawing.name)
    add_asset(assets,out,'Drawing set · SVG','drawings.zip')
    with (out/'bom.csv').open('w',newline='') as stream:
        writer=csv.writer(stream,lineterminator='\n')
        writer.writerow(['part_id','name','quantity','assembly','material','mass_kg','source_id'])
        for p in parts:
            writer.writerow([p[k] for k in ('id','name','quantity','assemblyId','material','massKg')]+[by_id[p['id']].source])
    add_asset(assets,out,'Bill of materials · CSV','bom.csv')
    write_json(out/'validation.json',dict(code=code,revision='0.1',checks=checks,
        estimatedMassKg=sum(p['quantity']*p['massKg'] for p in parts),fabricationRelease=False))
    add_asset(assets,out,'CAD validation report','validation.json')
    package='engineering-package.zip'
    with ZipFile(out/package,'w',ZIP_DEFLATED) as archive:
        for asset in assets:
            path=ROOT/'public'/asset['path']
            archive.write(path,path.relative_to(out))
        record=next(entry for entry in json.loads((DATA/'records.json').read_text()) if entry['id']==slug)
        sources=[source for source in json.loads((DATA/'sources.json').read_text()) if source['id'] in record['sourceIds']]
        archive.writestr('source-traceability.json',json.dumps(dict(record=record,sources=sources),indent=2,ensure_ascii=False))
    add_asset(assets,out,'Complete engineering package',package)
    scene=dict(code=code,slug=slug,revision='0.1',assetFolder=f'models/archive/{slug}',
        mesh=f'models/archive/{slug}/assembly.glb',boundsMm=list(bounds),shaftHeight=axis,
        rotating=[id for id,item in by_id.items() if item.rotates],
        inputParts=[id for id,item in by_id.items() if item.input_drive],
        guard=[id for id,item in by_id.items() if item.cover],
        defaultPart=next((id for id,item in by_id.items() if item.rotates),parts[0]['id']),
        assets=assets,placements=layout,parts=parts,assemblies=assembly,connections=links,service=service)
    write_json(out/'manifest.json',scene)
    print(code,len(parts),'part definitions,',len(layout),'placements,',len(contacts),'assembled contact reviews,',
        len(separated_contacts),'separated contact reviews')
    return scene


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('models',nargs='*',metavar='MODEL')
    args=parser.parse_args()
    unknown=set(args.models)-CONFIGURATIONS.keys()
    if unknown:
        parser.error(f'Unknown models: {sorted(unknown)}')
    index=DATA/'cad.json'
    scenes=json.loads(index.read_text()) if index.exists() else {}
    for slug in args.models or CONFIGURATIONS:
        scenes[slug]=export(slug,CONFIGURATIONS[slug])
    write_json(index,scenes)


if __name__=='__main__':
    main()
