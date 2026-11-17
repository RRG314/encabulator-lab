# Physics and model basis

## Rotation and vibration

The drive axis is X. Transverse translation is modeled along Y. The spin model includes viscous loss, an assumed quadratic drag coefficient and an applied load. The unbalance input is converted from g·mm to kg·m. Radial force is proportional to angular speed squared. One transverse degree of freedom connects sinusoidal force to displacement and acceleration. The free torsion model splits two inertias by a linear spring and damper. Angular momentum changes by the integrated external torque. [NASA rotating system dynamics](https://ntrs.nasa.gov/citations/19740021818).

## Energy and electrical drive

The averaged BLDC equivalent uses equal SI back-EMF and torque constants, series equivalent resistance, and current-limited motoring. The bus estimate represents PWM-averaged input. It partitions mechanical conversion, winding loss and controller loss. The integrated model additionally tracks drag work, external work and stored kinetic energy. Fan electrical power lies outside this motor-drive boundary. This circuit excludes commutation dynamics, inductive switching, regeneration and empirically fitted limits. [Texas Instruments BLDC current model](https://www.ti.com/document-viewer/lit/html/SSZTBP2/GUID-E16F6FD4-B74F-4AB0-990E-C89D493A2398).

The AC example uses a lumped series RL branch and shunt capacitance at a single frequency. It tracks real and reactive power and the net source current angle. The study is an independent linear-circuit calculation.

## Thermal and airflow

Each thermal node uses a single uniform temperature and first-order storage and conductance. The model requires a small internal temperature gradient for physical use. Fan command changes the assumed conductance. The fluid estimate solves the intersection of a quadratic fan curve and a quadratic duct loss. Rotor drag and fan air power are separate terms. Fan curve, filter pressure loss and heat transfer require measurement. [NASA lumped thermal model discussion](https://ntrs.nasa.gov/api/citations/20210015051/downloads/Power_Cable_Mass_Estimation_for_EAP%20-%20submitted%201676.pdf).

## Phase and signal quality

Phase is the signed angle of X times conjugate Y at a known tone. Detrended overlapping Hann windows are aggregated as complex spectra. Windows with missing samples are excluded. The reported magnitude-squared coherence is a quality statistic. Phase uncertainty also depends on sample timing, sensor delays, observability and effective sample count. A validated confidence interval requires a defined calibration and uncertainty study. The quality gate withholds any control eligibility following a signal fault. [SciPy magnitude-squared coherence](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.coherence.html).

## Integration methods

Fourth-order Runge–Kutta solves the state ODEs on a deterministic grid. Vibration and torsion limit the timestep relative to the assumed modal frequencies. Thermal calculations are compared to the first-order closed form. Integrated fault scenarios start at 3 s and remain active. Current and temperature thresholds in the browser describe model conditions.
