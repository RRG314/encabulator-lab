"""FreeCAD part hierarchy, shared by solid verification, drawings and browser export."""
import json
import math
import FreeCAD as App
import Part
from .assemblies.layout import placements
from .components import mechanical as m, services as s
from .components.primitives import V, box, compound
from .materials import MATERIALS
from .parameters import ROOT, D

BUILDERS = [
    m.baseplate, m.feet, m.motor, s.driver, m.shaft, m.bearing, m.pedestal, m.hub, m.vane,
    m.retainer, m.isolator, s.fan, s.duct, m.guard, m.spiral, lambda: s.pcb(21,24,8),
    lambda: s.pcb(8,8,3), s.tachometer, s.probe, lambda: s.pcb(15,19,4)+[('blue',box(5,16,4,(-4,0,3)))],
    s.stop, s.supply, s.fuse, s.interlock, s.enclosure, s.harness,
    lambda: [('blue',box(7,7,1.4)),('black',box(5.2,5.2,1,(0,0,1)))], s.torque, m.fastener, m.coupling,
]

def registry():
    return {p['id']:p for p in json.loads((ROOT/'data/parts.json').read_text())}

def components():
    return {f'TE-{i:03}': build() for i, build in enumerate(BUILDERS, 1)}

def transform(row, fraction=0):
    point = [a + fraction*b for a,b in zip(row['origin'],row['offset'])]
    return App.Placement(V(*point), App.Rotation(V(1,0,0),math.degrees(row['rotation'])))

def machine_document(shapes, fraction=0):
    doc = App.newDocument('TE01_Exploded' if fraction else 'TE01_Assembly')
    doc.Label = 'TE-01 • Schematic engineering solids'
    records = registry()
    groups = {}
    for row in placements():
        id = row['partId']
        item = records[id]
        owner = item['assemblyId']
        if owner not in groups:
            groups[owner] = doc.addObject('App::DocumentObjectGroup', owner)
        instance = doc.addObject('App::Part', 'P_' + row['key'].replace('-','_').replace(':','_'))
        instance.Label = f"{row['key']} · {item['name']}"
        instance.addProperty('App::PropertyString', 'PartNumber', 'Registry').PartNumber = id
        instance.addProperty('App::PropertyString', 'EvidenceStatus', 'Registry').EvidenceStatus = 'Schematic preliminary'
        instance.addProperty('App::PropertyInteger', 'SequenceIndex', 'Assembly').SequenceIndex = row['stage'] + 1
        instance.addProperty('App::PropertyVector', 'DisassemblyVector', 'Assembly').DisassemblyVector = V(*row['offset'])
        groups[owner].addObject(instance)
        for i,(finish, shape) in enumerate(shapes[id]):
            member = doc.addObject('Part::Feature', f'{instance.Name}_{i+1}')
            member.Label = MATERIALS[finish][0]
            member.Shape = shape
            if member.ViewObject:
                member.ViewObject.ShapeColor = MATERIALS[finish][1]
                member.ViewObject.Transparency = round(100*(1-MATERIALS[finish][4]))
            instance.addObject(member)
        instance.Placement = transform(row, fraction)
    doc.recompute()
    return doc

def world_shapes(shapes, fraction=0):
    items = []
    for row in placements():
        if row['partId']=='TE-027':
            continue  # Logical marker has no solid envelope in interference checks.
        pieces = [shape for _,shape in shapes[row['partId']]]
        shape = compound(pieces)
        shape.Placement = transform(row, fraction)
        items.append((row,shape))
    return items

def section(shapes, axis='y'):
    cutters = {'y':box(500,250,500,(0,125,0)), 'x':box(250,500,500,(-125,0,0))}
    solid = compound(shape for _,shape in world_shapes(shapes))
    return solid.common(cutters[axis])
