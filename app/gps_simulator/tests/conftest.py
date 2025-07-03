"""
Pytest configuration and fixtures for GPS simulator tests.
"""
import json
import tempfile
import os
import pytest
from unittest.mock import patch
import asyncio

# Sample GeoJSON data for testing
SAMPLE_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "busId": "test-bus-001",
                "routeId": "test-route-001",
                "driver": "Test Driver",
                "stops": [
                    {
                        "stopId": "stop1",
                        "name": "First Stop", 
                        "lat": 20.3527,
                        "lon": 85.8193
                    },
                    {
                        "stopId": "stop2",
                        "name": "Second Stop",
                        "lat": 20.3538,
                        "lon": 85.8165
                    },
                    {
                        "stopId": "stop3",
                        "name": "Third Stop",
                        "lat": 20.3541,
                        "lon": 85.8139
                    }
                ]
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [85.8193, 20.3527],  # [lon, lat]
                    [85.8180, 20.3530],
                    [85.8165, 20.3538],
                    [85.8150, 20.3540],
                    [85.8139, 20.3541]
                ]
            }
        }
    ]
}

COMPLEX_ROUTE_GEOJSON = {
    "type": "FeatureCollection", 
    "features": [
        {
            "type": "Feature",
            "properties": {
                "busId": "test-bus-complex",
                "routeId": "test-route-complex",
                "stops": [
                    {"stopId": "complex_stop1", "name": "Campus Gate", "lat": 20.3527, "lon": 85.8193},
                    {"stopId": "complex_stop2", "name": "Library", "lat": 20.3550, "lon": 85.8160},
                    {"stopId": "complex_stop3", "name": "Hostel", "lat": 20.3570, "lon": 85.8140},
                    {"stopId": "complex_stop4", "name": "Admin Block", "lat": 20.3580, "lon": 85.8120}
                ]
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [85.8193, 20.3527], [85.8190, 20.3530], [85.8185, 20.3535],
                    [85.8180, 20.3540], [85.8175, 20.3545], [85.8170, 20.3548],
                    [85.8165, 20.3550], [85.8160, 20.3550], [85.8155, 20.3555],
                    [85.8150, 20.3560], [85.8145, 20.3565], [85.8142, 20.3568],
                    [85.8140, 20.3570], [85.8135, 20.3572], [85.8130, 20.3575],
                    [85.8125, 20.3577], [85.8120, 20.3580]
                ]
            }
        }
    ]
}

@pytest.fixture
def sample_route_file():
    """Create a temporary GeoJSON file for testing."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".geojson", mode="w")
    json.dump(SAMPLE_GEOJSON, tmp)
    tmp.close()
    yield tmp.name
    os.unlink(tmp.name)

@pytest.fixture
def complex_route_file():
    """Create a temporary complex GeoJSON file for testing."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".geojson", mode="w")
    json.dump(COMPLEX_ROUTE_GEOJSON, tmp)
    tmp.close()
    yield tmp.name
    os.unlink(tmp.name)

@pytest.fixture
def empty_route_file():
    """Create a temporary empty GeoJSON file for testing error conditions."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".geojson", mode="w")
    json.dump({"type": "FeatureCollection", "features": []}, tmp)
    tmp.close()
    yield tmp.name
    os.unlink(tmp.name)

@pytest.fixture
def invalid_route_file():
    """Create an invalid GeoJSON file for testing error handling."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".geojson", mode="w")
    tmp.write("invalid json content")
    tmp.close()
    yield tmp.name
    os.unlink(tmp.name)

@pytest.fixture
def mock_time():
    """Mock time.time() to return predictable values."""
    with patch('time.time') as mock:
        mock.return_value = 1672531200.0  # 2023-01-01 00:00:00 UTC
        yield mock

@pytest.fixture
def mock_random():
    """Mock random functions for predictable testing."""
    with patch('random.randint') as mock_randint, \
         patch('random.uniform') as mock_uniform, \
         patch('random.gauss') as mock_gauss:
        mock_randint.return_value = 15  # predictable occupancy
        mock_uniform.return_value = 1.0  # predictable speed variations
        mock_gauss.return_value = 0.0001  # predictable GPS noise
        yield {
            'randint': mock_randint,
            'uniform': mock_uniform, 
            'gauss': mock_gauss
        }

@pytest.fixture
def event_loop():
    """Create an event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_websocket():
    """Mock websocket for testing."""
    from unittest.mock import AsyncMock, MagicMock
    
    mock_ws = AsyncMock()
    mock_ws.send = AsyncMock()
    mock_ws.wait_closed = AsyncMock()
    return mock_ws

# Test constants
TEST_COORDINATES = {
    'KIIT_GATE': (20.3527, 85.8193),
    'KIIT_LIBRARY': (20.3550, 85.8160), 
    'KIIT_HOSTEL': (20.3570, 85.8140),
    'KIIT_ADMIN': (20.3580, 85.8120)
}

TEST_DISTANCES = {
    'GATE_TO_LIBRARY': 300,  # approximate distance in meters
    'LIBRARY_TO_HOSTEL': 250,
    'HOSTEL_TO_ADMIN': 200
}
