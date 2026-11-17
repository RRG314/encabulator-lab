# Assembly and drawing conformance

Each entry in the physical register has a selectable browser mesh, an individual STEP file, a dimensioned SVG sheet, and STEP and STL members in the component archive. The assembly drawings use the same component placement datums as the interactive workbench at 0% and 100% separation. The intermediate workbench states are staged illustrations of separation.

| Configuration | Physical definitions | Placed instances | Drawing basis |
|---|---:|---:|---|
| Turbo Encabulator TE-01 | 29 | 59 | Project FreeCAD design. Firmware runs on the measurement controller. |
| Retro Encabulator RE-01 | 49 | 67 | Project FreeCAD design. The assembled sheet shows the construction datum for the crank and slider before motion replay. |
| Metachronic Encabulator ME-01 | 41 | 48 | Project FreeCAD design. Eleven computational records retain their controller and instrumentation links. |
| General Electric Turboencabulator GE-62 | 23 | 137 | Handbook HBK-8359 figure 1 constrains the exterior. Page 802 gives six internal vanes and forty-seven brushes. Physical dimensions and the routing of brush feeds are nominal. |
| Chrysler Turbo Encabulator CH-88 | 13 | 22 | Exterior and visible cutaway from the service presentation. The ten flange fasteners follow the project hole pattern. |
| Micro Encabulator MI-16 | 11 | 14 | Visible open enclosure, lid electrical elements and cable arrangement. The hinge pins use nominal project dimensions. |
| Electro Turbo Encabulator ET-21 | 11 | 21 | Publisher and instrument images constrain the chassis and board packaging. Cover screws and standoffs use nominal project geometry. |
| Magneto-Turboencabulator MT-22 | 12 | 74 | Visible shaft carriers and satellite magnet discs. Each modeled insert set contains eight solids. The historical magnet count, distribution and polarity across the machine remain unverified. |

## Verification method

`python -m cad.conformance` uses the FreeCAD Python environment to reproduce each orthographic and isometric drawing projection from the canonical boundary representations. The script verifies component STEP files and both assembly poses. For each STEP and FreeCAD assembly, it checks solid counts and compares individual solid centres of mass within 0.02 mm and volume within 0.03 mm³ or 0.1%, whichever is greater. Drawing envelopes use the analytic CAD geometry. Direct downloads and archive copies are compared byte for byte. [Machine-readable report](../public/models/assembly-conformance.json)

The application tests check the browser mesh definitions and the instance identities, translations and orientations against the typed assembly registers. They also check a SHA-256 fingerprint of the files listed for each configuration in the report. The workbench reports separately how many distinct physical records and placed CAD instances are available in the current view. Select an individual record to inspect its dimensions, tool candidates, interfaces and drawing.

The drawing checks establish consistency across the project assets. Original manufacturing drawings or a measured survey would be required to verify absolute dimensions, hidden components, tooling and wiring for the historical machines. The archive also indexes documentary and computational configurations whose available sources do not establish a mechanical assembly.

Source evidence for the reconstructed models is recorded by part in the archive. [General Electric handbook pages 801–802](https://attachments.priuschat.com/attachment-files/2019/05/167769_Turboencabulator_1962_GE.pdf) · [Chrysler service presentation](https://www.youtube.com/watch?v=MXW0bx_Ooq4) · [PATH presentation](https://www.youtube.com/watch?v=u4ILnWpi8XY) · [Keysight presentation](https://connectlp.keysight.com/turboencabulator) · [Instrument photographs](https://www.signalintegrityjournal.com/blogs/4-eric-bogatin-signal-integrity-journal-technical-editor/post/2179-your-next-must-have-widget-the-electro-turbo-encabulator) · [Magneto builder demonstration](https://www.youtube.com/watch?v=lBOB9SSdDfU)
