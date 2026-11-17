"""Finish assignments and reference densities. Density is an assumption, not a material certificate."""
MATERIALS = {
    'plate': ('Machined aluminum candidate', (0.52, 0.56, 0.57), 0.68, 0.38, 1.0, 2700),
    'steel': ('Steel candidate', (0.70, 0.74, 0.75), 0.69, 0.30, 1.0, 7850),
    'cast': ('Cast aluminum candidate', (0.24, 0.28, 0.32), 0.44, 0.55, 1.0, 2700),
    'frame': ('Coated housing candidate', (0.18, 0.21, 0.25), 0.35, 0.44, 1.0, None),
    'black': ('Insulating polymer candidate', (0.10, 0.13, 0.15), 0.13, 0.65, 1.0, None),
    'rubber': ('Elastomer candidate', (0.055, 0.07, 0.08), 0.02, 0.76, 1.0, None),
    'glass': ('Transparent guard material TBD', (0.68, 0.76, 0.80), 0.08, 0.23, 0.15, None),
    'board': ('Printed circuit carrier', (0.15, 0.35, 0.29), 0.12, 0.58, 1.0, None),
    'gold': ('Copper alloy candidate', (0.60, 0.43, 0.24), 0.52, 0.39, 1.0, None),
    'amber': ('Rotor surface finish and service markings', (0.86, 0.48, 0.18), 0.40, 0.38, 1.0, None),
    'red': ('Stop actuator cap', (0.63, 0.10, 0.06), 0.05, 0.42, 1.0, None),
    'blue': ('Instrument finish', (0.17, 0.35, 0.44), 0.14, 0.48, 1.0, None),
    'sensor': ('Instrumentation marker', (0.28, 0.60, 0.59), 0.15, 0.42, 1.0, None),
    'enamel': ('Enamel-coated aluminum candidate', (0.84, 0.83, 0.77), 0.11, 0.36, 1.0, 2700),
    'magnet': ('Plated magnet insert candidate', (0.65, 0.65, 0.63), 0.61, 0.34, 1.0, 7400),
}
