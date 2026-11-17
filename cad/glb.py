"""Export OpenCascade tessellations as GLB with canonical node identifiers."""
import json
import math
import struct
from .materials import MATERIALS

def vector(value):
    # Millimetres Z-up to metres Y-up, with a right-handed basis.
    x,y,z = value
    return (x/1000,z/1000,-y/1000)

def write_glb(path, components, placements, fraction=0):
    data = bytearray()
    document = {'asset':{'version':'2.0','generator':'FreeCAD/OpenCascade encabulator tessellation'},'scene':0,
                'scenes':[{'nodes':[]}], 'nodes':[], 'meshes':[], 'materials':[],
                'bufferViews':[], 'accessors':[], 'buffers':[]}
    for title, rgb, metal, rough, alpha, _ in MATERIALS.values():
        document['materials'].append({'name':title, 'pbrMetallicRoughness':{
            'baseColorFactor':[*rgb,alpha], 'metallicFactor':metal,'roughnessFactor':rough},
            **({'alphaMode':'BLEND','doubleSided':True} if alpha<1 else {})})
    def store(rows, type, component, format, target):
        start = len(data)
        for row in rows:
            data.extend(struct.pack('<'+format, *row))
        length = len(data)-start
        data.extend(bytes(-length%4))
        views = document['bufferViews']
        views.append(dict(buffer=0,byteOffset=start,byteLength=length,target=target))
        index = len(document['accessors'])
        acc = dict(bufferView=len(views)-1,componentType=component,count=len(rows),type=type)
        if type=='VEC3':
            acc.update(min=[min(row[i] for row in rows) for i in range(3)],max=[max(row[i] for row in rows) for i in range(3)])
        document['accessors'].append(acc)
        return index
    mesh_index = {}
    for id,pieces in components.items():
        primitives = []
        finishes = {}
        for finish,shape in pieces:
            finishes.setdefault(finish,[]).append(shape)
        for finish,shapes in finishes.items():
            coords, triangles = [], []
            for shape in shapes:
                for face in shape.Faces:
                    points, faces = face.tessellate(0.11)
                    base = len(coords)
                    coords.extend(vector(tuple(p)) for p in points)
                    triangles.extend((base+i,) for face in faces for i in face)
            if not coords or not triangles:
                continue
            if len(coords) > 50_000:
                import MeshPart
                coords, triangles = [], []
                for shape in shapes:
                    vertices, faces = MeshPart.meshFromShape(Shape=shape, LinearDeflection=.22,
                                                             AngularDeflection=.23, Relative=False).Topology
                    base = len(coords)
                    coords.extend(vector(tuple(p)) for p in vertices)
                    triangles.extend((base + i,) for face in faces for i in face)
            positions = store(coords,'VEC3',5126,'fff',34962)
            indices = store(triangles,'SCALAR',5123,'H',34963) if len(coords) < 65_536 else store(triangles,'SCALAR',5125,'I',34963)
            primitives.append(dict(attributes={'POSITION':positions},indices=indices,
                                   material=list(MATERIALS).index(finish),extras={'finish':finish}))
        mesh_index[id] = len(document['meshes'])
        document['meshes'].append(dict(name=id,primitives=primitives))
    for row in placements:
        part = row['partId']
        node = dict(name=row['key'],mesh=mesh_index[part],extras={'partId':part},
                    translation=vector(a+fraction*b for a,b in zip(row['origin'],row['offset'])),
                    rotation=[math.sin(row['rotation']/2),0,0,math.cos(row['rotation']/2)])
        document['scenes'][0]['nodes'].append(len(document['nodes']))
        document['nodes'].append(node)
    document['buffers'].append(dict(byteLength=len(data)))
    header = json.dumps(document,separators=(',',':')).encode()
    header += b' '*(-len(header)%4)
    size = 28+len(header)+len(data)
    path.write_bytes(struct.pack('<4sIIII',b'glTF',2,size,len(header),0x4e4f534a)+header+
                     struct.pack('<II',len(data),0x004e4942)+data)
