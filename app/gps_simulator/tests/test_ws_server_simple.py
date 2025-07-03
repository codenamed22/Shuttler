"""
Simple unit tests for WebSocket server functionality.
"""
import pytest
import asyncio
import json
from unittest.mock import AsyncMock
from gps_simulator.ws_server import broadcast_message, connected_clients


class TestWebSocketServer:
    """Test basic WebSocket server functionality."""
    
    @pytest.mark.asyncio
    async def test_broadcast_message_empty_clients(self):
        """Test broadcast_message with no connected clients."""
        # Ensure no clients connected
        connected_clients.clear()
        
        test_message = {"test": "message"}
        
        # Should not raise exception
        await broadcast_message(test_message)
        
    @pytest.mark.asyncio
    async def test_broadcast_message_single_client(self):
        """Test broadcast_message with single client."""
        mock_websocket = AsyncMock()
        
        connected_clients.clear()
        connected_clients.add(mock_websocket)
        
        try:
            test_message = {"busId": "test-bus", "lat": 20.3527, "lon": 85.8193}
            expected_json = json.dumps(test_message)
            
            await broadcast_message(test_message)
            
            # Verify message was sent
            mock_websocket.send.assert_called_once_with(expected_json)
        finally:
            connected_clients.clear()
            
    @pytest.mark.asyncio
    async def test_broadcast_message_multiple_clients(self):
        """Test broadcast_message with multiple clients."""
        # Create multiple mock clients
        mock_clients = [AsyncMock() for _ in range(3)]
        
        connected_clients.clear()
        for client in mock_clients:
            connected_clients.add(client)
            
        try:
            test_message = {"busId": "test-bus", "lat": 20.3527}
            expected_json = json.dumps(test_message)
            
            await broadcast_message(test_message)
            
            # Verify all clients received message
            for client in mock_clients:
                client.send.assert_called_once_with(expected_json)
        finally:
            connected_clients.clear()
            
    @pytest.mark.asyncio
    async def test_broadcast_message_json_serialization(self):
        """Test that broadcast_message properly serializes objects."""
        mock_websocket = AsyncMock()
        
        connected_clients.clear()
        connected_clients.add(mock_websocket)
        
        try:
            complex_message = {
                "busId": "test-bus-001",
                "location": {"lat": 20.3527, "lon": 85.8193},
                "timestamp": 1672531200,
                "occupancy": 25
            }
            
            await broadcast_message(complex_message)
            
            # Verify JSON serialization
            expected_json = json.dumps(complex_message)
            mock_websocket.send.assert_called_once_with(expected_json)
        finally:
            connected_clients.clear()


class TestWebSocketMessageFormats:
    """Test different message formats and structures."""
    
    @pytest.mark.asyncio
    async def test_bus_ping_message_format(self):
        """Test broadcasting typical bus ping message."""
        mock_websocket = AsyncMock()
        
        connected_clients.clear()
        connected_clients.add(mock_websocket)
        
        try:
            bus_ping = {
                "busId": "bus-001",
                "lat": 20.352727422448552,
                "lon": 85.81928257681125,
                "timestamp": 1672531200,
                "occupancy": 23
            }
            
            await broadcast_message(bus_ping)
            
            expected_json = json.dumps(bus_ping)
            mock_websocket.send.assert_called_once_with(expected_json)
        finally:
            connected_clients.clear()
            
    @pytest.mark.asyncio
    async def test_empty_message_broadcast(self):
        """Test broadcasting empty message."""
        mock_websocket = AsyncMock()
        
        connected_clients.clear()
        connected_clients.add(mock_websocket)
        
        try:
            empty_message = {}
            
            await broadcast_message(empty_message)
            
            expected_json = json.dumps(empty_message)
            mock_websocket.send.assert_called_once_with(expected_json)
        finally:
            connected_clients.clear()
