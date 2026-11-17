# ME-01 simulation inputs and units

The following values describe the nominal digital model. Geometry parameters use the CAD datum. Operating controls use the defaults in the coupled solver and the selectable intervals in the test bench.

[Geometry parameters](https://github.com/RRG314/encabulator-lab/blob/main/cad/models/me01/parameters.py) · [Solver inputs](https://github.com/RRG314/encabulator-lab/blob/main/src/simulation/metachronic/plant.ts) · [Test bench controls](https://github.com/RRG314/encabulator-lab/blob/main/src/app/MetachronicLab.tsx)

## Adjustable inputs

| Input | Default | Test bench interval | Unit |
|---|---:|---:|---|
| Primary speed request | 1,450 | 300–2,200 | rpm |
| Positive motor torque ceiling | 0.47 | 0.10–0.65 | N·m |
| Passive Y support stiffness | 32,000 | 17,000–55,000 | N/m |
| Passive lateral damping, each axis | 27 | 12–70 | N·s/m |
| Active radial gain limit | 1.2 | 0–2.2 | ratio |
| Vane pitch command | 14 | 2–24 | degrees |
| Residual unbalance | 9 | 0–38 | g·mm |
| Coolant valve opening | 0.68 | 0–1 | ratio |
| Coolant loop head | 12 | 1–54 | kPa |
| Ambient and initial node temperature | 22 | 12–43 | °C |
| Independent fan demand | 0.72 | 0–1 | ratio |
| Added resisting torque | 0.023 | 0–0.12 | N·m |
| Torsional coupling stiffness | 5.4 | 3–12 | N·m/rad |
| Torsional coupling damping | 0.065 | 0.022–0.150 | N·m·s/rad |
| Regenerative deceleration | On | On or off | state |
| Host boundary | Dynamometer | Six models | selection |
| Fault scenario | None | Seven trips and six degraded states | selection |

A request or selectable interval is a simulation input. Physical speed limits, load ratings, safe guard operation, coolant pressure qualification and component tolerances require released design and test evidence.

## Fixed values used in the operating model

| Quantity | Value | Basis |
|---|---:|---|
| Primary effective rotational inertia | 0.008 kg·m² | Assumed, including unresolved drive-side contributions |
| Secondary effective inertia before host factor | 0.011 kg·m² | Assumed for the output load model |
| Lateral effective mass | 1.42 kg | Assumed lumped moving mass |
| Effective winding resistance and torque constant | 2.55 Ω and 0.122 N·m/A | Assumed steady conversion model |
| Supply and maximum modeled DC-link voltage | 36 V and 39 V | Electrical model setpoints |
| DC-link capacitance | 0.038 F | Assumed electrical energy store |
| Drive braking torque lower bound | −0.28 N·m | Controller setting during the deceleration request |
| Motor and bearing heat capacities | 118 J/K and 93 J/K | Assumed lumped thermal masses |
| Mutual thermal conductance | 0.52 W/K | Assumed between nodes |
| Reference bearing-clearance term | 92 µm | Thermal sensitivity baseline |
| Linear expansion and effective length | 12 × 10⁻⁶ K⁻¹ and 0.13 m | Assumed clearance sensitivity |
| Orthogonal stiffness ratio, Z/Y | 1.2 | Assumed support anisotropy |
| Initial pitch and pitch rate bound | 8° and ±0.23 rad/s | Initial state and software rate limit |
| Initial fault and speed transition times | 3 s and 6 s | Study events |
| Integration step, display spacing and run length | 2 ms, nominal 26 ms and 9 s | Numerical grid |

The [equations](https://rrg314.github.io/encabulator-lab/#/me01/engineering/physics) give the airflow, magnetic pressure and additional fixed coefficients. The [benchmark data](https://rrg314.github.io/encabulator-lab/models/me01/benchmarks.json) record the nominal input values alongside observed solver output.

## CAD mass properties and simulation inertia

For a placed part, the axial estimate about the ME-01 shaft line uses `Jx = Jx,centroid + m[(y − yaxis)² + (z − zaxis)²]`, with offsets in metres after applying the recorded placement rotation. The part mass and centroid-axis inertia use generic densities and the nominal B-reps. The estimates below use the specific visual rotation sets and the nominal CAD pitch.

| Rotation set | Included geometry | CAD-derived inertia about X | Effective operating-model value |
|---|---|---:|---:|
| Primary | Waneshaft ME-005, carrier ME-012, six vanes ME-013 and pitch ring ME-014 | 0.00206234 kg·m² | 0.008 kg·m² |
| Secondary | Sleeve ME-006 and output dynamics load ME-030 | 0.000547619 kg·m² | 0.011 kg·m² before host factor |

The model inertias are independent assumed inputs. The CAD sums omit unresolved motor rotor, coupling mass allocation, host equipment and as-built material variations. The differences are calibration items. Inertia measurements or a complete mass model with resolved moving parts are needed to predict startup time. Nominal dimensions, candidate materials and shaft screens use separate bases. [Placement data](https://github.com/RRG314/encabulator-lab/blob/main/data/me01/model-layout.json) · [CAD mass-property register](https://github.com/RRG314/encabulator-lab/blob/main/data/me01/service.json)
