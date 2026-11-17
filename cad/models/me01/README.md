# ME-01 parametric CAD

Run `scripts/freecad-me01.sh` with a FreeCAD-enabled Python interpreter. Dimensions and journal references are defined in `parameters.py`. Local B-reps, ownership and mechanical interfaces are in `master_assembly.py`. The stations from `data/me01/families.tsv` are separated into physical and computational definitions. The computational functions receive registry entries and controller interfaces.

The exporter generates assembled and separated FCStd and STEP, section STEP, the named GLB, part solids, dimensioned SVG and geometry reports. Generated solids use mm, and GLB uses m against a Y-up basis. A one-parameter variation check is part of the geometry report. No CAD release tolerance is implied.
