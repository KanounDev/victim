# victim-app

This repository is a deliberately unsafe Node.js demo application for a controlled DevSecOps security showcase.
It is designed to help demonstrate how KubeSentinel flags insecure infrastructure and how runtime monitoring with Falco can surface suspicious activity.

## Demo architecture

![KubeSentinel demo architecture](kubesentinel_demo_architecture.svg)

The diagram summarizes the intended flow: code is pushed, manifests are scanned, the image is built and deployed, and runtime events are collected for analysis.

## Demo purpose

This project exists to support a security demonstration, not production use. The app and infrastructure are intentionally misconfigured so that CSPM and runtime detection tools have something meaningful to detect.

The demo covers:

- Static scanning of Kubernetes manifests
- Detection of risky container settings
- Runtime event visibility from the application and cluster
- Event aggregation and analysis in the KubeSentinel namespace

## Application overview

The service is a small Express API with a health check and two intentionally unsafe request handlers.

- `GET /api/health` returns a simple 200 response.
- `GET /api/ping` accepts a `target` query parameter and forwards it into a shell command.
- `GET /api/read` accepts a `file` query parameter and reads the requested path directly.

These behaviors are intentional for the demo and should only be used in an isolated lab environment.

## Local development

Requirements:

- Node.js 18 or newer
- npm

Run the app locally:

```bash
npm install
npm start
```

The server listens on port `3000`.

## Container image

The Dockerfile builds from the full `node:18` image and runs the process as the default root user so the demo can surface container hardening findings.

Build and run:

```bash
docker build -t victim-app .
docker run --rm -p 3000:3000 victim-app
```

## Kubernetes deployment

The manifest in [k8s/deployment.yaml](k8s/deployment.yaml) includes intentionally unsafe pod settings and a hostPath mount to ensure the scanner has clear violations to report.

Apply it with:

```bash
kubectl apply -f k8s/deployment.yaml
```

## CI/CD flow

The GitHub Actions workflow in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) represents the demo pipeline:

1. Push code to the main branch.
2. Run a KubeSentinel static scan against the manifests.
3. Deploy to Minikube only if the scan passes.

## Repo layout

- [server.js](server.js)
- [Dockerfile](Dockerfile)
- [k8s/deployment.yaml](k8s/deployment.yaml)
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- [kubesentinel_demo_architecture.svg](kubesentinel_demo_architecture.svg)