package com.ivez.etaengine.config;

import com.ivez.etaengine.model.Stop;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class RouteConfig {

    @Bean
    public List<Stop> stops() throws Exception {
        InputStream is = getClass().getResourceAsStream("/routes/route_kiit_campus_loop.geojson"); // Adjust if necessary

        if (is == null) {
            throw new IllegalArgumentException("❌ Could not find route.json in resources/routes/");
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(is);

        JsonNode features = root.get("features");
        if (features == null || !features.isArray() || features.isEmpty()) {
            throw new IllegalArgumentException("❌ Invalid route.json: 'features' missing or not an array");
        }

        JsonNode properties = features.get(0).get("properties");
        if (properties == null) {
            throw new IllegalArgumentException("❌ Invalid route.json: 'properties' missing");
        }

        JsonNode stopNodes = properties.get("stops");
        if (stopNodes == null || !stopNodes.isArray()) {
            throw new IllegalArgumentException("❌ Invalid route.json: 'stops' missing or not an array");
        }

        List<Stop> stops = new ArrayList<>();
        for (JsonNode stopNode : stopNodes) {
            stops.add(new Stop(
                    stopNode.get("stopId").asText(),
                    stopNode.get("name").asText(),
                    stopNode.get("lat").asDouble(),
                    stopNode.get("lon").asDouble()
            ));
        }

        System.out.println("✅ Loaded " + stops.size() + " stops from route.json");
        return stops;
    }
}
