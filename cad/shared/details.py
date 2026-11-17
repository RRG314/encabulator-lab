"""Component machining and industrial enclosure features."""
import math
from cad.components.primitives import V, along_x, box, compound, cyl, prism, ring
import Part

def chamfered(x, y, z, position=(0,0,0), chamfer=2):
    a,b=x/2,y/2
    face=[(-a,-b+chamfer),(-a+chamfer,-b),(a-chamfer,-b),(a,-b+chamfer),
          (a,b-chamfer),(a-chamfer,b),(-a+chamfer,b),(-a,b-chamfer)]
    return prism(face,z).translated(V(*position))

def bore_grid(shape, coords, radius, length, axis='z'):
    return shape.cut(compound(cyl(radius,length,p,axis) for p in coords))

def xplate(width, height, thickness, aperture, holes=()):
    body = chamfered(height,width,thickness).rotated(V(),V(0,1,0),90)
    body = body.cut(cyl(aperture,thickness+2))
    return bore_grid(body,[(0,y,z) for y,z in holes],2.1,thickness+2,'x') if holes else body

def hexhead(radius, height, position=(0,0,0), socket=0):
    points=[(radius*math.cos(i*math.pi/3),radius*math.sin(i*math.pi/3)) for i in range(6)]
    solid=prism(points,height)
    if socket:
        recess=[(socket*math.cos(i*math.pi/3),socket*math.sin(i*math.pi/3)) for i in range(6)]
        solid=solid.cut(prism(recess,height/2,height/3))
    return solid.translated(V(*position))

def strip(finish, solids):
    return finish, compound(solids)

def terminal(pins=6, pitch=5, length=18):
    blocks=[chamfered(pitch-0.35,11,length,((i-(pins-1)/2)*pitch,0,0),.65) for i in range(pins)]
    contacts=[ring(1.45,.65,1,((i-(pins-1)/2)*pitch,0,length/2+.15),'z') for i in range(pins)]
    return [strip('frame',blocks),strip('gold',contacts)]
