package com.ivez.etaengine.util;

import java.util.LinkedList;
import java.util.Queue;

// Keeps last N values, returns average
public class MovingAverageFilter {
    private final int windowSize;
    private final Queue<Double> window;
    private double sum = 0;

    public MovingAverageFilter(int size) {
        this.windowSize = size;
        this.window = new LinkedList<>();
    }

    public double addAndGetAverage(double value) {
        sum += value;
        window.add(value);

        if (window.size() > windowSize) {
            sum -= window.poll(); // remove oldest
        }

        return sum / window.size();
    }
}
