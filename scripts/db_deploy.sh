#!/bin/bash
set -e

NAMESPACE="hashimoto-pcos"
DEPLOYMENT="hashimoto-pcos"
PVC_CLAIM="hashimoto-pcos-data-pvc"
LOCAL_DB="${1:-/home/cschaf/hashimoto-pcos/data/products.db}"

if [ ! -f "$LOCAL_DB" ]; then
  echo "ERROR: Database not found at $LOCAL_DB"
  echo "Usage: $0 [path/to/products.db]"
  exit 1
fi

echo "==> Scaling down deployment..."
kubectl scale deployment/$DEPLOYMENT -n $NAMESPACE --replicas=0
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=60s || true

echo "==> Creating temporary copy pod..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: tmp-copy
  namespace: $NAMESPACE
spec:
  restartPolicy: Never
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: $PVC_CLAIM
  containers:
    - name: tmp-copy
      image: busybox
      command: ["tail", "-f", "/dev/null"]
      volumeMounts:
        - name: data
          mountPath: /data
EOF

echo "==> Waiting for tmp-copy pod to be ready..."
kubectl wait pod/tmp-copy -n $NAMESPACE --for=condition=Ready --timeout=60s

echo "==> Copying $LOCAL_DB to PVC..."
kubectl cp "$LOCAL_DB" $NAMESPACE/tmp-copy:/data/products.db

echo "==> Removing stale WAL files..."
kubectl exec -n $NAMESPACE tmp-copy -- sh -c 'rm -f /data/products.db-shm /data/products.db-wal'

echo "==> Verifying files in PVC:"
kubectl exec -n $NAMESPACE tmp-copy -- sh -c 'ls -lh /data/'

echo "==> Cleaning up tmp-copy pod..."
kubectl delete pod tmp-copy -n $NAMESPACE

echo "==> Scaling deployment back up..."
kubectl scale deployment/$DEPLOYMENT -n $NAMESPACE --replicas=1
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=120s

echo "==> Done! Database deployed successfully."
