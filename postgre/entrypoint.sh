#!/bin/bash

set -e
echo "alias dbc='psql -U RSO -d tsuioku_base'" >> ~/.bashrc
source ~/.bashrc
# Run the PostgreSQL initialization script
/docker-entrypoint-initdb.d/init.sql &

# Start PostgreSQL
exec "$@"

