package com.ivez.etaengine.service;

import com.ivez.etaengine.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static com.ivez.etaengine.util.GeoUtils.haversine;

// This service keeps track of each bus’s latest location, speed, and time
@Service
public class BusStateTracker {

    // Stores the latest state of each bus using busId as the key
    private final Map<String, BusState> stateMap = new ConcurrentHashMap<>();
    private final long minGapMillis = 3;

    private final Routes routes;

    public BusStateTracker(Routes routes){
        this.routes = routes;
    }

    public void updateBusState(BusPing ping) {
        // Get previous state (if any)
        BusState previous = stateMap.get(ping.getBusId());
        System.out.println("Bus State : " + previous);



        RouteData route = routes.getRoute(ping.getBusId());


        if (route == null) {
            System.err.println("Unknown route for busId: " + ping.getBusId());
            return;
        }

        double speed = 0;
        int segment = findClosestSegment(ping.getLat(), ping.getLon(), route.getCoordinates());


        if (previous != null) {

            for(Stop stop : route.getStops()){
                if(previous.getArrivedStops().contains(stop.getStopId()))
                    continue;
                double dist = haversine(ping.getLat(), ping.getLon(), stop.getLat(), stop.getLon());
                if (dist <= 50.0) {
                    System.out.println("Bus " + ping.getBusId() + " arrived at stop " + stop.getName());
                    previous.getArrivedStops().add(stop.getStopId());
                }
            }

            System.out.println("Time diff : " + (ping.getTimestamp() - previous.getLastUpdated()));
            if(ping.getTimestamp() - previous.getLastUpdated() < minGapMillis)
                return;
            // Calculate time difference in seconds
            double timeDiff = (ping.getTimestamp() - previous.getLastUpdated()) ;

            if (timeDiff > 0) {
                // Estimate distance between old and new point
                double distance = haversine(
                        previous.getLat(), previous.getLon(),
                        ping.getLat(), ping.getLon()
                );
                System.out.println("Distance :" + distance + " Time : " + timeDiff);
                // Speed = distance / time (m/s)
                speed = distance / timeDiff;
            }
        }

        // Update bus state with new location and calculated speed
        BusState newState = new BusState(
                ping.getBusId(),
                ping.getLat(),
                ping.getLon(),
                speed,
                segment,
                previous == null ? new HashSet<String>() : previous.getArrivedStops(),
                ping.getTimestamp()
        );

        stateMap.put(ping.getBusId(), newState);
    }

    // Get a single bus's state
    public BusState getState(String busId) {
        return stateMap.get(busId);
    }

    // Get all current bus states
    public Map<String, BusState> getAllStates() {
        return stateMap;
    }

    private int findClosestSegment(double lat, double lon, List<Coordinate> coords) {
        int bestIndex = -1;
        double bestDistance = Double.MAX_VALUE;

        for (int i = 0; i < coords.size() - 1; i++) {
            Coordinate a = coords.get(i);
            Coordinate b = coords.get(i + 1);

            double dist = pointToSegmentDistance(lat, lon, a.getLat(), a.getLon(), b.getLat(), b.getLon());
            if (dist < bestDistance) {
                bestDistance = dist;
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    private double pointToSegmentDistance(double px, double py,
                                          double ax, double ay,
                                          double bx, double by) {
        double dx = bx - ax;
        double dy = by - ay;

        if (dx == 0 && dy == 0) {
            return haversine(px, py, ax, ay);
        }

        double t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
        t = Math.max(0, Math.min(1, t));

        double projX = ax + t * dx;
        double projY = ay + t * dy;

        return haversine(px, py, projX, projY);
    }

    public boolean isNewer(BusPing ping){
        BusState latest = stateMap.get(ping.getBusId());
        return latest == null || ping.getTimestamp() > latest.getLastUpdated();
    }

}
