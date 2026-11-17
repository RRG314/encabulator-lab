"""Metachronic installed and staged spatial datums."""
from cad.shared.placement import placements_in_bands
from .master_assembly import BASE_GROUPS, FAMILIES

STAGES={i: min(8,i%9+1) for i in range(1,len(BASE_GROUPS)+len(FAMILIES)+1)}
STAGES.update({14:0,3:4,4:6,2:7,7:1,9:5,6:6,'ME-001':9,'ME-002':8})

def placements(records):
    return placements_in_bands(records,STAGES,floor_z=-23)
