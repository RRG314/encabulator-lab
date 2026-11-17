"""Nominal engineering layouts derived from the historical evidence register."""
from dataclasses import dataclass
from math import cos, sin, tau
import FreeCAD as App
import Part

V = App.Vector


def box(x, y, z, origin=(0, 0, 0)):
    return Part.makeBox(x, y, z, V(*(a - b/2 for a, b in zip(origin, (x, y, z)))))


def cylinder(radius, width, origin=(0, 0, 0), axis=(1, 0, 0)):
    center, direction = V(*origin), V(*axis)
    return Part.makeCylinder(radius, width, center - direction*(width/2), direction)


def annulus(radius, bore, width, axis=(1, 0, 0)):
    return cylinder(radius, width, axis=axis).cut(cylinder(bore, width+2, axis=axis))


def tube(size, wall, open_face):
    x, y, z = size
    inner = [a - 2*wall for a in size]
    inner[open_face] += wall
    offset = [0, 0, 0]
    offset[open_face] = wall
    return box(x, y, z).cut(box(*inner, offset))


@dataclass(frozen=True)
class Item:
    name: str
    group: int
    finish: str
    shape: object
    stations: tuple
    offset: tuple
    host: int
    interface: str
    service: str
    source: str = ''
    rotates: bool = False
    cover: bool = False
    input_drive: bool = False


def item(name, group, finish, shape, xyz, offset, host, interface, service, source='', *, rotates=False, cover=False, multiple=False, input_drive=False):
    return Item(name, group, finish, shape, tuple(xyz) if multiple else (xyz,), offset, host,
                interface, service, source, rotates, cover, input_drive)


def plate_with_holes(size, holes, diameter, axis=(0, 0, 1)):
    plate = box(*size)
    cutting_length = max(size)+2
    for location in holes:
        plate = plate.cut(cylinder(diameter/2, cutting_length, location, axis))
    return plate


def ge_instrument():
    z = 65
    meters = [(-56, 0, 30), (56, 0, 30)]
    flange = plate_with_holes((340, 4, 148), meters, 56, (0, 1, 0))
    case = box(340, 218, 146).cut(box(332, 218, 138, (0, -5, -4)))
    bearing = box(22, 44, 65, (0, 0, -32.5)).fuse(cylinder(22, 22)).cut(cylinder(8.2, 30))
    blades = []
    for i in range(6):
        blade = box(12, 8, 22, (0, 0, 22))
        blade.rotate(V(), V(1, 0, 0), i*60)
        blades.append(blade)
    fan = annulus(12, 8.2, 14).multiFuse(blades).removeSplitter()
    return [
        item('Prefabulated Amulite baseplate',0,'plate',plate_with_holes((366,238,10),[(x,y,0) for x in (-168,168) for y in (-108,108)],6.6),(0,0,-5),(0,0,-23),0,'Datum A · upper mounting plane','5 mm hex key candidate','G62A'),
        item('Logarithmic case',0,'frame',case,(0,3,73),(0,100,170),1,'Removable case above datum A','PH2 screwdriver candidate','G62A',cover=True),
        item('Inrush and realization meter fascia',0,'cast',flange,(0,-111,74),(0,-155,0),1,'Front-panel flange','PH2 screwdriver candidate','G62A',cover=True),
        item('Inrush and realization panel meter',1,'blue',annulus(27.6,22,13,(0,1,0)).fuse(cylinder(22,7,(0,-1,0),(0,1,0))),[(x,-108,104) for x,_,_ in meters],(0,-100,52),3,'Ø56 mm fascia opening, two independent indications','Panel retaining-ring spanner','G62A',multiple=True),
        item('Coaxial bearing pedestal',2,'steel',bearing,[(-85,25,z),(65,25,z)],(0,25,85),1,'Common shaft datum X. Two station envelopes','Bearing puller candidate','G62A',multiple=True),
        item('Rotor spindle',2,'steel',cylinder(8,257),(0,25,z),(-280,0,72),5,'Ø16 mm journal envelope','Dial indicator and soft-jaw fixture','G62A',rotates=True),
        item('Semi-boloid stator carrier',2,'cast',annulus(41,28,66),(-4,25,z),(0,100,128),1,'Station between the bearing planes','4 mm hex key candidate','G62A'),
        item('Rotor sleeve',2,'plate',annulus(23,8.2,60),(-4,25,z),(-40,-87,45),6,'Bore over spindle, radial air clearance to stator','3 mm hex key candidate','G62A',rotates=True),
        item('Pentametric fan',2,'amber',fan,(112,25,z),(90,30,74),6,'Coaxial fan bore','3 mm hex key candidate','G62A',rotates=True),
        item('Meter excitation and load board',1,'board',plate_with_holes((124,52,2),[(x,y,0) for x in (-55,55) for y in (-20,20)],3.2),(9,-62,14),(0,-115,-25),1,'Low-voltage demonstration circuit, independent of handbook ratings','PH1 screwdriver candidate'),
        item('Input protection module',1,'red',box(31,30,36),(128,-61,18),(75,-70,0),1,'Isolated reference feed at the board input','Insulated terminal driver','G62A'),
    ]


def carrier():
    shape = annulus(32, 9.5, 8)
    for i in range(5):
        angle=tau*i/5
        y,z=48*cos(angle),48*sin(angle)
        arm=box(8,42,19,(0,31,0))
        arm.rotate(V(),V(1,0,0),360*i/5)
        shape=shape.fuse(arm).fuse(cylinder(10,8,(0,y,z)))
    for i in range(5):
        angle=tau*i/5
        shape=shape.cut(cylinder(3,12,(0,48*cos(angle),48*sin(angle))))
    return shape.removeSplitter()


def magneto():
    z=98
    stations=(-84,-28,28,84)
    satellite = annulus(15,3,8)
    for i in range(8):
        a=tau*i/8
        satellite=satellite.cut(cylinder(2.5,9,(0,10.4*cos(a),10.4*sin(a))))
    supports=box(16,40,z,(0,0,-z/2)).fuse(cylinder(20,16)).cut(cylinder(7,24))
    return [
        item('Fixture base rail',0,'plate',plate_with_holes((352,190,9),[(x,y,0) for x in (-157,157) for y in (-80,80)],6.6),(0,0,-4.5),(0,0,-35),0,'Shaft frame mounting datum','5 mm hex key candidate','A22'),
        item('Outboard shaft support',0,'cast',supports,[(-149,0,z),(149,0,z)],(0,-62,35),1,'Common X-axis support bores','Dial indicator and 4 mm hex key','A22',multiple=True),
        item('Through input shaft',1,'steel',cylinder(6.8,325),(0,0,z),(-235,0,47),2,'Input shaft within the separate carrier sleeve','Soft-jaw fixture','A22',rotates=True,input_drive=True),
        item('Lobed magnetic carrier',1,'plate',carrier(),[(x,0,z) for x in stations],(0,48,112),10,'Indexed sleeve bore and five satellite pivot holes','4 mm hex key candidate','A22',rotates=True,multiple=True),
        item('Satellite magnet disk',1,'blue',satellite,[(x+10,48*cos(i*tau/5),z+48*sin(i*tau/5)) for x in stations for i in range(5)],(15,-80,128),4,'Representative eight magnet recesses per machined disk','Nonmagnetic pick and soft-jaw arbor','A22',rotates=True,multiple=True),
        item('Satellite pivot',1,'steel',cylinder(2.9,18),[(x+5,48*cos(i*tau/5),z+48*sin(i*tau/5)) for x in stations for i in range(5)],(28,128,50),4,'Pivot engagement in carrier and disk bores','2.5 mm hex key candidate',rotates=True,multiple=True),
        item('Outboard indicator disk',2,'red',annulus(42,9.5,8),[(x,0,z) for x in (112,128)],(67,74,15),10,'Paired disks on the carrier sleeve','3 mm hex key candidate','A22',rotates=True,multiple=True),
        item('Optical sensor stand',2,'blue',box(15,25,103),(121,76,51.5),(60,78,-24),1,'Independent of shaft frame. Sensor bracket datum','PH1 screwdriver candidate','A22'),
        item('Optical pickup',2,'black',box(24,28,12),(121,75,109.5),(64,90,38),8,'Service alignment to outboard indicator disk','2.5 mm hex key candidate'),
        item('Carrier torque sleeve',1,'steel',annulus(9.3,7.1,238),(16,0,z),(163,-100,15),3,'Independent coaxial output with 0.3 mm radial clearance to the input shaft','Soft-jaw fixture',rotates=True),
        item('Input magnetic coupling disk',1,'amber',annulus(36,6.8,10),(-114,0,z),(-79,-92,75),3,'Nominal input-side induction face. Pole properties remain open.','3 mm hex key candidate',rotates=True,input_drive=True),
    ]


def micro():
    # Coordinates locate the lid in the observed service pose. Hinge axis is X.
    fasteners=[(x,y,0) for x in (-105,105) for y in (-49,49)]
    lid = plate_with_holes((272,4,146),[(x,0,z) for x in (-122,122) for z in (-62,62)],3.3,(0,1,0))
    return [
        item('Portable enclosure tray',0,'cast',tube((272,158,59),3,2),(0,0,29.5),(0,0,-35),0,'Equipment floor, nominal carry-case envelope','PH2 screwdriver candidate','P16'),
        item('Hinged lid',0,'plate',lid,(0,77,133),(0,118,73),1,'Lid in service pose about rear hinge datum','PH2 screwdriver candidate','P16',cover=True),
        item('Hinge knuckle',0,'steel',annulus(5,2.4,28),[(-105,84,60),(105,84,60)],(45,85,14),1,'Twin X-axis parallel hinge supports','2.5 mm hex key candidate','P16',multiple=True),
        item('Lid backplane',1,'board',plate_with_holes((228,2,116),[(x,0,y) for x,y,_ in fasteners],3.2,(0,1,0)),(0,72,133),(0,-83,70),2,'Stand-off plane 5 mm forward of lid','PH1 screwdriver candidate','P16'),
        item('Interface terminal strip',1,'black',box(128,10,15),(0,64,109),(0,-132,8),4,'Numbered terminal positions. Pin assignment pending','Insulated terminal driver','P16'),
        item('Lid relay module',1,'blue',box(37,12,38),[(-53,64,151),(52,64,151)],(0,-146,84),4,'Dual relay envelopes on shared backplane','PH1 screwdriver candidate','P16',multiple=True),
        item('Control compartment plate',2,'plate',plate_with_holes((229,124,3),fasteners,3.4),(0,0,13),(0,-76,85),1,'Removable floor insert and equipment datum','4 mm hex key candidate'),
        item('Instrument input module',2,'board',plate_with_holes((75,54,16),[(x,y,0) for x in (-31,31) for y in (-20,20)],3),(57,-8,25),(73,-90,29),7,'Charge-assay fixture. Low-voltage input definition','PH1 screwdriver candidate'),
        item('Shielded discharge module',2,'blue',box(64,54,26),(-56,-8,28),(-75,-84,42),7,'Resistance network heat-transfer interface','3 mm hex key candidate'),
        item('Lid services harness',1,'red',Part.makeCompound([cylinder(2.2,79,(i,0,18),(0,0,1)).fuse(cylinder(2.2,26,(i,-12,-20),(0,1,0))) for i in range(-9,10,6)]),(81,61,70),(55,-90,58),5,'Flexible service loop between lid and tray','Continuity meter and terminal driver','P16'),
    ]


def electro():
    ports=[(x,0,z) for x in (56,94) for z in (10,-20)]
    front=plate_with_holes((264,4,88),ports,10.6,(0,1,0))
    display=box(93,14,50)
    fascia=front.cut(box(94,10,51,(-57,0,9)))
    enclosure=tube((266,191,87),3,2).cut(box(94,26,51,(-57,-96,9.5)))
    for x,_,z in ports:
        enclosure=enclosure.cut(cylinder(5.3,26,(x,-96,z+.5),(0,1,0)))
    return [
        item('Measurement chassis',0,'cast',enclosure,(0,0,43.5),(0,0,-26),0,'Instrument datum at bottom of chassis','PH2 screwdriver candidate','B21'),
        item('Removable chassis cover',0,'plate',plate_with_holes((265,190,3),[(x,y,0) for x in (-119,119) for y in (-81,81)],3.2),(0,0,88.5),(0,30,98),1,'Upper chassis rim. Retained at four corners','PH2 screwdriver candidate','B21',cover=True),
        item('Instrument fascia',0,'frame',fascia,(0,-97.5,44),(0,-67,24),1,'Panel openings aligned to display and coax ports','PH2 screwdriver candidate','B21',cover=True),
        item('Readout module',1,'blue',display,(-57,-92,53),(-31,-115,43),3,'Recessed front readout opening','PH1 screwdriver candidate','B21'),
        item('Coaxial acquisition port',1,'gold',annulus(4.9,1.8,18,(0,1,0)),[(x,-97,z) for x in (56,94) for z in (54,24)],(58,-105,-8),3,'Four nominal feed-throughs','Coax head spanner candidate','K21',multiple=True),
        item('Acquisition printed circuit board',2,'board',plate_with_holes((186,114,1.6),[(x,y,0) for x in (-83,83) for y in (-48,48)],3.2),(10,2,16),(0,-37,61),1,'Candidate board outline, four mounting holes','PH1 screwdriver candidate','B21'),
        item('Spurving resonator package',2,'blue',Part.makeCompound([box(30,20,8),box(3,24,2,(-10,0,-4)),box(3,24,2,(10,0,-4))]),[(-24,5,21.9),(25,5,21.9)],(-35,-25,104),6,'Two mounted stages on shared acquisition board','ESD-rated placement tool','K21',multiple=True),
        item('Panametric phase noise depositer',2,'black',box(26,22,6),(73,25,19.8),(66,10,90),6,'Output processing footprint','ESD-rated placement tool','K21'),
        item('Quantized entanglement realizer footprint',2,'gold',Part.makeCompound([box(2,6,.2,(x,y,0)) for x in (-9,-3,3,9) for y in (-9,9)]),(71,-32,16.9),(55,-60,85),6,'Inspectable unpopulated pad field','Optical microscope','B21'),
    ]


def chrysler():
    axis = 125
    flange = annulus(106, 60, 13)
    for i in range(10):
        angle=i*tau/10
        flange=flange.cut(cylinder(3.8,15,(0,98*cos(angle),98*sin(angle))))
    bell = Part.makeCone(60,94,104,V(-52,0,0),V(1,0,0))
    bell=bell.cut(Part.makeCone(54,88,104,V(-52,0,0),V(1,0,0)))
    ribs=[]
    for i in range(8):
        rib=Part.makePolygon([V(-50,0,60),V(49,0,93),V(49,0,102),V(-50,0,60)])
        rib=Part.Face(rib).extrude(V(0,4,0))
        rib.rotate(V(),V(1,0,0),i*45)
        ribs.append(rib)
    bell=bell.multiFuse(ribs).removeSplitter()
    pump=annulus(48,11.5,13)
    turbine=annulus(48,13.5,13)
    for i in range(12):
        b=box(5,4,34,(8,0,29))
        c=b.copy()
        c.translate(V(-16,0,0))
        b.rotate(V(),V(1,0,0),i*30)
        c.rotate(V(),V(1,0,0),i*30)
        pump=pump.fuse(b)
        turbine=turbine.fuse(c)
    case=box(116,144,130).cut(box(109,132,116,(6,0,0))).cut(cylinder(24,130))
    return [
        item('Bench mounting tray',0,'plate',plate_with_holes((346,285,12),[(x,y,0) for x in (-155,155) for y in (-123,123)],9),(0,0,-6),(0,0,-28),0,'Datum A at the nominal service fixture','6 mm hex key candidate'),
        item('Ribbed bell casting',0,'cast',bell,(-58,0,axis),(-185,140,205),1,'Open wide flange toward positive X','13 mm socket candidate','CHV',cover=True),
        item('Bell flange',0,'steel',flange,(.5,0,axis),(0,95,148),2,'Nominal ten-position service split','13 mm socket candidate','CHV',cover=True),
        item('End case',0,'cast',case,(84,0,axis),(130,0,140),1,'Rear opposed end case and output journal','13 mm socket candidate','CHV',cover=True),
        item('Drive input shaft',1,'steel',cylinder(11.3,132),(-89,0,axis),(-225,0,0),6,'Coaxial input datum within the drive element','Soft-jaw shaft fixture',rotates=True,input_drive=True),
        item('Drive impeller',1,'amber',pump,(-30,0,axis),(0,-105,69),2,'Input member of fluid-coupling analogue','Retaining ring pliers',rotates=True,input_drive=True),
        item('Driven turbine',1,'plate',turbine,(6,0,axis),(12,-138,130),8,'Output member opposite the impeller with unsteady-fluid clearance','Retaining ring pliers',rotates=True),
        item('Driven hub and shaft',1,'steel',cylinder(13.3,136),(69,0,axis),(180,30,45),4,'Coaxial shaft to the outboard output datum','Soft-jaw shaft fixture',rotates=True),
        item('Output seal carrier',2,'blue',annulus(23.5,13.5,12),(145,0,axis),(63,-101,83),4,'Seal reference inside nominal end-case opening','Hook spanner candidate'),
        item('Service cover',2,'frame',annulus(57,12.5,8),(-115,0,axis),(-107,60,70),2,'Dark removable service end plate','10 mm socket candidate','CHV',cover=True),
        item('Lower case stand',0,'plate',box(104,142,60),(86,0,30),(34,105,-18),1,'Load path from the case to fixture over lower mounting plane','6 mm hex key candidate'),
        item('Case transition ring',0,'cast',annulus(63,54,19),(16.5,0,axis),(45,139,103),3,'Annular locating step between bell flange and end case','13 mm socket candidate'),
    ]


CONFIGURATIONS = {
    'chrysler': ('CH-88', (346,285,238), 125, ('Fixture and transaxle castings','Fluid torque stage','Service outputs'), chrysler),
    'ge-1962': ('GE-62', (366,238,158), 65, ('Case and base','Metering and protection','Coaxial train'), ge_instrument),
    'magneto-2022': ('MT-22', (352,190,167), 98, ('Outboard support','Magnet carrier train','Indicator stack'), magneto),
    'micro-2016': ('MI-16', (272,158,215), 0, ('Transport enclosure','Lid instrumentation','Base instrumentation'), micro),
    'electro-2021': ('ET-21', (266,202,92), 0, ('Measurement chassis','Panel instruments','Acquisition circuit'), electro),
}
