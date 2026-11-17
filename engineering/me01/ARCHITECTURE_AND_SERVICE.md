# Mechanical, electrical and service architecture

## Interface chain

```text
External DC source ── protected drive ── polyphase stator ── primary shaft
                                └── DC storage / braking sink       │
                                                     torsional coupling
                                                                    │
Case and datum ── orthogonal bearings ── secondary sleeve ── host boundary
                         ↑                   │
                         │        pitched vanes and shaft telemetry
Gram-meter ── modal discriminator ── suppression matrix ── radial force
    ↑                        └── synchronization and gain scheduling
    ├── fluid pressure / delay         ↑
    └── thermal measurements ── fan dispatch and entropy estimate
```

The Transpanendermic distribution header splits the coolant circuit into thermal exchange, the conductive bypass and the toroidal branch. The normal direction is from the header to the Tremie regulator, then through the exchange path. Calibration coils, acoustic transducers and gimbal stations share timestamped inputs through the measurement boundary. Phase conjugation, causal inversion and non-Abelian orientation filtering execute as defined computational functions.

## CAD and assembly review

1. Establish the baseplane and channel parallelism. Inspect mounting holes, mounting feet, material designation and preload requirements.
2. Fit primary and secondary journals against a shared +X axis. The section views show the concentric primary and sleeve interface. Verify axial and radial float under the intended temperature range.
3. Inspect the six individually indexed vane pivots. Verify pitch sense, actuator travel, imbalance, guard aperture and retention under centrifugal load.
4. Fit coupling hubs and attenuation inserts. Confirm stop clearances independently of the browser separation vectors.
5. Establish fluid direction, drainability, branch flow, sensor calibration and leak-testing procedures. Confirm seals and pressure qualification before filling.
6. Inspect DC isolation, discharge observation, supply protection, thermal paths and guards. Closed-loop testing requires a released stop and interlock procedure.
7. Record as-built shaft runout, measured bearing clearance, pressure and flow calibration. Increment loads within the qualified commissioning plan only.

| Service boundary | Logical connection | Pending hardware detail |
|---|---|---|
| DC distribution | Supply, return, storage monitor, independent inhibit | Fuse curve, fault current, connector pin numbers |
| Polyphase path | Phase U/V/W, encoder reference, temperature input | Winding scheme, coolant path, insulation design |
| Gram-meter | Timestamp, sample quality, offset/scale, calibrated signal | Supplier sensor selection and verified electrical ranges |
| Fluid circuit | Supply, branch, return, pressure taps | Fittings, seals, manifold proof and flow calibration |
| Gimbal and acoustic stations | Inhibit, displacement samples, drive channels | Measured cross gain, alignment, safe operating envelope |

Dimensioned B-rep exports and tool candidates are review aids. Ranked inspection and assembly procedures remain subject to joint selection, confirmed load cases and verified access.
