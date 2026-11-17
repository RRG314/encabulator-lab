# Safety and hardware release

**Status: design and simulation only.** The casing represents a guarded volume. Its material grade, attachment, fragment loading and impact containment require review. The model diagrams and drawings are reference artifacts for engineering review.

| Hazard | Design intent | Release evidence |
|---|---|---|
| Rotor or coupling fragment | Fixed containment about the rotating load path and independently verified overspeed inhibit | Material traceability, dynamic loading and containment analysis, qualified guard trial |
| Pinch, entanglement or unexpected restart | Access interlock, independent latching stop and guarded manual restart | Interlock open, wiring fault, restart and power restoration tests |
| Bearing binding or loss of retention | Defined locating and floating restraints, fits, preload and temperature monitoring | Alignment, thermal expansion, measured fits and guarded commissioning |
| DC short, overload and hot conductors | DC-rated protection and isolation selected against available fault current and wire ampacity | Wiring drawing, fault current, disconnect ratings and insulation checks |
| Thermal excursion | Independent temperature limits, cooling fault indication and drive inhibit | Probe calibration, operating thermal map and restricted airflow tests |
| Invalid telemetry | Tachometer dropout and stale communication latch the simulated inhibit | Timestamp, watchdog and sensor fault injection with independent motor-enable observation |

## Release gates

1. Freeze interface drawings, load cases, design allowables and commercially selected components.
2. Review material traceability, rotor stress and fatigue, balance criteria, containment, fastener joints, and electrical protection.
3. Inspect as-built joints, geometry, conductors and measured alignment under an approved procedure.
4. Demonstrate safe energy isolation, guard interlock, emergency stop and fault latch without exposed motion.
5. Review guarded commissioning and proof-test procedures with qualified personnel. Establish speed increments, trip limits, exclusion zones and acceptance evidence before applying energy.
