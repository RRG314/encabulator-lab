# ME-01 coupled operating model

**Configuration 0.1 · lumped-parameter simulation**

The model integrates the primary shaft, output sleeve, radial displacement, pitch, cooling and DC-link storage. The nominal run uses a dynamometer boundary from rest. The controller receives a 1,450 rpm request and changes it to 754 rpm at 6 s when regenerative deceleration is enabled.

[Input parameters](https://rrg314.github.io/encabulator-lab/#/me01/engineering/inputs) · [Benchmark results](https://rrg314.github.io/encabulator-lab/#/me01/engineering/benchmarks) · [Executable equations](https://github.com/RRG314/encabulator-lab/blob/main/src/simulation/metachronic/plant.ts)

## State and sign convention

Positive shaft rotation follows the right-hand rule about the CAD +X axis. The lateral channels are Y and Z, with displacement relative to the nominal shaft line at Y = 0 mm and Z = 108 mm. The solver uses seconds, kilograms, metres, radians, newtons and watts internally. Convert speed by ω = 2πn/60 for n in rpm. The solver stores temperatures in °C and uses kelvin for absolute-temperature terms.

| State | Meaning | Unit |
|---|---|---|
| ω₁, ω₂ | Primary and secondary speed | rad/s |
| δ, θ₂ | Relative angle θ₁ − θ₂ and secondary angle | rad |
| y, z, vᵧ, v_z | Transverse displacements and velocities | m, m/s |
| Tₘ, T_b | Motor and bearing lumped temperatures | °C |
| β | Actual modeled vane pitch | rad |
| E_dc | Energy stored on the DC link | J |
| E_in, E_out | Integrated drive input and accounted output | J |

Initially both shafts and lateral channels are at rest, δ = θ₂ = 0, Tₘ = T_b = T_air, β = 8° and E_dc = ½C_dc × (36 V)². Both energy integrals start at zero. The viewer uses θ₂ and θ₁ = θ₂ + δ for the respective assemblies.

## Torsional drive and pitch

```text
δ̇ = ω₁ − ω₂
θ̇₂ = ω₂
τc = kθ δ + cθ (ω₁ − ω₂)
J₁ ω̇₁ = τm − τc − b₁ ω₁
J₂ ω̇₂ = τc − τa − τext
τa = (k₀ + kβ sin² β) ω₂ |ω₂|
β̇ = clamp[2 (βcommand − β), −0.23, +0.23]
```

The nominal primary inertia is 0.008 kg·m². Secondary inertia is 0.011 kg·m² times the selected host multiplier. The default coupling uses kθ = 5.4 N·m/rad and cθ = 0.065 N·m·s/rad. Primary viscous drag b₁ is 0.001 N·m·s/rad. The vane load coefficients k₀ and kβ are 1.9 × 10⁻⁶ and 5.4 × 10⁻⁶ N·m·s²/rad². The pitch gain is 2 s⁻¹ and its symmetric rate limit is 0.23 rad/s.

The commanded drive torque before limiting is `1.85 (J₁ + J₂)(ωrequest − ω₁) + τc + b₁ω₁`, with speed-loop gain 1.85 s⁻¹. The upper limit is the lesser of the input torque ceiling and `Kt max[0, (36 V − Ke |ω₁|)/R]`. The lower limit is 0 in ordinary motoring and −0.28 N·m in the deceleration interval. A sustained trip sets torque to zero. Back-EMF and resistance enter through this algebraic limit. Winding inductance, switching, current slew and controller delay are outside this model.

For an isolated, undriven pair, the relative coordinate has reduced inertia `Jr = J₁J₂/(J₁+J₂)`. The corresponding undamped frequency is `√(kθ/Jr)/(2π)` and damping ratio is `cθ/[2√(kθ Jr)]`. The dynamometer-basis estimates are 5.434 Hz and 0.206. These values describe the isolated coupling mode. The running model adds control, drag and load. [Rotational elements and reflected inertia, MIT 2.04A](https://ocw.mit.edu/courses/2-04a-systems-and-controls-spring-2013/f0e1ffa461429544e4cd40c69a164741_MIT2_04AS13_Lecture3.pdf)

## Host and fluid load

For w = ω₂, define `s = tanh[w/(2 rad/s)]`. The total external torque in the coupled model is the host term plus `s (τload + Ploop/max[10 rad/s, |w|])`. Multiplying any resisting torque by w gives its signed removal of mechanical power from the sleeve.

| Host boundary | Secondary inertia multiplier | Host resisting torque in N·m, w in rad/s |
|---|---:|---|
| Dynamometer | 1.00 | 0.043 s |
| Centrifugal pump | 1.08 | 2.8 × 10⁻⁶ w abs(w) |
| Compressor | 1.10 | 0.035 s + 0.00058 w |
| Generator | 1.14 | 0.17 s / (1 + abs(w)/250) |
| Reflected drivetrain | 1.58 | 0.028 s + 0.00023 w |
| Turbine test shaft | 1.23 | 0.00115 w |

The coolant flow approximation uses `Qloop = (9 × 10⁻⁶ m³/s) v √(p/12 kPa) clamp(abs(w)/ωrequested, 0, 1.15)`, where v is the valve fraction and p is the requested head. The pressure includes the magnetic contribution `ΔpMHD = χ σ B² L u`, with u = Qloop / (1.1 × 10⁻⁴ m²). The power term is `Ploop = (p + ΔpMHD) Qloop`. Inputs use χ = 0.65, σ = 1.4 S/m, B = 0.18 T and wetted length L = 0.058 m. The velocity scale and current closure are assumptions for a conducting bypass. For example, 0.60 m/s gives 0.001026 Pa additional pressure loss. The pump/system transient, seals and pressure rating require separate evidence. [Hartmann-flow context](https://magnetohydrodynamics.physics.wisc.edu/lecture5.html)

The cooling fan is independent of shaft torque. For demand d, free flow Q₀ = 0.032d m³/s, shutoff head Δp₀ = 120d² Pa and resistance Rₐ = 360,000 Pa·s²/m⁶. The model meets the quadratic system curve at `Qa = √[Δp₀/(Rₐ + Δp₀/Q₀²)]` for positive demand. Zero demand sets flow to zero. The nominal d = 0.72 gives 0.01142 m³/s. [Fan and system curves](https://www.energy.gov/sites/default/files/2014/05/f16/fan_sourcebook.pdf)

## Lateral force and temperature

The effective radial mass is 1.42 kg. The unbalance rotates with θ₂. At the nominal input U = 9 g·mm = 9 × 10⁻⁶ kg·m, the forcing amplitude is Uω₂². At a prescribed 1,450 rpm this is 0.2075 N. Actual forcing follows the simulated speed.

```text
M ÿ = Fu cos θ₂ + Fy − Ky y − Cvᵧ
M z̈ = Fu sin θ₂ + Fz − Kz z − Cv_z
Kz = 1.2 Ky
Fi = clamp[−g (3100 qi + 8 vi), −Fmax, +Fmax]
```

The active coefficients are 3,100 N/m and 8 N·s/m. Gain g is `clamp[0.65 + max(0, (Tₘ − T_b)/(60 K)), 0, gainLimit]`. The force limit is 5 N per axis in the nominal state. Raw support stiffness uses 32,000 N/m at the nominal input and is multiplied by `clamp(1 + 0.006 δg_um, 0.75, 1.2)`. Here δg_um is the clearance reduction in µm from `δg = (12 × 10⁻⁶ K⁻¹)(0.13 m)(T_b − T_air)`. The reported effective clearance is 92 µm less that reduction. The stiffness relation is a sensitivity assumption with coefficient 0.006 µm⁻¹. Passive undamped Y and Z frequencies at ambient, with no active terms, are 23.89 and 26.17 Hz. The envelope output is the instantaneous radial magnitude √(y² + z²), converted to µm. [Flexible rotor response context](https://ntrs.nasa.gov/citations/19740021818)

The two-node heat model uses capacities Cₘ = 118 J/K and C_b = 93 J/K and mutual conductance Gₘb = 0.52 W/K. With flows in m³/s, Gₘa = 0.55 + 34 Qa + 4,000 Qloop and G_ba = 0.46 + 20 Qa, in W/K. Model coefficients multiplying flow have units W·s/(K·m³).

```text
Cₘ Ṫₘ = Pcu + 0.46 b₁ ω₁² − Gₘa (Tₘ − T_air) − Gₘb (Tₘ − T_b)
C_b Ṫ_b = Gₘb (Tₘ − T_b) + 0.11 (τa + τext) ω₂ − G_ba (T_b − T_air)
```

The 0.46 and 0.11 fractions allocate modeled losses to the thermal nodes. The solver uses this two-node approximation over the nine-second record. Thermal qualification requires separate steady-state and transient measurements.

## Electrical power and energy audit

The torque constant is 0.122 N·m/A. The model assumes an equal numerical back-EMF constant of 0.122 V·s/rad and effective winding resistance R = 2.55 Ω. Model conversion is Pconv = τmω₁ and winding loss is Pcu = R(τm/Kt)². Supply input is `Pin = max(0, Pconv + Pcu)`. Recoverable electrical power is `Prec = max(0, −Pconv − Pcu)`.

The 0.038 F link starts at 36 V and has a modeled 39 V ceiling. The charging rate is `Pcharge = min(Prec, max[0, Emax − E_dc]/0.020 s)`. The sink absorbs `Pdump = Prec − Pcharge`. The capacitor energy increments by integrating Pcharge and its voltage follows `√(2 E_dc/C_dc)`. From 36 to 39 V, ideal storage increases by 4.275 J. The energy allocation carries no component voltage and ripple ratings. [Capacitor energy relation](https://openstax.org/books/university-physics-volume-2/pages/8-3-energy-stored-in-a-capacitor)

The reported residual is

```text
ε = ∫ Pin dt − Δ[½J₁ω₁² + ½J₂ω₂² + ½kθδ² + E_dc]
    − ∫ [Pcu + Pdump + b₁ ω₁² + (τa + τext) ω₂ + cθ(ω₁ − ω₂)²] dt
```

Radial actuator demand `|Fy vᵧ| + |Fz v_z| + 0.3 W` when gain is active, and the separate fan supply, sit outside this audit. The lab reports drive input plus radial demand under **Drive + radial input** and Pin/36 V under **Drive supply current**. **Regeneration** is the deceleration command mode. Recovered power may fall to zero after the link charges, and the drive can draw power again as speed settles.

## Time integration and fault scope

Classical RK4 uses 4,500 increments of 2 ms over 9 s. The nominal report records every 13 increments, then includes the exact terminal time. This gives 348 rows at 26 ms spacing with a shorter final interval. The CSV stores sample times explicitly. The selected disturbance starts at model time 3 s. A trip remains active through the run. The recorded modes are conditions at sample times. The six degraded scenarios change forcing, support factors, cooling, force limit or flow area while retaining the modeled drive.

The 21 subsystem studies use their own defined inputs and analysis domains. The coupled integration uses the pressure-loss, scheduled-gain and entropy-production relations directly. The eigenmode and nonlinear stability studies are independent reference calculations. See the [scientific subsystem register](https://rrg314.github.io/encabulator-lab/#/me01/systems) and [verification protocol](https://rrg314.github.io/encabulator-lab/#/me01/engineering/validation).
