"""Generate annotated review sheets directly from the current B-rep."""
from html import escape
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import FreeCAD as App
import TechDraw
from ..components.primitives import V, compound
from ..parameters import ROOT, D
from ..te01_master_assembly import registry

VIEWS = [('TOP / XY',V(0,0,1)),('FRONT / XZ',V(0,-1,0)),('END / YZ',V(1,0,0)),('ISOMETRIC',V(0.58,-1,0.68))]
DETAIL_NOTES = {
    'TE-001': f'DATUM A  •  TOP PLANE Z = 0    /    FOOT DATUM PATTERN {2*D.foot_x:g} × {2*D.foot_y:g} mm',
    'TE-005': f'BORE INTERFACE  •  Ø{D.shaft_diameter:g} NOMINAL JOURNAL    /    AXIAL LOCATION AND FIT PENDING',
    'TE-007': f'BEARING ENVELOPE  •  Ø{D.bearing_outer:g} CANDIDATE    /    FIT AND COAXIALITY REQUIRE REVIEW',
    'TE-009': f'INDEX  •  60° REPEATED SIX TIMES    /    SCHEMATIC PITCH {D.vane_pitch:g}°',
    'TE-014': f'ROTOR APERTURE  •  Ø{2*D.guard_aperture:g} SCHEMATIC    /    CONTAINMENT DESIGN PENDING',
}

def plane_basis(direction):
    direction.normalize()
    right = V(0,0,1).cross(direction)
    if right.Length < 1e-6:
        right = V(1,0,0)
    right.normalize()
    up = direction.cross(right)
    return right, up, direction


def project_edges(solid, direction):
    right, up, _ = plane_basis(direction)
    points = []
    strokes = []
    for edge in solid.Edges:
        coords = [(p.dot(right),p.dot(up)) for p in edge.discretize(Deflection=0.075)]
        points.extend(coords)
        strokes.append('M'+' L'.join(f'{x:.3f} {-y:.3f}' for x,y in coords))
    x,y = zip(*points)
    metrics = (min(x),max(x),min(y),max(y))
    return metrics,'<path d="'+' '.join(strokes)+'" stroke="#203246" fill="none"/>'


def projected_silhouette(solid, direction):
    a,b,c = plane_basis(direction)
    matrix = App.Matrix()
    matrix.A11,matrix.A12,matrix.A13 = a.x,a.y,a.z
    matrix.A21,matrix.A22,matrix.A23 = b.x,b.y,b.z
    matrix.A31,matrix.A32,matrix.A33 = c.x,c.y,c.z
    local = solid.copy()
    local.transformShape(matrix,True)
    bound = TechDraw.project(local,V(0,0,1))[0].BoundBox
    return (bound.XMin,bound.XMax,bound.YMin,bound.YMax),TechDraw.projectToSVG(local,V(0,0,1))


def sheet(identifier, title, solid, note, material, model="TE-01", edge_only=False, revision="0.1", nominal=False):
    art = []
    b = solid.optimalBoundingBox(False,False)
    basis = 'Nominal CAD · Historical scale unverified' if nominal else 'Schematic reference'
    extents = [(b.XMin,b.XMax,b.YMin,b.YMax), (b.XMin,b.XMax,b.ZMin,b.ZMax), (b.YMin,b.YMax,b.ZMin,b.ZMax)]
    for i,(label,direction) in enumerate(VIEWS):
        x,y = 190+(i%2)*365,177+(i//2)*200
        projection = project_edges if edge_only or identifier.startswith('TE01-') or identifier=='TE-015' else projected_silhouette
        (xmin,xmax,ymin,ymax),svg = projection(solid,V(direction))
        if i < 3:
            xmin,xmax,ymin,ymax = extents[i]
        width,height = xmax-xmin,ymax-ymin
        scale = min(275/max(width,1),123/max(height,1))
        cx = x-scale*(xmin+xmax)/2
        cy = y+scale*(ymin+ymax)/2
        art.append(f'<text class="label" x="{x-160}" y="{y-88}">{label}</text>')
        art.append(f'<g transform="translate({cx} {cy}) scale({scale})">{svg}</g>')
        if i<3:
            left,right = x-width*scale/2,x+width*scale/2
            level = y+height*scale/2+11
            art.append(f'<path class="dim" d="M{left} {level-6}v12 M{right} {level-6}v12 M{left} {level}H{right}"/>'
                       f'<text text-anchor="middle" class="value" x="{x}" y="{level+14}">{width:.2f} mm REF</text>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 540">
<title>{escape(identifier)} {escape(title)} Engineering review drawing</title>
<style>
text{{fill:#182431;font:12px sans-serif}}.label{{font:700 11px monospace;fill:#263d52}}.value{{font:10px monospace;fill:#335b78}}.dim{{stroke:#466b86;stroke-width:0.8;fill:none}}g :is(path,circle,ellipse,line,polyline,polygon){{vector-effect:non-scaling-stroke;stroke-width:.65px}}
</style>
<rect width="760" height="540" fill="white"/>
<rect x="12" y="12" width="736" height="516" fill="none" stroke="#405a70"/>
<rect x="12" y="12" width="736" height="63" fill="#edf2f5" stroke="#405a70"/>
<text x="26" y="36" style="font-size:19px;font-weight:bold">{escape(identifier)} / {escape(title)}</text>
<text x="26" y="59">{model} · Revision {escape(revision)} · {basis} · Fabrication release pending</text>
<path d="M380 75V466 M12 278H748 M12 466H748" fill="none" stroke="#9daebc"/>
{''.join(art)}
<text x="26" y="483">{escape(note)}</text>
<text x="26" y="501">Reference envelope (X × Y × Z) {b.XLength:.2f} × {b.YLength:.2f} × {b.ZLength:.2f} mm · Views fit to sheet</text>
<text x="26" y="518">Material / {escape(material)} · Dimensional and geometric tolerances pending</text>
</svg>'''

def drawings(shapes, assembled, exploded):
    path = ROOT/'cad/drawings'
    records = registry()
    sheets = [('TE01-ASSEMBLY','Assembly',compound(assembled),'DATUM A  •  TOP BASEPLATE    /    SHAFT +X, UP +Z','Registry candidates'),
              ('TE01-EXPLODED','Exploded assembly',compound(exploded),'SERVICE RELATIONSHIP STUDY  •  SEPARATION OFFSETS ARE SCHEMATIC','Registry candidates')]
    for id in shapes:
        part = records[id]
        sheets.append((id,part['name'],compound(shape for _,shape in shapes[id]),DETAIL_NOTES.get(id,'GEOMETRIC REFERENCE  •  INTERFACE AND TOLERANCE RELEASE PENDING'),part['material'] or 'Selection pending'))
    for owner in ['ABA','SBA','HMA','DGS','PFA','LCA','CGM','UPD','CSC']:
        from ..te01_master_assembly import world_shapes
        selected = [shape for item,shape in world_shapes(shapes) if records[item['partId']]['assemblyId']==owner]
        if not selected:
            continue
        sheets.append((f'TE01-{owner}',f'{owner} Subassembly',compound(selected),'SUBASSEMBLY DATUMS AND MOUNTING INTERFACES SUBJECT TO REVIEW','Registry candidates'))
    published = ROOT/'public/models'
    published_sheets=published/'te01-drawings'
    published_sheets.mkdir(exist_ok=True)
    with ZipFile(published/'te01-drawings-svg.zip','w',ZIP_DEFLATED) as archive:
        for identifier,title,solid,note,material in sheets:
            file = Path(path/f'{identifier}.svg')
            contents=sheet(identifier,title,solid,note,material,edge_only=True)+'\n'
            file.write_text(contents)
            (published_sheets/file.name).write_text(contents)
            archive.write(file,file.name)
