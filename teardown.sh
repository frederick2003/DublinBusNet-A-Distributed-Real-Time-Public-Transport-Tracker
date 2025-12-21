#!/usr/bin/env bash
set -euo pipefail

kubectl delete namespace dublinbus --ignore-not-found=true
echo "Namespace deleted. If you used 'minikube tunnel', stop it with Ctrl+C."