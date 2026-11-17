# Original source and CAD comparison

The assembly workbench places the selected reference beside the live 3D viewport. Historical scans retain the original page number and a link to the archival copy. Specifications, photographs, functional schematics, operating simulations and project CAD drawings identify their evidence class. Third-party previews load on request.

| Configuration | Governing evidence | Geometry and verification scope |
|---|---|---|
| TE-01 | [Project master specification](../docs/engineering/TE01_MASTER_SPEC.md) | Measured baseplate, shaft, bearing and vane counts, and maximum assembly envelope. Recessed trim keeps the finished plate at 300 × 200 × 6 mm. |
| RE-01 | [Project technical manual](re01/MASTER_SPEC.md) | Measured 488 × 350 × 10 mm foundation, bearing envelope, vane count, crank throw, stroke and connecting rod centres. The Rockwell record has its own source entry. |
| ME-01 | [Project master specification](me01/MASTER_SPEC.md) | Measured foundation, shaft centreline, journal, sleeve body and indexed vane count. |
| GE-62 | [GE HBK-8359 pp. 801–802](https://attachments.priuschat.com/attachment-files/2019/05/167769_Turboencabulator_1962_GE.pdf) | Catalog figure constrains exterior proportions. Counts are verified for bearings, both vane sets, brushes, feed stations and panel meters. The separately listed original dimension drawing and external wiring remain outstanding. |
| CH-88 | [Chrysler service presentation](https://www.youtube.com/watch?v=MXW0bx_Ooq4) | Visible housing and cutaway features. A-604/41TE is a comparison candidate. Matching its exact revision requires the demonstrator’s part or casting number. |
| MI-16 | [PATH presentation](https://www.youtube.com/watch?v=u4ILnWpi8XY) | Visible enclosure, lid and cabling. Case dimensions, hinge construction and pinout remain estimated. |
| ET-21 | [Keysight presentation](https://connectlp.keysight.com/turboencabulator) and [instrument photographs, figures 2–3](https://www.signalintegrityjournal.com/blogs/4-eric-bogatin-signal-integrity-journal-technical-editor/post/2179-your-next-must-have-widget-the-electro-turbo-encabulator) | Visible instrument and board. Actual netlist, layout and panel dimensions remain outstanding. |
| MT-22 | [AlphaPhoenix builder demonstration](https://www.youtube.com/watch?v=lBOB9SSdDfU) | Visible carrier train and satellites. Counts and placement across the full assembly, polarity and exact dimensions remain open. |
| MN-22 | [University of Illinois PCB exercise](https://courses.grainger.illinois.edu/ece445zjui/documents/pcb_exercise_doc.pdf) and [original student KiCad files](https://github.com/anandpraj/Mini-Encabulator-PCB-Design) | Course schematic and 1.575 × 1.26 in mounting pattern with Ø3.2 mm holes. Course participants choose the outline and placement. The student file’s right Edge.Cuts line ends 0.635 mm away from the mating top edge. The native files remain directly accessible in the archive. |

`python -m cad.conformance` regenerates the source checks after rerunning the affected CAD exporters. The source report includes measured CAD values and the published requirement. A maximum envelope is evaluated as a bound. Drawings and browser tessellations are independently checked against the source solids. [CAD source check report](../public/models/source-conformance.json) · [Digital artifact conformance](ASSEMBLY_CONFORMANCE.md)

## Operating laboratory

The TE-01 and RE-01 load bench integrates shaft angular position with the same states used for the current and speed calculations. The brake, centrifugal blower and generator use different speed-to-torque laws and a common adjustable reference torque. RE-01 also shows its crank-driven water loop, with adjustable pressure head and flow indicated from its pump model. ME-01 replays both integrated shaft angles, vane pitch and the cooling fan. Its installation page passes the selected host to the operating laboratory.

The five historical CAD studies use the same workbench. The GE, Chrysler and Magneto views replay shaft motion. The Micro and Electro views indicate the calculated electrical state on the modeled components and the animated test circuit. The Mini Encabulator study links the original course schematic to a debounced button and potentiometer-driven LED. External fixtures illustrate the simulated loads. Actual adapters, wiring, mounts and operating limits remain unspecified. The X-ray control fades the enclosure while keeping the internal components visible.
