"""Local OpenCascade solid builders."""
import FreeCAD as App
import Part

V = App.Vector

def box(x, y, z, at=(0, 0, 0)):
    a, b, c = at
    return Part.makeBox(x, y, z, V(a-x/2, b-y/2, c-z/2))

def cyl(r, length, at=(0,0,0), axis='x'):
    a, b, c = at
    if axis == 'x':
        return Part.makeCylinder(r, length, V(a-length/2,b,c), V(1,0,0))
    return Part.makeCylinder(r, length, V(a,b,c-length/2))

def ring(ro, ri, length, at=(0,0,0), axis='x'):
    return cyl(ro,length,at,axis).cut(cyl(ri,length+0.2,at,axis))

def prism(coords, depth, z=0):
    points = [V(x,y,z-depth/2) for x,y in coords]
    return Part.Face(Part.makePolygon(points+[points[0]])).extrude(V(0,0,depth))

def compound(shapes):
    return Part.makeCompound(list(shapes))

def along_x(shape, angle):
    return shape.rotated(V(),V(1,0,0),angle)

def cable(points, radius):
    # Capsules joined at the control vertices give positive-volume, closed conductors.
    vertices = [V(*point) for point in points]
    sections = [Part.makeSphere(radius, vertex) for vertex in vertices]
    for a,b in zip(vertices, vertices[1:]):
        direction = b-a
        sections.append(Part.makeCylinder(radius,direction.Length,a,direction))
    return sections[0].multiFuse(sections[1:]).removeSplitter()

def beveled_rect(a, b, c=4):
    return [(-a,-b+c),(-a+c,-b),(a-c,-b),(a,-b+c),(a,b-c),(a-c,b),(-a+c,b),(-a,b-c)]

def flange(y, z, length, bore, x=0, drill=False):
    slab = prism(beveled_rect(z/2,y/2,3),length).rotated(V(),V(0,1,0),90).translated(V(x,0,0))
    cutters = [cyl(bore,length+1,(x,0,0))]
    if drill:
        cutters += [cyl(1.45,length+1,(x,sy*(y/2-4.5),sz*(z/2-4.5))) for sy in (-1,1) for sz in (-1,1)]
    return slab.cut(compound(cutters))
