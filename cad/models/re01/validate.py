"""Checks performed on RE-01 design geometry. Open dispositions remain visible."""
from dataclasses import asdict
from itertools import combinations
import math
from cad.shared.placement import overlaps
from .constraints import placed
from .parameters import D

def validate(records, layout):
    by_id={p.id:p for p in records}
    checks=[]
    def check(name,expected,observed,passed,unit=None):
        checks.append(dict(check=name,expected=expected,observed=observed,status='PASS' if passed else 'FAIL',unit=unit))
    bad=[part.id for part in records if any(not s.Solids or not s.isValid() or any(b.Volume<=0 or not b.isClosed() for b in s.Solids) for _,s in part.finish_parts)]
    check('Valid, closed positive-volume component solids',[],bad,not bad)
    qty=[p for p in layout if p['partId']=='RE-008']
    check('Patterned six-vane angular indexes',6,len(qty),len(qty)==6 and all(abs(a['rotation']-i*math.pi/3)<1e-9 for i,a in enumerate(qty)))
    keys={p['key'] for p in layout}
    check('Unique instance identities',len(layout),len(keys),len(keys)==len(layout))
    shaft=next(row for row in layout if row['partId']=='RE-005')
    error=max(abs(row['origin'][i]-shaft['origin'][i]) for row in layout if row['partId']=='RE-010' for i in (1,2))
    check('Shaft and journal coaxiality',0,error,error<1e-9,'mm')
    end=[(row,placed(by_id[row['partId']].finish_parts,row,1).BoundBox) for row in layout]
    intersections=[[a['key'],b['key']] for (a,ba),(b,bb) in combinations(end,2) if overlaps(ba,bb)>0.1]
    check('Exploded endpoint envelope overlaps',[],intersections,not intersections)
    room=D.guard_r-math.hypot(D.rotor_tip,4)
    check('Conservative radial swept-envelope clearance','> 0',round(room,3),room>0,'mm')
    linkage=D.rod_length-D.crank_r
    check('Crank-slider real closure margin','> 0',linkage,linkage>0,'mm')
    assembled=[(row,placed(by_id[row['partId']].finish_parts,row)) for row in layout]
    contacts=[]
    for (a,sa),(b,sb) in combinations(assembled,2):
        if overlaps(sa.BoundBox,sb.BoundBox)<=.08:
            continue
        try:
            common=sum(s.Volume for s in sa.common(sb).Solids)
            if common>.15: contacts.append(dict(a=a['key'],b=b['key'],volumeMm3=round(common,3)))
        except RuntimeError:
            contacts.append(dict(a=a['key'],b=b['key'],status='Boolean review'))
    check('Rotor, bearing and frame key collision pairs',[],
          found := [r for r in contacts if {r['a'].split(':')[0],r['b'].split(':')[0]} in [
              {'RE-008','RE-016'},{'RE-005','RE-010'},{'RE-010','RE-011'}]],not found)
    checks.append(dict(check='Assembled joint and packaging dispositions',expected='Review each finite-volume contact',
                       observed=contacts,status='REVIEW' if contacts else 'PASS',unit='mm³'))
    return dict(revision='0.1',fabricationRelease=False,basis='OpenCascade design geometry',dimensions=asdict(D),checks=checks)
