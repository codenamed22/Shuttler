import asyncio
import websockets
import json

connected_clients = set()

async def register_client(websocket):
    connected_clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)

async def start_ws_server(host='localhost', port=8765):
    print(f"WebSocket server listening on ws://{host}:{port}")
    async with websockets.serve(register_client, host, port):
        await asyncio.Future()  # run forever

async def broadcast_message(message: dict):
    if connected_clients:
        message_json = json.dumps(message)
        await asyncio.gather(
            *[client.send(message_json) for client in connected_clients ],
            return_exceptions=True
        )