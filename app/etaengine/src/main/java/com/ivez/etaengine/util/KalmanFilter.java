package com.ivez.etaengine.util;

public class KalmanFilter {
    private double estimate;
    private double errorCovariance;
    private final double processNoise;
    private final double measurementNoise;
    private boolean initialized = false;

    public KalmanFilter(double initialEstimate, double initialErrorCovariance,
                        double processNoise, double measurementNoise) {
        this.estimate = initialEstimate;
        this.errorCovariance = initialErrorCovariance;
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;
    }

    public double update(double measurement) {
        if (!initialized) {
            estimate = measurement;
            initialized = true;
        }

        // Prediction
        errorCovariance += processNoise;

        // Kalman Gain
        double kalmanGain = errorCovariance / (errorCovariance + measurementNoise);

        // Update estimate
        estimate = estimate + kalmanGain * (measurement - estimate);

        // Update error covariance
        errorCovariance = (1 - kalmanGain) * errorCovariance;

        return estimate;
    }

    public double getEstimate() {
        return estimate;
    }
}
