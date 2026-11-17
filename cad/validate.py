"""B-rep integrity and measured schematic clearances."""
from dataclasses import asdict
from itertools import combinations
from .assemblies.layout import placements
from .components.primitives import compound
from .materials import MATERIALS
from .parameters import D
from .te01_master_assembly import registry, world_shapes

def investigate(shapes):
    checks = []
    def add(name, expected, observed, passed, unit=None):
        checks.append(dict(check=name,expected=expected,observed=observed,status='PASS' if passed else 'FAIL',unit=unit))
    records = {id for id, record in registry().items() if record.get('kind') != 'logical'}
    rows = placements()
    add('Physical registry coverage',len(records),len(set(shapes)&records),set(shapes)==records)
    add('Unique instance keys',len(rows),len({row['key'] for row in rows}),len(rows)==len({row['key'] for row in rows}))
    unknown = sorted({finish for pieces in shapes.values() for finish,_ in pieces} - MATERIALS.keys())
    add('Finish assignments',[],unknown,not unknown)
    bad = [f'{id}:{i}' for id,pieces in shapes.items() for i,(_,shape) in enumerate(pieces,1)
           if not shape.isValid() or not shape.Solids or any(s.Volume <= 1e-6 or not s.isClosed() for s in shape.Solids)]
    add('Valid positive-volume closed solids',[],bad,not bad)
    shaft = next(row for row in rows if row['partId']=='TE-005')
    journals = [row for row in rows if row['partId']=='TE-006']
    center_error = max(abs(j['origin'][axis] - shaft['origin'][axis]) for j in journals for axis in (1,2))
    add('Journal coaxiality',0,center_error,center_error < 1e-9,'mm')
    gap = D.guard_aperture-(D.hub_radius+D.vane_span)
    add('Conservative rotor to guard aperture clearance','> 0',gap,gap>0,'mm')
    b = compound(shape for _,shape in shapes['TE-001']).optimalBoundingBox(False,False)
    observed = [b.XLength,b.YLength,b.ZLength]
    expected = [D.base_length,D.base_width,D.base_thickness]
    add('Complete baseplate envelope',expected,observed,max(abs(q-p) for p,q in zip(expected,observed)) < 1e-7,'mm')
    assembled = world_shapes(shapes)
    # Finite intersections are reported as open design issues, without an implicit contact whitelist.
    contacts = []
    for (a,am),(b,bm) in combinations(assembled,2):
        ba,bb = am.BoundBox,bm.BoundBox
        overlap = [min(getattr(ba,k+'Max'),getattr(bb,k+'Max'))-max(getattr(ba,k+'Min'),getattr(bb,k+'Min')) for k in 'XYZ']
        if min(overlap) <= 0.001:
            continue
        try:
            common = am.common(bm)
            volume = sum(s.Volume for s in common.Solids)
            if volume > 0.01:
                contacts.append(dict(a=a['key'],b=b['key'],volumeMm3=round(volume,4)))
        except RuntimeError as error:
            contacts.append(dict(a=a['key'],b=b['key'],detail=str(error)))
    critical = {frozenset(pair) for pair in [('TE-005','TE-006'),('TE-006','TE-007'),('TE-009','TE-014'),('TE-008','TE-014'),('TE-009','TE-015')]}
    issues = [contact for contact in contacts if frozenset(contact[k].split(':')[0] for k in ('a','b')) in critical]
    add('Critical rotor/journal envelope interference',[],issues,not issues)
    separated = world_shapes(shapes, 1)
    overlaps = []
    for (a,am),(b,bm) in combinations(separated,2):
        ba,bb = am.BoundBox,bm.BoundBox
        intervals = [min(getattr(ba,k+'Max'),getattr(bb,k+'Max'))-max(getattr(ba,k+'Min'),getattr(bb,k+'Min')) for k in 'XYZ']
        if min(intervals)>0.2:
            overlaps.append([a['key'],b['key']])
    add('Exploded bounding boxes',[],overlaps,not overlaps)
    checks.append(dict(check='Full assembly contact review',expected='Engineering disposition for each pair',
                       observed=contacts,status='REVIEW' if contacts else 'PASS',unit='mm³'))
    volume_by_part = {id: round(sum(shape.Volume for _,shape in pieces),5) for id,pieces in shapes.items()}
    return dict(revision='0.1',basis='OpenCascade schematic design geometry',fabricationRelease=False,
                dimensions=asdict(D),checks=checks,volumeMm3ByPart=volume_by_part)
