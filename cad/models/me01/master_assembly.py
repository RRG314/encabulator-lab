"""Local B-rep geometry and physically distinct Metachronic equipment stations."""
from dataclasses import dataclass
import math
import Part
from cad.components.primitives import V, along_x, box, cable, compound, cyl, prism, ring
from cad.shared.details import chamfered, bore_grid, hexhead, strip, terminal, xplate
from cad.parameters import ROOT
from .parameters import D

BASE_GROUPS=[
 'Transpanendermic Flux Rectifier','Ambilateral Spurving Compensator','Recursive Marzelvane Phasing Array',
 'Isogonal Waneshaft Precession Regulator','Polyphase Unilateral Detractor','Differential Girdle Harmonic Attenuator',
 'Quadrature Panametric Induction Fan','Cardinal Gram-Meter Array','Panendermic Semi-Boloid Stator',
 'Non-Reversible Tremie Regulator','Transverse Fumbling Suppression Matrix','Recursive Deltoid Synchronizer',
 'Panametric Supervisory Controller','Logarithmic Casing and Structural System',
]
FAMILIES=[]
for line in (ROOT/'data/me01/families.tsv').read_text().splitlines():
    part,name,kind,domain,purpose,eq,variables,uri,failure=line.split('|')
    FAMILIES.append(dict(number=int(part),name=name,kind=kind,domain=domain,purpose=purpose,
                         equation=eq,variables=variables,interface=uri,failure=failure))

@dataclass
class PartRecord:
    number:int
    group:int
    name:str
    purpose:str
    material:str | None
    tool:str
    finish_parts:list
    stations:list
    host:int | None
    interface:str
    failure:str
    equation:str=''
    variables:str=''

    @property
    def id(self): return f'ME-{self.number:03}'

def at(x,y,z): return [((x,y,z),0.)]

def chassis(width,height,depth):
    shell=chamfered(width,height,depth,chamfer=3).cut(box(width-5,height-5,depth+1,(0,0,2.5)))
    fins=[box(2.1,height-9,4,(x,0,depth/2+1.5)) for x in range(-int(width/2)+6,int(width/2)-4,6)]
    return [('cast',shell),('steel',chamfered(width-2,height-2,2,(0,0,depth/2+1),2)),strip('frame',fins)]

def block_fluid(x,y,z,bore):
    core=chamfered(x,y,z,chamfer=3).cut(cyl(bore,x+3))
    boss=[ring(bore+3,bore,5,(sgn*(x/2+2.5),0,0)) for sgn in (-1,1)]
    ports=[ring(3,1.1,8,(a,0,z/2+3),'z') for a in (-x/4,x/4)]
    return [('gold',core),strip('steel',boss),strip('plate',ports)]

def winding_path(radius,length,turns):
    curve=Part.BSplineCurve()
    points=[V(-length/2+length*i/72,radius*math.cos(i*math.tau*turns/72),radius*math.sin(i*math.tau*turns/72)) for i in range(73)]
    curve.interpolate(points)
    path=Part.Wire([curve.toShape()])
    cross=Part.Wire([Part.makeCircle(.65,points[0],curve.tangent(curve.FirstParameter)[0])])
    return path.makePipeShell([cross],True,False)

def records(d=D):
    h=d.shaft_z
    r=d.shaft_diameter/2
    j1=-112
    j2=j1+d.journal_span
    records=[]
    def put(n,g,name,purpose,finish,at,host,interface,failure,tool='4 mm hex key · candidate cover hardware',eq='',vars=''):
        material='Coated steel, aluminum and functional inserts · schematic finish assignment' if finish else None
        records.append(PartRecord(n,g,name,purpose,material,tool,finish,at,host,interface,failure,eq,vars))
    bed=bore_grid(chamfered(d.length,d.width,d.plate,chamfer=14),
                  [(x,y,0) for x in (-285,-215,-110,0,110,215,285) for y in (-187,187,-59,59)],3.4,d.plate+3)
    put(1,14,'Amulite ribbed foundation','Mounting bed carries orthogonal datum rails and separable coolant and signal circuits.',
        [('plate',bed),strip('cast',[box(d.length-34,3,4,(0,y,-4)) for y in (-d.width/2+4,d.width/2-4)])],
        at(0,0,-d.plate/2),None,'Z = 0 datum','Deck sag or datum damage','6 mm hex key · candidate bed screws')
    rail=bore_grid(chamfered(d.length-43,27,14,chamfer=3),[(x,0,0) for x in range(-260,261,52)],3.2,18)
    put(2,14,'Machined bed channels','Paired longitudinal steel rails carry sliding pedestals and the drive bracket.',
        [('cast',rail),strip('steel',[box(d.length-45,2,1.4,(0,y,7)) for y in (-10,10)])],
        [((0,-59,7),0),((0,59,7),0)],1,'bed kinematic clamp','Axial movement or preload loss')
    side=xplate(170,166,5,d.cover_radius,[(-74,-74),(-74,74),(74,-74),(74,74)])
    put(3,14,'Logarithmic rotor containment frame','Machined end flanges, triangulated corner rails and stand-offs span the six-vane rotor.',
        [strip('cast',[side.translated(V(x,0,0)) for x in (-53,53)]+[box(109,5,5,(0,y,z)) for y in (-79,79) for z in (-79,79)]),
         strip('plate',[chamfered(24,18,14,(x,y,-99),2) for x in (-53,53) for y in (-75,75)])],
        at(-48,0,h),1,'flanged guard perimeter','Fragment containment qualification outstanding','5 mm hex key · candidate guard fasteners')
    door=box(104,4,d.cover_width-10).cut(box(87,7,d.cover_width-33))
    put(4,14,'Removable guard window and roof','Framed observation panels provide indexed visual access and independent guarded opening.',
        [('plate',door),('glass',box(86,2.4,d.cover_width-34)),
         strip('steel',[cyl(2.8,20,(-47,-3,z),'z') for z in (-52,52)]),('cast',box(12,9,5,(43,-6,0)))],
        at(-48,-82,h),3,'hinge and latch interface','Warped panel or failed latch')
    shaft=cyl(r,d.primary_length).fuse(cyl(r+2,62,(52,0,0)))
    put(5,4,'Primary isogonal waneshaft','Shouldered primary shaft transfers electromagnetic torque through the first rotor and axial coupling.',
        [('steel',shaft)],at(-100,0,h),7,'primary journals','Shaft fatigue or combined-load deflection','Dial indicator · journal setup','J₁ ω̇₁ = τm − τc − τloss', 'J [kg·m²], torque [N·m], ω [rad/s]')
    put(6,4,'Secondary concentric torque sleeve','Annular output sleeve runs on the shared axis and allows a small compliant phase offset.',
        [('plate',ring(d.secondary_diameter/2,r+.28,d.secondary_length)),('cast',ring(d.secondary_diameter/2+1.6,r+.28,9,(37,0,0)))],
        at(132,0,h),8,'secondary bearing bore','Bore interference or torsional failure','Bore gauge · nominal sleeve fit')
    for n,station,bore in [(7,j1,r),(8,j2,d.secondary_diameter/2)]:
        R=d.bearing_outer/2
        put(n,2,'Primary spurving bearing' if n==7 else 'Secondary spurving bearing',
            'Separated inner, outer and seal rings form a preliminary coaxial journal cartridge.',
            [('steel',ring(R,R-2.4,d.bearing_width)),('steel',ring(bore+1.9,bore,d.bearing_width)),
             ('rubber',ring(R-2.4,bore+1.9,.5,(d.bearing_width/2-.4,0,0)))],
            at(station,0,h),15,'radial bearing bore','Spall, preload loss or overheating','Bearing puller · provisional envelope')
    outer=ring(49,42,d.motor_length)
    outer=outer.cut(box(d.motor_length+1,78,40,(0,0,42)))
    put(9,9,'Finned polyphase drive barrel','Open inspection sector exposes the actual stator slots and winding pack. Radial fins provide surface area.',
        [('blue',outer),strip('blue',[along_x(box(d.motor_length-12,2.4,7,(0,0,49)),angle) for angle in range(60,305,15)]),
         strip('plate',[ring(43,16,5,(x,0,0)) for x in (-d.motor_length/2-3,d.motor_length/2+3)]),
         strip('cast',[chamfered(d.motor_length,16,18,(0,y,-51),3) for y in (-30,30)])],
        at(d.motor_x,0,h),2,'motor shoe and spline envelope','Mount migration or winding temperature excursion')
    slot=[along_x(box(62,4.7,8,(0,0,29)),i*20) for i in range(18)]
    put(10,9,'Panendermic semi-boloid stator','Eighteen indexed radial slot cuts preserve an annular magnetic return path.',
        [('cast',ring(41,25,57).cut(compound(slot))),strip('plate',[ring(40,36,.6,(x,0,0)) for x in range(-25,26,10)])],
        at(d.motor_x,0,h),9,'motor lamination shoulder','Insulation failure or slot fouling')
    copper=[along_x(box(59,2.8,4,(0,0,29)),i*20) for i in range(18)]
    copper.extend(along_x(ring(3,1.3,2,(x,0,29)),i*20) for x in (-30.5,30.5) for i in range(18))
    put(11,9,'Lotus-o-deltoid polyphase winding','Grouped copper slot bars and end turns provide explicit phase-path volume and a terminal boundary.',
        [strip('gold',copper),('black',chamfered(22,12,9,(-10,-36,34),2))],
        at(d.motor_x,0,h),10,'winding power and cooling','Interturn fault or insulation creep','Four-wire milliohm meter')
    root=d.vane_root
    hub=ring(root,r+2,58)
    for i in range(6): hub=hub.cut(along_x(box(46,9,4,(0,0,root-1)),i*60))
    put(12,3,'Marzelvane differential carrier','Six indexed root sockets and ring keepers locate variable-pitch blade pivots.',
        [('steel',hub),strip('plate',[ring(root+1.8,r+2,2.4,(x,0,0)) for x in (-30,30)])],
        at(-48,0,h),5,'carrier shaft fit','Fretting or pitch indexing error')
    blade=prism([(-d.vane_chord/2,-2.8),(-23,-3.6),(21,-2.6),(d.vane_chord/2,.1),(20,3.2),(-22,3.0)],
                d.vane_radius-root,(d.vane_radius-root)/2).rotated(V(),V(0,0,1),d.vane_pitch)
    vane_sites=[((-48,-root*math.sin(i*math.pi/3),h+root*math.cos(i*math.pi/3)),i*math.pi/3) for i in range(6)]
    put(13,3,'Recursive hydrocoptic marzelvane','Indexed radial blade. Root pin establishes the local pitch axis and a trim actuator monitors deviation.',
        [('gold',blade),('cast',chamfered(46,8,3,(0,0,-1.5),.8)),('steel',cyl(3.0,4,(0,0,-3),'z')),
         strip('plate',[hexhead(2.7,1,(x,0,-.05),1.1) for x in (-18,18)])],vane_sites,12,'radial blade pivot','Root fatigue or angle runaway','3 mm hex key · candidate keeper','τa = k(β) ω²','Pitch β [rad], τa [N·m], ω [rad/s]')
    put(14,3,'Indexed vane actuator ring','Six separate actuator pods, linkage studs and rotor-side sensing pass through a common hub interface.',
        [strip('frame',[along_x(chamfered(17,10,8,(0,0,19),1),a) for a in range(0,360,60)]),
         strip('steel',[along_x(box(26,2.25,2.8,(5,0,23)),a) for a in range(0,360,60)])],
        at(-67,0,h),12,'pitch command and index feedback','Actuator jam or loss of position datum')
    stand=xplate(67,67,20,d.bearing_outer/2+.06,[(-26,-27),(-26,27),(26,-27),(26,27)])
    put(15,2,'Ambilateral orthogonal bearing pedestal','Two pedestal cartridges locate journal outer rings. Opposed actuator mounts establish Y and Z force axes.',
        [('cast',stand),('cast',chamfered(27,43,72,(0,0,-56),2)),('plate',chamfered(43,124,8,(0,0,-89),2)),
         strip('gold',[along_x(box(25,13,8,(0,0,34)),i*90) for i in range(4)])],
        [((j1,0,h),0),((j2,0,h),0)],2,'orthogonal actuator reaction and pickup','Axis error or force saturation','5 mm hex key · candidate pedestal shims')
    put(16,6,'Differential girdle coupling hub pair','Opposed annular hub sections transfer torque and bound relative orientation.',
        [strip('steel',[ring(29,r+.3,8,(x,0,0)) for x in (-d.coupling_length/2,d.coupling_length/2)]),
         strip('plate',[cyl(2.6,d.coupling_length+2,(0,y,12)) for y in (-18,18)])],
        at(25,0,h),6,'coaxial torque path','Stop impact or clamp migration','5 mm hex key · candidate hub clamp','τc=kθ Δθ + cθ Δω','kθ [N·m/rad], cθ [N·m·s/rad]')
    put(17,6,'Harmonic attenuation inserts','Eight discrete elastomer sections provide compliant torsional reaction between the hubs.',
        [strip('amber',[along_x(chamfered(12,6,7,(0,0,22),1),i*45) for i in range(8)]),('cast',ring(26,23,3))],
        at(25,0,h),16,'parallel torsional damper','Elastomer creep or crack')
    fr=d.fan_diameter/2
    fan=prism([(11,-4),(22,-8),(fr-4,-6),(fr-1,1),(fr-5,7),(15,5)],2.2).rotated(V(),V(0,1,0),90)
    put(18,7,'Quadrature Panametric impeller','Independent nine-blade cooling fan stage has nominal housing clearance and a tachometer interface.',
        [('cast',cyl(12,14)),strip('blue',[along_x(fan,i*40) for i in range(9)])],
        at(d.fan_x,0,h),19,'fan demand and heat transfer','Fan stall or blade crack','3 mm hex key · candidate fan hub')
    put(19,7,'Panametric bellmouth and protective grille','Independent vented fan shroud, end flange and multiple concentric grille rings.',
        [('cast',ring(fr+7,fr+2,39)),('plate',xplate(101,101,5,fr+2,[(-43,-43),(-43,43),(43,-43),(43,43)]).translated(V(20,0,0))),
         strip('steel',[ring(i,i-1,1.5,(23,0,0)) for i in range(9,39,5)])],
        at(d.fan_x,0,h),2,'fan tray and exhaust duct','Grille obstruction or guard damage')
    put(20,1,'Transpanendermic distribution header','Hollow brass chamber receives separated branch returns. Pressure taps constrain the model hydraulic energy balance.',
        block_fluid(88,33,27,7),at(-220,-131,34),1,'coolant split & return','Manifold leakage or stuck restriction','17 mm spanner · candidate union flats','Qin = Σ Qj','Q [m³/s]')
    put(21,10,'Non-reversible Tremie regulator','Serviceable poppet and bypass body limits reverse flow and defines the regulated pressure boundary.',
        block_fluid(46,32,25,7)+[('plate',cyl(4.2,7,(0,0,0)))],at(-67,-133,34),20,'one-direction pressure path','Reverse leakage or occluded seat','19 mm spanner · candidate plug')
    put(22,1,'Primary thermal exchange core','Finned heat exchanger places the fluid temperature field downstream of the motor-loss boundary.',
        chassis(80,63,23)+[('gold',ring(8,5,86,(0,-19,0))),('gold',ring(8,5,86,(0,19,0)))],
        at(130,-142,36),20,'heat removal loop','Fouling or runaway temperature')
    put(23,5,'Polyphase regenerative controller','Finned electronics case supports a wide-area thermal interface and isolated command terminals.',
        chassis(88,58,25)+terminal(8,5.5,13),at(-230,149,40),24,'motor torque and signed DC power','Overvoltage or current saturation')
    put(24,5,'DC-link energy storage enclosure','Two distinct capacitor cans and a current shunt reference stored bus energy.',
        [('cast',chamfered(69,46,7,chamfer=3)),strip('steel',[cyl(14,43,(x,0,25),'z') for x in (-18,18)]),
         strip('blue',[cyl(11,1,(x,0,47),'z') for x in (-18,18)]),*terminal(5,4.8,9)],
        at(-137,149,20),28,'bounded regeneration storage','Voltage window exceeded','Insulated driver · terminal size open')
    put(25,8,'Cardinal gram-meter timing assembly','Timestamped speed, current and pressure acquisition with individually serviceable terminal channels.',
        chassis(65,52,28)+terminal(7,5,13),at(-53,149,39),28,'synchronized samples to ME-059','Stale clock or dropout')
    put(26,11,'Transverse suppression processor','Physical processor board evaluates two-axis shaft feedback and sends bounded radial force commands.',
        [('board',chamfered(53,49,2,chamfer=2)),('cast',chamfered(24,19,9,(0,0,5),2)),*terminal(7,4.8,11)],
        at(12,149,36),25,'lateral displacement and actuator current','Lost modal discrimination')
    put(27,12,'Recursive Deltoid synchronization module','Constrained phase controller sends signed speed and coupling requests through isolated I/O.',
        chassis(62,51,21)+terminal(6,5,10),at(75,149,40),26,'phase measurement and drive request','Oscillation or uncertain phase')
    cabinet=box(144,61,164).cut(box(137,61,157,(0,-3,0)))
    put(28,13,'Panametric supervisory and interlock rack','Vertical card rack with control slices, air vents and protected wiring glands.',
        [('cast',cabinet),strip('blue',[chamfered(13,21,55,(i*15,-15,31),2) for i in range(-4,5)]),
         strip('steel',[box(136,3,7,(0,-20,z)) for z in (-49,15,55)]),
         strip('plate',[ring(5,2.6,2,(i*16,0,-80),'z') for i in range(-3,4)])],
        at(223,158,100),1,'supervisory PLC and independent inhibit','Interlock failure or stale data')
    routes=[([(-230,129,50),(-233,106,35),(-230,61,33),(-222,39,78),(-219,35,136)],'black'),
            ([(221,130,46),(160,103,30),(60,116,29),(-54,129,40)],'blue'),
            ([(-215,-118,34),(-177,-105,35),(-84,-133,34),(-67,-133,34)],'gold'),
            ([(-41,-133,34),(18,-106,35),(61,-106,35),(100,-129,37)],'gold')]
    put(29,8,'Field harness and coolant interconnect','Separate pipe, power and sensing routes connect mechanical station interfaces.',
        [(finish,cable(points,2.4)) for points,finish in routes],at(0,0,0),25,'field cable and thermal return','Chafe or coolant leak','Multimeter · continuity and isolation')
    put(30,4,'Concentric output dynamics load','Instrumented annular load sleeve forms the external simulated host interface.',
        [('cast',ring(38,d.secondary_diameter/2,38)),strip('plate',[ring(41,d.secondary_diameter/2,3,(x,0,0)) for x in (-20,20)]),
         strip('frame',[along_x(box(27,4,4,(0,0,38.7)),a) for a in range(0,360,45)])],
        at(206,0,h),6,'host torque attachment','Excessive thermal or torque demand')
    put(31,14,'Upper enclosure inspection cassette','Transparent section seats in a narrow frame and keeps the vane path visible in the assembled position.',
        [('plate',box(106,d.cover_width,4).cut(box(90,d.cover_width-19,6))),('glass',box(89,d.cover_width-20,2)),
         strip('steel',[hexhead(2.4,2,(x,y,2.9),1) for x in (-48,48) for y in (-74,74)])],
        at(-48,0,h+82),3,'top cover removability','Window crazing or loose fasteners')
    # Independent physical reference stations on the front, rear and shaft datums.
    physical={
      40:([('cast',xplate(67,67,30,16,[(-27,-27),(-27,27),(27,-27),(27,27)])),
            strip('gold',[along_x(ring(9,3.6,9).rotated(V(),V(0,1,0),90).translated(V(0,0,18)),a) for a in range(0,360,90)]),
            strip('steel',[along_x(box(32,8,5,(0,0,15)),a) for a in range(0,360,90)])],(80,-145,43),15),
      41:(block_fluid(58,30,25,6)+[('blue',xplate(36,39,6,8).translated(V(8,0,0))),('gold',box(27,6,3,(0,10,14)))],(-140,-134,36),20),
      42:([('plate',chamfered(93,30,4,chamfer=2)),strip('steel',[chamfered(7,19,12,(i*9,0,7),1.1) for i in range(-4,5)]),
            strip('blue',[box(8,2,3,(i*9+4,0,10)) for i in range(-4,4)]),('gold',box(7,17,1,(0,0,13)))],
           (-141,80,40),26),
      43:([('plate',chamfered(34,31,5,chamfer=3)),('glass',ring(12,9,38,(0,0,22),'z')),('cast',cyl(11,3,(0,0,42),'z')),
            ('gold',ring(15,12,12,(0,0,26),'z')),('blue',chamfered(9,20,5,(12,0,49),1.2))],(-6,-149,36),41),
      44:([('cast',chamfered(78,29,4,chamfer=2)),('plate',box(65,13,3,(0,0,14))),
            strip('blue',[cyl(9,16,(x,0,10),'z') for x in (-26,26)]),strip('gold',[cyl(4,5,(x,0,20),'z') for x in (-26,26)])],
           (10,76,34),26),
      46:([('steel',ring(34,26,12)),('plate',ring(24,19,13).rotated(V(),V(0,0,1),8)),
            strip('blue',[along_x(box(21,15,9,(0,0,34)),a) for a in range(0,360,90)])],(108,0,h),15),
      47:([('frame',ring(18,13,46)),('gold',winding_path(19,43,6)),
            strip('steel',[ring(22,16,3,(x,0,0)) for x in (-24,24)])],(57,70,59),40),
      49:([('plate',chamfered(57,45,5,chamfer=2)),strip('steel',[box(7,23,18,(x,0,12)) for x in (-22,0,22)]),
            strip('blue',[box(17,5,3,(x,y,12)) for x in (-11,11) for y in (-10,10)])],(130,79,40),26),
      52:([('gold',ring(29,23,14,axis='z')),('glass',ring(29,23,1.5,(0,0,8),'z')),
            strip('steel',[ring(5,2.8,12,(x,y,-2)) for x,y in [(-31,14),(30,-14)]])],(234,-138,38),20),
      58:([('steel',ring(31,16,13)),('rubber',ring(27,19,7,(1,0,0))),
            strip('plate',[along_x(box(12,4,6,(0,0,29)),a) for a in range(0,360,60)])],(83,0,h),46),
    }
    for index,f in enumerate(FAMILIES,15):
        n=f['number']
        if n in physical:
            solids,origin,host=physical[n]
            station=at(*origin)
        else:
            solids,station,host=[],[],28 if n in (45,53,54,60) else 26
        put(n,index,f['name'],f['purpose'],solids,station,host,f['interface'],f['failure'],
            '4 mm hex key · review joint fit' if solids else 'Trace recorder · replay the matching study',
            f['equation'],f['variables'])
    return records
