# Clean up and Start Minikube - Step Explanation

## Overview
The **"Clean up and Start Minikube"** step prepares a fresh, safe Kubernetes cluster environment for the demo pipeline. It ensures the runner has enough disk space, removes any lingering broken clusters, and starts Minikube with optimal resource allocation for a 4GB VM.

---

## Step Breakdown

### Step 1: Freeing up Disk Space
```bash
docker system prune -af --volumes
```

**What it does:**
- Removes all unused Docker images (`-a`)
- Removes all unused containers
- Removes all unused volumes (`--volumes`)
- Forces removal without prompting (`-f`)

**Why it's important:**
- GitHub Actions runners (especially self-hosted VMs) have limited disk space
- Previous pipeline runs accumulate Docker layers, unused images, and volumes
- Without cleanup, `minikube image load` fails with "no space left on device" error
- This reclaims gigabytes of space for the new build

**Impact:** Frees 2-5GB of disk space depending on previous runs

---

### Step 2: Deleting old broken cluster
```bash
minikube delete
```

**What it does:**
- Completely removes the existing Minikube cluster (if present)
- Deletes the Minikube VM, all pods, and persistent volumes

**Why it's important:**
- Ensures a "clean slate" start—no stale configurations or crashed workloads from previous runs
- Prevents port conflicts (Minikube services may be hanging on ports)
- Prevents node readiness issues or hung control plane
- Reduces flaky failures due to partially-initialized clusters

**Impact:** Removes ~500MB of Minikube data, clears all cluster state

---

### Step 3: Starting Minikube safely
```bash
minikube start --memory=2200 --cpus=2 --force
```

**What it does:**
- Starts a new Minikube cluster with specific resource constraints
- Allocates 2200MB (2.2GB) RAM to the cluster
- Allocates 2 CPU cores
- Uses `--force` to bypass lingering disk space warnings

**Memory allocation rationale:**
- The VM has 4GB total RAM
- 2200MB for Minikube leaves ~1.8GB for:
  - OS kernel and system processes
  - Docker daemon
  - Other runner components (GitHub Actions agent, etc.)
- Attempting to allocate more (e.g., 3000MB) causes OOM (out-of-memory) errors
- 2200MB is safe and sufficient for:
  - Falco DaemonSet
  - Victim app pod
  - KubeSentinel scanner
  - Health checks and monitoring

**CPU allocation:**
- 2 CPUs is standard for lightweight K8s clusters
- Sufficient for demo purposes

**`--force` flag:**
- Bypasses warnings about remaining disk space
- Useful because cleanup may not free disk immediately
- Allows startup to proceed even if df shows tight margins

**Impact:** Creates a fresh, responsive Kubernetes cluster

---

### Step 4: Wait for Control Plane
```bash
kubectl wait --for=condition=Ready node/minikube --timeout=90s
```

**What it does:**
- Pauses the pipeline until the Minikube node is fully ready
- Checks for the "Ready" condition on the minikube node
- Waits up to 90 seconds (timeout)

**Why it's critical:**
- Ensures the Kubernetes API server is responsive
- Verifies the control plane components (etcd, scheduler, controller-manager) are healthy
- Prevents race conditions if subsequent steps try to deploy before K8s is ready
- If this check fails, the pipeline fails early with clear error messaging

**Typical wait time:** 15-30 seconds

**Impact:** Synchronization point; guarantees cluster readiness before proceeding

---

## Full Script Flow

| Phase | Command | Time | Outcome |
|-------|---------|------|---------|
| **Cleanup** | `docker system prune -af --volumes` | 10-20s | Frees disk space |
| **Reset** | `minikube delete` | 5-10s | Removes old cluster |
| **Bootstrap** | `minikube start --memory=2200 --cpus=2 --force` | 20-30s | New cluster created |
| **Readiness** | `kubectl wait --for=condition=Ready node/minikube` | 15-30s | Cluster operational |
| **Total** | All steps combined | ~60s | Pipeline ready to deploy |

---

## Common Issues & Fixes

### Issue: "no space left on device"
**Cause:** Step 1 cleanup didn't free enough space
**Fix:** Manually run on VM:
```bash
docker system prune -af --volumes
docker image prune -af
rm -rf ~/.minikube/  # Nuclear option: delete all Minikube data
```

### Issue: "kubectl wait" timeout (90s exceeded)
**Cause:** Minikube failed to start or control plane crashed
**Fix:** Check logs on VM:
```bash
minikube logs
minikube status
```

### Issue: Pod OOM killed after deployment
**Cause:** Memory allocation too aggressive
**Fix:** Don't increase `--memory` beyond 2200MB on 4GB VM

---

## Why This Matters for the Demo

This step is **critical** for the KubeSentinel + Falco demo because:

1. **Reliability**: Ensures each pipeline run starts fresh, preventing cascading failures
2. **Disk Safety**: Prevents disc-full errors that block image loading
3. **Performance**: 2200MB memory is tuned for Falco (eBPF) + victim app without OOM
4. **Idempotency**: Multiple reruns work consistently (no stale state)
5. **Time to Deploy**: ~60 seconds from cleanup to "Ready" cluster

---

## Related Steps

- **Next step:** Build Docker image (uses the ready cluster)
- **Before:** Checkout repository and set environment variables
- **Falco depends on:** This step completing successfully (Falco installs via Helm to the ready cluster)

