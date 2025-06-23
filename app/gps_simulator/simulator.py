import time
import os
from bus import Bus
import random

ROUTE_DIR = os.path.join(os.path.dirname(__file__), "..", "routes")

def load_route_files():
    files = []
    for f in os.listdir(ROUTE_DIR):
        if f.endswith(".geojson"):
            full_path = os.path.join(ROUTE_DIR, f)
            files.append(full_path)
    return files

# Build all bus simulators
buses = []
route_files = load_route_files()

for route_file in route_files:
    speed = random.uniform(20.0, 30.0)  # Random speed between 20 and 30 km/h
    bus = Bus(route_file, speed_kmph=speed)
    buses.append(bus)


#Main simulation loop
while True:
    for bus in buses:
        tick = random.uniform(0.5, 1.5)
        ping = bus.next_ping(tick)  # Random tick between 0.5 and 1.5 seconds
        print(ping)
        time.sleep(tick)