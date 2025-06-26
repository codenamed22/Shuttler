import time
import os
from bus import Bus
import random
from ws_server import broadcast_message, start_ws_server
import asyncio

# ✅ Use absolute + normalized path (Windows-safe)
ROUTE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "main", "resources", "routes"))



print("📁 ROUTE_DIR =", ROUTE_DIR)

def load_route_files():
    files = []
    if not os.path.exists(ROUTE_DIR):
        print("❌ ROUTE_DIR does not exist!")
        return files
    else:
        print("📂 ROUTE_DIR confirmed exists.")

    for f in os.listdir(ROUTE_DIR):
        if f.endswith(".geojson"):
            full_path = os.path.join(ROUTE_DIR, f)
            files.append(full_path)

    if not files:
        print("⚠️ No .geojson files found in:", ROUTE_DIR)
    else:
        print("✅ Found route files:", files)

    return files

async def run_simulation():
    # Build all bus simulators
    buses = []
    route_files = load_route_files()

    for route_file in route_files:
        speed = random.uniform(20.0, 30.0)  # Random speed between 20 and 30 km/h
        bus = Bus(route_file, speed_kmph=speed)
        buses.append(bus)

    print(f"🚌 Simulating {len(buses)} buses...")

    # Main simulation loop
    while True:
        for bus in buses:
            tick = random.uniform(0.5, 1.5)
            ping = bus.next_ping(tick)
            await broadcast_message(ping)
            await asyncio.sleep(tick)

async def main():
    await asyncio.gather(
        start_ws_server(),
        run_simulation()
    )

if __name__ == "__main__":
    asyncio.run(main())
