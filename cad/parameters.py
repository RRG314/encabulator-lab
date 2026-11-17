"""Revision 0.1 dimension authority for the OpenCascade model, in millimetres."""
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

@dataclass(frozen=True)
class Dimensions:
    base_length: float = 300
    base_width: float = 200
    base_thickness: float = 6
    shaft_z: float = 58
    shaft_diameter: float = 8
    shaft_length: float = 136
    shaft_center_x: float = 6
    bearing_span: float = 96
    # 608-size envelope is a candidate interface, with procurement still open.
    bearing_outer: float = 22
    bearing_width: float = 7
    hub_radius: float = 16
    hub_length: float = 38
    vane_count: int = 6
    vane_span: float = 28
    vane_chord: float = 32
    vane_thickness: float = 4
    vane_pitch: float = 12
    guard_aperture: float = 49
    guard_half_length: float = 35
    coupling_length: float = 20
    motor_body_length: float = 58

    @property
    def motor_x(self):
        return self.coupling_x - 39

    @property
    def coupling_x(self):
        return self.shaft_center_x - self.shaft_length / 2 - self.coupling_length / 2 + 1

    @property
    def foot_x(self):
        return self.base_length / 2 - 16

    @property
    def foot_y(self):
        return self.base_width / 2 - 16

D = Dimensions()
