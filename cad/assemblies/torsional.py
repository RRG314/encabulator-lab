"""Separate DGS torsional study. Baseline TE-011 remains a stationary mount."""
import math
from ..parameters import D
from ..components.primitives import along_x, box, cyl, compound, ring

PIN_RADIUS = 1.5
STOP_RADIUS = 2.25
PITCH_RADIUS = 9.2

def cartridge():
    bore = D.shaft_diameter/2
    drive = ring(12.5,bore,6,(-5.5,0,0))
    follower = ring(12.5,bore,6,(5.5,0,0))
    for y in (-PITCH_RADIUS,PITCH_RADIUS):
        follower = follower.cut(cyl(STOP_RADIUS,9,(5.5,y,0)))
    pins = compound(cyl(PIN_RADIUS,8,(-0.4,y,0)) for y in (-PITCH_RADIUS,PITCH_RADIUS))
    elastomer = compound(along_x(box(5,3,2.8,(0,0,8.5)),45+i*90) for i in range(4))
    return [('steel',drive),('plate',follower),('steel',pins),('amber',elastomer)]

def working_travel():
    """Hard-stop contact by the planar chord between coaxial hub-hole centers."""
    clearance = STOP_RADIUS-PIN_RADIUS
    limit = 2*math.asin(clearance/(2*PITCH_RADIUS))
    return dict(status='schematic design variant',allowedAngleDeg=math.degrees(limit),
                pinRadiusMm=PIN_RADIUS,stopHoleRadiusMm=STOP_RADIUS,pitchRadiusMm=PITCH_RADIUS,
                torqueRating=None,stiffness=None,damping=None)
