package com.ivez.etaengine.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivez.etaengine.model.Coordinate;
import com.ivez.etaengine.model.RouteData;
import com.ivez.etaengine.model.Stop;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.util.*;

import static com.ivez.etaengine.util.GeoUtils.haversine;

@Component
public class Routes {
    private final Map<String, RouteData> routeMap = new HashMap<>();
    @Value("${routes.directory}")
    private String routesDir;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RouteData getRoute(String busId) {
        return routeMap.get(busId);
    }

    public Set<String> getAllBusIds() {
        return routeMap.keySet();
    }

    @PostConstruct
    public void loadRoutes() {
        File folder = new File(routesDir); // Assuming "routes/" exists at the project root
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".geojson"));

        if (files == null) {
            System.err.println("No route files found!");
            return;
        }

        for (File file : files) {
            try {
                JsonNode root = objectMapper.readTree(file);
                JsonNode feature = root.get("features").get(0); // assuming single feature
                JsonNode props = feature.get("properties");
                JsonNode geometry = feature.get("geometry");

                String busId = props.get("busId").asText();
                String routeId = props.get("routeId").asText();

                // Parse stops
                List<Stop> stops = new ArrayList<>();
                for (JsonNode stopNode : props.get("stops")) {
                    stops.add(new Stop(
                            stopNode.get("stopId").asText(),
                            stopNode.get("name").asText(),
                            stopNode.get("lon").asDouble(),
                            stopNode.get("lat").asDouble()
                    ));
                }

                // Parse coordinates
                List<Coordinate> coords = new ArrayList<>();
                for (JsonNode coord : geometry.get("coordinates")) {
                    coords.add(new Coordinate(coord.get(0).asDouble(), coord.get(1).asDouble()));
                }

                for (Stop stop : stops) {
                    int bestIndex = -1;
                    double bestDistance = Double.MAX_VALUE;

                    for (int i = 0; i < coords.size() - 1; i++) {
                        Coordinate a = coords.get(i);
                        Coordinate b = coords.get(i + 1);

                        double dist = pointToSegmentDistance(
                                stop.getLat(), stop.getLon(),
                                a.getLat(), a.getLon(),
                                b.getLat(), b.getLon()
                        );
                        //System.out.printf("Stop %s checking segment %d: dist = %.2f\n", stop.getName(), i, dist);
                        if (dist < bestDistance) {
                            bestDistance = dist;
                            bestIndex = i;
                        }
                    }
                    //System.out.printf("Stop %s matched with segment %d (dist %.2f meters)\n", stop.getName(), bestIndex, bestDistance);
                    stop.setSegmentIndex(bestIndex);
                }

                RouteData route = new RouteData(routeId, busId, coords, stops);
                routeMap.put(busId, route);
                System.out.println("Loaded route for bus: " + busId);

            } catch (IOException e) {
                System.err.println("Error loading file: " + file.getName());
                e.printStackTrace();
            }
        }
    }

    private double pointToSegmentDistance(
            double lat, double lon,           // point P
            double aLat, double aLon,         // segment start A
            double bLat, double bLon          // segment end B
    ) {
        // Project all points from lat/lon to x/y in meters
        double x0 = lonToX(lon);
        double y0 = latToY(lat);
        double x1 = lonToX(aLon);
        double y1 = latToY(aLat);
        double x2 = lonToX(bLon);
        double y2 = latToY(bLat);

        double dx = x2 - x1;
        double dy = y2 - y1;

        if (dx == 0 && dy == 0) {
            // A and B are the same point
            return haversine(lat, lon, aLat, aLon);
        }

        double t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
        t = Math.max(0, Math.min(1, t));

        double projX = x1 + t * dx;
        double projY = y1 + t * dy;

        // Return Euclidean distance in meters
        double dx0 = projX - x0;
        double dy0 = projY - y0;
        return Math.sqrt(dx0 * dx0 + dy0 * dy0);
    }

    private double lonToX(double lon) {
        return lon * 111320.0;
    }

    private double latToY(double lat) {
        return lat * 110540.0;
    }



}

