"""Retro Encabulator study dimensions, millimetres; shaft is on +X, datum Z=0."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Parameters:
    length: float = 488
    width: float = 350
    plate: float = 10
    axis_z: float = 84
    journal_span: float = 164
    journal_d: float = 12
    rotor_root: float = 23
    rotor_tip: float = 63
    guard_r: float = 70
    blade_chord: float = 52
    blade_pitch_deg: float = 16
    crank_r: float = 12
    rod_length: float = 68
    stator_bore: float = 22
    stator_outer: float = 35
    stator_slots: int = 12
    stator_slot_width: float = 5
    stator_slot_depth: float = 8
    bearing_outer: float = 28
    bearing_width: float = 8
    fan_x: float = 169

D = Parameters()
