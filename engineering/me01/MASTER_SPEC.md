# Metachronic Encabulator ME-01

**Polychronous Differential Synchronization Configuration**

**Design revision 0.1 · nominal CAD with calculated and simulated evidence**

ME-01 couples a brushless-driven primary waneshaft and a concentric output sleeve through a compliant torsional connection. The primary assembly carries six indexed variable-pitch marzelvanes. Orthogonal radial stabilization acts at the bearing stations. An independent fan and fluid loop remove heat at the drive and bearing boundaries. The electrical model allocates recovered power between the DC link and an excess-energy sink.

[Operating equations](https://rrg314.github.io/encabulator-lab/#/me01/engineering/physics) · [Model inputs](https://rrg314.github.io/encabulator-lab/#/me01/engineering/inputs) · [Benchmarks](https://rrg314.github.io/encabulator-lab/#/me01/engineering/benchmarks) · [Verification](https://rrg314.github.io/encabulator-lab/#/me01/engineering/validation)

## Coordinate system and geometry

The upper foundation plane sets Z = 0. +X runs along the shaft toward the output. +Y is the transverse direction and +Z is up. The primary and secondary journal stations lie at X = −112 mm and +151 mm with Y = 0 and Z = 108 mm.

| Feature | Design nominal or calculated geometry | Component or reference |
|---|---:|---|
| Foundation plate | 620 × 412 × 12 mm | ME-001 nominal plate |
| Full assembled envelope | 620.00 × 412.00 × 205.90 mm | Assembly drawing envelope |
| Total estimated CAD mass | 21.9261 kg | Nominal solids with generic material densities |
| Primary shaft | 280 mm long, Ø13 mm journal | ME-005, separate shoulder geometry |
| Secondary sleeve | 196 mm long, Ø24 mm nominal sleeve body | ME-006, separate end collar |
| Journal station separation | 263 mm | Common X datum, separate supports |
| Journal cartridge | Ø37 mm outer envelope, 10 mm width | ME-007 and ME-008 |
| Rotor indexing | Six vanes spaced at 60° | ME-012, ME-013 and ME-014 |
| Nominal vane geometry | 27 mm root radius, 70 mm radius, 55 mm chord, 14° pitch | ME-013 geometry parameters |
| Guard aperture | 78 mm nominal radius | ME-003 |
| Coupling length parameter | 25 mm, between nominal hub centres | ME-016 |
| Fan design diameter | 75 mm | ME-018 fan parameter |

The parameter values and observed envelopes have distinct meanings. For example, the secondary sleeve body and its collar have different outside diameters. The estimated mass sums the local part masses over the placed instances, including solid volumes involved in unresolved contacts. Use the individual nominal drawing for the part envelope, the assembly sheet for the installation envelope, and the source audit for the exact check definitions. [Assembly drawing](https://rrg314.github.io/encabulator-lab/models/me01/drawings/ME01-ASSEMBLY.svg) · [Separated drawing](https://rrg314.github.io/encabulator-lab/models/me01/drawings/ME01-EXPLODED.svg) · [Source conformance](https://rrg314.github.io/encabulator-lab/models/source-conformance.json)

## Electrical, fluid and control interfaces

| Interface | Design or model basis | Hardware evidence needed |
|---|---|---|
| ME-023 drive and ME-024 link | 36 V class reference supply, 0.038 F modeled capacitance and 39 V modeled charging ceiling | Device ratings, fusing, fault current, internal discharge and wiring |
| ME-005 primary and ME-006 output | Two coupled angular states, 300–2,200 rpm selectable request | Measured inertias, fits, torsional travel, rotor balance and allowable speed |
| ME-015 radial actuators | Controlled Y and Z reactions and a two-axis support model | Force-current calibration, position data, gap, stability and saturation tests |
| ME-020 coolant distribution and ME-041 bypass | Head and valve command in a lumped flow model, small transverse magnetic pressure contribution | Flow and pressure calibration, materials, seals and leak qualification |
| ME-018 fan and thermal nodes | Independent air demand, coupled motor and bearing thermal model | Fan curve and steady and transient node temperatures |
| ME-030 host-output boundary | Six defined torque and reflected-inertia models | Host-specific coupling, mounts, containment and interface ratings |

The geometry register contains 41 physical definitions, 48 placed instances and 11 controller computations. The scientific subsystem register defines 21 reference studies. The active plant implements selected subsystem relations and state variables. The configured study limits are numerical bounds. Fabrication, commissioning, physical guard qualification and measured performance remain open. [Part register](https://rrg314.github.io/encabulator-lab/#/me01/bom) · [Subsystem register](https://rrg314.github.io/encabulator-lab/#/me01/systems) · [Downloads](https://rrg314.github.io/encabulator-lab/#/me01/engineering/downloads)
