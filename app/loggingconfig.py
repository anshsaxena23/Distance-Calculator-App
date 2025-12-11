# app/logger_config.py

import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Define log level mapping for clarity
LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

def setup_logger(name: str = "app_logger", level: str = "INFO"):
    """
    Sets up a reusable, configured logger instance.

    Args:
        name: The name of the logger (usually __name__ of the module).
        level: The minimum logging level to display (e.g., "INFO").
    """
    # 1. Get or create the logger
    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVELS.get(level.upper(), logging.INFO))
    
    # Prevent propagation of logs to the root logger if handlers are already attached
    logger.propagate = False 

    # Check if handlers already exist to prevent duplicate output
    if not logger.handlers:
        
        # 2. Define the Formatter (How the log message looks)
        # Includes timestamp, log level, module name, and the message
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        # 3. Setup the Console Handler (Sends logs to stdout/stderr)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # Optional: Add file handler for local debugging if needed
        # log_dir = Path("logs")
        # log_dir.mkdir(exist_ok=True)
        # file_handler = RotatingFileHandler(
        #     log_dir / "app.log", maxBytes=1024*1024*5, backupCount=5
        # )
        # file_handler.setFormatter(formatter)
        # logger.addHandler(file_handler)

    return logger