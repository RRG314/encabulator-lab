# Retro Encabulator RE-01 technical manual

**Revision 0.1 · preliminary design · millimetres and SI units**

The RE-01 is an independent 48 V DC bench-study machine with a 12 mm journal drivetrain, a six-vane rotor, a separate axial cooling stage, an instrumented crank-slider water loop, and a raised control cabinet. Candidate rotor operation spans 300–2,100 rpm. The baseplate is 488 × 350 mm with a 10 mm nominal thickness. The preferred assembly frame is right-handed, with the rotor on +X and the machined deck at Z = 0. The model has a defined dry assembly, a separated state, orthographic cutaways and local component frames.

| Function | Proposed implementation | Verification basis |
|---|---|---|
| Rotation and support | Permanent-magnet brushless drive, shouldered waneshaft, two 12 × 28 × 8 mm radial bearing envelopes and compliant coupling | CAD datum and bearing-interface checks. Fit, fatigue and balance remain open. |
| Rotor aero load | Six pitched vanes, indexed roots and a bolted casing. The cooling fan has a separate drive. | Parametric geometry and radial swept envelope. Air loading uses assumed coefficients. |
| Reciprocation | Eccentric crank 12 mm, connecting rod 68 mm, 24 mm nominal stroke and an assumed 20:1 reduction | Geometric closure and sample trajectory. Final reduction mechanism and full swept tool access require review. |
| One-direction water delivery | Low-head demonstration loop, positive displacement approximation and a separately modeled check valve | Water delivery and pressure drop are calculations. No pressure rating assigned. |
| Electrical drive | Three-phase brushless architecture, averaged electrical model, isolated command boundary and independent stop inputs | TI winding voltage model R2. Winding design, protection and EMC release pending. |
| Supervisory control | State feedback, model interlock latch, simulated current, temperature, speed and vibration | Repeatable sampled calculations and injected sensor/control faults. |

The Rockwell transcript supplies terminology. The CAD dimensions, materials, winding geometry and operating points are project proposals. See the [reference library](https://github.com/RRG314/turbo-encabulator/blob/main/engineering/REFERENCES.md) and source traceability register. The software output represents simulation; physical measurement and prototype acceptance are separate evidence requirements.
