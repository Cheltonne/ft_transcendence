FROM python:3

WORKDIR /usr/src/app

COPY requirements.txt ./
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

RUN python manage.py migrate

CMD ["python", "script.py"]
