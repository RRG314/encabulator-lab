"""Cooling, electronics, and harness candidate envelopes."""
import Part
from .primitives import V, along_x, box, cable, compound, cyl, flange, prism, ring
from ..parameters import D

def fan():
    blade = prism([(7,-2),(11,-5),(20,-4),(21,0),(17,5),(9,3)],1.6).rotated(V(),V(0,1,0),90)
    grill = [ring(r,r-0.55,0.65,(7.8,0,0)) for r in (10,15,20,23)]
    grill += [along_x(box(0.8,46,0.8,(8.2,0,0)),i*60) for i in range(3)]
    return [('frame',flange(53,53,14,22,drill=True)),('cast',cyl(7.5,10)),
            ('plate',compound(along_x(blade,i*360/7) for i in range(7))),('steel',compound(grill))]

def duct():
    sleeve = Part.makeCone(23,24,25,V(-13,0,0),V(1,0,0)).cut(cyl(21,27))
    grill = compound(box(0.7,0.8,37,(11,y,0)) for y in (-12,-8,-4,0,4,8,12))
    return [('cast',flange(50,49,4,22,12.5,True)),('frame',sleeve),('black',grill)]

def pcb(x,y,n=6):
    plate = box(x,y,1.6)
    standoff_holes = compound(cyl(0.9,2,(a*(x/2-1.9),b*(y/2-1.9),0),'z') for a in (-1,1) for b in (-1,1))
    return [('board',plate.cut(standoff_holes)),
            ('black',box(x*0.21,y*0.36,1.5,(0,0,1.55))),
            ('steel',compound(box(4,3,3,(a*(x/2-3.2),y*0.27,2.3)) for a in (-1,1))),
            ('gold',compound(box(1,1.5,0.45,((i+0.5-n/2)*x/(n+1),-y*0.35,1)) for i in range(n)))]

def driver():
    heatsink = [box(14,16,1.5,(0,0,2.0))]
    heatsink += [box(1,16,3.4,(x,0,4.25)) for x in (-5,-2.5,0,2.5,5)]
    return pcb(22,27) + [('plate',compound(heatsink))]

def tachometer():
    return [('frame',box(11,8,11,(0,0,-2.5))),('sensor',box(6,3,4,(0,4.5,0))),
            ('steel',ring(6,D.shaft_diameter/2,2.2,(0,14,0))),('gold',box(1.8,1.8,1.4,(0,14,6.3)))]

def probe():
    return [('gold',cyl(2.4,4.5,(0,0,0),'z')),('rubber',cyl(1.35,2.75,(0,0,3.5),'z'))]

def stop():
    return [('frame',box(25,21,16,(0,0,-10))),('amber',cyl(10,2,(0,0,-1),'z')),
            ('red',Part.makeCone(8.4,9.5,5,V()))]

def supply():
    vents = compound(box(2,21,3,(i*5.2-23,0,10.7)) for i in range(9))
    shell = box(54,32,20).cut(box(51,29,21,(0,0,1.25)))
    return [('cast',shell),('plate',box(55,32.5,2,(0,0,10.5)).cut(vents)),
            ('black',box(7,22,8,(22,0,4))),('gold',compound(cyl(1.6,1,(24,y,8.5),'z') for y in (-6,0,6)))]

def fuse():
    return [('frame',box(19,19,16,(0,0,-3))),('blue',box(10,10,1.7,(0,0,5.8))),
            ('steel',box(3,8,2,(0,0,7.4)))]

def interlock():
    return [('frame',box(13,7,8)),('amber',box(5,4,3,(0,4.5,2.5))),('steel',box(2,8,1,(4,0,4.5)))]

def enclosure():
    base = box(87,40,14.5,(0,0,1.25)).cut(box(83,36,14.5,(0,0,3.75)))
    vents = compound(box(2,5,3,(i*6.8-34,-20,4.5)) for i in range(11))
    glands = compound(cyl(2.6,4,(43, y, 2)) for y in (-11,0,11))
    return [('frame',base.cut(vents).cut(glands)),('glass',box(84,37,1.1,(0,0,17.5))),
            ('plate',box(87,6,2,(0,17,17.5)))]

def harness():
    routes = [
        ('black',2.0,[(-73,-68,9),(-86,-65,10),(-96,-52,10),(-105,-27,12),(-123,-22,30),(-123,-9,78)]),
        ('gold',0.85,[(-74,-65,12),(-86,-63,12),(-96,-50,12),(-103,-26,14),(-121,-20,31),(-121,-9,78)]),
        ('blue',1.1,[(-10,-67,11),(22,-65,9),(44,-52,11),(50,-27,16),(57,-22,45),(53,-20,66),(48,-18,76)]),
        ('black',1.4,[(-37,-62,7),(-25,-58,8),(-13,-58,8),(24,-65,8),(84,-67,12),(116,-48,11),(116,-28,29)]),
        ('amber',0.85,[(-120,-72,7),(-130,-59,9),(-133,-19,9),(-134,34,9),(-129,65,10)]),
    ]
    return [(name,cable(points,r)) for name,r,points in routes]

def torque():
    return [('blue',ring(9,D.shaft_diameter/2,8)),('steel',ring(10,D.shaft_diameter/2,1.2,(4.6,0,0)))]
