"""Journal-datum placements and dimension-aware exploded endpoints."""
from collections import defaultdict
import math
import FreeCAD as App
from cad.components.primitives import V, compound
from .parameters import D

STAGE = {1:8,2:5,3:4,4:6,5:1,6:0,7:3,8:4,9:7,10:2,11:2,12:5,13:2,14:7,15:2}

def placed(pieces, row, fraction=0):
    solid=compound(shape for _,shape in pieces)
    origin=[a+fraction*b for a,b in zip(row['origin'],row['offset'])]
    solid.Placement=App.Placement(V(*origin),App.Rotation(V(1,0,0),math.degrees(row['rotation'])))
    return solid

def placements(records):
    rows=[]
    bands=defaultdict(list)
    for part in records:
        for index,(origin,angle) in enumerate(part.stations,1):
            row=dict(key=f'{part.id}:{index}',partId=part.id,origin=list(origin),offset=[0,0,0],
                     rotation=angle,stage=STAGE[part.group])
            body=placed(part.finish_parts,row)
            b=body.BoundBox
            bands[row['stage']].append((row,b))
            rows.append(row)
    z=500
    for stage, group in sorted(bands.items()):
        # Split spatial rows by major envelope and retain subsystem order within each row.
        height=max(b.ZLength for _,b in group)
        depth=max(b.YLength for _,b in group)
        widths=[b.XLength+14 for _,b in group]
        # Arrange broad bands in two depth planes for readable end positions.
        cuts=[group] if sum(widths)<680 else [group[:len(group)//2],group[len(group)//2:]]
        for depth_row, items in enumerate(cuts):
            cursor=-sum(b.XLength+14 for _,b in items)/2
            for row,b in items:
                center_x=(b.XMin+b.XMax)/2
                center_y=(b.YMin+b.YMax)/2
                center_z=(b.ZMin+b.ZMax)/2
                row['offset']=[cursor+b.XLength/2-center_x, (depth+22)*(depth_row-0.5*(len(cuts)-1))-center_y, z-center_z]
                cursor+=b.XLength+14
        z-=height/2 + max((b.ZLength for s,items in bands.items() if s>stage for _,b in items),default=0)/2 + 14
    return rows
