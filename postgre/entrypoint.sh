#!/bin/bash

set -e
#echo "alias dbc='psql -U RSO -d tsuioku_base'" >> ~/.bashrc
source ~/.bashrc
/docker-entrypoint-initdb.d/init.sql &

exec "$@"