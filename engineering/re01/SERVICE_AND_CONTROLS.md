# RE-01 service and control architecture

## Isolation and service order

Establish a released isolation procedure for electrical input, stored inertia and residual fluid pressure before physical service. The package defines an assembly sequence for review. Confirm access and joint geometry before selecting tooling and tightening values.

1. Establish deck flatness and support loading. Inspect isolation pad seating and rail contact.
2. Verify that the bearing seats share a datum. Inspect axial collar location and measure shaft runout using a suitable reference indicator.
3. Check vane seating and keeper retention. Establish allowable imbalance, inspect rotor swept clearance, and document measured values during guarded commissioning.
4. Review attachment of the motor, flexible coupling, cooling circuit, and the transparent rotor and linkage enclosure segments.
5. Validate valve flow direction and clearance of the guarded crank-slider across a complete cycle. Qualify loop pressure and sealing before circulation.
6. Confirm power separation, continuity, signal conditioning and the independent stop-chain response before drive enable.
7. Calibrate indexed speed, vibration, temperature and pressure channels against traceable references. Record measurement bandwidth and uncertainty.
8. Establish safe prototype commissioning limits and pass conditions. Demonstrate stop, dropout, guard-state, power restoration and manual reset behavior before controlled speed increases.

## Electrical and sensor assignment

```text
48 V DC design boundary
    ├── fused DC distribution ── independent enable ── BLDC drive ── motor phases
    ├── protected fan supply ─────────────────────────────────────── axial fan
    └── isolated supervisory supply ── controller and field I/O
                                         ├── speed reference and acquisition
                                         ├── temperature, vibration, pressure
                                         └── phase acquisition ── quality gate
Guard, stop, watchdog ── independent stop request ── drive inhibit and latch
```

| Interface | Logical signals | Verification required |
|---|---|---|
| J1 DC feed | DC+, DC−, protective bonding where required | Fault current, conductor selection, terminal assignment and insulation |
| J2 drive | U, V, W, feedback reference | Motor/drive compatibility and installed phase ordering |
| J3 synchronous pickup | reference, return, edge | Timing, scaling, shielding and dropout |
| J4 instrumentation | sensor excitation, returns and isolated inputs | Vendor channel design, calibration and common-mode limits |
| J5 interlock | guard state, stop state, reset authorization | Safety-rated logic, stopping response and fault validation |

Connector cavity numbers and final wiring drawings depend on selected hardware. The site models a software stop latch and aspirational control architecture. It has no interface for live equipment.
