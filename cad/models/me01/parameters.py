"""Metachronic Encabulator geometry, millimetres and degrees."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Dimensions:
    length: float = 620
    width: float = 412
    plate: float = 12
    shaft_z: float = 108
    shaft_diameter: float = 13
    primary_length: float = 280
    secondary_diameter: float = 24
    secondary_length: float = 196
    journal_span: float = 263
    bearing_outer: float = 37
    bearing_width: float = 10
    vane_root: float = 27
    vane_radius: float = 70
    vane_chord: float = 55
    vane_pitch: float = 14
    cover_radius: float = 78
    cover_width: float = 170
    motor_length: float = 66
    coupling_length: float = 25
    fan_diameter: float = 75
    motor_x: float = -224
    fan_x: float = 260

D = Dimensions()
