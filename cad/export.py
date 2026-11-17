"""Run with a Python interpreter that can import FreeCAD, Part and TechDraw."""
import argparse
from enum import Enum
import json
import zipfile
import FreeCAD as App
import Part
import MeshPart
from .assemblies.layout import placements
from .assemblies.torsional import cartridge, working_travel
from .components.primitives import compound
from .glb import write_glb
from .parameters import ROOT, D
from .te01_master_assembly import components, machine_document, section, world_shapes
from .validate import investigate

class Artifact(Enum):
    WEB = 'web'
    ALL = 'all'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=[mode.value for mode in Artifact],default='all')
    args = parser.parse_args()
    out = ROOT/'public/models'
    out.mkdir(parents=True,exist_ok=True)
    shapes = components()
    layout = placements()
    (ROOT/'data/model-layout.json').write_text(json.dumps(dict(shaftHeight=D.shaft_z,journalStations=[-D.bearing_span/2,D.bearing_span/2],placements=layout),indent=2)+'\n')
    report = investigate(shapes)
    density={'plate':2700,'steel':7850,'cast':3650,'blue':2700,'frame':1800,'amber':1200,
             'gold':8500,'black':1250,'glass':1200,'board':1780,'rubber':1100,'red':1260,'sensor':2000}
    envelopes={}
    masses={}
    for id,pieces in shapes.items():
        b=compound(shape for _,shape in pieces).BoundBox
        envelopes[id]=[round(b.XLength,3),round(b.YLength,3),round(b.ZLength,3)]
        masses[id]=sum(shape.Volume*density[finish]*1e-9 for finish,shape in pieces)
    (ROOT/'data/te01-envelopes.json').write_text(json.dumps(envelopes,indent=2)+'\n')
    report['estimatedMassKg']=round(sum(masses[row['partId']] for row in layout if row['partId']!='TE-027'),3)
    report['massBasis']='Schematic sum of component volumes with generic finish densities. Includes representative mounting hardware, excluding software marker.'
    (out/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
    for check in report['checks']:
        print(check['status'],check['check'])
    write_glb(out/'te01.glb', shapes, layout)
    if args.mode == 'all':
        out_cad = ROOT/'cad/exports'
        out_cad.mkdir(parents=True,exist_ok=True)
        for label, fraction in [('assembled',0),('exploded',1)]:
            # FreeCAD creates a backup when saving over a path. Use an atomic replacement.
            target = out/f'te01-{label}.FCStd'
            temp = out_cad/f'te01-{label}.FCStd'
            temp.unlink(missing_ok=True)
            document = machine_document(shapes,fraction)
            document.saveAs(str(temp))
            temp.replace(target)
            App.closeDocument(document.Name)
            step_document = App.newDocument('TE01_STEP')
            objects = []
            for row, shape in world_shapes(shapes, fraction):
                feature = step_document.addObject('Part::Feature', 'Instance')
                feature.Label = row['key']
                feature.Shape = shape
                objects.append(feature)
            step_document.recompute()
            Part.export(objects, str(out/f'te01-{label}.step'))
            App.closeDocument(step_document.Name)
        # Standalone local solids for geometric exchange; logic is a reference marker.
        with zipfile.ZipFile(out_cad/'te01-part-solids.zip','w',compression=zipfile.ZIP_DEFLATED) as archive:
            for name,pieces in shapes.items():
                if name == 'TE-027':
                    continue
                body = compound(shape for _,shape in pieces)
                step = out_cad/f'{name}.step'
                stl = out_cad/f'{name}.stl'
                body.exportStep(str(step))
                mesh = MeshPart.meshFromShape(Shape=body, LinearDeflection=0.2, AngularDeflection=0.25, Relative=False)
                mesh.write(str(stl))
                for path in (step,stl):
                    archive.write(path,path.name)
                    path.unlink()
        (out_cad/'te01-part-solids.zip').replace(out/'te01-part-solids.zip')
        variant = compound(shape for _,shape in cartridge())
        variant.exportStep(str(out/'te01-dgs-travel-study.step'))
        (out/'dgs-travel-study.json').write_text(json.dumps(working_travel(),indent=2)+'\n')
        for plane in ('x','y'):
            section(shapes,plane).exportStep(str(out/f'te01-section-{plane}.step'))
        from .drawings.generate import drawings
        drawings(shapes, [shape for _,shape in world_shapes(shapes)],
                 [shape for _,shape in world_shapes(shapes,1)])
    if any(check['status']=='FAIL' for check in report['checks']):
        raise SystemExit('Solid validation detected failures')

if __name__ == '__main__':
    main()
