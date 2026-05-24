#!/usr/bin/env bash
# Render build script — pins pip and installs dependencies with pre-built wheels.
set -o errexit

echo "Python version: $(python --version)"
pip install --upgrade pip
pip install -r requirements.txt
