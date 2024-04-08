#!/bin/bash

# Wait for PostgreSQL to be ready
until pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_NAME; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 1
done

# Create the database if it doesn't exist
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -c "CREATE POSTGRES IF NOT EXISTS $POSTGRES_NAME;"

# Run database migrations
python manage.py migrate

# Start the Django server
exec "$@"

