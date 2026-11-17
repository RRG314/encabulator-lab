# Mechanical architecture

The baseplate establishes the Z = 0 mounting plane, with the shaft parallel to X. Two radial journal stations straddle the rotor. The negative-X motor drives a flexible coupling. The stationary motor support is compliant. Shaft location, shoulders, retention stack and tolerances remain open.

The six vanes use one parametric profile and equal angular spacing. The CAD source defines vane span, chord, pitch and thickness independently of the axis transform. The geometry includes hub seats, separate retaining hardware, service guard, open fan duct and spiral insert. Balance correction stock, allowable vibration and rotor retention approval require material and process selection.

## Screening assumptions

The calculations page evaluates a round, unkeyed shaft with simple supports and a concentrated transverse force. The approximate critical speed uses a centered equivalent mass and the centered static stiffness of the shaft. Bearing flexibility, gyroscopic effects, rotor distribution, stress concentration, fatigue and fit effects require separate analysis. The rotor inertia example approximates a uniform disk. The shaft torsional stiffness uses a homogeneous shear modulus and constant polar area moment.

Bearing life uses a hypothetical dynamic rating and equivalent constant load. This is the basic L₁₀ equation for ball bearings. The example bearing is unselected. Bolt shear is an equal-share screen. Preload, slip, fatigue, load eccentricity and thread pullout require joint analysis. Material modulus, shear modulus and thermal expansion values are generic assumptions. No safety factor is established until an allowable and qualified load case are supplied.

[SKF rolling bearing rating life](https://cdn.skfmediahub.skf.com/api/public/0901d196802809de/pdf_preview_medium/Rolling_bearings_-_17000_1_EN_pdf_preview_medium.pdf).

[NASA Fastener Design Manual](https://ntrs.nasa.gov/citations/19900009424).

## Differential Girdle Spring

The baseline DGS is a stationary motor support. Torsional spring and damper response is evaluated as a separate two-inertia study. A travel-limited torsional cartridge would require qualified interfaces, positive retention, fatigue testing and a guarded dynamics assessment before a load-path revision.
