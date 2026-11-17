"""Reopen published CAD and check its drawing projections and part coverage."""
from hashlib import sha256
import json
import re
from pathlib import Path
from xml.etree import ElementTree as XML
from zipfile import ZipFile

import FreeCAD as App
import Part

from cad.components.primitives import compound
from cad.drawings.generate import sheet
from cad.models.archive.configurations import CONFIGURATIONS
from cad.models.me01.master_assembly import records as me_records
from cad.models.re01.master_assembly import records as re_records
from cad.shared.placement import placed
from cad.source_requirements import measurements
from cad.te01_master_assembly import components as te_components


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
MODELS = PUBLIC / 'models'
DATA = ROOT / 'data'
POSITION_TOLERANCE = .02  # mm, the STEP round-trip comparison target
VOLUME_RELATIVE_TOLERANCE = .001  # STEP conversion of swept surfaces


def read_json(path):
    return json.loads(path.read_text())


def solid_sets(shapes):
    return [(solid.CenterOfMass, solid.Volume) for shape in shapes for solid in shape.Solids]


def verify_solids(expected, actual, path):
    remaining = solid_sets(actual)
    baseline = solid_sets(expected)
    if len(remaining) != len(baseline):
        raise ValueError(f'{path.name}: expected {len(baseline)} solids, detected {len(remaining)}')
    for centroid, volume in baseline:
        matches = [(i, (centroid - point).Length) for i, (point, size) in enumerate(remaining)
                   if abs(size - volume) <= max(.03, volume * VOLUME_RELATIVE_TOLERANCE)]
        index, delta = min(matches, key=lambda match: match[1], default=(-1, float('inf')))
        if delta > POSITION_TOLERANCE:
            raise ValueError(f'{path.name}: missing or moved {volume:.4f} mm³ solid at {tuple(centroid)} (offset {delta:.4f} mm)')
        remaining.pop(index)
    return len(baseline)


def native_shapes(path):
    document = App.openDocument(str(path))
    try:
        shapes = []
        for feature in document.Objects:
            if not feature.isDerivedFrom('Part::Feature'):
                continue
            shape = feature.Shape.copy()
            parent = feature.getGlobalPlacement().multiply(feature.Placement.inverse())
            shape.Placement = parent.multiply(shape.Placement)
            shapes.append(shape)
        return shapes
    finally:
        App.closeDocument(document.Name)


def drawing_projections(svg):
    root = XML.fromstring(svg)
    ns = {'s': 'http://www.w3.org/2000/svg'}
    return [(group.attrib['transform'], group.find('s:path', ns).attrib['d'])
            for group in root.findall('s:g', ns)]


def verify_drawing(shape, path, nominal):
    source = path.read_text()
    expected = sheet(path.stem, '', shape, '', '', edge_only=True, nominal=nominal)
    envelope = re.compile(r'Reference envelope \(X × Y × Z\) ([\d.]+ × [\d.]+ × [\d.]+) mm')
    measured = envelope.search(source)
    if not measured or measured[1] != envelope.search(expected)[1]:
        raise ValueError(f'{path.name}: drawing envelope differs from canonical CAD')
    projections = drawing_projections(source)
    if len(projections) != 4 or projections != drawing_projections(expected):
        raise ValueError(f'{path.name}: drawing views differ from canonical CAD')


def fingerprint(files):
    digest = sha256()
    for path in sorted(files, key=Path.as_posix):
        digest.update(path.relative_to(PUBLIC).as_posix().encode() + b'\0')
        digest.update(sha256(path.read_bytes()).digest())
    return digest.hexdigest()


def check_model(code, shapes, records, layout, mesh, sets, solid_bundle, drawing_bundle, nominal=False):
    records = {row['id']: row for row in records if row.get('kind') != 'logical'}
    instances = {row['key'] for row in layout}
    if set(shapes) != records.keys() or set(shapes) != {row['partId'] for row in layout} or len(instances) != len(layout):
        raise ValueError(f'{code}: physical record, shape and placement inventories differ')

    files = [mesh]
    with ZipFile(solid_bundle) as solids, ZipFile(drawing_bundle) as drawings:
        if set(solids.namelist()) != {f'{id}.{extension}' for id in records for extension in ('step', 'stl')}:
            raise ValueError(f'{code}: component solid archive differs from the physical register')
        for id, pieces in shapes.items():
            record = records[id]
            path = PUBLIC / record['cadAssetPath']
            drawing = PUBLIC / record['diagramRefs'][0]
            files.extend([path, drawing])
            shape = compound(shape for _, shape in pieces)
            verify_solids([shape], [Part.read(str(path))], path)
            verify_drawing(shape, drawing, nominal)
            if solids.read(path.name) != path.read_bytes() or drawings.read(drawing.name) != drawing.read_bytes():
                raise ValueError(f'{id}: download archives contain a stale component file')

        pose_results = {}
        for fraction, (label, step, native, drawing) in enumerate(sets):
            files.extend([step, native, drawing])
            pieces = [placed(shapes[row['partId']], row, fraction) for row in layout]
            count = verify_solids(pieces, [Part.read(str(step))], step)
            verify_solids(pieces, native_shapes(native), native)
            verify_drawing(compound(pieces), drawing, nominal)
            if drawings.read(drawing.name) != drawing.read_bytes():
                raise ValueError(f'{code}: download archive contains a stale {label.lower()} drawing')
            pose_results[label] = dict(placedSolids=count, native='PASS', step='PASS', drawing='PASS')

    return dict(code=code, physicalDefinitions=len(records), placements=len(instances), componentSheets=len(records),
                componentStep='PASS', drawingProjections='PASS', packages='PASS', poses=pose_results,
                artifactsSha256=fingerprint(files), files=sorted(path.relative_to(PUBLIC).as_posix() for path in files))


def main():
    results = []
    source_checks = []
    for key, shapes in [('te01', te_components()),
                        ('re01', {p.id: p.finish_parts for p in re_records()}),
                        ('me01', {p.id: p.finish_parts for p in me_records() if p.finish_parts})]:
        archive = key != 'te01'
        folder = MODELS / key if archive else MODELS
        registry = DATA / key if archive else DATA
        drawing_folder = folder / ('drawings' if archive else 'te01-drawings')
        sets = [(label, folder / f'{key}-{file}.step', folder / f'{key}-{file}.FCStd', drawing_folder / f'{key.upper()}-{id}.svg')
                for label, file, id in [('assembled', 'assembled', 'ASSEMBLY'), ('exploded', 'exploded', 'EXPLODED')]]
        solids = folder / {'te01': 'te01-part-solids.zip', 're01': 'part-solids.zip', 'me01': 'solids.zip'}[key]
        drawings = folder / ('drawings.zip' if archive else 'te01-drawings-svg.zip')
        layout = read_json(registry / 'model-layout.json')['placements']
        results.append(check_model(f'{key[:2].upper()}-01', shapes, read_json(registry / 'parts.json'),
                                   layout, folder / f'{key}.glb', sets, solids, drawings))
        source_checks.append(dict(id=key, checks=measurements(key, shapes, layout)))
        print(results[-1]['code'], 'component and assembly files verified', flush=True)

    for slug, (code, _, _, builder) in CONFIGURATIONS.items():
        folder = MODELS / 'archive' / slug
        manifest = read_json(folder / 'manifest.json')
        shapes = {f'{code.split("-")[0]}-{i:03}': [(item.finish, item.shape)] for i, item in enumerate(builder(), 1)}
        sets = [(pose, folder / f'{pose}.step', folder / native, folder / 'drawings' / f'{pose}.svg')
                for pose, native in [('assembled', 'assembly.FCStd'), ('exploded', 'exploded.FCStd')]]
        results.append(check_model(code, shapes, manifest['parts'], manifest['placements'], folder / 'assembly.glb', sets,
                                   folder / 'solids.zip', folder / 'drawings.zip', nominal=code == 'GE-62'))
        checks = measurements(slug, shapes, manifest['placements'])
        if checks:
            source_checks.append(dict(id=slug, checks=checks))
        print(code, 'component and assembly files verified', flush=True)

    report = dict(scope='Conformance to project CAD and drawing sets', positionToleranceMm=POSITION_TOLERANCE,
                  relativeVolumeTolerance=VOLUME_RELATIVE_TOLERANCE, minimumVolumeToleranceMm3=.03,
                  fabricationRelease=False, models=results)
    (MODELS / 'assembly-conformance.json').write_text(json.dumps(report, indent=2) + '\n')
    (MODELS / 'source-conformance.json').write_text(json.dumps(dict(configurations=source_checks), indent=2) + '\n')


if __name__ == '__main__':
    main()
