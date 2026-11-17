# Retro Encabulator RE-01 verification matrix

| Check | Evidence | Limit |
|---|---|---|
| Component IDs, owners, mating and telemetry links | JSON schema and automated registry checks | Physical interfaces require drawing approval. |
| Native solids, journal centers, radial guard envelope and endpoint separation | Generated OpenCascade report | Dispositions for assembled contacts remain open. Swept disassembly and tool access are engineering review items. |
| Rotor vane population | Six indexed CAD instances and local mass/centroid/inertia calculation | Material lot acceptance and balancing remain open. |
| STEP, STL, GLB, drawings and BOM | Regenerable export and artifact integrity tests | Reference models and drawings carry preliminary dimensions. |
| Crank-slider motion | Closure, 24 mm stroke and derivative tests | No prototype linkage load or bearing-life measurements. |
| Industrial automation | Fault latch, inhibited current, tracking, restart/reset, deterministic time grid and timestep refinement | Simulated state machine; disconnected from actual industrial equipment. |
| Site parity and access | Browser checks for model switching, mesh loading, part integrity, full and scoped separation, touch and fallback | Visual scope differs from physical service conditions. |
| Prototype qualification | Structural and electrical review, guarded inspection, pressure and loss characterization | Open. |

See the live verification page for observed results and the JSON downloads for machine-readable evidence.
