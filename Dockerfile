FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only what the API needs
COPY ml_pipeline/ ./ml_pipeline/
COPY models/ ./models/

EXPOSE 8000

CMD uvicorn ml_pipeline.inference_api:app --host 0.0.0.0 --port $PORT
