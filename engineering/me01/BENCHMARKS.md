# ME-01 reference runs and engineering screens

**Configuration 0.1 · calculated and simulated results**

The reference runs use the executable operating model and the input values in the simulation register. Values below are rounded for inspection. The JSON preserves the report precision and the nominal CSV supplies the full time series.

[Benchmark JSON](https://rrg314.github.io/encabulator-lab/models/me01/benchmarks.json) · [Nominal trajectory CSV](https://rrg314.github.io/encabulator-lab/models/me01/nominal-trajectory.csv) · [Numerical verification JSON](https://rrg314.github.io/encabulator-lab/models/me01/numerical-validation.json)

## B1 · Nominal dynamometer run with deceleration

Use the ME-01 test bench defaults and select **Dynamometer**, **None** for the fault scenario, and **Regenerative deceleration** on. The 1,450 rpm request is reduced to 754 rpm at model time 6 s. The commanded pitch is 14°. The sampled startup reaches about 1,017 rpm on the primary before deceleration.

| Time (s) | Primary (rpm) | Secondary (rpm) | Relative angle (rad) | Pitch (°) | Coolant (mL/s) | DC link (V) | Power to link (W) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.000 | 0.000 | 0.000 | 0.00000 | 8.000 | 0.000 | 36.000 | 0.000 |
| 3.016 | 563.714 | 563.728 | 0.04987 | 13.986 | 2.379 | 36.000 | 0.000 |
| 5.980 | 1016.622 | 1016.632 | 0.04613 | 14.000 | 4.291 | 36.000 | 0.000 |
| 6.006 | 1014.670 | 1020.061 | 0.04429 | 14.000 | 4.305 | 36.076 | 16.320 |
| 9.000 | 754.006 | 754.005 | 0.01485 | 14.000 | 3.182 | 39.000 | 0.000 |

At 9 s the motor node is 24.128 °C, the bearing node is 22.119 °C and the modeled radial displacement is 1.809 µm. The maximum sampled radial displacement during the run is 5.593 µm. About 4.275 J accumulates in the capacitor model. Peak sampled charging power is 16.320 W. The maximum sampled absolute drive-energy residual is 3.92 × 10⁻⁶ J. Peaks refer to the recorded sample grid.

With deceleration off, the same 9 s run ends at approximately 1,383 rpm on both shafts and a 36 V link. This comparison changes both the speed request and the braking condition. The trajectory CSV separates the drive supply current, charging power, and drive-plus-radial input power. [Run the operating model](https://rrg314.github.io/encabulator-lab/#/me01/simulation)

## B2 · Host installation comparison

Use a 1,500 rpm request, regeneration off, and compare at 9 s. For each row, the direct drive uses the same reflected output inertia and host law as the ME-01 case. The ME-01 adds its primary inertia, coupling and additional load terms. The direct drive and ME-01 use the same voltage and drive limits. The pitch values are commands.

| Host load | Output inertia (kg·m²) | Direct-drive speed (rpm) | ME-01, 14° (rpm) | ME-01, 8° (rpm) |
|---|---:|---:|---:|---:|
| Dynamometer | 0.01100 | 1479.82 | 1383.06 | 1389.57 |
| Centrifugal pump | 0.01188 | 1471.12 | 1388.22 | 1394.28 |
| Compressor | 0.01210 | 1447.55 | 1210.82 | 1215.50 |
| Generator | 0.01254 | 1456.42 | 1014.99 | 1018.27 |
| Reflected drivetrain | 0.01738 | 1480.77 | 1115.04 | 1118.24 |
| Turbine test shaft | 0.01353 | 1434.07 | 1134.69 | 1138.49 |

The underlying model compares mathematical load boundaries. The mechanical installation, containment, coupler dimensions, efficiency and torque ratings remain open. [Installation laboratory](https://rrg314.github.io/encabulator-lab/#/me01/installation) · [Comparison source](https://github.com/RRG314/encabulator-lab/blob/main/src/simulation/metachronic/installation.ts)

## B3 · Nominal shaft and bearing screening

The ideal shaft screen uses a 13 mm uniform round section, a 263 mm simply supported span, a 63 N midspan point load and 0.47 N·m of steady applied torque. The nominal elastic and shear moduli are 200 and 77 GPa. This model uses a 0.64 kg, 70 mm-radius disk, a 0.00007 kg·m² drive inertia, an assumed bearing rating C = 1,800 N, equivalent load P = 78 N and 1,450 rpm for the constant-speed bearing conversion.

| Quantity | Relation | Calculated |
|---|---|---:|
| Support reactions | F/2 at each support | 31.5 N each |
| Midspan bending moment | F L/4 | 4.142 N·m |
| Outer fibre bending stress | 32 M/(π d³) | 19.205 MPa |
| Maximum torsional shear | 16 τ/(π d³) | 1.090 MPa |
| Nominal equivalent stress | √(σ² + 3τ²) | 19.297 MPa |
| Midspan deflection | F L³/(48 E I), I = π d⁴/64 | 85.152 µm |
| Shaft-only disk critical speed | √[(48 E I/L³)/m] converted to rpm | 10,267 rpm |
| Ideal solid-shaft torsional stiffness | G π d⁴/(32 L) | 820.934 N·m/rad |
| Basic ball-bearing life | (C/P)³, in millions of revolutions | 12,289 million revolutions |
| Basic constant-speed life | L₁₀ × 10⁶/(60 n) | 141,258 h |

The 820.934 N·m/rad ideal shaft stiffness and 5.4 N·m/rad compliant-coupling input describe different elements. The critical-speed result uses rigid lateral supports, a massless beam and a centered disk. The assembled rotor includes a separate sleeve, finite support stiffness, vane motion and coupling geometry. The bearing life uses a hypothetical C and P. Shaft shoulders, fatigue, fit, preload, impact containment, load spectrum and lubricant evidence are required for qualification. [Interactive shaft screen](https://rrg314.github.io/encabulator-lab/#/me01/engineering/calculations) · [SKF bearing-reference basis](https://cdn.skfmediahub.skf.com/api/public/0901d196802809de/pdf_preview_medium/Rolling_bearings_-_17000_1_EN_pdf_preview_medium.pdf)

## Reproduce

Run from the repository root with the locked Node dependencies installed.

```sh
npm ci
TE01_WRITE_NUMERICAL=1 npm test -- tests/metachronic.test.ts
npm test -- tests/metachronic.test.ts
```

The first test run writes the benchmark JSON, nominal trajectory CSV and numerical verification JSON under `public/models/me01/`. The second run checks the checked-in artefacts against the current solver. [Source and reference cases](https://github.com/RRG314/encabulator-lab/blob/main/tests/metachronic.test.ts)
