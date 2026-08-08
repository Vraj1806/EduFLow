import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ["ML_BACKEND"] = "demo"
os.environ["ML_SERVICE_SECRET"] = "test-ml-secret"
