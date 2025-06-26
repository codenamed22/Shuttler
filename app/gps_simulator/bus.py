import json
import random
import time
import math

class Bus:
    def __init__(self, route, speed_kmph= 25.0, gps_noise=0.0001):
        self.bus_id = None
        self.route_id = None
        self.route_points = []
        self.stops = []
        
        self.current_index = 0      # index on the route
        self.speed_kmph = speed_kmph
        self.gps_noise_std = gps_noise
        
        self.pause_until = 0        # for simulating stop pause
        self._load_route(route)
        
        self.direction = 1  # 1 = forward, -1 = backward
        self.end_pause_until = 0  # pause after reaching route end
    
    def _load_route(self, path):
        with open(path, 'r') as file:
            data = json.load(file)
        
        feature = data['features'][0]
        self.bus_id = feature['properties']['busId']
        self.route_id = feature['properties']['routeId']
        coords = feature['geometry']['coordinates']  # [lon, lat]
        self.route_points = [(lat, lon) for lon, lat in coords]
        
        # Optional embedded stops
        if 'stops' in feature['properties']:
            self.stops = feature['properties']['stops']
        
    def next_ping(self, tick_seconds = 1.0):
        now = time.time()
        
        if now < self.end_pause_until:
            return self._format_ping(self.route_points[self.current_index], now)
        
        if now < self.pause_until:
            return self._format_ping(self.route_points[self.current_index], now)
        
         # Simulate traffic variation
        self.speed_kmph += random.uniform(-2.0, 2.0)
        self.speed_kmph = max(10.0, min(self.speed_kmph, 50.0))  # Clamp
        
        distance_m = ((self.speed_kmph * 1000) / 3600) * tick_seconds
        
        route_len = len(self.route_points)
        while distance_m > 0:
            next_index = self.current_index + self.direction

            if 0 <= next_index < route_len:
                curr = self.route_points[self.current_index]
                nxt = self.route_points[next_index]
                seg_dist = self._haversine(curr, nxt)

                if seg_dist <= distance_m:
                    distance_m -= seg_dist
                    self.current_index = next_index
                else:
                    frac = distance_m / seg_dist
                    lat = curr[0] + frac * (nxt[0] - curr[0])
                    lon = curr[1] + frac * (nxt[1] - curr[1])
                    simulated_point = (lat, lon)
                    break
            else:
                # Reached end or beginning of the route
                self.end_pause_until = now + random.uniform(60, 120)  # 1–2 min pause
                self.direction *= -1  # reverse direction
                break
        else:
            simulated_point = self.route_points[self.current_index]
            
        # Check for stop pause
        for stop in self.stops:
            stop_point = (stop['lat'], stop['lon'])
            if self._haversine(simulated_point, stop_point) < 20:  # within 20 meters
                self.pause_until = now + random.uniform(5, 10)
                break
        
        # Add noise
        lat_noise = random.gauss(0, self.gps_noise_std)
        lon_noise = random.gauss(0, self.gps_noise_std)
        noisy_point = (simulated_point[0] + lat_noise, simulated_point[1] + lon_noise)

        return self._format_ping(noisy_point, now)
    
    def _format_ping(self, point, timestamp):
        return {
            "busId": self.bus_id,
            "lat": point[0],
            "lon": point[1],
            "timestamp": int(timestamp)
        }
    
    def _haversine(self, a, b):
        # Compute great-circle distance in meters
        R = 6371000  # Earth radius in meters
        lat1, lon1 = map(math.radians, a)
        lat2, lon2 = map(math.radians, b)
        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c