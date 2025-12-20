FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy analytics worker code
COPY . .

# Ensure logs appear immediately
ENV PYTHONUNBUFFERED=1

# Run Kafka consumer (blocking)
CMD ["python", "main.py"]
