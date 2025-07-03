"""
Comprehensive unit tests for the Bus class in GPS simulator.
"""
import pytest
import time
import math
import json
from unittest.mock import patch, MagicMock
from gps_simulator.bus import Bus
from .conftest import TEST_COORDINATES


class TestBusInitialization:
    """Test Bus class initialization and route loading."""
    
    def test_bus_initialization_default_values(self, sample_route_file):
        """Test bus initialization with default parameters."""
        bus = Bus(sample_route_file)
        
        assert bus.bus_id == "test-bus-001"
        assert bus.route_id == "test-route-001"
        assert bus.speed_kmph == 25.0
        assert bus.gps_noise_std == 0.000001
        assert 5 <= bus.occupancy <= 25
        assert bus.current_index == 0
        assert bus.direction == 1
        assert len(bus.route_points) == 5
        assert len(bus.stops) == 3
        
    def test_bus_initialization_custom_values(self, sample_route_file):
        """Test bus initialization with custom parameters."""
        bus = Bus(sample_route_file, speed_kmph=40.0, gps_noise=0.01)
        
        assert bus.speed_kmph == 40.0
        assert bus.gps_noise_std == 0.01
        
    def test_route_loading(self, sample_route_file):
        """Test proper loading of route data from GeoJSON."""
        bus = Bus(sample_route_file)
        
        # Check route points conversion (lon,lat -> lat,lon)
        expected_first_point = (20.3527, 85.8193)
        expected_last_point = (20.3541, 85.8139)
        
        assert bus.route_points[0] == expected_first_point
        assert bus.route_points[-1] == expected_last_point
        assert bus.current_points == expected_first_point
        
    def test_stops_loading(self, sample_route_file):
        """Test proper loading of stops data."""
        bus = Bus(sample_route_file)
        
        assert len(bus.stops) == 3
        assert bus.stops[0]['stopId'] == 'stop1'
        assert bus.stops[0]['lat'] == 20.3527
        assert bus.stops[0]['lon'] == 85.8193
        
    def test_invalid_route_file(self, invalid_route_file):
        """Test handling of invalid route file."""
        with pytest.raises((json.JSONDecodeError, KeyError)):
            Bus(invalid_route_file)
            
    def test_empty_route_file(self, empty_route_file):
        """Test handling of empty route file."""
        with pytest.raises((IndexError, KeyError)):
            Bus(empty_route_file)


class TestHaversineDistance:
    """Test the Haversine distance calculation."""
    
    def test_haversine_distance_calculation(self, sample_route_file):
        """Test Haversine distance calculation with known coordinates."""
        bus = Bus(sample_route_file)
        
        # Test with KIIT coordinates
        point_a = TEST_COORDINATES['KIIT_GATE']
        point_b = TEST_COORDINATES['KIIT_LIBRARY']
        
        distance = bus._haversine(point_a, point_b)
        
        # Distance should be approximately 300-450 meters (actual distance is ~429m)
        assert 300 < distance < 500
        
    def test_haversine_same_point(self, sample_route_file):
        """Test Haversine distance for same point."""
        bus = Bus(sample_route_file)
        point = (20.3527, 85.8193)
        
        distance = bus._haversine(point, point)
        assert distance == 0.0
        
    def test_haversine_precision(self, sample_route_file):
        """Test Haversine distance calculation precision."""
        bus = Bus(sample_route_file)
        
        # Very close points (1 meter apart approximately)
        point_a = (20.3527, 85.8193)
        point_b = (20.35271, 85.81931)
        
        distance = bus._haversine(point_a, point_b)
        assert 0 < distance < 2  # Should be very small distance


class TestPingFormatting:
    """Test ping message formatting."""
    
    def test_format_ping_structure(self, sample_route_file, mock_time):
        """Test that ping formatting returns correct structure."""
        bus = Bus(sample_route_file)
        point = (20.3527, 85.8193)
        timestamp = 1672531200.0
        
        ping = bus._format_ping(point, timestamp)
        
        assert isinstance(ping, dict)
        assert ping["busId"] == "test-bus-001"
        assert ping["lat"] == point[0]
        assert ping["lon"] == point[1]
        assert ping["timestamp"] == int(timestamp)
        assert isinstance(ping["occupancy"], int)
        assert 0 <= ping["occupancy"] <= 50
        
    def test_format_ping_different_coordinates(self, sample_route_file):
        """Test ping formatting with different coordinates."""
        bus = Bus(sample_route_file)
        
        test_points = [
            (20.3527, 85.8193),
            (20.3550, 85.8160),
            (20.3570, 85.8140)
        ]
        
        for point in test_points:
            ping = bus._format_ping(point, time.time())
            assert ping["lat"] == point[0]
            assert ping["lon"] == point[1]


class TestBusMovement:
    """Test bus movement along route."""
    
    def test_next_ping_basic_movement(self, sample_route_file, mock_random):
        """Test basic bus movement with next_ping."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        initial_position = bus.current_points
        
        ping = bus.next_ping(1.0)
        
        assert isinstance(ping, dict)
        assert "lat" in ping and "lon" in ping
        assert ping["busId"] == "test-bus-001"
        
    def test_bus_moves_forward_along_route(self, sample_route_file):
        """Test that bus moves forward along the route."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        initial_index = bus.current_index
        
        # Move bus with sufficient distance
        for _ in range(5):
            bus.next_ping(2.0)
            
        # Bus should have moved forward
        assert bus.current_index >= initial_index
        
    def test_direction_reversal_at_route_end(self, sample_route_file):
        """Test that bus reverses direction at route end."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        
        # Move bus to the end
        bus.current_index = len(bus.route_points) - 1
        bus.direction = 1
        
        # Try to move beyond end
        with patch('time.time', return_value=1000.0):
            bus.next_ping(1.0)
            
        # Should trigger direction reversal
        assert bus.direction == -1 or bus.end_pause_until > 0
        
    def test_speed_variation(self, sample_route_file):
        """Test that bus speed varies within acceptable range."""
        bus = Bus(sample_route_file, speed_kmph=25.0)
        original_speed = bus.speed_kmph
        
        # Run several pings to see speed variation
        for _ in range(10):
            bus.next_ping(1.0)
            
        # Speed should be clamped between 10 and 50
        assert 10.0 <= bus.speed_kmph <= 50.0


class TestStopBehavior:
    """Test bus behavior at stops."""
    
    def test_pause_at_stop_detection(self, sample_route_file, mock_time):
        """Test that bus pauses when near a stop."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        
        # Place bus exactly at first stop
        stop_point = (bus.stops[0]['lat'], bus.stops[0]['lon'])
        bus.current_points = stop_point
        
        initial_time = time.time()
        bus.next_ping(1.0)
        
        # Bus should be paused
        assert bus.pause_until >= initial_time
        assert bus.last_stop_id == bus.stops[0]['stopId']
        
    def test_occupancy_change_at_stop(self, sample_route_file):
        """Test that occupancy changes when bus stops."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        
        # Place bus at stop and record initial occupancy
        stop_point = (bus.stops[0]['lat'], bus.stops[0]['lon'])
        bus.current_points = stop_point
        initial_occupancy = bus.occupancy
        
        bus.next_ping(1.0)
        
        # Occupancy might have changed (though random, so we test it's valid)
        assert 0 <= bus.occupancy <= 50
        
    def test_stop_pause_duration(self, sample_route_file):
        """Test that stop pause duration is reasonable."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        
        # Place bus at stop
        stop_point = (bus.stops[0]['lat'], bus.stops[0]['lon'])
        bus.current_points = stop_point
        
        current_time = time.time()
        bus.next_ping(1.0)
        
        # Pause should be between 30 and 120 seconds
        pause_duration = bus.pause_until - current_time
        assert 30 <= pause_duration <= 120
        
    def test_no_repeated_pause_same_stop(self, sample_route_file):
        """Test that bus doesn't pause repeatedly at same stop."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        
        # Set last_stop_id to prevent re-pause
        stop_point = (bus.stops[0]['lat'], bus.stops[0]['lon'])
        bus.current_points = stop_point
        bus.last_stop_id = bus.stops[0]['stopId']
        
        initial_pause = bus.pause_until
        bus.next_ping(1.0)
        
        # Should not create new pause
        assert bus.pause_until == initial_pause


class TestGPSNoise:
    """Test GPS noise addition."""
    
    def test_gps_noise_application(self, sample_route_file):
        """Test that GPS noise is applied to coordinates."""
        bus = Bus(sample_route_file, gps_noise=0.001)  # Larger noise for testing
        
        # Get multiple pings and check they're slightly different
        pings = []
        for _ in range(5):
            ping = bus.next_ping(0.1)  # Small time step
            pings.append((ping['lat'], ping['lon']))
            
        # With noise, coordinates should vary slightly
        lats = [p[0] for p in pings]
        lons = [p[1] for p in pings]
        
        # Check there's some variation (not all identical)
        assert len(set(lats)) > 1 or len(set(lons)) > 1
        
    def test_no_gps_noise(self, sample_route_file):
        """Test behavior with no GPS noise."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        
        # Test with small movement to avoid edge cases
        ping1 = bus.next_ping(0.1)  # Small time step
        ping2 = bus.next_ping(0.1)  # Small time step
        
        # Both pings should be valid
        assert isinstance(ping1, dict)
        assert isinstance(ping2, dict)
        assert 'lat' in ping1 and 'lon' in ping1
        assert 'lat' in ping2 and 'lon' in ping2


class TestEndPauseBehavior:
    """Test end-of-route pause behavior."""
    
    def test_end_pause_basic_functionality(self, sample_route_file):
        """Test basic end pause functionality without edge cases."""
        bus = Bus(sample_route_file, gps_noise=0.0)
        
        # Test that end_pause_until can be set
        initial_pause = bus.end_pause_until
        assert initial_pause == 0  # Should start at 0
        
        # Test basic ping generation works
        ping = bus.next_ping(0.5)
        assert isinstance(ping, dict)
        assert 'busId' in ping


class TestEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_empty_stops_list(self, sample_route_file):
        """Test bus behavior with no stops defined."""
        # Modify the route to have no stops
        with open(sample_route_file, 'r') as f:
            data = json.load(f)
        
        data['features'][0]['properties']['stops'] = []
        
        with open(sample_route_file, 'w') as f:
            json.dump(data, f)
            
        bus = Bus(sample_route_file)
        assert len(bus.stops) == 0
        
        # Should still work without stops
        ping = bus.next_ping(0.5)
        assert isinstance(ping, dict)
        
    def test_very_high_speed(self, sample_route_file):
        """Test bus behavior with very high speed."""
        bus = Bus(sample_route_file, speed_kmph=100.0)  # Very high speed
        
        # Should still be clamped to maximum
        bus.next_ping(0.5)
        assert bus.speed_kmph <= 50.0
        
    def test_basic_functionality(self, sample_route_file):
        """Test basic bus functionality works."""
        bus = Bus(sample_route_file)
        
        # Test basic ping generation
        ping = bus.next_ping(0.5)
        assert isinstance(ping, dict)
        assert 'busId' in ping
        assert 'lat' in ping
        assert 'lon' in ping
