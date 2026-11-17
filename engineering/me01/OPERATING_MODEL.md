# Coupled operating equations

| Domain | Model relation | Definitions |
|---|---|---|
| Drive shaft | J₁ ω̇₁ = τₘ − τc − τd,1 | J is inertia [kg·m²], ω speed [rad/s] and τ signed torque [N·m]. |
| Output sleeve | J₂ ω̇₂ = τc − τa − τh | Aerodynamic torque τa and host load τh oppose positive rotation in the nominal scenario. |
| Differential girdle coupling | τc = kθ Δθ + cθ Δω | kθ [N·m/rad], cθ [N·m·s/rad], relative phase Δθ [rad]. |
| Orthogonal compensation | M q̈ + C q̇ + K q = Fu + Ffield | q [m] has Y and Z channels, M [kg], K [N/m], C [N·s/m]. |
| Hydrocoptic flow load | τa = [k₀ + kβ sin² β] ω₂|ω₂| | β is commanded pitch [rad]; k₀ and kβ [N·m·s²] are assumed coefficients. |
| Electromechanical conversion | Pconv = τₘ ω₁; Pcu = R(τₘ/Kt)² | P [W], R [Ω], Kt [N·m/A]. |
| DC-link energy | Ecap = Cdc Vdc²/2 | E [J], Cdc [F], Vdc [V]. The model allocates recovered energy to the link or to the sink. |
| Thermal energy | Cth Ṫ = Pthermal − G(T−Ta) | Cth [J/K], temperature difference [K], conductance G [W/K]. Two nodes exchange heat. |
| Hydrostatic and magnetic demand | Ploop = Q(Δp + ΔpMHD) | Q [m³/s], pressure [Pa]. ΔpMHD is a small current-closure-qualified term for a conducting aqueous bypass. |
| Bearing expansion | Δg = −α L ΔT | g [m], α [K⁻¹], effective L [m]. The nominal clearance sensitivity enters the lateral stiffness calculation. |

The drive accepts a bounded speed request, available current and torque. A deceleration request at 6 s enables regeneration; the converted power is first reduced by winding loss. Excess power enters the modeled sink. The reported motor-drive energy residual includes shaft, coupling and DC-link storage, winding loss, dissipation, and exported load work. Radial actuator supply is reported as an auxiliary boundary. Fan electrical supply is a separate boundary.

Fourth-order Runge–Kutta uses a nominal 2 ms step and records an approximately 25 ms sampled trajectory. Fault studies introduce a sustained condition at 3 s. Latched stop conditions set motor torque to zero. Degraded scenarios alter imbalance, support stiffness, cooling, radial force limits and flow area. The control calculation does not communicate with physical equipment.

## Host boundary

| Host | Mechanical approximation |
|---|---|
| Dynamometer | Bounded constant resisting torque |
| Centrifugal pump | Torque proportional to speed squared |
| Compressor | Constant term and a linearized speed-dependent term |
| Generator | Bounded passive electrical torque sink |
| Drivetrain | Increased reflected inertia and speed-dependent load |
| Turbine test shaft | Passive rotational damping with reflected inertia |

The signed host power is τhω₂. Thermal rejection and installation compatibility are outside the mechanical host comparison. Electrical and signal domains retain the ME-01 boundaries.
