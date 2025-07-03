# GPS Simulator

A real-time GPS bus tracking simulator with WebSocket broadcasting.

## Quick Start

```bash
# Run tests
python run_tests.py simple

# Run with coverage
python run_tests.py simple-cov

# Check environment
python run_tests.py check
```

## Core Modules

- **`bus.py`** - GPS bus simulation with route following
- **`ws_server.py`** - WebSocket server for real-time broadcasting  
- **`simulator.py`** - Main simulation orchestrator
- **`tests/`** - Comprehensive test suite (37 tests, all passing)

## Dependencies

```bash
pip install -r requirements.txt
```

Includes: pytest, pytest-asyncio, pytest-cov, websockets
