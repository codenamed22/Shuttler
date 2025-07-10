# Kalman Filtering in the Shuttle ETA Engine

## What is Kalman Filtering?
Kalman filtering is a recursive estimation technique used to predict and update the state of a system over time, even in the presence of noise or missing data. It combines a predictive model (based on physics or kinematics) with real-time measurements (e.g., GPS data) to produce a more accurate and smooth estimate of the system's actual state.

In our case, the hidden state is the **position and velocity** of a moving bus. The Kalman filter fuses live GPS readings with our motion model to track buses smoothly and reliably, improving ETA prediction, map display, and downstream analytics.

The filter operates in two steps:

1. **Prediction**: It forecasts the next state using the previous state and a motion model.
2. **Update**: It corrects that prediction based on the newest sensor reading (e.g., GPS), adjusted by how much we trust the measurement.

---

## Why Kalman Instead of Moving Average or Exponential Smoothing?

### Moving Average (MA)

Moving average smooths data by taking the average of the last 'n' values. While simple and easy to implement, it has several drawbacks:

* It gives equal weight to all past samples, which causes the model to lag behind sudden changes in the data.
* It lacks any concept of motion dynamics like speed or acceleration.
* It cannot separate noise from real changes in signal, leading to poor estimates during sharp turns or stops.

### Exponential Smoothing (ES)

Exponential smoothing gives exponentially decreasing weights to older observations, making it more responsive than MA. However, it still has key limitations:

* It only uses a single smoothing parameter that is hard to tune across different noise conditions.
* Like MA, it lacks a system model and does not explicitly track velocity or acceleration.
* It underperforms when GPS data is irregular or noisy, since it treats all movement as passive trends in position.

### Why Kalman Filter?

The Kalman Filter was chosen because it addresses all the above shortcomings by explicitly modeling both **position and velocity** of the bus, enabling:

* **State-aware smoothing**: Rather than just reacting to past positions, Kalman predicts where the bus *should be*, based on how fast it is moving.
* **Adaptability to noise**: Through tuning parameters, it adjusts the trust between model and measurement based on conditions.
* **Handling of irregular data**: It works effectively even when GPS readings come in at irregular intervals or are temporarily missing.
* **Real-time prediction**: Even if no new GPS fix is available, the filter can forecast position from velocity, allowing ETAs to remain useful.

In short, Kalman filtering offered a principled and dynamic approach to tracking that was far superior to Moving Average for moving vehicles when we tried it.

---

## Our Model: Configuration and Interpretation

### State Vector

We track two quantities:

* **Position**: Where the bus is along its route. This can be represented as distance along a path or a transformed coordinate.
* **Velocity**: How fast the bus is moving.

This two-element state vector is updated continuously as new data arrives.

### Process Model (Prediction)

The system uses basic motion equations:

* New position = old position + (velocity × time elapsed)
* New velocity = old velocity (assumes constant speed between updates)

This is implemented via a state transition matrix. The prediction accounts for time passed (Δt) since the last measurement.

**Process noise (Q)** is introduced to account for unpredictable movements like braking, turning, or stopping at a red light. We choose larger values of Q for fast-moving or erratic routes so that the filter remains responsive to sudden changes.

### Measurement Model (Update)

We assume our only direct measurement is the GPS-derived position (not velocity). The Kalman filter then adjusts its predicted position and velocity based on this observation.

**Measurement noise (R)** reflects how trustworthy the GPS data is. Typical civilian GPS has an uncertainty of about 5–15 meters. If R is high, the filter trusts the GPS less and relies more on its internal prediction.

---

## Tuning for Real-World Use

* A **high Q** means you expect the bus to vary a lot in motion (e.g., speeding up, slowing down frequently). The filter will rely less on previous state and be more agile.
* A **high R** means GPS is noisy or unreliable. The filter will discount the GPS reading and rely more on its prediction.

For slow buses or those on fixed, predictable routes, lower Q values make sense to stabilize the output. For fast, unpredictable traffic, higher Q helps keep the estimates accurate.

---

## Summary

Kalman filtering is essential for producing accurate, smooth, and real-time estimates of bus location and ETA. Unlike simpler methods like Moving Average or Exponential Smoothing, it understands how buses move, adapts to changing noise levels, and handles data irregularity gracefully. For a real-time transit system, Kalman filtering provides the right balance of precision and adaptability.