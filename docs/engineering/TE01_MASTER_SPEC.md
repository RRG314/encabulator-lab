# TURBO ENCABULATOR TE-01
## Engineering specification, component registry, digital twin, and GitHub implementation brief
**Revision:** 0.1 | **Status:** preliminary design | **Units:** SI unless stated

## 1. System definition
TE-01 is a bench-scale, 24 V DC, instrumented electromechanical assembly with a six-vane rotor, two supported shaft journals, motor drive, configurable vibration isolation, airflow and thermal management, and sensor-based supervisory control. The machine measures rotor speed, acceleration, temperature, bus current and voltage. Its phase-detractor function measures phase relationships between periodic signals and can apply bounded motor-speed modulation; it does not claim to produce energy, cancel arbitrary reactive power, or improve efficiency without measurement.

**Nominal targets (subject to component verification):** 24 V DC nominal, 50 W motor class, 300–3000 rpm, 8 mm shaft, 300 x 200 x 200 mm envelope, 6 vanes, guarded rotor, emergency stop, software overspeed threshold. No pressure-rated housing or high-voltage circuitry in revision 1.

## 2. Functional decomposition
1. **Amulite Baseplate Assembly (ABA):** rigid mounting datum, motor and bearing alignment, vibration-isolating feet.
2. **Spurving Bearing Assembly (SBA):** two bearing supports with 8 mm shaft journals, retention, temperature sensing.
3. **Hydrocoptic Marzelvane Assembly (HMA):** balanced six-vane rotor, hub, fasteners, interchangeable vane inserts, optical speed target. Air is the revision-1 working fluid.
4. **Differential Girdle Spring Assembly (DGS):** compliant motor-mount or separate torsional coupling with characterized stiffness and damping; do not place an unqualified spring in a rotating load path.
5. **Panametric Fan Assembly (PFA):** independent guarded cooling fan, duct, filter, thermal feedback.
6. **Logarithmic Casing Assembly (LCA):** segmented guard/enclosure, optional logarithmic-spiral air channel insert, access interlocks.
7. **Cardinal Gram-Meter Assembly (CGM):** instrumentation board, IMU, tachometer, thermistors, bus voltage/current sensor, optional torque measurement.
8. **Unilateral Phase Detractor Assembly (UPD):** sampled voltage/current or tachometer/acceleration phase estimator and bounded control output; current phase only has a defined meaning for an appropriately measured AC waveform.
9. **Control and Safety Core (CSC):** ESP32, motor driver, fused power, independent hardware emergency-stop path, fault latch, telemetry.

## 3. Bill of materials, preliminary
| ID | Qty | Component | Proposed specification | Assembly | Validation required |
|---|---:|---|---|---|---|
| TE-001 | 1 | Amulite baseplate | 300 x 200 x 6 mm aluminum plate; composite overlay optional | ABA | deflection, mounting |
| TE-002 | 4 | Isolating feet | elastomer, selected by measured mass | ABA | transmissibility |
| TE-003 | 1 | BLDC motor | 24 V, ~50 W, compatible driver, rated to 3000 rpm | drive | torque-speed curve |
| TE-004 | 1 | Motor controller | 24 V BLDC ESC with speed control and current limiting | CSC | interface, protections |
| TE-005 | 1 | Main shaft | 8 mm nominal steel, shoulders/retention as engineered | SBA | critical speed, stress |
| TE-006 | 2 | Spurving bearings | 8 mm bore radial bearings, e.g. 608-series where fit permits | SBA | load/life/fit |
| TE-007 | 2 | Bearing housings | aligned, bolted housings | SBA | coaxiality |
| TE-008 | 1 | Marzelvane hub | machined aluminum hub with positive shaft retention | HMA | torque transfer |
| TE-009 | 6 | Hydrocoptic vanes | identical, guarded, balanced vane inserts | HMA | fatigue, balance |
| TE-010 | 1 | Rotor retaining system | locking hardware specified to rotor geometry | HMA | retention |
| TE-011 | 1 | Girdle spring isolator | replaceable elastomer/spring-damper mount | DGS | stiffness/damping |
| TE-012 | 1 | Panametric fan | 24 V guarded axial fan | PFA | cooling capacity |
| TE-013 | 1 | Air duct/filter | removable intake and exhaust duct | PFA | pressure loss |
| TE-014 | 1 | Logarithmic casing | rigid transparent guard + opaque service panels | LCA | impact containment |
| TE-015 | 1 | Spiral-channel insert | optional nonstructural removable duct | LCA | flow effects |
| TE-016 | 1 | ESP32 controller | 3.3 V logic microcontroller | CSC | electrical compatibility |
| TE-017 | 1 | IMU | 3-axis accelerometer, suitable sampling bandwidth | CGM | calibration |
| TE-018 | 1 | Tachometer | Hall/optical sensor plus target | CGM | pulses/rev |
| TE-019 | 2 | Temperature probes | motor/bearing temperature | CGM | calibration |
| TE-020 | 1 | Bus monitor | voltage and current sensing, isolated as needed | CGM | accuracy |
| TE-021 | 1 | Emergency stop | latching switch interrupting motor-enable/power safely | CSC | fault tests |
| TE-022 | 1 | DC power supply | certified 24 V, appropriately rated and fused | CSC | load, fault current |
| TE-023 | 1 | Main fuse and disconnect | sized after measured current and wire rating | CSC | protection |
| TE-024 | 1 | Interlock switch | prevents motor run with guard open | CSC | fail-safe behavior |
| TE-025 | 1 | Controller enclosure | insulated, ventilated, strain-relieved | CSC | ingress/wiring |
| TE-026 | 1 | Harness | keyed connectors, labeled conductors, cable restraint | CSC | continuity |
| TE-027 | 1 | Phase-analysis firmware | digital filters, phase estimator, bounded controller | UPD | phase uncertainty |
| TE-028 | 1 | Optional torque sensor | inline rated torque transducer, later revision | CGM | calibration |
| TE-029 | set | Fasteners | graded, torque-specified, locking as required | all | retention |
| TE-030 | 1 | Shaft coupling | rated flexible coupling between motor and supported shaft | drive | misalignment, torque |

**Do not treat this BOM as fabrication-ready.** Bearing fits, shaft spans, exact motor part, rotor diameter/mass, containment, fastener torque, thermal margins, and power wiring must be selected and checked before physical construction. No unsupported performance or efficiency claim is permitted.

## 4. Assembly structure and explosion order
TE-01 root
- 100 ABA: TE-001, TE-002, baseplate brackets
- 200 Drive: TE-003, TE-004, TE-030, motor bracket
- 300 SBA: TE-005, TE-006 x2, TE-007 x2, retainers
- 400 HMA: TE-008, TE-009 x6, TE-010, TE-018 target
- 500 DGS: TE-011 and mount hardware
- 600 PFA: TE-012, TE-013
- 700 LCA: TE-014, TE-015, TE-024
- 800 CGM: TE-017, TE-018, TE-019 x2, TE-020, TE-028 optional
- 900 UPD/CSC: TE-016, TE-021, TE-022, TE-023, TE-025, TE-026, TE-027

**Explode order:** (1) removable outer casing panels; (2) fan/duct; (3) electronics cover and harness; (4) rotor guard; (5) vanes and hub; (6) shaft retainers; (7) bearing housings; (8) coupling/motor; (9) vibration mounts/baseplate. Assembly is reverse order with alignment and inspection checkpoints. The viewer may animate this order, but mechanical service instructions must never imply running with the guard removed.

## 5. Mechanical design constraints
- Shaft axis X, transverse Y, vertical Z; origin at shaft midpoint on baseplate datum.
- Rotor is centered between two bearing supports unless engineering analysis dictates otherwise.
- All rotating components must have a containment guard and positive retention.
- First rotor diameter is **TBD by critical-speed, balance, containment, and torque calculations**; do not invent dimensions for manufacturing.
- Calculate shaft bending/critical speed, bearing reactions and L10 life, rotor unbalance forces, motor startup torque, fastener preload, and vibration isolation resonance before releasing drawings.
- Rotor balancing and guarded low-speed commissioning precede operation at higher RPM.

## 6. Electrical interfaces
Power: certified 24 V supply -> fuse/disconnect -> emergency-stop-rated motor power path -> motor driver -> BLDC motor. A separately protected DC/DC converter supplies 5 V/3.3 V logic. ESP32 interfaces: tachometer pulse input, I2C/SPI IMU, temperature ADC/digital input, current/voltage monitor, PWM/UART/CAN as driver supports, fan PWM, guard interlock, and latched fault input. Do not route motor power through an ESP32 pin. Specify grounding, shielding, flyback/EMI protection and strain relief in the electrical drawing.

## 7. Mathematical model and measurement definitions
### Rotor
`J*dΩ/dt = τ_motor(Ω,u) - τ_aero(Ω) - b*Ω - τ_disturbance`
`F_unbalance = m_u * r_u * Ω²`
`P_electric = V_bus * I_bus` (DC bus approximation); `P_shaft = τ_shaft * Ω` (requires torque measurement or validated estimate); `η = P_shaft/P_electric` only when both are valid and measured consistently.
### Transverse vibration
`M*x¨ + C*x˙ + K*x = F_unbalance(t) + F_external(t)`; optional 2D model for X/Y.
### Thermal
`C_th*T˙ = P_loss - h*A*(T-T_ambient)`.
### Phase detractor
For two band-limited periodic signals at a common frequency, estimate `Δφ = arg(X(f0)) - arg(Y(f0))` using DFT/cross-spectrum; report coherence, sample rate, confidence and frequency. Phase estimation alone does not imply power-factor correction. Bounded controller may adjust speed setpoint to avoid measured resonance bands; disable modulation when signal quality is insufficient.
### Airflow
Use fan curve and duct pressure-loss measurements; an initial rotor drag approximation `τ_aero = k*Ω*abs(Ω)` must be fitted, not asserted.

## 8. Simulation acceptance tests
- Unit test rotational ODE against analytic constant-torque/linear-drag solution.
- Check unbalance scales with square of angular velocity.
- Check natural frequency `sqrt(K/M)` and damping trends for a single-degree-of-freedom oscillator.
- Energy audit: output power cannot exceed input power absent a separately measured energy source; report loss and uncertainty.
- Phase estimator: synthetic sinusoids with known phase offset, noise, sample-rate changes, and missing data.
- Coordinate invariance: physical outputs unchanged under rigid translation/rotation of the entire modeled assembly; component positions transform consistently.
- Fault injection: tachometer dropout, IMU saturation, overtemperature, guard-open, overspeed, communications loss.
- Data provenance: label every plot `synthetic`, `simulation`, or `measured`; never display simulated data as empirical.

## 9. Interactive 3D encyclopedia
**Views:** assembled, exploded (0–100%), section cutaway, isolated subsystem, wiring, airflow, vibration, telemetry, and maintenance. **Interactions:** rotate/pan/zoom, select part, search part ID, toggle layers, change exploded distance, animate assembly sequence, reveal mounting/fastener locations, open component details, compare revisions, inspect simulation results, and export a parts list.

**Part detail schema:** id, canonical name, assembly id, revision, description, function, material, quantity, mass (nullable), dimensions (nullable), mounting interfaces, mating part ids, fastener ids, sensors, electrical ports, equations, limits, safety flags, maintenance, CAD asset path, diagram references, test evidence, sourcing status, and fabrication readiness.

**Visual requirements:** CAD-like accurate silhouettes, distinct materials, visible shaft/bearing alignment, real component hierarchy, physically meaningful exploded vectors, line callouts, scale bar, measurement overlays, accessible labels. Never use image-generated geometry as a dimensionally accurate CAD source.

## 10. Website and repository architecture
Use GitHub Pages with Vite + TypeScript + React + React Three Fiber/Three.js, static JSON data, and locally served GLB assets. No backend or paid hosting required for version 1. Use URL hash routing or configure static fallback for GitHub Pages. Provide responsive mobile UI, keyboard controls, WebGL fallback, and lightweight LOD models.

```
turbo-encabulator/
  README.md
  LICENSE
  CONTRIBUTING.md
  docs/
    engineering/TE01_MASTER_SPEC.md
    engineering/requirements.md
    engineering/safety.md
    engineering/verification-matrix.md
    engineering/bom.csv
    engineering/electrical-interface.md
    engineering/assembly-sequence.md
    science/rotational-dynamics.md
    science/vibration.md
    science/phase-detractor.md
    science/thermal.md
  data/
    parts.json
    assemblies.json
    connections.json
    simulations.json
  cad/
    source/              # parametric CAD source, when available
    exports/             # STEP and glTF/GLB derived from source
  public/models/
  src/
    app/
    components/Viewer3D.tsx
    components/PartsTree.tsx
    components/PartInspector.tsx
    components/ExplodeSlider.tsx
    components/SimulationPanel.tsx
    simulation/rotor.ts
    simulation/vibration.ts
    simulation/thermal.ts
    simulation/phase.ts
    schemas/part.ts
  tests/
  .github/workflows/deploy.yml
  package.json
  vite.config.ts
```

## 11. Implementation milestones and acceptance criteria
**M1: Data model.** All 30 BOM IDs and nine assemblies exist in validated JSON; all mating references resolve; every part has a visible placeholder or mesh.
**M2: 3D geometry.** Parametric provisional geometry with shared axis, six identical rotor vanes, two bearings, enclosure and fasteners; units and coordinate conventions documented; no implied fabrication tolerances.
**M3: Exploded viewer.** 0–100% slider, assembly tree, selection synchronization, labels, camera presets, isolation, mobile touch controls; reversible animations without part collisions at endpoints.
**M4: Engineering panels.** Each part has technical details, known/unknown fields, equations, interfaces, and evidence tags.
**M5: Simulation.** Deterministic ODE solvers, parameter controls, plot output, validated unit tests, and clear simulation labeling.
**M6: Documentation and deployment.** GitHub Pages build, CI checks, accessible UI, responsive performance, contribution guide, release changelog.
**M7: Hardware readiness.** Separate gated design review, drawings, electrical schematics, FMEA, containment and stress calculations, procurement selection, guarded commissioning plan.

## 12. Engineering release rules
1. Every numerical value is identified as target, assumption, simulation, calculation, or measurement.
2. No claims of net energy gain, arbitrary electromagnetic cancellation, or validated performance without reproducible evidence.
3. No fabrication-ready designation without engineering checks and drawings.
4. Every component in the exploded view maps to a canonical registry ID.
5. Geometry, diagrams, parts catalog, and simulations use the same units and coordinate system.
6. Do not insert jokes, winks, disclaimers about satire, or commentary about generative tools in the public site. Maintain technical precision instead.
