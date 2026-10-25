FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /srv

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY certs/avast-root.crt /usr/local/share/ca-certificates/avast-root.crt

RUN update-ca-certificates
RUN echo "=== Certificate details ===" \
    && openssl x509 -in /usr/local/share/ca-certificates/avast-root.crt -noout -subject -issuer \
    && echo "=== Avast certificates in trust store ===" \
    && (ls -l /etc/ssl/certs | grep -i avast || true)

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]