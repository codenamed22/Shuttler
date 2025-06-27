package com.ivez.etaengine.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteData {
    private String busId;
    private String routeId;
    private List<Coordinate> coordinates; // the LineString
    private List<Stop> stops;
}
