"""Resolve local interface datums and preserve the staged separation vectors."""
import json
import math
from ..parameters import ROOT, D

def placements():
    rows = json.loads((ROOT/'cad/staging.json').read_text())
    for item in rows:
        id = item['partId']
        index = int(item['key'].split(':')[1])-1
        x,y,z = item['origin']
        match id:
            case 'TE-001':
                z = -D.base_thickness/2
            case 'TE-002':
                x = D.foot_x * math.copysign(1,x)
                y = D.foot_y * math.copysign(1,y)
                z = -D.base_thickness-4.5
            case 'TE-003' | 'TE-011':
                x = D.motor_x
            case 'TE-005':
                x = D.shaft_center_x
            case 'TE-006' | 'TE-007' | 'TE-017':
                x = D.bearing_span/2 * math.copysign(1,x)
            case 'TE-009':
                theta = 2*math.pi*index/D.vane_count
                y = -D.hub_radius*math.sin(theta)
                z = D.shaft_z+D.hub_radius*math.cos(theta)
                item['rotation'] = theta
            case 'TE-010':
                x = D.hub_length/2 + 5
            case 'TE-018':
                x = D.hub_length/2 + 11
            case 'TE-019':
                x = D.motor_x+21 if index == 0 else D.bearing_span/2
                y,z = (0,79.45) if index == 0 else (11,76.75)
            case 'TE-024':
                y = -60
            case 'TE-025':
                y = -76
            case 'TE-004' | 'TE-016' | 'TE-020':
                y = -73
            case 'TE-028':
                x = D.shaft_center_x+D.shaft_length/2-11
            case 'TE-029':
                if index < 4:
                    x = D.foot_x*math.copysign(1,x)
                    y = D.foot_y*math.copysign(1,y)
                elif index < 8:
                    x = D.bearing_span/2*math.copysign(1,x)
                elif index < 12:
                    x = D.motor_x+(-19 if index < 10 else 19)
                    z = D.shaft_z-27.8
                elif index < 16:
                    x = D.guard_half_length*math.copysign(1,x)
                else:
                    y = -76+17*math.copysign(1,y+70)
            case 'TE-030':
                x = D.coupling_x
        if id in {'TE-003','TE-005','TE-006','TE-007','TE-008','TE-010','TE-014','TE-015','TE-018','TE-028','TE-030'}:
            z = D.shaft_z
        if id in {'TE-017','TE-019','TE-024'}:
            z += D.shaft_z-58
        item['origin'] = [x,y,z]
    return rows
