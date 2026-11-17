# Contributing to Encabulator Engineering

Use a branch from the current default branch. Keep Turbo Encabulator TE-01 and Retro Encabulator RE-01 identities stable. File a technical issue for design proposals and include the model code, part ID or study name, revision, evidence, and the expected result.

## Change a machine

- Keep parts, assemblies, interfaces and instance keys linked. Add a new identity for an independently selectable component.
- Treat dimensions as targets, B-rep measurements as digital geometry evidence, and numerical curves as simulation. Include quantities, units, material assumptions, and the basis of each claim.
- RE-01 parts and placements are generated from the FreeCAD assembly definition. Update the source and regenerate both the register and affected exports. TE-01 retains its baseline BOM and geometry path.
- Add verifiable references to the reference library. Check licensing before adding external material. Keep private or proprietary data and installation details out of source, CAD metadata, logs and screen captures.

## Reproduce checks

```sh
npm ci
npm run lint
npm run typecheck
npm test
npx playwright install --only-shell chromium
npm run test:browser
npm run build
python3 scripts/audit-publication.py
```

Give the expected calculations and actual observations in pull requests. State any unresolved contacts or physical evidence gates. The deployment workflow validates both machine routes and available reports.
