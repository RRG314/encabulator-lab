# Electrical architecture

The nominal system input is 24 V DC. Fuse and disconnect selection requires the selected supply's available fault current, wire ratings and inrush behavior. The switching components, driver, logic converter and connector pinouts are open selection items.

```text
TE-022 DC supply → TE-023 fuse / disconnect → independent stop path → TE-004 driver → TE-003 motor
                         ├─ protected fan branch → TE-012
                         └─ protected DC/DC conversion → TE-016 control and instrumentation

TE-024 guard interlock → independent stop path
TE-021 latching stop   → independent stop path

TE-018 speed ───────┐
TE-017 acceleration ─┼─ timestamped inputs → TE-016 → TE-027 phase and quality
TE-019 temperature ─┤                       └─ bounded request → TE-004 driver
TE-020 bus V and I ─┘
```

| Channel | Logical interface | Qualification |
|---|---|---|
| Speed reference | Indexed pulse with edge timestamp | Pulse count, jitter, conditioning and dropout |
| Housing acceleration | Digital SPI or I²C candidate | Axis orientation, range, anti-alias response, saturation |
| Motor and housing temperature | Two calibrated probe channels | Cold junction or conversion method as applicable, lag and attachment |
| Protected bus | Time-aligned voltage and current | Polarity, common mode, sensing boundary and calibration |
| Drive request | Driver-supported PWM or serial protocol | Logic level, fallback on timeout and independent inhibit |
| Fan | Protected branch with optional PWM | Current, tach feedback availability and stall behavior |
| Safety system | Guard and latching stop to independent hardware motor inhibit | Released circuit, fault analysis, stop category and restart sequence |

Connector pin numbers, conductor sizes, shield terminations and mating connector models require vendor selection. The drawing must establish isolation, protection, grounding, EMC and strain relief. Hardware motor inhibition remains independent of supervisory firmware.
