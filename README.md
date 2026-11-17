# Encabulator Lab

**Encabulation Systems Inc** is the research and engineering portal for Encabulator Lab. The project includes **25 configurations, 35 sources, and eight explodable CAD assemblies**. Inspect original references beside reconstructed geometry, operate the models under simulated loads, and contribute new configurations or source material.

[![Build and Pages](https://github.com/RRG314/encabulator-lab/actions/workflows/deploy.yml/badge.svg)](https://github.com/RRG314/encabulator-lab/actions/workflows/deploy.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-536975)](LICENSE)

**[Open the Encabulation Systems Inc portal](https://rrg314.github.io/encabulator-lab/)** · [Technical archive](https://rrg314.github.io/encabulator-lab/#/archive) · [Assembly comparison](https://rrg314.github.io/encabulator-lab/#/comparison) · [Contribute a configuration](https://github.com/RRG314/encabulator-lab/issues/new?template=encabulator-configuration.yml)

## Inspect and operate a model

1. On the landing page, rotate or explode the interactive ME-01 Metachronic Encabulator. Select a part, then open the full workbench to keep it selected. In the workbench, use **View configuration** to switch machines or open the source comparison to review the reference evidence.
2. Open **Test bench** and start a run. The [TE-01](https://rrg314.github.io/encabulator-lab/#/simulation) and [RE-01](https://rrg314.github.io/encabulator-lab/#/re01/simulation) benches accept brake, blower, and generator loads. RE-01 adds a crank-driven water loop. The [ME-01 laboratory](https://rrg314.github.io/encabulator-lab/#/me01/simulation) animates two shafts, variable vane pitch, and independent cooling under selectable host loads.
3. Open **Engineering** for drawings, component records, and CAD files. Historical configurations without verified geometry retain their sources and, where available, an operating study.

The five historical CAD reconstructions cover General Electric GE-62, Chrysler CH-88, Micro MI-16, Electro ET-21, and Magneto MT-22. The [GE-62 workbench](https://rrg314.github.io/encabulator-lab/#/archive/ge-1962/assembly) displays the original handbook beside the model. The source review distinguishes published requirements, measured CAD dimensions, and estimates. [Source comparison and operating fixtures](engineering/SOURCE_COMPARISON.md) · [Reference library](engineering/REFERENCES.md)

## Program assemblies

| Configuration | Mechanical and control basis | Technical package |
|---|---|---|
| **[Turbo Encabulator TE-01](https://rrg314.github.io/encabulator-lab/#/explorer)** | Instrumented six-vane rotor, 24 V class drive, two 8 mm journals, flexible coupling and independent cooling. | [Master specification](docs/engineering/TE01_MASTER_SPEC.md) · [BOM](docs/engineering/bom.csv) · [CAD](cad/models/te01/) · [Downloads](https://rrg314.github.io/encabulator-lab/#/engineering/downloads) |
| **[Retro Encabulator RE-01](https://rrg314.github.io/encabulator-lab/#/re01/explorer)** | 48 V class industrial control architecture, 12 mm journals, six pitched marzelvanes, a compliant coupling and guided water-loop load. | [Technical manual](engineering/re01/MASTER_SPEC.md) · [Assembly hierarchy](engineering/re01/ASSEMBLY_HIERARCHY.md) · [CAD](cad/models/re01/) · [Downloads](https://rrg314.github.io/encabulator-lab/#/re01/engineering/downloads) |
| **[Metachronic Encabulator ME-01](https://rrg314.github.io/encabulator-lab/#/me01/explorer)** | 36 V class dual-shaft assembly with variable pitch, active radial stabilization, regenerative power management, and 21 scientific subsystem studies. | [Master specification](engineering/me01/MASTER_SPEC.md) · [Operating equations](engineering/me01/OPERATING_MODEL.md) · [CAD](cad/models/me01/) · [Downloads](https://rrg314.github.io/encabulator-lab/#/me01/engineering/downloads) |

[ME-01 host installation laboratory](https://rrg314.github.io/encabulator-lab/#/me01/installation) · [Interchangeability study](engineering/INTERCHANGEABILITY.md) · [RE-01 source traceability](engineering/re01/SOURCE_TRACEABILITY.md)

## Assembly illustrations

| Turbo Encabulator TE-01 | Retro Encabulator RE-01 | Metachronic Encabulator ME-01 |
|---|---|---|
| ![Turbo Encabulator TE-01 CAD assembly](docs/media/te01-assembly.png) | ![Retro Encabulator RE-01 CAD assembly](docs/media/re01-assembly.png) | ![Metachronic Encabulator ME-01 CAD assembly](docs/media/me01-assembly.png) |

[Power transfer and feedback diagram](docs/media/me01-power-and-feedback.svg) · [Canonical terminology](docs/engineering/terminology.md)

## Quick start

Node.js 22.12 or newer is required.

```sh
npm ci
npm run dev
```

Vite prints the local URL. WebGL 2 enables the CAD views. The parts hierarchy and schematic elevation remain available if graphics initialization fails.

## Layout and regeneration

The [historical register](data/archive/records.json) indexes source configurations separately from project CAD and numerical studies. The [source register](data/archive/sources.json) records publishers, dates, access and evidence scope. GE-62, CH-88, MI-16, ET-21 and MT-22 export from the shared [FreeCAD archive pipeline](cad/models/archive/). Generate the complete set with `python -m cad.models.archive.export` using a Python environment that can import FreeCAD and TechDraw. Pass a record ID to regenerate one configuration.

| Path | Role |
|---|---|
| `data/`, `data/re01/`, `data/me01/` | Machine-specific registries, interface links, assumed simulation inputs, and generated CAD placement data |
| `cad/`, `cad/models/` | Machine-specific solid geometry, CAD assembly, export and verification |
| `engineering/`, `docs/` | Design basis, source traceability, service, validation and research references |
| `src/machines/`, `src/simulation/` | Shared model bindings, solvers, and separate machine parameter sets |
| `public/models/` | Published neutral solids, browser meshes, drawings, BOM and verification reports |

Use `scripts/freecad.sh --mode all` for TE-01, `scripts/freecad-re01.sh` for RE-01, and `scripts/freecad-me01.sh` for ME-01. Set `TE01_FREECAD_PYTHON` to a FreeCAD-enabled interpreter where automatic macOS discovery is unavailable. [CAD generation and units](cad/README.md).

## Verification and deployment

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:browser`, and `npm run build`. Install Chromium for Playwright with `npx playwright install --only-shell chromium`. `TE01_WRITE_NUMERICAL=1 npm test` refreshes numerical evidence. Use `python -m cad.conformance` in the FreeCAD-enabled environment to reopen the neutral and native CAD and verify the drawing projections. [CAD and drawing conformance review](engineering/ASSEMBLY_CONFORMANCE.md)

GitHub Actions publishes the validated static build to Pages. The workflow uses the configured repository base path and checks the assembled and exploded drawings for all eight mechanical models after deployment. Hash routes support browser reload and direct machine links. No repository secrets or backend are needed. Set `PAGES_BASE_PATH=/encabulator-lab/` to reproduce the hosted build locally.

## Research and contributions

Start with the [contribution guide](CONTRIBUTING.md), [citation metadata](CITATION.cff), and [publication policy](SECURITY.md). The [engineering status](STATUS.md) records what has been verified and what remains open. Geometry and test-bench results describe preliminary digital studies. Material qualification, measured performance, containment, and manufacturing release remain open.

The first planned public release is **v0.1.0**. The project uses Semantic Versioning for software releases and separate revision numbers for CAD and drawings. [Semantic Versioning](https://semver.org/) · [Draft release notes](docs/releases/0.1.0.md) · [Changelog](CHANGELOG.md) · [Zenodo archiving](docs/releases/ARCHIVING.md)
