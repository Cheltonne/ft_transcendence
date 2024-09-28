FROM debian:11.9-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/app

RUN apt update && \
    apt install -y libpq-dev gcc && \
    apt install -y --no-install-recommends python3 python3-pip && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --upgrade pip

COPY requirements.txt ./

RUN pip3 install --no-cache-dir -r requirements.txt

COPY . ./

CMD ["sh", "-c", "python3 manage.py makemigrations --merge && python3 manage.py migrate && \
python3 manage.py reset_online_devices && python3 manage.py runserver 0.0.0.0:8000"]
