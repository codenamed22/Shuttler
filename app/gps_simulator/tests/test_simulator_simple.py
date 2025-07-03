"""
Simple unit tests for the GPS simulator main functionality.
"""
import pytest
import os
import tempfile
import json
from gps_simulator import simulator


class TestRouteFileLoading:
    """Test route file loading functionality."""
    
    def test_load_route_files_finds_geojson(self):
        """Test that load_route_files finds GeoJSON files."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test GeoJSON files
            test_files = ['route1.geojson', 'route2.geojson', 'not_route.txt']
            for filename in test_files:
                filepath = os.path.join(temp_dir, filename)
                with open(filepath, 'w') as f:
                    json.dump({"test": "data"}, f)
                    
            # Mock ROUTE_DIR to point to temp directory
            original_route_dir = simulator.ROUTE_DIR
            try:
                simulator.ROUTE_DIR = temp_dir
                files = simulator.load_route_files()
                
                # Should find only GeoJSON files
                assert len(files) == 2
                assert all(f.endswith('.geojson') for f in files)
                assert all('route' in os.path.basename(f) for f in files)
            finally:
                simulator.ROUTE_DIR = original_route_dir
            
    def test_load_route_files_empty_directory(self):
        """Test load_route_files with empty directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            original_route_dir = simulator.ROUTE_DIR
            try:
                simulator.ROUTE_DIR = temp_dir
                files = simulator.load_route_files()
                assert files == []
            finally:
                simulator.ROUTE_DIR = original_route_dir
            
    def test_load_route_files_no_geojson(self):
        """Test load_route_files with no GeoJSON files."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create non-GeoJSON files
            for filename in ['route.txt', 'data.json', 'config.xml']:
                filepath = os.path.join(temp_dir, filename)
                with open(filepath, 'w') as f:
                    f.write("test content")
                    
            original_route_dir = simulator.ROUTE_DIR
            try:
                simulator.ROUTE_DIR = temp_dir
                files = simulator.load_route_files()
                assert files == []
            finally:
                simulator.ROUTE_DIR = original_route_dir
            
    def test_load_route_files_returns_full_paths(self):
        """Test that load_route_files returns full file paths."""
        with tempfile.TemporaryDirectory() as temp_dir:
            test_file = 'test_route.geojson'
            filepath = os.path.join(temp_dir, test_file)
            with open(filepath, 'w') as f:
                json.dump({"test": "data"}, f)
                
            original_route_dir = simulator.ROUTE_DIR
            try:
                simulator.ROUTE_DIR = temp_dir
                files = simulator.load_route_files()
                
                assert len(files) == 1
                assert files[0] == filepath
                assert os.path.isabs(files[0])
            finally:
                simulator.ROUTE_DIR = original_route_dir


class TestSimulatorBasics:
    """Test basic simulator functionality."""
    
    def test_module_imports(self):
        """Test that simulator module imports work."""
        # Test that we can import the necessary components
        assert hasattr(simulator, 'load_route_files')
        assert hasattr(simulator, 'run_simulation')
        assert hasattr(simulator, 'main')
        
    def test_route_dir_exists(self):
        """Test that ROUTE_DIR is properly defined."""
        assert hasattr(simulator, 'ROUTE_DIR')
        assert isinstance(simulator.ROUTE_DIR, str)
        assert len(simulator.ROUTE_DIR) > 0
