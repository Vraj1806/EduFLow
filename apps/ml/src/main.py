"""Uvicorn entrypoint for the EduFlow ML service."""

import os

import uvicorn


def main() -> None:
    host = os.getenv("ML_HOST", "127.0.0.1")
    port = int(os.getenv("ML_PORT", "5000"))
    uvicorn.run(
        "src.app:app",
        host=host,
        port=port,
        reload=bool(os.getenv("ML_RELOAD", "false").lower() == "true"),
    )


if __name__ == "__main__":
    main()
