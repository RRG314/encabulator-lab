# Design decisions and model assumptions

## Geometry

- RE-01 uses a larger X-axis machine bed and a distinct raised cabinet with I/O slices, DIN support, split service access and field glands. Motor and control gear are generic component envelopes.
- The bearing stations lie at X = ±82 mm at Z = 84 mm. Shaft and radial bearing fits are nominal. The candidate outer ring and pedestal radius differ by 0.07 mm in the display model. This value separates reference shapes and prescribes no machined fit.
- The winding geometry uses twelve groups. For slot index i, the polar axis is θᵢ = 2πi/12. Each axial opening is the intersection of the annulus with a 5 mm tangential by 8 mm radial slot, centered at r = 25.8 mm. This definition gives a repeatable semi-boloid terminological assignment. It establishes no magnetic loss, insulation class or rated torque.
- The rotor uses six instances of a single pitched profile. The inner edge is the root frame; the positive local radial axis points to the tip. The mass, centroid and shaft-axis inertia are calculated from B-rep volumes and generic densities. Mixed material and fastener boundaries await selection.
- The enclosure uses planar openable segments and a curved airflow transition. An internal logarithmic spiral remains an optional concept pending fan curve and pressure measurements. Exact containment capacity and panel attachment design remain open.

## Computation

- The electrical plant is an averaged, positive-torque current-limited brushless drive. (V = Ri + L\,di/dt + k_e\omega) governs the winding family. The implemented quasi-static current substitutes a settled inductive term. An independent RL bench experiment estimates the winding step response with an explicit inductance input.
- Unbalance uses (F = me\omega^2). A supported single-degree-of-freedom screen excludes shaft gyroscopics and nonlinear bearings.
- A 20:1 reduction maps the waneshaft to the planar crank-slider model. The water loop assumes a 9 mm pump bore and 0.8 volumetric efficiency. Pressure uses a specified static head, distributed loss and minor loss. These are scenario inputs. The pump receives motor torque through the assumed reduction; the estimated pump power is part of the torque load.
- The input-energy audit covers the motor-drive boundary. Fan electrical power lies outside that boundary. Both machines report simulated RPM, current, temperatures and vibration.
