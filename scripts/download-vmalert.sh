#!/bin/bash

# Download vmalert binary for local development
# Detects platform and downloads appropriate binary

set -e

VM_VERSION="${1:-1.132.0}"
ARCH=$(uname -m)
OS=$(uname -s)

echo "Detected: OS=$OS, Arch=$ARCH"

# Determine platform
case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64) PLATFORM="darwin-arm64" ;;
      x86_64) PLATFORM="darwin-amd64" ;;
      *) echo "Unsupported architecture: $ARCH" && exit 1 ;;
    esac
    ;;
  Linux)
    case "$ARCH" in
      aarch64|arm64) PLATFORM="linux-arm64" ;;
      x86_64|amd64) PLATFORM="linux-amd64" ;;
      armv7l) PLATFORM="linux-arm" ;;
      *) echo "Unsupported architecture: $ARCH" && exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

echo "Downloading vmalert v${VM_VERSION} for ${PLATFORM}..."

# Download Victoria Metrics release
DOWNLOAD_URL="https://github.com/VictoriaMetrics/VictoriaMetrics/releases/download/v${VM_VERSION}/victoria-metrics-${PLATFORM}-v${VM_VERSION}.tar.gz"
TEMP_DIR=$(mktemp -d)
TEMP_FILE="${TEMP_DIR}/vm.tar.gz"

echo "URL: $DOWNLOAD_URL"

curl -fL -o "$TEMP_FILE" "$DOWNLOAD_URL" || {
  echo "Failed to download vmalert"
  rm -rf "$TEMP_DIR"
  exit 1
}

# Extract vmalert-prod
tar -xzf "$TEMP_FILE" -C "$TEMP_DIR" vmalert-prod || {
  echo "Failed to extract vmalert-prod from archive"
  rm -rf "$TEMP_DIR"
  exit 1
}

# Move to server directory
mkdir -p server
mv "$TEMP_DIR/vmalert-prod" server/vmalert-prod
chmod +x server/vmalert-prod

# Cleanup
rm -rf "$TEMP_DIR"

echo "vmalert downloaded successfully to server/vmalert-prod"
echo "Version:"
./server/vmalert-prod --version || echo "Binary may not be executable on this platform"

