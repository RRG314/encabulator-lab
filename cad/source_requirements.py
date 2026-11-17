"""Measure selected explicit source requirements on the released CAD definitions."""
from math import hypot, isclose

import Part

from cad.components.primitives import compound, ring
from cad.shared.placement import placed


def measurements(key, shapes, layout):
    checks = []

    def shape(id):
        return compound(body for _, body in shapes[id])

    def envelope(body):
        bounds = body.optimalBoundingBox(False, False)
        return bounds.XLength, bounds.YLength, bounds.ZLength

    def smallest_circle(id):
        return min(2 * edge.Curve.Radius for edge in shape(id).Edges if isinstance(edge.Curve, Part.Circle))

    def station_count(id):
        return sum(row['partId'] == id for row in layout)

    def add(feature, target, actual, unit='', maximum=False):
        expected = target if isinstance(target, tuple) else (target,)
        observed = actual if isinstance(actual, tuple) else (actual,)
        fits = all(a <= t + .002 if maximum else isclose(a, t, abs_tol=.002) for t, a in zip(expected, observed))

        def line(values):
            return ' × '.join(f'{value:.3f}'.rstrip('0').rstrip('.') for value in values) + unit

        status = ('WITHIN' if maximum else 'PASS') if fits else 'OPEN'
        checks.append(dict(feature=feature, target=line(expected), actual=line(observed), status=status))

    if key == 'te01':
        # TE-01 master specification §§1, 3 and 5.
        add('Baseplate', (300, 200, 6), envelope(shape('TE-001')), ' mm')
        add('Main shaft diameter', 8, smallest_circle('TE-005'), ' mm')
        add('Radial bearings', 2, station_count('TE-006'))
        add('Rotor vanes', 6, station_count('TE-009'))
        assembly = compound(placed(shapes[row['partId']], row) for row in layout)
        add('Assembly envelope limit', (300, 200, 200), envelope(assembly), ' mm', maximum=True)
    elif key == 're01':
        # RE-01 technical manual, configuration and principal design bases.
        add('Baseplate', (488, 350, 10), envelope(shape('RE-001')), ' mm')
        width, diameter, _ = envelope(shape('RE-010'))
        add('Bearing bore × outside × width', (12, 28, 8), (smallest_circle('RE-010'), diameter, width), ' mm')
        add('Rotor vanes', 6, station_count('RE-008'))
        pin = shapes['RE-032'][1][1]
        center = pin.CenterOfMass
        eccentricity = hypot(center.x, center.y)
        add('Crank throw', 12, eccentricity, ' mm')
        add('Nominal stroke', 24, 2 * eccentricity, ' mm')
        eyes = shapes['RE-031'][1][1].Solids
        add('Connecting rod centres', 68, (eyes[1].CenterOfMass - eyes[0].CenterOfMass).Length, ' mm')
    elif key == 'me01':
        # ME-01 master specification, design nominal table.
        add('Foundation', (620, 412, 12), envelope(shape('ME-001')), ' mm')
        add('Main axis height', 108, next(row['origin'][2] for row in layout if row['partId'] == 'ME-005'), ' mm')
        add('Primary journal diameter', 13, smallest_circle('ME-005'), ' mm')
        # The sleeve has a locally enlarged collar. The shaft body is the first solid.
        add('Sleeve body diameter', 24, envelope(shapes['ME-006'][0][1])[1], ' mm')
        add('Rotor vanes', 6, station_count('ME-013'))
    elif key == 'ge-1962':
        # HBK-8359 p. 802, operation. Page 801 Figure 1 gives the visible fan count.
        add('Coaxial bearing supports', 2, station_count('GE-005'))
        add('External fan blades', 5, len(shape('GE-009').common(ring(41, 40, 22)).Solids))
        add('Internal marzel-vanes', 6, station_count('GE-021'))
        add('Grouting brushes', 47, station_count('GE-022'))
        add('Individual feed locations', 47, station_count('GE-023'))
        add('Panel meters', 2, station_count('GE-004'))
    return checks
