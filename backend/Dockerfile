FROM python:3.11-alpine AS builder

WORKDIR /app

# Upgrade Alpine packages to fix OS-level vulnerabilities
RUN apk upgrade --no-cache

COPY requirements.txt .

RUN pip install --upgrade pip wheel setuptools

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
