# GE-62 dimensional evidence and verification

The General Electric Turboencabulator reconstruction uses the visible architecture in HBK-8359, dated 31 December 1962. The handbook has two pages. Page 801 contains figure 1, photo 2904401, a single perspective view without a scale. Page 802 lists dimension drawings and external wiring as furnished on delivery. Neither document is included in the handbook. No independent dimensioned GE drawing or confirmed physical measurement was located in the public records reviewed.

[HBK-8359, page 801](https://commons.wikimedia.org/wiki/File:GE_Turboencabulator_pg_1.jpg) · [HBK-8359, page 802](https://commons.wikimedia.org/wiki/File:GE_Turboencabulator_pg_2.jpg)

## Figure comparison and revision 0.3

Both sides of the exposed near base edge provide a vertical comparison against the nearer support. In a 798 × 674 pixel crop from page 801, the visible base edge is about 80–85 px tall and the nearby exposed support is about 40–45 px tall. Perspective and differing depths preclude direct conversion to millimetres. The ratio supports an approximately two-to-one relation in the image. Revision 0.3 adopts a nominal ratio of 1.87 in the CAD.

| Feature | Revision 0.2 CAD | Revision 0.3 CAD | Evidence |
|---|---:|---:|---|
| Baseplate thickness | 24 mm | 56 mm | Figure 1 supports the thicker base relative to the visible supports. |
| Exposed support height | 59 mm | 30 mm | Figure 1 shows two short supports. |
| Shell outside diameter | 132 mm | 132 mm | Project scale datum. Figure 1 supplies no diameter. |
| Shaft height above datum A | 125 mm | 96 mm | Derived as nominal support height plus shell radius. Datum A is the upper base surface. |
| External fan blade count | 6 | 5 | Five blades appear in figure 1. Page 802 describes six marzel-vanes separately. |

The 322 mm shell length excludes the end closures. Shell length, meter pitch, hidden interfaces, mounting hole locations, and the remaining dimensions are nominal project geometry. The handbook weight entry supplies no reliable scale for the photographed assembly.

Revision 0.4 retains the exterior geometry. Page 802 specifies six internal marzel-vanes and forty-seven grouting brushes with tremie feeds. The internal register now includes each vane and brush and one feed stub for each brush. Profiles, spacing, materials and feed routing use nominal geometry because the handbook gives no corresponding drawings or fits.

## CAD and drawing checks

The assembled and separated SVG sheets, per-part dimensions, and viewer footprint are generated from FreeCAD solid envelopes. The baseplate footprint and overall assembly envelope are separate records. All GE-62 sheets carry the current CAD revision and identify the dimensions as nominal. The exporter reloads both assembly STEP files and each component STEP file and compares their envelopes against the source solids to within 0.02 mm. Automated tests also compare the stamped SVG envelopes and revision identifiers against the register.

These checks establish agreement across project files. Historical scale, tolerances, installation fits and swept service clearances remain unverified. A dimensioned drawing with a traceable original reference or a measured surviving artifact would be required to verify absolute size.

[Live assembly](https://rrg314.github.io/encabulator-lab/#/archive/ge-1962/assembly) · [Assembled drawing](https://rrg314.github.io/encabulator-lab/models/archive/ge-1962/drawings/assembled.svg) · [CAD validation report](https://rrg314.github.io/encabulator-lab/models/archive/ge-1962/validation.json)
