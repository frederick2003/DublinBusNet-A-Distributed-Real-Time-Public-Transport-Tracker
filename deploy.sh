#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="dublinbus"

echo "[1/7] Starting minikube (docker driver)..."
minikube start --driver=docker

#echo "[2/7] Enabling ingress addon..."
#minikube addons enable ingress

echo "[3/7] Pointing Docker to minikube daemon..."
eval "$(minikube -p minikube docker-env)"

echo "[4/7] Building images in minikube..."
# Build with repo root as context when needed (so backend can include static data if desired)
docker build -t dublinbus-backend -f services/backend-service/Dockerfile .
docker build -t dublinbus-analytics -f services/analytics-service/Dockerfile services/analytics-service
docker build -t dublinbus-kafka-ingestion -f services/ingestion-service/Dockerfile services/ingestion-service
docker build -t dublinbus-vehicle-positions-consumer services/vehicle-positions-consumer

# Frontend: pass VITE_API_BASE at build time (browser should call /api via ingress)
docker build \
  -t dublinbus-frontend \
  --build-arg VITE_API_BASE=/api \
  -f services/frontend/DublinBusNet/Dockerfile \
  services/frontend/DublinBusNet

echo "[5/7] Applying namespace + base resources..."
kubectl apply -f k8s/namespace.yaml

echo "[6/7] Applying config + secret..."
kubectl apply -f k8s/configmap.yaml

# Create/replace secret from env var if provided
if [[ -n "${NTA_API_KEY:-}" ]]; then
  kubectl create secret generic api-secrets \
    --from-literal=NTA_API_KEY="${NTA_API_KEY}" \
    -n "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -
else
  echo "WARNING: NTA_API_KEY not set. Ingestion may fail if the API requires a key."
  kubectl create secret generic api-secrets \
    --from-literal=NTA_API_KEY="REPLACE_ME" \
    -n "${NAMESPACE}" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

echo "[7/7] Applying services..."
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/redpanda.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/analytics.yaml
kubectl apply -f k8s/kafka-ingestion.yaml
kubectl apply -f k8s/vehicle-positions-consumer.yaml
kubectl apply -f k8s/frontend.yaml
#kubectl apply -f k8s/ingress.yaml

echo "Waiting for pods to become Ready..."
kubectl wait --for=condition=ready pod -n "${NAMESPACE}" --all --timeout=240s

echo "Done."
echo "Open the app with:"
echo "  minikube tunnel"
echo "  Then visit: http://localhost"