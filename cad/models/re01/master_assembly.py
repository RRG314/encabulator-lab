"""RE-01 local solids and joint datums. Service metadata travels with each definition."""
from dataclasses import dataclass
import math
import Part
from cad.components.primitives import V, along_x, box, cable, compound, cyl, prism, ring
from cad.shared.details import bore_grid, chamfered, hexhead, strip, terminal, xplate
from .parameters import D

GROUPS = [
 ('Prefabulated Amulite Structural Assembly','Bed & mounts'),('Ambifacient Lunar Waneshaft Assembly','Waneshaft'),
 ('Hydrocoptic Marzelvane Assembly','Six-vane rotor'),('Spurving Bearing Assembly','Journal supports'),
 ('Panametric Fan and Fluid System','Cooling circuit'),('Logarithmic Casing','Guard & access'),
 ('Lotus-o-Deltoid Electrical Assembly','Winding & terminals'),('Panendermic Semi-Boloid Stator Assembly','Slotted stator'),
 ('Differential Girdle Spring','Torsional coupling'),('Cardinal Gram-Meter Instrumentation','Instrumentation'),
 ('Unilateral Phase Detractor','Phase acquisition'),('Drawn Reciprocating Dingle Arm','Crank-slider'),
 ('Non-Reversible Tremie Pipe','Check-valve loop'),('Industrial Motor and Drive','Motor & power'),
 ('Industrial Automation and Control','Control cabinet'),
]

@dataclass
class Record:
    number: int
    group: int
    name: str
    purpose: str
    material: str
    tool: str
    finish_parts: list
    stations: list
    host: int | None
    failure: str
    source: str | None = None
    kind: str = 'mechanical'

    @property
    def id(self):
        return f'RE-{self.number:03}'

def one(x,y,z): return [((x,y,z),0)]
def each(*positions): return [(p,0) for p in positions]

def records():
    rows=[]
    def add(n,g,name,purpose,material,tool,pieces,at,host,failure,source=None,kind='mechanical'):
        rows.append(Record(n,g,name,purpose,material,tool,pieces,at,host,failure,source,kind))
    J=D.journal_span/2
    H=D.axis_z
    rail_y=(-50,50)
    corner=[(x,y,0) for x in (-222,222) for y in (-157,157)]
    bed=bore_grid(chamfered(D.length,D.width,D.plate,chamfer=11),corner+[(x,y,0) for x in (-203,-117,-J,J,192) for y in rail_y],3.3,D.plate+4)
    add(1,1,'Prefabulated amulite baseplate','Machined foundation and common top-plane datum. Corner holes transfer load to resilient pads.','Generic aluminum plate','5 mm hex key · candidate M6 bed hardware',[('plate',bed),strip('cast',[box(450,1,2,(0,y,-2)) for y in (-175,175)])],one(0,0,-5),None,'Deck bending or joint slip','amulite')
    rail=bore_grid(box(427,25,14),[(x,y,0) for x in (-203,-117,-J,J,192) for y in (-7,7)],3.3,20)
    add(2,1,'Slotted support channel','Rail shoulders register the pedestal and drive footprints. Parallel rows allow adjustment before clamp-up.','Generic coated steel','5 mm hex key · candidate M6 rail hardware',[('cast',rail),strip('steel',[box(427,2,2,(0,y,7.8)) for y in (-7,7)])],each(*[(0,y,7) for y in rail_y]),1,'Rail bow or inadequate clamping')
    add(3,1,'Isolation foot and bonded insert','Elastomer body decouples the deck from the bench. The steel insert carries the bench attachment.','Elastomer and steel','13 mm spanner · candidate foot locknut',[('rubber', Part.makeCone(19,15,14,V(0,0,-7))),('steel',ring(11,3.4,2,(0,0,8),'z'))],each(*[(x,y,-18) for x,y,_ in corner]),1,'Compression set or uneven load')
    add(4,1,'Bed socket screw and washer','Representative socket fastener and load-spreading washer at deck and guard joints.','Steel, grade open','5 mm hex key · candidate M6 socket head',[('steel',hexhead(5.1,4,(0,0,2),2.4).fuse(cyl(2.9,9,(0,0,-3),'z'))),('plate',ring(6.4,3.05,1.1,(0,0,-.5),'z'))],each(*[(x,y,0) for x,y,_ in corner]),1,'Thread pullout or loss of preload')
    shaft=cyl(D.journal_d/2,280).fuse(cyl(8,122))
    add(5,2,'Ambifacient lunar waneshaft','Shouldered X-axis shaft transmits torque from the coupling to the rotor, with separate bearing journals.','Machined steel','Dial indicator · 0.01 mm graduation candidate',[('steel',shaft)],one(15,0,H),2,'Fatigue at shoulder or runout','waneshaft')
    add(6,2,'Waneshaft retaining collar','Split-style axial setting collar, shown with a radial clamp fastener.','Steel','3 mm hex key · candidate M4 clamp',[('steel',ring(11,6,6).cut(box(8,1.1,8,(0,0,9)))),('cast',cyl(2,4,(0,0,10),'z'))],each((-94,0,H),(96,0,H)),5,'Axial creep or clamp loosening')
    hub=ring(D.rotor_root,8,52)
    for i in range(6):
        hub=hub.cut(along_x(box(47,9,4,(0,0,D.rotor_root-1)),60*i))
    add(7,3,'Indexed marzelvane carrier','Six milled root pockets locate the radial blade pattern. Machined end rings carry the keeper hardware.','Generic aluminum billet','4 mm hex key · candidate M5 keeper screw',[('steel',hub),strip('plate',[ring(24,8,2,(x,0,0)) for x in (-26,26)])],one(0,0,H),5,'Fretting, imbalance or hub slip','marzlevanes')
    profile=[(-D.blade_chord/2,-2),(-D.blade_chord/2+3,-3),(19,-2),(26,0),(21,3),(-22,2.5)]
    blade=prism(profile,D.rotor_tip-D.rotor_root,(D.rotor_tip-D.rotor_root)/2).rotated(V(),V(0,0,1),D.blade_pitch_deg)
    root=bore_grid(chamfered(45,8,3,(0,0,-1.5),1),[(x,0,-1.5) for x in (-15,15)],2,5)
    add(8,3,'Hydrocoptic marzelvane','Six pitched blades move room-temperature air through the guarded stage. Root tabs locate against the carrier pockets.','Generic aluminum billet','3 mm hex key · candidate M4 blade keeper',[('gold',blade),('steel',root),strip('cast',[hexhead(2.8,1,(x,0,0.5),1.4) for x in (-15,15)])],[((0,-D.rotor_root*math.sin(i*math.pi/3),H+D.rotor_root*math.cos(i*math.pi/3)),i*math.pi/3) for i in range(6)],7,'Root fatigue or loss of retention','marzlevanes')
    add(9,3,'Rotor balance and keeper ring','Perforated face ring provides controlled correction locations and a removable axial keeper.','Aluminum and steel','4 mm hex key · candidate M5 ring screws',[('plate',bore_grid(ring(25,10,3),[(0,20*math.cos(i*math.pi/4),20*math.sin(i*math.pi/4)) for i in range(8)],1.7,5,'x'))],each((-31,0,H),(31,0,H)),7,'Keeper migration or incorrectly matched balance correction')
    B=D.bearing_outer/2
    add(10,4,'Spurving bearing cartridge','Two sealed radial ball bearing envelopes at the nominal 12 mm journals. The candidate envelope is 12 × 28 × 8 mm.','Bearing steel and seal elastomer','Bearing puller · Ø28 mm envelope',[('steel',ring(B,B-2,D.bearing_width)),('steel',ring(7.6,6,D.bearing_width)),strip('rubber',[ring(B-2,7.6,.55,(x,0,0)) for x in (-3.45,3.45)])],each((-J,0,H),(J,0,H)),5,'Contamination, spalling or overheated fit','bearings')
    main_ped=xplate(47,45,18,B+.07,[(-16,-15),(-16,15),(16,-15),(16,15)])
    riser=chamfered(22,34,48,(0,0,-45),3)
    add(11,4,'Line-bored pedestal and adjustment shoe','Split service carrier supports the bearing outer ring. Side gussets and a broad shoe transfer the load to the base.','Ductile iron candidate','6 mm hex key · candidate M8 pedestal hardware',[('cast',main_ped.fuse(riser)),('plate',bore_grid(box(40,83,9,(0,0,-66)),[(x,y,-66) for x in (-12,12) for y in (-31,31)],4.2,12)),
         strip('cast',[prism([(-22,-20),(22,-20),(16,20),(-16,20)],4).rotated(V(),V(1,0,0),90).translated(V(0,y,-46)) for y in (-17.5,17.5)])],each((-J,0,H),(J,0,H)),2,'Bore skew or pedestal flexure')
    add(12,4,'Journal cap and labyrinth shoulder','Separate annular cover shields the journal seal and locates its service face.','Generic steel','4 mm hex key · candidate M5 end cap',[('plate',ring(20,7.8,3)),('cast',ring(13.9,9,2,(2.4,0,0)))],each((-J-11,0,H),(J+11,0,H)),11,'Seal drag or contaminated running gap')
    fan_blade=prism([(10,-3),(23,-8),(31,-5),(34,1),(26,6),(12,4)],2).rotated(V(),V(0,1,0),90)
    add(13,5,'Panametric fan impeller','Independent fan impeller draws cooling air through the filter and exhaust cylinder.','Aluminum and molded polymer','3 mm hex key · candidate hub fixing',[('cast',cyl(10,20)),strip('blue',[along_x(fan_blade,i*360/9) for i in range(9)])],one(D.fan_x,0,H),14,'Impeller rubbing or fan stall','fan')
    add(14,5,'Fan shroud and slotted grille','Circular bellmouth and bolted frame provide inspection access. Concentric grille rings block direct access.','Coated aluminum and steel','4 mm hex key · candidate M5 grille screws',[('cast',ring(42,36,40)),('plate',xplate(94,94,5,36,[(-39,-39),(-39,39),(39,-39),(39,39)]).translated(V(20,0,0))),strip('steel',[ring(r,r-1,1.4,(23,0,0)) for r in range(8,37,5)]+[along_x(box(1.6,74,1.7,(23,0,0)),a) for a in (0,60,120)])],one(D.fan_x,0,H),15,'Guard fatigue or restricted inlet')
    add(15,5,'Service filter cassette','Replaceable pleated medium and slotted face distribute flow to the intake opening.','Stainless frame and filter media','PH2 screwdriver · candidate quarter-turn retainer',[('cast',xplate(89,89,12,34)),strip('steel',[box(1.2,1.1,57,(0,i*5,0)) for i in range(-5,6)])],one(202,0,H),1,'Filter blockage or bypass')
    aperture=D.guard_r
    end=xplate(150,151,4,aperture,[(-65,-63),(-65,63),(65,-63),(65,63)])
    endcap=end.cut(box(8,157,7,(0,0,-74)))
    guard_rails=[box(106,5,5,(0,y,z)) for y in (-72,72) for z in (-72,72)]
    add(16,6,'Malleable logarithmic casing frame','Bolted end frames and corner rails surround the rotor’s swept envelope. Chamfered flanges locate the service covers.','Coated steel and aluminum','5 mm hex key · candidate M6 guard joints',[strip('cast',[endcap.translated(V(x,0,0)) for x in (-51,51)]+guard_rails),
        strip('plate',[box(14,12,10,(x,y,-78)) for x in (-51,51) for y in (-69,69)])],one(0,0,H),1,'Frame fracture or lost coverage','casing')
    rim=box(100,141,4).cut(box(84,117,6))
    add(17,6,'Inspection roof and polycarbonate insert','Top roof carries the transparent inspection panel, rounded retention lips and a lifting handle.','Polycarbonate candidate and coated frame','4 mm hex key · candidate M5 cover screws',[('cast',rim),('glass',chamfered(83,116,3,(0,0,0),5)),('steel',compound([box(30,4,5,(0,0,9)),box(4,4,9,(-13,0,5)),box(4,4,9,(13,0,5))]))],one(0,0,H+75),16,'Crazing, loose retainers or damaged handle')
    side_frame=box(100,3,137).cut(box(84,6,116))
    add(18,6,'Guard access door and latch','Front inspection door with a separate transparent insert, hinge barrels and positive latch.','Transparent polymer and anodized aluminum','4 mm hex key · candidate hinge fasteners',[('plate',side_frame),('glass',box(84,2.4,116)),strip('steel',[cyl(2.5,17,(-48,0,z),'z') for z in (-45,45)]),('black',box(14,7,5,(41,-4,2)))],one(0,-73,H),16,'Hinge play or failed interlock actuation')
    # Base is a radial ring; the winding is a separately selectable copper package.
    winding=[]
    for i in range(D.stator_slots):
        winding.extend([along_x(box(34,3.4,4.5,(0,0,26.3)),i*30),along_x(ring(4,2.1,2,(0,0,0)).translated(V(-19,0,26.3)),i*30),along_x(ring(4,2.1,2).translated(V(19,0,26.3)),i*30)])
    add(19,7,'Lotus-o-deltoid winding pack','Twelve slot groups and end turns illustrate a proposed grouped winding. Connection, insulation class and electromagnetic constants remain open.','Copper and slot insulation','Milliohm meter · four-wire range required',[strip('gold',winding)],one(-184,0,H),21,'Interturn fault or insulation breakdown','winding','power')
    slots=[]
    for i in range(D.stator_slots):
        slots.append(along_x(box(43,D.stator_slot_width,D.stator_slot_depth,(0,0,25.8)),i*30))
    lam=ring(D.stator_outer,D.stator_bore,40).cut(compound(slots))
    add(20,8,'Panendermic semi-boloid laminated stator','Equal angular slot pitch and an explicitly cut radial slot keep the magnetic stack separable from the winding.','Electrical steel candidate','Internal bore gauge · nominal Ø44 mm bore',[('cast',lam),strip('plate',[ring(34.8,30,.6,(x,0,0)) for x in (-18,-12,-6,0,6,12,18)])],one(-184,0,H),21,'Slot damage or loss of lamination retention','stator')
    shell=ring(40,35.5,49)
    # Open an upper sector so the stator stack and conductors can be inspected.
    shell=shell.cut(box(51,62,33,(0,0,34)))
    fins=[along_x(box(42,2,5,(0,0,41)),a) for a in range(65,300,15)]
    add(21,14,'Fin-ribbed industrial motor housing','Motor cover, annular end flanges and heat-dissipation fins surround the model stator. Inspection sector exposes the winding package.','Coated cast aluminum','5 mm hex key · candidate terminal cover screws',[('blue',shell),strip('blue',fins),strip('plate',[ring(38,15,4,(x,0,0)) for x in (-26,26)]),strip('cast',[chamfered(63,16,14,(0,y,-44),2) for y in (-27,27)])],one(-184,0,H),2,'Motor mount distortion or cooling obstruction','automation')
    add(22,14,'Permanent-magnet motor rotor','Cylindrical motor rotor carries a longitudinal pattern of bars and a single supported output shaft interface.','Steel stack and magnet candidate','Nonmagnetic fixture · method pending',[('steel',cyl(19.5,40)),strip('gold',[along_x(box(34,4,1.6,(0,0,20)),i*45) for i in range(8)]),('plate',cyl(6,69,(4,0,0)))],one(-184,0,H),21,'Rotor eccentricity or magnet retention fault')
    add(23,9,'Differential girdle spring input hub','Input coupling flange transmits motor torque into the compliant elements.','Steel and elastomer','4 mm hex key · candidate M5 radial clamp',[('plate',ring(21,6,9)),strip('steel',[cyl(2.6,7,(7,14*math.cos(a),14*math.sin(a))) for a in (0,math.pi)])],one(-145,0,H),22,'Clamp slip or excessive coupling travel','spring')
    add(24,9,'Differential coupling damper cartridge','Eight elastomer sectors and a drive ring carry small relative torsional motion. Stop clearance and stiffness are separate qualification items.','Elastomer and steel','Snap-ring pliers · nominal 34 mm ring envelope',[strip('amber',[along_x(box(7,5,6,(0,0,15)),a) for a in range(0,360,45)]),('cast',ring(20,17,3,(4,0,0)))],one(-135,0,H),23,'Elastomer shear or engagement of the travel stop','spring')
    add(25,9,'Differential output flange and travel stops','Indexed coupling output aligns with the waneshaft, with clearance holes for concept stop pins.','Machined steel','4 mm hex key · candidate M5 clamp screw',[('steel',bore_grid(ring(21,6,10),[(0,-14,0),(0,14,0)],3.4,12,'x'))],one(-125,0,H),5,'Impact at travel stops or loosening','spring')
    add(26,7,'Motor termination block','Insulated terminals represent the electrical connection between winding group and drive. External connector pinout awaits component selection.','Glass-filled polymer and brass','2.5 mm insulated slotted driver · terminal design candidate',terminal(6,5,11),one(-186,-40,112),19,'Loose conductor or insulation failure','winding','power')
    add(27,10,'Cardinal gram-meter acquisition module','Enclosed timebase and signal conditioner combine speed, vibration and temperature channels.','Metal enclosure and PCB','PH2 screwdriver · candidate cover',[('cast',chamfered(53,34,24,(0,0,0),3)),('plate',box(51,32,2,(0,0,13))),*terminal(6,5,7)],one(22,108,32),35,'Stale timebase or signal saturation','grammeters','signal')
    add(28,10,'Bearing vibration and temperature pickups','Matched shaft-support pickups represent accelerometer and temperature measurement points.','Aluminum probe bodies','10 mm spanner · candidate M6 sensor flats',[('plate',hexhead(5,8)),('blue',cyl(3,10,(0,0,8),'z'))],each((-J,15,H+23),(J,15,H+23)),11,'Sensor loosening, drift or thermal lag','grammeters','signal')
    add(29,10,'Incremental shaft reference pickup','Fixed pulse pickup faces a separate rotating timing feature on the shaft.','Metal housing and polymer insulator','2.5 mm hex key · candidate M3 sensor clamp',[('frame',chamfered(18,16,18,chamfer=2)),('gold',cyl(3,6,(0,-6,0),'z')),('steel',box(20,4,14,(0,7,-7)))],one(108,12,H+12),12,'Lost index, clearance error or timing jitter')
    add(30,11,'Unilateral phase detractor module','Isolated signal front end and computation module compare paired waveforms at a defined tone.','Shielded PCB enclosure','PH2 screwdriver · candidate shield cover',[('board',box(46,31,2)),('cast',chamfered(34,22,13,(0,0,7),2)),*terminal(5,5,7)],one(82,108,28),27,'Invalid coherence or common-mode overload','phase','signal')
    add(31,12,'Drawn reciprocating dingle arm','Separate connecting link couples the demonstration eccentric to its guided slider. Motion is shown inside the service guard.','Steel or aluminum candidate','10 mm spanner · candidate 6 mm pivot hardware',[('steel',chamfered(D.rod_length,8,5,chamfer=2)),strip('plate',[ring(8,3,4,(x,0,0),'z') for x in (-D.rod_length/2,D.rod_length/2)])],one(23,-118,38),32,'Pivot wear or fatigue','dingle')
    crank=ring(23,5,8,axis='z').cut(cyl(2.9,10,(D.crank_r,0,0),'z'))
    add(32,12,'Eccentric crank and replaceable pin','Adjustable offset converts a reduced-rate drive into a guided reciprocation, with a removable pin.','Steel','5 mm hex key · candidate crank retainer',[('cast',crank),('steel',cyl(2.85,12,(D.crank_r,0,8),'z')),strip('steel',[cyl(2.1,1,(13*math.cos(a),13*math.sin(a),4.5),'z') for a in (2,3,4,5)])],one(-23,-118,28),2,'Pin loosening or excessive bearing load')
    add(33,12,'Guided slider and end stops','Paired rails guide straight-line motion of the reciprocating mechanism. The stops remain outside the study stroke.','Coated steel and polymer wear strips','4 mm hex key · candidate rail bolts',[strip('steel',[cyl(3.2,112,(0,y,0)) for y in (-9,9)]),strip('cast',[chamfered(10,28,15,(x,0,0),2) for x in (-54,54)])],one(52,-118,37),1,'Binding or misadjusted stop')
    add(34,12,'Crosshead and piston load interface','Guided block transfers stroke to the positive-displacement demonstration pump.','Bronze slide and steel fitting','10 mm spanner · candidate pivot nut',[('gold',bore_grid(chamfered(21,26,13,chamfer=2),[(0,y,0) for y in (-9,9)],3.3,25,'x')),('steel',cyl(4,22,(18,0,0)))],one(58,-118,37),33,'Scoring or loss of linear alignment')
    add(35,15,'Raised control wiring tray','Drainable mounting tray supports phase and acquisition units under the separate control cabinet.','Coated sheet steel','5 mm hex key · candidate M6 tray bolts',[('cast',chamfered(174,57,4,chamfer=4)),strip('plate',[box(165,3,14,(0,y,4)) for y in (-26,26)])],one(52,109,16),1,'Cracked mounting flange or insufficient separation')
    elbow=cable([(0,0,0),(16,0,0),(21,0,0),(21,16,0)],7).cut(cable([(-2,0,0),(16,0,0),(21,0,0),(21,19,0)],4.5))
    add(36,13,'Non-reversible tremie pipe manifold','Low-head water-loop manifold carries flow through a separate check-valve body. Elbow volume is hollow.','Copper alloy candidate','17 mm open-end spanner · candidate union flats',[('gold',elbow),('steel',ring(8,4.7,4,(0,0,0)))],one(112,-118,37),37,'Union leakage or air accumulation','tremi','airflow')
    add(37,13,'Directional check valve and inspection plug','Internal poppet seat allows one direction of circulation through the demonstration loop. Pressure qualification and sealing are pending.','Bronze body and stainless poppet','19 mm spanner · candidate union cap',[('gold',ring(11,5,23)),('plate',ring(12,5.6,4,(12.5,0,0))),('gold',hexhead(8,5,(1,0,10))),('steel',cyl(3.4,5,(-5,0,0)))],one(98,-118,37),34,'Backflow or poppet fouling','tremi','airflow')
    add(38,13,'Loop outlet and pressure sample station','Open-bore outlet stage with a radial sensor boss and mounting foot.','Bronze and stainless steel','17 mm spanner · candidate tubing compression nut',[('gold',ring(9,4.5,34)),('steel',ring(4,2,10,(0,0,8),'z')),('cast',chamfered(24,16,4,(0,0,-12),2))],one(160,-101,37),36,'Pressure tap blockage or poor sealing')
    add(39,14,'Brushless drive and finned cold plate','Current-limited drive accepts a supervisory setpoint through an isolated command boundary.','Finned aluminum and PCB','4 mm hex key · candidate M5 cold-plate mounting',[('cast',chamfered(69,47,21,chamfer=4)),strip('plate',[box(2.6,43,13,(5.5*i,0,17)) for i in range(-5,6)]),*terminal(8,4,9)],one(-150,118,29),44,'Overcurrent, thermal trip or command timeout','automation','power')
    add(40,14,'DC distribution, fuse and disconnect','Rail-mounted low-voltage disconnect and fused distribution blocks represent the protected input.','Insulated polymer, copper terminals','3 mm insulated slotted driver · terminal design candidate',[('frame',chamfered(46,43,32,chamfer=3)),('red',box(14,10,8,(0,0,19))),*terminal(7,5,11)],one(-80,118,35),39,'Poor interruption capacity or loose termination','automation','power')
    shell=box(126,49,158).cut(box(119,49,151,(0,-3,0)))
    add(41,15,'Industrial motor-control cabinet','Distinct vertical cabinet with open service recess, embossed cooling vents, DIN rails and load-side cable glands.','Powder-coated steel','5 mm hex key · candidate M6 cabinet mounting',[('cast',shell),strip('steel',[box(112,2,6,(0,-16,z)) for z in (-49,0,49)]),strip('frame',[box(44,1.2,2.3,(0,24.8,i*4-50)) for i in range(12)]),strip('plate',[ring(6,3,2,(i*16,0,-79),'z') for i in range(-3,4)])],one(140,132,93),35,'Door misalignment or poor airflow','automation')
    door=box(120,4,151).cut(box(83,8,115,(0,0,-2)))
    add(42,15,'Cabinet service door and inspection window','Framed cabinet access door carries a viewing panel, lock handle and external hinge barrels.','Powder-coated steel and safety glazing candidate','Triangular service key · profile pending',[('plate',door),('glass',box(82,2.6,114,(0,0,-2))),('black',box(6,10,19,(50,-6,0))),strip('steel',[cyl(2.5,21,(-58,0,z),'z') for z in (-53,53)])],one(140,105,93),41,'Latch damage or detached hinge')
    add(43,15,'Industrial controller and I/O slice rack','Dedicated controller and pluggable slices show separated power, safety and monitored sensor channels.','Insulated housings and copper contacts','2.5 mm insulated slotted driver · candidate spring terminal',[('frame',box(92,11,37)),strip('blue',[chamfered(10,12,32,(i*11.4,-5,0),1) for i in range(-3,4)]),strip('gold',[box(1.9,1.6,3,(i*5,-11,12)) for i in range(-8,9)])],one(140,122,130),41,'Controller watchdog or channel fault','automation','signal')
    add(44,15,'Protected DC supply module','Rectangular supply with ventilated cover and segregated terminal guard. The 48 V DC design boundary is an assumption.','Coated steel and copper','PH2 screwdriver · candidate cover screws',[('plate',chamfered(80,48,30,chamfer=4)),strip('frame',[box(2,34,.9,(i*5,0,15.4)) for i in range(-6,7)]),*terminal(7,5,8)],one(-178,116,17),1,'Overload or restricted cooling','automation','power')
    add(45,15,'Latching emergency-stop operator','Prominent red actuator represents an independent stop-chain input. Safety ratings and reset implementation are open.','Steel and polymer','22 mm panel locknut spanner · candidate body',[('cast',chamfered(26,25,19,(0,0,-13),3)),('amber',cyl(13,2,(0,0,-1),'z')),('red',Part.makeCone(10,12,7,V()))],one(-112,-124,26),40,'Faulted contacts or unintended restart','automation','signal')
    harness=[]
    for i,(start,end) in enumerate([((-186,-43,112),(-150,96,42)),((-80,108,44),(90,112,35)),((155,117,37),(4,113,38)),((86,15,108),(14,103,45))]):
        a,b,c=start
        x,y,z=end
        harness.append((['black','gold','blue','black'][i],cable([start,(a,b-4,c-15),(a,b-13,22),(x-9,y-12,22),end],1.6)))
    add(46,15,'Keyed field harness and strain relief','Visible power and instrumentation bundles leave separate cabinet glands and terminate at local modules.','Copper conductors and polymer jackets','Multimeter · continuity and isolation functions',harness,one(0,0,0),43,'Chafe, broken shield or wrong connector mate','automation','signal')
    add(47,6,'Positive guard interlock and plunger','Independent guard-state switch reads access-door closure before enabling the modeled drive.','Insulated actuator and metal bracket','3 mm hex key · candidate switch mount',[('frame',chamfered(18,12,12,chamfer=2)),('amber',box(3,7,5,(8,-5,2))),('plate',box(25,12,2,(0,0,-6)))],one(48,-79,H+37),18,'Misadjusted engagement or wiring fault','automation','signal')
    add(48,12,'Reciprocating mechanism service guard','Transparent cover and perforated side ribs separate the moving crank-slider from access.','Coated steel and clear polymer','4 mm hex key · candidate guard fasteners',[('glass',box(153,43,2)),strip('cast',[box(153,2.7,10,(0,y,-4)) for y in (-21,21)]),strip('steel',[box(3,44,4,(x,0,-2)) for x in (-74,74)])],one(28,-118,68),33,'Loose guard or failed clearance to slider')
    add(49,5,'Curved exhaust transition','Open taper connects the filtered independent fan to an axial outlet. Its flow-area transition is represented explicitly.','Sheet aluminum','4 mm hex key · candidate duct flange screws',[('plate',Part.makeCone(43,30,30,V(-15,0,0),V(1,0,0)).cut(Part.makeCone(39.7,26.7,30.2,V(-15.1,0,0),V(1,0,0)))),('steel',ring(31,26,3,(15,0,0)))],one(226,0,H),15,'Leakage or unstable inlet flow')
    return rows
