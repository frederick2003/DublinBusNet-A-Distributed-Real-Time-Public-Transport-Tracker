# 🚌 DublinBusNet — Real-Time Distributed Transit Tracker

## 🎯 Project Overview
**DublinBusNet** is a distributed system designed to provide **real-time tracking, analysis, and prediction of Dublin Bus locations** using the public **GTFS-Realtime API**.  
The project demonstrates key distributed systems principles, including **scalability**, **fault tolerance**, **asynchronous communication**, and **architectural trade-off analysis**.

This project is developed as part of the **COMP41720 Distributed Systems capstone**.

---

## 🧩 Core Objectives

1. **Collect** live bus data (positions, trips, alerts) from the Dublin Bus GTFS-Realtime feeds.  
2. **Process and normalise** data across distributed microservices.  
3. **Store** time-series data in a scalable, queryable database.  
4. **Expose** a secure API and real-time frontend for live bus tracking and ETAs.  
5. **Demonstrate** distributed system design trade-offs in our report and ADRs.

---

## ⚙️ System Architecture

We use a **microservices-based distributed architecture** combining both **asynchronous** (Kafka) and **synchronous** (REST/gRPC) communication.

### **Service Overview**

| Service | Description | Communication |
|----------|--------------|----------------|
| **Ingestion Service** | Polls GTFS-Realtime feeds (TripUpdates, VehiclePositions, Alerts). | Publishes messages to Kafka / Redpanda |
| **Processing Service** | Normalises and enriches bus data for storage. | Consumes from Kafka, writes to DB |
| **Analytics Service** | Performs ETA calculations and route statistics. | REST / gRPC |
| **API Gateway & Query Service** | Provides REST and WebSocket APIs for frontend clients. | HTTPS / WebSocket |
| **Frontend (Web)** | Displays real-time bus locations and analytics. | WebSocket / HTTPS |

### **Supporting Components**

- **Kafka / Redpanda** — Asynchronous messaging backbone.  
- **TimescaleDB / InfluxDB** — Time-series data store.  
- **Redis** — High-speed caching layer.  
- **Docker + Kubernetes** — Containerisation and orchestration.  
- **Prometheus + Grafana** — Monitoring and observability.  
- **Keycloak + mTLS** — Authentication and service-level security.

---

## 🧱 High-Level Architecture Diagram
```mermaid
flowchart LR
subgraph External
    GTFSRT[GTFS-Realtime Feeds: Trip Updates, Vehicle Positions, Alerts]
  end

  subgraph Ingestion
    Poller[Ingestion Poller]
    Validator[Schema Validator]
  end

  subgraph Messaging
    Kafka[(Kafka / Redpanda)]
    SR[(Schema Registry)]
  end

  subgraph Processing
    Normaliser[Normalizer & Enricher]
    TSDB[(TimescaleDB / InfluxDB)]
    Cache[(Redis)]
  end

  subgraph API
    Gateway[API Gateway]
    Query[Query API]
    WS[WebSocket or SSE]
    Analytics[Analytics / ETA Service]
    Auth[Keycloak Auth]
  end

  subgraph Observability
    OTel[OpenTelemetry SDK]
    Prom[Prometheus]
    Grafana[Grafana]
    Jaeger[Jaeger Tracing]
  end

  subgraph Clients
    Web[Web Frontend Map]
  end

  GTFSRT --> Poller --> Validator -->|produce| Kafka
  SR --- Kafka
  Kafka -->|consume| Normaliser --> TSDB
  Normaliser --> Cache
  Analytics --> TSDB
  Analytics --> Cache
  Gateway -->|mTLS + JWT| Query
  Gateway -->|mTLS + JWT| Analytics
  Query --> TSDB
  Query --> Cache
  Query --> WS
  Web -->|HTTPS| Gateway
  OTel -.-> Poller
  OTel -.-> Normaliser
  OTel -.-> Query
  OTel -.-> Analytics
  Prom --> Grafana
  OTel --> Jaeger
```
