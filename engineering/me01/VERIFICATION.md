# ME-01 verification protocol and results

**Design revision 0.1 · reproducible digital checks**

Verification covers geometry, exported files, equation identities and numerical reference cases. Physical validation requires a calibrated prototype test with measured inputs and uncertainty. The applicable engineering status, unresolved contacts and reference assumptions remain part of the record. [Model credibility and uncertainty methods, NIST](https://www.nist.gov/publications/methods-uncertainty-quantification-computational-modeling-and-simulation-harmonizing)

## Geometry and file verification

| Check | Criterion or method | Recorded result |
|---|---|---|
| Geometry registration | Positive closed volume, 41 physical definitions with matching mesh definitions, 48 placed instances and no solid assigned to the computational records | Pass |
| Primary and secondary journal centre alignment | Four shaft and bearing placement centres share Y = 0 mm, Z = 108 mm | Pass |
| Rotor placement | Six vane instances indexed at integral multiples of 60° | Pass |
| Simplified guard aperture clearance | 78 − √(70² + 5²) mm is positive | 7.8217 mm calculated |
| Critical bearing and blade pairs | No recorded finite-volume interference in the three specified shaft/sleeve bearing and vane-frame pairs at the reference pose | Pass |
| Assembled contact review | Check intersecting nominal solids and retain finite-volume findings for engineering disposition | 23 review findings |
| Fully separated pose | No pair exceeds the bounding-envelope threshold in the endpoint check | Pass |
| Parameter propagation | Rebuild affected geometry after changing journal diameter 13 → 13.4 mm, pitch 14 → 17° and fan diameter 75 → 77 mm | Five part definitions respond |
| Drawing and neutral-file audit | Verify individual STEP files, 41 component drawings, two overall sheets and pose equivalence within documented round-trip tolerances | 462 solids in each assembled and separated native and STEP file pose, checks pass |

An endpoint check establishes the assembled or fully separated geometry only at its stated pose. Swept paths, hot clearance, vane travel, housing and clamp details and physical containment require additional verification. Two reference examples requiring disposition are the output sleeve and coupling hub pair, and the vane carrier and actuator ring. The CAD contact quantities are geometric intersections and do not determine joint fit or preload. [Geometry report](https://rrg314.github.io/encabulator-lab/models/me01/validation.json) · [Assembly conformance report](https://rrg314.github.io/encabulator-lab/models/assembly-conformance.json)

## Numerical verification

| Case | Acceptance or comparison | What it establishes |
|---|---|---|
| Analytical station identities | 128 mT at the stated linear quadrupole boundary, 4:1 magnetic pressure scaling on field doubling, zero entropy production for equal temperatures, 1,700 N/m static stiffness, zero commutator for the identity rotation, and unit synchronous correlation | Arithmetic and unit-convention checks for selected stations |
| Scientific input coverage | All 21 studies produce finite, correctly sized outputs at the minimum, default and maximum slider settings | Tested study boundaries |
| Coupling equation | Maximum absolute residual ≤ 10⁻⁹ N·m across the nominal sampled rows | Independent reconstruction from relative angle and both speeds |
| DC-link headroom | 4.275 J recovered storage from 36 to 39 V within 10⁻⁸ J in the nominal case. With regeneration off, the link stays at 36 V and charging remains zero | Internal energy allocation at these settings |
| Drive-energy accounting | Nominal terminal residual within 0.2 J. Observed about −3.92 × 10⁻⁶ J | Closure of the defined model energy terms |
| Timestep sensitivity | Compare terminal speeds at 2 ms and 1 ms. Allow up to 1.2 rpm change. Observed primary and secondary differences of 6.35 × 10⁻⁶ and 2.93 × 10⁻⁵ rpm | Terminal speed convergence for the nominal scenario |
| Shaft screening | 31.5 N at each support and 85.1516865 µm deflection for the stated ideal centered case | Static solver checks using the reference dimensions and load |
| Fault mode | No active fault before 3 s. Seven defined trip cases inhibit drive supply input. Six degraded states retain the modeled drive and report the selected disturbance | Expected software gating and scenario routing |
| Output preservation | Check the 348-row CSV, expected units, time endpoints and solver-aligned benchmark metadata | Downloaded reference-data consistency |

The timestep comparison concerns terminal rotational speed. Transient peaks and discontinuity timing have separate sampling sensitivity. Quoted tolerances apply to the software cases. The nominal reference run gives no experimental accuracy or confidence interval. [Numerical observations](https://rrg314.github.io/encabulator-lab/models/me01/numerical-validation.json) · [Benchmark results](https://rrg314.github.io/encabulator-lab/#/me01/engineering/benchmarks)

## Physical verification required for qualification

| Sequence | Evidence to record |
|---|---|
| Geometry and joints | As-built journal fits, runout, coupling travel, minimum vane-to-guard clearance over the complete motion, material identity and contact dispositions |
| Drive and containment | Qualified rotor balancing, independently verified inhibit path, acceptable stop response and guarded load-envelope test |
| Mechanical calibration | Measured torque, dual speed and relative phase, reflected inertia, coupling stiffness and damping with instrumentation uncertainty |
| Fluid and actuator calibration | Pressure and flow curves, sealed path verification, electrical isolation, available radial force and sensor scale on each axis |
| Thermal and regenerative comparison | Motor and bearing temperature transients, supply power, DC-link voltage, sink power and independent energy balance |
| Model comparison | Publish calibrated measurements and uncertainty with repeat conditions, residual plots and any changes to the numerical coefficients |

Numerical reports regenerate with `TE01_WRITE_NUMERICAL=1 npm test -- tests/metachronic.test.ts`. `python -m cad.conformance` in the FreeCAD-enabled environment reopens the canonical neutral and native files and verifies the drawings. [CAD method and tolerances](https://github.com/RRG314/encabulator-lab/blob/main/engineering/ASSEMBLY_CONFORMANCE.md)
