# Verification matrix

| Evidence item | Method | Design release state |
|---|---|---|
| Canonical registry and interfaces | Runtime schema, BOM parity, owner and reciprocal mating links | Automated digital check |
| Shaft and rotor geometry | Common X-axis checks, solid integrity, aperture screening and finite-volume contact report | Schematic geometric verification |
| Exploded presentation | Bounding-box endpoint separation, keyboard control, reversible animation, WebGL fallback | Automated digital check |
| Mechanical analytical model | Closed-form constant-torque spin-up, free-inertia conservation, resonance and timestep refinement | Software verification |
| Thermal and electrical response | Closed-form thermal solution, limits and energy audit | Software verification |
| Phase analysis | Known phase, sample-rate changes, deterministic noise and missing data | Synthetic verification |
| Diagnostic logic | Six sustained fault injections, quality gate and drive inhibit | Simulated logic verification |
| Assembled solid contacts | OpenCascade common volume for candidate component pairs | Open interface dispositions in the published JSON report |
| Rotor and bearing limits | Selected parts, material allowables, stress, modal and balance studies | Pending hardware release |
| Guard and controls | Independent inhibition, overspeed, vibration, thermal and containment verification | Pending prototype qualification |

Run the repository test suite and CAD export to reproduce reported digital checks. The numerical and geometry reports show conditions, observations and dispositions. Physical acceptance requires separate signed measurements.
