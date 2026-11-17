"""Generate canonical ME-01 solids, assembly data and technical drawings."""
import csv
import json
import math
from dataclasses import asdict
from itertools import combinations
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import FreeCAD as App
import Part
import MeshPart
from cad.components.primitives import box, compound
from cad.drawings.generate import sheet
from cad.glb import write_glb
from cad.shared.placement import placed, overlaps
from .constraints import placements
from cad.parameters import ROOT
from .master_assembly import BASE_GROUPS,FAMILIES,records
from .parameters import D,Dimensions

OUT=ROOT/'public/models/me01'
DATA=ROOT/'data/me01'
GROUPS=BASE_GROUPS+[f['name'] for f in FAMILIES]
DENSITIES={'plate':2700,'steel':7850,'cast':3650,'blue':2700,'frame':1800,'amber':1200,'gold':8500,'black':1250,'glass':1200,'board':1780,'rubber':1100}
SIGNAL={23,24,25,26,27,28,29,40,44,45,47,48,50,51,53,54,55,56,57,59,60}
FLUID={20,21,22,41,43,52}

def save(path,data):
    path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

def validation(by_id,layout):
    result=[]
    def add(name,expected,observed,passed,unit=None):
        result.append(dict(check=name,expected=expected,observed=observed,unit=unit,status='PASS' if passed else 'FAIL'))
    physical=[p for p in by_id.values() if p.finish_parts]
    invalid=[p.id for p in physical if any(not s.Solids or not s.isValid() or any(b.Volume<=0 or not b.isClosed() for b in s.Solids) for _,s in p.finish_parts)]
    add('Closed positive-volume solid registration',[],invalid,not invalid)
    centers=[i['origin'][1:] for i in layout if i['partId'] in ('ME-005','ME-006','ME-007','ME-008')]
    add('Concentric load path centers in Y/Z',[0,D.shaft_z],centers,all(i==[0,D.shaft_z] for i in centers),'mm')
    vanes=[p for p in layout if p['partId']=='ME-013']
    add('Uniform vane indexing and instance quantity',6,len(vanes),len(vanes)==6 and all(abs(p['rotation']-i*math.pi/3)<1e-10 for i,p in enumerate(vanes)))
    gap=D.cover_radius-math.hypot(D.vane_radius,5)
    add('Conservative guard radial clearance','> 0',gap,gap>0,'mm')
    v=[(p['key'],placed(by_id[p['partId']].finish_parts,p,1).BoundBox) for p in layout]
    errors=[[a,b] for (a,x),(b,y) in combinations(v,2) if overlaps(x,y)>.1]
    add('Exploded endpoint envelope overlaps',[],errors,not errors)
    volumes=[]
    assembled=[(p['key'],placed(by_id[p['partId']].finish_parts,p)) for p in layout]
    for (a,x),(b,y) in combinations(assembled,2):
        if overlaps(x.BoundBox,y.BoundBox)<.1: continue
        try:
            common=sum(p.Volume for p in x.common(y).Solids)
            if common>.16: volumes.append(dict(a=a,b=b,overlapMm3=round(common,3)))
        except RuntimeError:
            volumes.append(dict(a=a,b=b,disposition='Boolean evaluation pending'))
    critical=[c for c in volumes if {c['a'].split(':')[0],c['b'].split(':')[0]} in [
        {'ME-013','ME-003'},{'ME-005','ME-007'},{'ME-006','ME-008'}]]
    add('Critical bearing and blade-envelope solid interference',[],critical,not critical)
    result.append(dict(check='Assembled interface dispositions',expected='Engineering review of every finite-volume intersection',
                       observed=volumes,unit='mm³',status='REVIEW' if volumes else 'PASS'))
    return result

def main():
    for path in (OUT,DATA,OUT/'drawings',OUT/'parts'): path.mkdir(parents=True,exist_ok=True)
    models=records()
    by_id={p.id:p for p in models}
    layout=placements(models)
    links=[dict(id=f'ME-IF-{p.number:03}',kind='signal' if p.number in SIGNAL else 'fluid' if p.number in FLUID else 'mechanical',
                 **{'from':p.id,'to':f'ME-{p.host:03}'},label=p.interface) for p in models if p.host]
    for i,(a,b,label,kind) in enumerate([(5,16,'Drive-side torque','mechanical'),(25,7,'Primary journal telemetry','signal'),(25,8,'Secondary journal telemetry','signal'),
        (21,41,'Conductive bypass return','fluid'),(41,43,'Bounded field command','signal'),(18,45,'Fan demand','signal'),(46,48,'Axis orientation request','signal'),
        (55,46,'Estimated tilt correction','signal'),(56,55,'Attitude convention test','signal'),(57,59,'Causal reconstructed samples','signal'),
        (59,26,'Modal order selection','signal'),(60,27,'Bounded scheduling signal','signal'),(54,45,'Thermodynamic dispatch request','signal'),
        (53,60,'Branch Margin','signal'),(51,42,'Dither calibration','signal'),(50,44,'Complex drive phasor','signal'),(49,26,'Directional dynamic stiffness','signal'),
        (52,22,'Toroidal pressure and delivery','fluid'),(23,11,'Polyphase drive output','power')],1):
        links.append(dict(id=f'ME-X-{i:03}',**{'from':f'ME-{a:03}','to':f'ME-{b:03}'},label=label,kind=kind))
    parts=[]
    service={}
    for p in models:
        physical=bool(p.finish_parts)
        group=f'ME-{p.group*100}'
        related=[(x['to'] if x['from']==p.id else x['from'],x) for x in links if p.id in (x['from'],x['to'])]
        dimensions=None
        mass=None
        basis={}
        if physical:
            b=compound(s for _,s in p.finish_parts).BoundBox
            dimensions={k:round(v,3) for k,v in zip(('length','width','height'),(b.XLength,b.YLength,b.ZLength))}
            all_solids=[(finish,s) for finish,body in p.finish_parts for s in body.Solids]
            weights=[s.Volume*DENSITIES[f]*1e-9 for f,s in all_solids]
            mass=sum(weights)
            center=[sum(w*getattr(s.CenterOfMass,axis) for (_,s),w in zip(all_solids,weights))/mass for axis in 'xyz']
            inertia=[sum(DENSITIES[f]*1e-15*(getattr(s.MatrixOfInertia,f'A{i+1}{i+1}')+
                      s.Volume*sum((getattr(s.CenterOfMass,a)-center[j])**2 for j,a in enumerate('xyz') if j!=i)) for f,s in all_solids) for i in range(3)]
            basis=dict(envelopeMm=list(dimensions.values()),massBasis='Generic material densities applied to schematic B-rep volumes.',
                       centerMm=[round(value,4) for value in center],centroidAxisInertiaKgM2=inertia)
        service[p.id]=dict(failureMode=p.failure,tool=p.tool,classification='Parametric physical part' if physical else 'Controller computation',
                           variables=p.variables,interface=p.interface,**basis)
        parts.append(dict(id=p.id,name=p.name,assemblyId=group,revision='0.1',description=p.purpose,function=p.purpose,
             material=p.material,quantity=len(p.stations) or 1,massKg=round(mass,7) if mass else None,dimensionsMm=dimensions,
             mounting=p.interface if physical else f'Executes on the ME-{p.host:03} controller boundary.',
             matingPartIds=[id for id,x in related if x['kind']=='mechanical'],fastenerIds=[],sensors=[],
             ports=[x['label'] for _,x in related if x['kind']!='mechanical'],equations=[p.equation] if p.equation else [],
             limits=p.variables or 'As-designed geometry. Material certification and operational limits require qualification.',
             safetyFlags=['Guarded and isolated service'] if physical else [],
             maintenance=f'Inspect {p.failure.lower()}. Review affected interfaces before return to test.',
             cadAssetPath=f'models/me01/parts/{p.id}.step' if physical else None,
             diagramRefs=[f'models/me01/drawings/{p.id}.svg'] if physical else [f'#/me01/systems/{p.id}'],
             testEvidence=[],sourcing='Preliminary component definition' if physical else 'Defined numerical function',
             readiness='Preliminary',evidence='calculation',proposedSpecification=p.material or 'Controller computation',
             sourceAssembly=group,verification='Geometry review' if physical else 'Deterministic numerical study',kind='physical' if physical else 'logical'))
    assemblies=[dict(id=f'ME-{(i+1)*100}',order=i+1,name=name,shortName=name,description=name,
                     partIds=[p.id for p in models if p.group==i+1]) for i,name in enumerate(GROUPS)]
    for file,data in [('parts',parts),('assemblies',assemblies),('connections',links),('service',service),('scientific',FAMILIES),
                      ('model-layout',dict(shaftHeight=D.shaft_z,journalStations=[-112,-112+D.journal_span],placements=layout))]:
        save(DATA/f'{file}.json',data)
    checks=validation(by_id,layout)
    # Rebuild local B-reps after a small set of independent dimension changes.
    changed=records(Dimensions(shaft_diameter=13.4, vane_pitch=17, fan_diameter=77))
    dm={p.id:p for p in changed}
    propagated=[]
    for id in ('ME-005','ME-007','ME-013','ME-018','ME-019'):
        a=compound(s for _,s in by_id[id].finish_parts)
        b=compound(s for _,s in dm[id].finish_parts)
        if abs(a.Volume-b.Volume)>1e-7 or abs(a.BoundBox.XLength-b.BoundBox.XLength)>1e-7: propagated.append(id)
    checks.append(dict(check='Parameter propagation to shaft, journal, vane and fan',expected=5,observed=len(propagated),unit=None,status='PASS' if len(propagated)==5 else 'FAIL'))
    save(OUT/'validation.json',dict(revision='0.1',basis='ME-01 OpenCascade assembly, calculated design geometry',
        estimatedMassKg=round(sum((p['massKg'] or 0)*p['quantity'] for p in parts),4),fabricationRelease=False,dimensions=asdict(D),checks=checks))
    for item in checks: print(item['status'],item['check'],len(item['observed']) if isinstance(item['observed'],list) else item['observed'],flush=True)
    physical={id:p.finish_parts for id,p in by_id.items() if p.finish_parts}
    write_glb(OUT/'me01.glb',physical,layout)
    with (OUT/'bom.csv').open('w',newline='') as f:
        writer=csv.writer(f,lineterminator='\n')
        writer.writerow(['ID','Component','Assembly','Quantity','Mass per unit, kg','Classification','Tool'])
        for p in parts: writer.writerow([p['id'],p['name'],p['assemblyId'],p['quantity'],p['massKg'],service[p['id']]['classification'],service[p['id']]['tool']])
    worlds={}
    for label,fraction in [('assembled',0),('exploded',1)]:
        doc=App.newDocument('ME01_MASTER_ASSEMBLY')
        parents={}
        leaves=[]
        worlds[label]=[]
        for row in layout:
            p=by_id[row['partId']]
            if p.group not in parents:
                group=doc.addObject('App::DocumentObjectGroup',f'G{p.group}')
                group.Label=GROUPS[p.group-1]
                parents[p.group]=group
            leaf=doc.addObject('Part::Feature','Component')
            solid=placed(p.finish_parts,row,fraction)
            leaf.Shape=solid
            leaf.Label=f"{row['key']} {p.name}"
            leaf.addProperty('App::PropertyString','PartNumber').PartNumber=p.id
            parents[p.group].addObject(leaf)
            worlds[label].append((p.group,solid))
            leaves.append(leaf)
        doc.recompute()
        target=OUT/f'me01-{label}.FCStd'
        target.unlink(missing_ok=True)
        doc.saveAs(str(target))
        Part.export(leaves,str(OUT/f'me01-{label}.step'))
        App.closeDocument(doc.Name)
    full=compound(s for _,s in worlds['assembled'])
    full.common(box(900,500,580,(0,250,60))).exportStep(str(OUT/'me01-longitudinal.step'))
    full.common(box(500,650,580,(-250,0,60))).exportStep(str(OUT/'me01-transverse.step'))
    with ZipFile(OUT/'solids.zip','w',ZIP_DEFLATED) as solids, ZipFile(OUT/'drawings.zip','w',ZIP_DEFLATED) as prints:
        def draw(id,title,shape,material):
            drawing=OUT/'drawings'/f'{id}.svg'
            drawing.write_text(sheet(id,title,shape,'ME-01 · DESIGN GEOMETRY · BASE Z = 0, SHAFT +X',material,model='ME-01',edge_only=True))
            prints.write(drawing,drawing.name)
        for p in models:
            if not p.finish_parts: continue
            shape=compound(s for _,s in p.finish_parts)
            step=OUT/'parts'/f'{p.id}.step'
            stl=OUT/'parts'/f'{p.id}.stl'
            shape.exportStep(str(step))
            MeshPart.meshFromShape(Shape=shape,LinearDeflection=.32,AngularDeflection=.35,Relative=False).write(str(stl))
            for item in (step,stl): solids.write(item,item.name)
            stl.unlink()
            draw(p.id,p.name,shape,'Candidate materials')
        for i,name in enumerate(GROUPS,1):
            solids_in_group=[s for group,s in worlds['assembled'] if group==i]
            if solids_in_group: draw(f'ME-{i*100}',name,compound(solids_in_group),'See part register')
        draw('ME01-ASSEMBLY','Metachronic Encabulator assembled',full,'See part register')
        draw('ME01-EXPLODED','Metachronic Encabulator disassembly',compound(s for _,s in worlds['exploded']),'See part register')
    if any(item['status']=='FAIL' for item in checks): raise SystemExit('ME-01 geometry requires review')

if __name__=='__main__':
    main()
