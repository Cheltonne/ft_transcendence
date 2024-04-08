FROM postgres:16.2

COPY init.sql /docker-entrypoint-initdb.d/
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh
RUN chmod +x /docker-entrypoint-initdb.d/
CMD ["postgres"]
