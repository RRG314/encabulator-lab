# Turbo Encabulator TE-01

TE-01 is a preliminary, bench-scale electromechanical engineering study. The static browser application provides a selectable and explodable digital twin, nine canonical assemblies, 30 component records, ten mathematical studies, and a synchronized diagnostic replay.

## Run locally

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Use the local URL printed by Vite. The browser loads a compact procedural model first, then a tessellation of the FreeCAD solids on desktop. Select **View options → CAD mesh** to change model detail. WebGL 2 is required for 3D. The illustrated assembly stations and parts tree remain navigable when graphics are unavailable.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npx playwright install --only-shell chromium
npm run test:browser
npm run build
```

Use `TE01_WRITE_NUMERICAL=1 npm test` to refresh the numerical validation data. Browser checks cover the real WebGL renderer, CAD asset loading, keyboard and touch layout, static hash routes, the geometry fallback, and key accessibility requirements.

## GitHub Pages

In repository settings, select **Pages → Build and deployment → Source → GitHub Actions**. Push to `main` or dispatch **Verify and deploy TE-01**. The workflow runs checks, builds, publishes and verifies the static output. GitHub supplies the project base path to Vite. For an equivalent local build, use `PAGES_BASE_PATH=/turbo-encabulator npm run build`. Hash routes support reloads and links to component records.

No runtime server, external APIs, or repository secrets are required.

## Edit engineering data

- [Master specification](docs/engineering/TE01_MASTER_SPEC.md) and [preliminary BOM](docs/engineering/bom.csv) hold the source baseline.
- `data/parts.json`, `data/assemblies.json`, and `data/connections.json` maintain canonical records, ownership, and interfaces. Run the registry tests after edits. `data/schema/` contains JSON Schema exports and `src/schemas/` defines the runtime contracts.
- `data/functional.json` maps TE-100 through TE-900 architecture roles. `data/service.json` maintains component failure descriptions.
- `data/simulations.json` stores labeled numerical assumptions and default parameter ranges. Equations and solvers are in `src/simulation/`.

## CAD, drawings and exports

See the [CAD workflow](cad/README.md). Editable OpenCascade source, FreeCAD documents, STEP, STL, GLB, a 22-sheet PDF/SVG review set, and validation reports share a preliminary engineering model. Full assets are available under **Engineering → Downloads**.

## Roadmap

1. Disposition the remaining assembled contacts, qualify the alignment and retention stack, and choose vendor components.
2. Complete tolerance, joint, stress, fatigue, rotordynamics and guard-containment reviews.
3. Release electrical drawings, selected connector pinouts and independent safety circuit verification.
4. Acquire calibrated guarded test data for motor torque, bearing loads, thermal response, balancing and signal delay.
5. Fit measured fan/duct behavior and compare against higher-fidelity transient models.

[Implementation status](STATUS.md) · [Verification matrix](docs/engineering/verification-matrix.md) · [Contribution guide](CONTRIBUTING.md)
