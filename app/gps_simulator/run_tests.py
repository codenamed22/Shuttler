"""
Test runner script for GPS simulator tests.
Provides convenient commands to run different types of tests.
"""
import subprocess
import sys
import os
import argparse


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"\n✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"\n❌ Command not found: {cmd[0]}")
        print("Make sure pytest is installed: pip install -r requirements.txt")
        return False


def run_all_tests():
    """Run all tests."""
    cmd = [
        "python", "-m", "pytest", 
        "tests/", 
        "-v", 
        "--tb=short"
    ]
    return run_command(cmd, "All tests")


def run_unit_tests():
    """Run only unit tests."""
    cmd = [
        "python", "-m", "pytest",
        "tests/test_bus.py",
        "tests/test_ws_server.py", 
        "tests/test_simulator.py",
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, "Unit tests")


def run_integration_tests():
    """Run only integration tests."""
    cmd = [
        "python", "-m", "pytest",
        "tests/test_integration.py",
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, "Integration tests")


def run_performance_tests():
    """Run performance tests."""
    cmd = [
        "python", "-m", "pytest",
        "tests/test_performance.py",
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, "Performance tests")


def run_simple_tests():
    """Run only the simple, stable tests."""
    cmd = [
        "python", "-m", "pytest",
        "tests/test_bus.py",
        "tests/test_ws_server_simple.py", 
        "tests/test_simulator_simple.py",
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, "Simple tests")


def run_simple_with_coverage():
    """Run simple tests with coverage report."""
    cmd = [
        "python", "-m", "pytest",
        "tests/test_bus.py",
        "tests/test_ws_server_simple.py",
        "tests/test_simulator_simple.py",
        "--cov=.",
        "--cov-report=term-missing",
        "--cov-report=html:htmlcov",
        "-v"
    ]
    return run_command(cmd, "Simple tests with coverage")


def run_with_coverage():
    """Run tests with coverage report."""
    cmd = [
        "python", "-m", "pytest",
        "tests/test_bus.py",
        "tests/test_ws_server_simple.py", 
        "tests/test_simulator_simple.py",
        "--cov=.",
        "--cov-report=html:htmlcov",
        "--cov-report=term-missing",
        "-v"
    ]
    return run_command(cmd, "Tests with coverage")


def run_fast_tests():
    """Run quick tests (excluding performance and long-running tests)."""
    cmd = [
        "python", "-m", "pytest",
        "tests/test_bus.py",
        "tests/test_ws_server.py",
        "tests/test_simulator.py",
        "-k", "not (performance or stress or extended or long_running)",
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, "Fast tests")


def run_specific_test_file(test_file):
    """Run tests from a specific file."""
    if not test_file.startswith("tests/"):
        test_file = f"tests/{test_file}"
    if not test_file.endswith(".py"):
        test_file = f"{test_file}.py"
        
    cmd = [
        "python", "-m", "pytest",
        test_file,
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, f"Tests from {test_file}")


def run_specific_test(test_pattern):
    """Run tests matching a specific pattern."""
    cmd = [
        "python", "-m", "pytest",
        "tests/",
        "-k", test_pattern,
        "-v",
        "--tb=short"
    ]
    return run_command(cmd, f"Tests matching '{test_pattern}'")


def check_test_environment():
    """Check if test environment is properly set up."""
    print("Checking test environment...")
    
    # Check if we're in the right directory
    if not os.path.exists("tests"):
        print("❌ tests/ directory not found")
        print("Please run this script from the gps_simulator directory")
        return False
        
    # Check if required files exist
    required_files = [
        "bus.py",
        "simulator.py", 
        "ws_server.py",
        "requirements.txt"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
            
    if missing_files:
        print(f"❌ Missing required files: {', '.join(missing_files)}")
        return False
        
    # Check if pytest is available
    try:
        import pytest
        print(f"✅ pytest {pytest.__version__} available")
    except ImportError:
        print("❌ pytest not installed")
        print("Install with: pip install -r requirements.txt")
        return False
        
    # Check if optional dependencies are available
    optional_deps = {
        "websockets": "WebSocket functionality",
        "psutil": "Performance monitoring", 
        "coverage": "Coverage reporting"
    }
    
    for dep, description in optional_deps.items():
        try:
            __import__(dep)
            print(f"✅ {dep} available ({description})")
        except ImportError:
            print(f"⚠️  {dep} not available ({description})")
            
    print("\n✅ Test environment check completed")
    return True


def main():
    parser = argparse.ArgumentParser(description="GPS Simulator Test Runner")
    parser.add_argument(
        "command",
        choices=[
            "all", "unit", "simple", "coverage", "simple-cov",
            "fast", "check", "file", "pattern"
        ],
        help="Type of tests to run"
    )
    parser.add_argument(
        "target",
        nargs="?",
        help="Target file (for 'file' command) or pattern (for 'pattern' command)"
    )
    
    args = parser.parse_args()
    
    # Change to the gps_simulator directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    if args.command == "check":
        success = check_test_environment()
    elif args.command == "all":
        success = run_all_tests()
    elif args.command == "unit":
        success = run_unit_tests()
    elif args.command == "simple":
        success = run_simple_tests()
    elif args.command == "coverage":
        success = run_with_coverage()
    elif args.command == "simple-cov":
        success = run_simple_with_coverage()
    elif args.command == "fast":
        success = run_fast_tests()
    elif args.command == "file":
        if not args.target:
            print("Error: file command requires a target file")
            sys.exit(1)
        success = run_specific_test_file(args.target)
    elif args.command == "pattern":
        if not args.target:
            print("Error: pattern command requires a test pattern")
            sys.exit(1)
        success = run_specific_test(args.target)
    else:
        print(f"Unknown command: {args.command}")
        sys.exit(1)
        
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
