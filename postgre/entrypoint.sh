#!/bin/bash

set -e

# Run the PostgreSQL initialization script
/docker-entrypoint-initdb.d/init.sql &

# Start PostgreSQL
exec "$@"

