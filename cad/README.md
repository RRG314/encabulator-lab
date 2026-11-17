# CAD model and generation

The editable geometry source is Python using the FreeCAD/OpenCascade API, verified with FreeCAD 1.1.4. Start with `parameters.py`, the component builders in `components/`, the parent placement rules in `assemblies/`, and the reviewed reference staging vectors in `staging.json`. The FreeCAD documents expose individual editable bodies and their registry identity, location, sequence and separation vectors. Regenerate after parameter edits.

```sh
scripts/freecad.sh --mode all
node scripts/drawings-pdf.mjs
```

On macOS, the runner uses the Python provided by FreeCAD.app. Elsewhere, set `TE01_FREECAD_PYTHON` to a Python interpreter able to import FreeCAD, Part, and MeshPart. The PDF step uses the installed project Playwright browser. A browser-only export is available with `scripts/freecad.sh --mode web`.

The pipeline writes:

- `data/model-layout.json`, the assembled and exploded instance transforms consumed by React.
- Assembled and exploded FreeCAD and STEP. The STEP files contain separate tagged instances. The component archive contains local STEP and STL files for physical parts.
- GLB in metres with Y-up orientation. The application converts local geometry to millimetres with Z up. The synthesized firmware marker carries TE-027 for navigation.
- X and Y section STEP files, a separate DGS travel study, and a vector and PDF drawing review package.
- Solid validity, volume, datum, clearance and interference observations in `public/models/validation.json`.

The drawings use fit-to-sheet reference projections, with internal edges visible in assembly views. The geometry is schematic. The report retains unresolved solid intersections for mounting, retention and cable interfaces. AABB separation at full explosion checks the visual endpoint. Tool clearance, swept volume, fastening order and released tolerances require additional verification.
