"""Retro Encabulator service-order layout."""
from cad.shared.placement import placements_in_bands, placed

STAGE = {1:8,2:5,3:4,4:6,5:1,6:0,7:3,8:4,9:7,10:2,11:2,12:5,13:2,14:7,15:2}


def placements(records):
    return placements_in_bands(records,STAGE)
