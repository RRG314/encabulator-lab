# Engineering evidence by configuration

Each program assembly has a specification, nominal geometry, an operating study and a verification record. The archive reconstructions use the dimensions and counts that can be traced to a source. Unscaled or obscured geometry retains estimate status.

## Program assemblies

| Configuration | Geometry anchors | Mathematical and verification records |
|---|---|---|
| Turbo Encabulator TE-01 | 300 × 200 × 6 mm plate, Ø8 mm main journal, two bearings and six vanes. The assembled envelope is 300 × 200 × 126 mm. | [Specification](https://rrg314.github.io/encabulator-lab/#/engineering/specification) · [Equations](https://rrg314.github.io/encabulator-lab/#/engineering/physics) · [Verification](https://rrg314.github.io/encabulator-lab/#/engineering/validation) · [Drawings and data](https://rrg314.github.io/encabulator-lab/#/engineering/downloads) |
| Retro Encabulator RE-01 | 488 × 350 × 10 mm plate, Ø12 mm journal, 12 mm crank throw, 24 mm stroke and 68 mm connecting-rod centres. | [Specification](https://rrg314.github.io/encabulator-lab/#/re01/engineering/specification) · [Equations](https://rrg314.github.io/encabulator-lab/#/re01/engineering/physics) · [Verification](https://rrg314.github.io/encabulator-lab/#/re01/engineering/validation) · [Drawings and data](https://rrg314.github.io/encabulator-lab/#/re01/engineering/downloads) |
| Metachronic Encabulator ME-01 | 620 × 412 × 12 mm foundation plate, Ø13 mm primary journal, Ø24 mm sleeve body, 263 mm journal station separation, six indexed vanes and 36 V electrical model. | [Specification](https://rrg314.github.io/encabulator-lab/#/me01/engineering) · [Equations](https://rrg314.github.io/encabulator-lab/#/me01/engineering/physics) · [Input parameters](https://rrg314.github.io/encabulator-lab/#/me01/engineering/inputs) · [Benchmarks](https://rrg314.github.io/encabulator-lab/#/me01/engineering/benchmarks) · [Verification](https://rrg314.github.io/encabulator-lab/#/me01/engineering/validation) |

## Nominal archive reconstructions

| Configuration | Basis for review | Record |
|---|---|---|
| General Electric GE-62 | HBK-8359 constrains the exterior and documents six internal vanes and 47 brushes. The released drawing reports nominal reconstruction dimensions. | [Assembly and source comparison](https://rrg314.github.io/encabulator-lab/#/archive/ge-1962/assembly) · [Dimensional audit](https://github.com/RRG314/encabulator-lab/blob/main/engineering/GE62_DIMENSION_AUDIT.md) |
| Chrysler CH-88 | Service presentation documents the visible casting and selected internals. Project dimensions define unseen interfaces. | [Assembly and source comparison](https://rrg314.github.io/encabulator-lab/#/archive/chrysler/assembly) · [Study](https://rrg314.github.io/encabulator-lab/#/archive/chrysler/study) |
| Micro MI-16 | Documented enclosure and instrumentation arrangement supports the model. Interior fits and service hardware use nominal dimensions. | [Assembly and source comparison](https://rrg314.github.io/encabulator-lab/#/archive/micro-2016/assembly) · [Study](https://rrg314.github.io/encabulator-lab/#/archive/micro-2016/study) |
| Electro ET-21 | Publisher photographs constrain the chassis and electronics arrangement. Mounting hardware uses nominal dimensions. | [Assembly and source comparison](https://rrg314.github.io/encabulator-lab/#/archive/electro-2021/assembly) · [Study](https://rrg314.github.io/encabulator-lab/#/archive/electro-2021/study) |
| Magneto MT-22 | Builder footage constrains the visible carriers and discs. Internal magnet distribution remains unverified. | [Assembly and source comparison](https://rrg314.github.io/encabulator-lab/#/archive/magneto-2022/assembly) · [Study](https://rrg314.github.io/encabulator-lab/#/archive/magneto-2022/study) |

Additional configurations have source and study records in the [technical archive](https://rrg314.github.io/encabulator-lab/#/archive). Each record states the available evidence. The native, STEP, SVG and browser assembly comparisons appear in the [assembly conformance report](https://rrg314.github.io/encabulator-lab/models/assembly-conformance.json). The [source conformance report](https://rrg314.github.io/encabulator-lab/models/source-conformance.json) records feature-level checks against the documented program values and GE-62 component counts.

## Evidence categories

| Category | Meaning |
|---|---|
| Published source | A number or relationship appears in a cited document, figure or demonstrator record |
| Design nominal | A selected project parameter with a defined engineering meaning and unit |
| CAD observation | A feature, count, dimension or volume obtained from the digital solid model |
| Calculation | A result from stated assumptions and an analytical relation |
| Simulation result | A value from the executable numerical model with stated inputs, time grid and output definitions |
| Physical qualification | A comparison against calibrated hardware measurements, with conditions and uncertainties |
