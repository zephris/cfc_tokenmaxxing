FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_DIR=/models

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip
COPY ./inference/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ./inference ./

EXPOSE 8100
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
    CMD python -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:8100/health', timeout=3)"

CMD ["gunicorn", "inference_service.wsgi:application", "--bind", "0.0.0.0:8100", "--workers", "1", "--timeout", "120"]
