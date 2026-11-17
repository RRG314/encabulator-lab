# Contributing

Treat the master specification as the design baseline. Preserve original BOM IDs in any revision proposal. Update registry links, dimensions and their evidence at their source. Add cross references for shared service locations and update the generated assets when geometry changes.

Use SI units for physics and millimetres for geometry. Identify design values as targets or assumptions. Label computed output as calculation or simulation, and identify generated waveforms as synthetic. Measured claims require a reproducible procedure, uncertainty and raw evidence.

For mechanical changes, regenerate the CAD and draw sheets, review the B-rep contact report, and explain any new interference or movement. Use `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:browser` and `npm run build` before submitting a change.
