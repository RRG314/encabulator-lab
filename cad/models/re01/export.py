"""Generate RE-01 registry, review drawings and exchange formats."""
import csv
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import FreeCAD as App
import MeshPart
import Part
from cad.components.primitives import V, box, compound
from cad.glb import write_glb
from cad.parameters import ROOT
from cad.drawings.generate import sheet
from .constraints import placements,placed
from .master_assembly import GROUPS, records
from .parameters import D
from .validate import validate

REGISTER=ROOT/'data/re01'
OUT=ROOT/'public/models/re01'
DRAW=Path(__file__).parent/'drawings'
DENSITIES={'plate':2700,'steel':7850,'cast':3650,'blue':2700,'frame':1800,'amber':1200,'gold':8500,
           'black':1250,'glass':1200,'board':1780,'rubber':1100,'red':1260,'sensor':2000}
SUPPORTS={10:[11],11:[10,12],19:[20,26],27:[28,29,30],43:[27,30,45,47]}
EQUATIONS={5:['σ = 32M/(πd³)','τ = 16T/(πd³)'],7:['F = mrΩ²'],8:['F = mrΩ²'],10:['L₁₀ = (C/P)³ × 10⁶ rev'],
           19:['V = Ri + L di/dt + kₑΩ'],24:['τ = kΔθ + cΔω'],30:['Δφ = arg Σ(XY*)'],
           31:['x = r cosθ + √(L² − r²sin²θ)'],36:['Δp = (f L/D + ΣK) ρv²/2'],39:['Vdc Idc = Pconv + Ploss']}

def save(path,data):
    path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

def export():
    OUT.mkdir(parents=True,exist_ok=True)
    REGISTER.mkdir(parents=True,exist_ok=True)
    DRAW.mkdir(parents=True,exist_ok=True)
    bodies=records()
    layout=placements(bodies)
    by_id={p.id:p for p in bodies}
    links=[dict(id=f'RE-IF-{p.number:03}',kind=p.kind,**{'from':p.id,'to':f'RE-{p.host:03}'},
                label=f'{p.name} — {by_id[f"RE-{p.host:03}"].name} interface') for p in bodies if p.host]
    links.extend([dict(id=f'RE-IF-S{i:02}',kind=kind,**{'from':f'RE-{a:03}','to':f'RE-{b:03}'},label=label)
        for i,(a,b,kind,label) in enumerate([(43,39,'signal','Drive setpoint and watchdog'),(28,27,'signal','Calibrated bearing signals'),
        (47,45,'signal','Guard and stop permissives'),(39,26,'power','Three-phase drive output'),(43,40,'power','Protected control power'),
        (29,27,'signal','Synchronous tachometer edge'),(46,27,'signal','Field signal connector')],1)])
    parts=[]
    service={}
    for p in bodies:
        shape=compound(s for _,s in p.finish_parts)
        b=shape.BoundBox
        group=f'RE-{p.group*100}'
        dim=dict(length=b.XLength,width=b.YLength,height=b.ZLength)
        if p.number==1: dim=dict(length=D.length,width=D.width,thickness=D.plate)
        if p.number==5: dim['journalDiameter']=D.journal_d
        if p.number==10: dim.update(bore=D.journal_d,outerDiameter=D.bearing_outer,axialWidth=D.bearing_width)
        related=[(link['to'] if link['from']==p.id else link['from'],link) for link in links if p.id in (link['from'],link['to'])]
        mates=[id for id,link in related if link['kind']=='mechanical']
        mass=sum(s.Volume*DENSITIES[c]*1e-9 for c,s in p.finish_parts)
        service[p.id]=dict(failureMode=p.failure,tool=p.tool,source=p.source,
                           massBasis='Calculated from schematic component volumes and generic material densities.',
                           envelopeMm=[round(b.XLength,3),round(b.YLength,3),round(b.ZLength,3)],
                           classification='Catalog envelope candidate' if p.number in {3,4,10,13,28,29,39,40,43,44,45,47} else 'Custom design reference')
        parts.append(dict(id=p.id,name=p.name,assemblyId=group,revision='0.1',description=p.purpose,function=p.purpose,
                      material=p.material,quantity=len(p.stations),massKg=round(mass,6),dimensionsMm={k:round(v,3) for k,v in dim.items()},
                      mounting=f'CAD datum relative to {by_id[f"RE-{p.host:03}"].name if p.host else "the Z = 0 foundation plane"}.',
                      matingPartIds=mates,fastenerIds=['RE-004'] if 4 in [int(id[3:]) for id in mates] else [],
                      sensors=[f'RE-{i:03}' for i in SUPPORTS.get(p.number,[]) if i in (28,29)],ports=[link['label'] for _,link in related if link['kind'] in ('power','signal')],
                      equations=EQUATIONS.get(p.number,[]),limits='Published dimensions and material values are design inputs. Operational limits are pending qualification.',
                      safetyFlags=['Isolation and clearance review'] if p.group in (2,3,6,9,12,14,15) else [],
                      maintenance=f'Inspect for {p.failure.lower()}. Record condition and any deviation from the reviewed interface before reassembly.',
                      cadAssetPath=f'models/re01/parts/{p.id}.step',diagramRefs=[f'models/re01/drawings/{p.id}.svg'],
                      testEvidence=[],sourcing='Vendor and part number open.' if service[p.id]['classification'].startswith('Catalog') else 'Custom part concept.',
                      readiness='Preliminary',evidence='calculation',proposedSpecification=p.material,sourceAssembly=group,
                      verification='Digital geometry reviewed. Physical qualification pending.',kind='physical'))
    groups=[dict(id=f'RE-{(i+1)*100}',name=name,shortName=short,order=i+1,description=name,
                 partIds=[r.id for r in bodies if r.group==i+1]) for i,(name,short) in enumerate(GROUPS)]
    for name,data in [('parts',parts),('assemblies',groups),('connections',links),('service',service),
                      ('model-layout',dict(shaftHeight=D.axis_z,journalStations=[-D.journal_span/2,D.journal_span/2],placements=layout))]:
        save(REGISTER/f'{name}.json',data)
    report=validate(bodies,layout)
    report['estimatedMassKg']=round(sum(row['massKg']*row['quantity'] for row in parts),3)
    report['massBasis']='Computed from schematic volumes and generic finish densities. Includes modeled instance counts, including representative hardware.'
    rotor=by_id['RE-008']
    mass=sum(s.Volume*DENSITIES[c]*1e-9 for c,s in rotor.finish_parts)
    vane_solids=[(c,s) for c,body in rotor.finish_parts for s in body.Solids]
    cx=sum(s.CenterOfMass.x*s.Volume*DENSITIES[c]*1e-9 for c,s in vane_solids)/mass
    cy=sum(s.CenterOfMass.y*s.Volume*DENSITIES[c]*1e-9 for c,s in vane_solids)/mass
    cz=sum(s.CenterOfMass.z*s.Volume*DENSITIES[c]*1e-9 for c,s in vane_solids)/mass
    # FreeCAD supplies geometric volume moments about each solid's centroid.
    j=sum(DENSITIES[c]*1e-15*(s.MatrixOfInertia.A11+s.Volume*(s.CenterOfMass.y**2+(D.rotor_root+s.CenterOfMass.z)**2)) for c,s in vane_solids)
    report['vaneCalculation']=dict(massKg=mass,localCenterMm=[cx,cy,cz],perVaneInertiaAboutShaftKgM2=j,
                                   radiusMm=D.rotor_tip,pitchDeg=D.blade_pitch_deg,basis=report['massBasis'])
    save(OUT/'validation.json',report)
    for check in report['checks']: print(check['status'],check['check'],len(check['observed']) if isinstance(check['observed'],list) else check['observed'],flush=True)
    shapes={p.id:p.finish_parts for p in bodies}
    write_glb(OUT/'re01.glb',shapes,layout)
    with (OUT/'bom.csv').open('w',newline='') as stream:
        writer=csv.writer(stream,lineterminator="\n")
        writer.writerow(['part_id','component','assembly','quantity','material_basis','schematic_unit_mass_kg','tool_candidate'])
        for p in parts: writer.writerow([p['id'],p['name'],p['assemblyId'],p['quantity'],p['material'],p['massKg'],service[p['id']]['tool']])
    world={}
    for label,fraction in [('assembled',0),('exploded',1)]:
        doc=App.newDocument('Retro_Encabulator')
        parents={}
        leaves=[]
        world[label]=[]
        for row in layout:
            p=by_id[row['partId']]
            if p.group not in parents:
                group=doc.addObject('App::DocumentObjectGroup',f'A{p.group}')
                group.Label=GROUPS[p.group-1][0]
                parents[p.group]=group
            node=doc.addObject('Part::Feature','Component')
            node.Shape=placed(p.finish_parts,row,fraction)
            node.Label=f"{row['key']} {p.name}"
            node.addProperty('App::PropertyString','PartNumber').PartNumber=p.id
            parents[p.group].addObject(node)
            leaves.append(node)
            world[label].append((p.group,node.Shape))
        doc.recompute()
        fc=OUT/f're01-{label}.FCStd'
        fc.unlink(missing_ok=True)
        doc.saveAs(str(fc))
        Part.export(leaves,str(OUT/f're01-{label}.step'))
        App.closeDocument(doc.Name)
    full=compound(s for _,s in world['assembled'])
    full.common(box(800,450,600,(0,225,100))).exportStep(str(OUT/'re01-longitudinal.step'))
    full.common(box(500,500,600,(-250,0,100))).exportStep(str(OUT/'re01-transverse.step'))
    (OUT/'parts').mkdir(exist_ok=True)
    (OUT/'drawings').mkdir(exist_ok=True)
    with ZipFile(OUT/'part-solids.zip','w',ZIP_DEFLATED) as archive, ZipFile(OUT/'drawings.zip','w',ZIP_DEFLATED) as drawings:
        for p in bodies:
            shape=compound(s for _,s in p.finish_parts)
            step=OUT/'parts'/f'{p.id}.step'
            stl=OUT/'parts'/f'{p.id}.stl'
            shape.exportStep(str(step))
            mesh=MeshPart.meshFromShape(Shape=shape,LinearDeflection=.3,AngularDeflection=.32,Relative=False)
            mesh.write(str(stl))
            archive.write(step,step.name)
            archive.write(stl,stl.name)
            stl.unlink()
            output=OUT/'drawings'/f'{p.id}.svg'
            output.write_text(sheet(p.id,p.name,shape,'REFERENCE GEOMETRY · DIMENSIONS IN MILLIMETRES',p.material,model='RE-01',edge_only=True))
            drawings.write(output,output.name)
        entries=[('RE01-ASSEMBLY','Retro Encabulator assembly',full),
                 ('RE01-EXPLODED','Retro Encabulator disassembly',compound(s for _,s in world['exploded']))]
        entries.extend((f'RE-{i*100}',name,compound(s for g,s in world['assembled'] if g==i)) for i,(name,_) in enumerate(GROUPS,1))
        for id,name,shape in entries:
            output=OUT/'drawings'/f'{id}.svg'
            output.write_text(sheet(id,name,shape,'MOUNTING DATUM Z = 0 · SHAFT ALONG +X','See component registry',model='RE-01',edge_only=True))
            drawings.write(output,output.name)
    if any(item['status']=='FAIL' for item in report['checks']):
        raise SystemExit('Review solid validation failures')

if __name__=='__main__':
    export()
