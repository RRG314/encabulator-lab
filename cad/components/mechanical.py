"""Structural, bearing, and rotor B-reps. Local coordinates use the parent design datums."""
import math
import Part
from .primitives import V, along_x, beveled_rect, box, compound, cyl, flange, prism, ring
from ..parameters import D
from ..shared.details import chamfered, hexhead

def baseplate():
    blank = prism(beveled_rect(D.base_length/2,D.base_width/2,6),D.base_thickness)
    patterns = [(x*D.foot_x,y*D.foot_y,1.9) for x in (-1,1) for y in (-1,1)]
    patterns.extend((x*D.bearing_span/2,y*16,1.45) for x in (-1,1) for y in (-1,1))
    patterns.extend((D.motor_x+x*19,y*17,1.45) for x in (-1,1) for y in (-1,1))
    patterns.extend((x*D.guard_half_length,y*49,1.45) for x in (-1,1) for y in (-1,1))
    holes = [cyl(r,D.base_thickness+2,(x,y,0),'z') for x,y,r in patterns]
    counterbores = [cyl(3,1.5,(x,y,D.base_thickness/2-0.35),'z') for x,y,_ in patterns[:4]]
    channels=[box(236,1.1,.55,(0,y,2.9)) for y in (-95,-91,91,95)]
    return [('plate',blank.cut(compound(holes+counterbores+channels))),
            ('frame',chamfered(43,11,.35,(102,-79,2.91),1.2)),
            ('amber',compound(box(18,0.45,1.3,(x*124,-D.base_width/2-0.225,-0.4)) for x in (-1,1)))]

def feet():
    return [('rubber', Part.makeCone(10,8.5,9,V(0,0,-4.5)).cut(cyl(1.4,5,(0,0,4),'z'))),('steel',ring(5,1.4,1,(0,0,5),'z'))]

def motor():
    case = cyl(19.2,D.motor_body_length-6)
    caps = compound(cyl(17.4,3,(x*(D.motor_body_length/2-1.5),0,0)) for x in (-1,1))
    fins = compound(along_x(box(38,2.25,4.4,(0,0,20.1)),i*30) for i in range(12))
    feet = compound(box(44,11,6,(0,y*14.5,-22.5)) for y in (-1,1))
    end_bolts=compound(along_x(hexhead(2.4,1.4,socket=1.1).rotated(V(),V(0,1,0),90).translated(V(x*28.8,0,13.3)),45+i*90)
                       for x in (-1,1) for i in range(4))
    ring_fins=compound(ring(18.3,16.8,.75,(x,0,0)) for x in (-25.4,-23.7,23.7,25.4))
    return [('cast',case),('plate',caps),('frame',fins),('cast',feet),('steel',end_bolts),('cast',ring_fins),
            ('steel',cyl(D.shaft_diameter/2,10,(D.motor_body_length/2+5,0,0))),
            ('black',chamfered(13,9,7,(-11,-10,17),1.6)),('gold',chamfered(14,7,0.7,(5,-4,19.4),1.15))]

def shaft():
    return [('steel', cyl(D.shaft_diameter/2,D.shaft_length))]

def bearing():
    r = D.shaft_diameter/2
    R = D.bearing_outer/2
    d = D.bearing_width
    return [('steel',ring(R,R-1.75,d)),
            ('steel',ring(r+1.7,r,d)),
            ('rubber',compound(ring(R-1.75,r+1.7,0.45,(x*(d/2-0.25),0,0)) for x in (-1,1)))]

def pedestal():
    head = flange(34,33,11.5,D.bearing_outer/2+0.035,drill=True)
    height = D.shaft_z-19
    riser = box(13,24,height,(0,0,-17-height/2))
    foot = box(24,43,4,(0,0,-D.shaft_z+2))
    holes = compound(cyl(1.5,8,(0,y*16,-D.shaft_z+2),'z') for y in (-1,1))
    return [('cast',head.fuse(riser)),('plate',foot.cut(holes))]

def hub():
    body = ring(D.hub_radius,D.shaft_diameter/2,D.hub_length)
    for i in range(D.vane_count):
        seat = along_x(box(D.vane_chord+0.4,D.vane_thickness+1.2,4,(0,0,D.hub_radius-1)),i*360/D.vane_count)
        body = body.cut(seat)
    collars = compound(ring(D.hub_radius+1,D.shaft_diameter/2,2,(x*(D.hub_length/2+1),0,0)) for x in (-1,1))
    return [('steel',body),('plate',collars)]

def vane():
    chord = D.vane_chord
    half = D.vane_thickness / 2
    profile = [(-chord/2,-half*0.4),(-chord/2+2,-half),(chord/2-3,-half*0.8),
               (chord/2,half*0.1),(chord/2-3,half*0.7),(-chord/2+3,half)]
    shell = prism(profile,D.vane_span-2.5,(D.vane_span-2.5)/2).rotated(V(),V(0,0,1),D.vane_pitch)
    root = box(chord-4,D.vane_thickness+0.4,2,(0,0,-1))
    bolts=compound(hexhead(1.65,.7,(x,0,-.32),.75) for x in (-11,11))
    return [('amber',shell),('cast',root),('steel',bolts)]

def retainer():
    return [('cast',ring(10.5,D.shaft_diameter/2,4)),('steel',ring(8.4,D.shaft_diameter/2,0.6,(2.3,0,0)))]

def isolator():
    cap_z = D.shaft_z - 32.5
    table = box(57,42,3,(0,0,-2))
    cap = box(52,39,3,(0,0,cap_z)).cut(compound(cyl(1.45,5,(x*19,y*17,cap_z),'z') for x in (-1,1) for y in (-1,1)))
    posts = compound(cyl(7,cap_z-4,(x*21,y*14,(cap_z-1)/2),'z') for x in (-1,1) for y in (-1,1))
    return [('plate',table),('cast',cap),('rubber',posts)]

def guard():
    frame = []
    for x in (-D.guard_half_length,D.guard_half_length):
        frame.append(flange(106,106,3,D.guard_aperture,x,True))
        for y in (-49,49):
            frame.append(box(8,8,5,(x,y,-D.shaft_z+2.5)).cut(cyl(1.45,7,(x,y,-D.shaft_z+2.5),'z')))
    for y in (-51,51):
        for z in (-51,51):
            frame.append(box(73,4,4,(0,y,z)))
    glass = [box(67,1.4,96,(0,y*51,0)) for y in (-1,1)]
    glass.append(box(67,96,1.4,(0,0,51)))
    front_bolts=compound(hexhead(1.7,1.3,socket=.75).rotated(V(),V(1,0,0),90).translated(V(x,-52.4,z))
                        for x in (-31,31) for z in (-41,-27,27,41))
    ticks=compound(box(3.5,1.25,3,(x,-54,48.8)) for x in range(-21,22,7))
    return [('plate',compound(frame)),('glass',compound(glass)),('steel',front_bolts),
            ('frame',box(67,96,1.4,(0,0,-51))),('amber',box(52,1,2,(0,-53.5,50))),('gold',ticks)]

def spiral():
    points = []
    for i in range(45):
        angle = i*math.pi*1.6/44
        radius = 45*math.exp(0.014*angle)
        points.append(V(29-0.07*i,radius*math.cos(angle),radius*math.sin(angle)))
    path = Part.BSplineCurve()
    path.interpolate(points)
    wire = Part.Wire([path.toShape()])
    section = Part.Wire([Part.makeCircle(0.72,points[0],path.tangent(path.FirstParameter)[0])])
    return [('blue',wire.makePipeShell([section],True,False))]

def fastener():
    head = prism([(2.6*math.cos(i*math.pi/3),2.6*math.sin(i*math.pi/3)) for i in range(6)],2.2,1.4)
    return [('steel',head.fuse(cyl(1.25,5,(0,0,-2),'z')))]

def coupling():
    half = D.coupling_length/2
    bore = D.shaft_diameter/2
    return [('steel',ring(10,bore,half-2,(-half/2-1,0,0))),
            ('plate',ring(10,bore,half-2,(half/2+1,0,0))),
            ('amber',ring(9.6,bore,4))]
