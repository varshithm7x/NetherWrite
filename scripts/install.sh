#!/bin/bash
set -e

# Repository configuration
REPO="varshithm7x/NetherWrite"
API_URL="https://api.github.com/repos/${REPO}/releases/latest"

echo "Checking system compatibility..."
OS="$(uname -s)"
ARCH="$(uname -m)"

# Normalize OS and ARCH
case "${OS}" in
  Linux*)
    OS_TYPE="linux"
    ;;
  Darwin*)
    OS_TYPE="macos"
    ;;
  *)
    echo "Error: Unsupported operating system: ${OS}"
    exit 1
    ;;
esac

case "${ARCH}" in
  x86_64|amd64)
    ARCH_TYPE="x64"
    ;;
  arm64|aarch64)
    ARCH_TYPE="arm64"
    ;;
  *)
    echo "Error: Unsupported architecture: ${ARCH}"
    exit 1
    ;;
esac

echo "Fetching latest release information for ${REPO}..."
# Fetch release metadata from GitHub API (or fallback if API rate-limited)
RELEASE_JSON=$(curl -fsSL "${API_URL}" || true)
if [ -z "${RELEASE_JSON}" ]; then
  # Fallback: get tag page directly
  VERSION=$(curl -sI https://github.com/${REPO}/releases/latest | grep -Fi location: | sed -e 's/.*tag\/v//' -e 's/\r//' -e 's/\n//')
else
  VERSION=$(echo "${RELEASE_JSON}" | grep -m1 '"tag_name":' | sed -E 's/.*"tag_name":\s*"v?([^"]*)".*/\1/')
fi

if [ -z "${VERSION}" ]; then
  echo "Error: Could not retrieve latest version info from GitHub."
  exit 1
fi

echo "Latest version is v${VERSION}"

# Temp download folder
TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_DIR}"' EXIT

# Installer logic
if [ "${OS_TYPE}" = "macos" ]; then
  echo "Downloading NetherWrite for macOS..."
  DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/NetherWrite-${VERSION}.dmg"
  
  DMG_PATH="${TMP_DIR}/NetherWrite.dmg"
  curl -L -# -o "${DMG_PATH}" "${DOWNLOAD_URL}"
  
  echo "Mounting disk image..."
  MOUNT_POINT="/Volumes/NetherWrite-Install"
  hdiutil attach "${DMG_PATH}" -mountpoint "${MOUNT_POINT}" -nobrowse -quiet
  
  echo "Installing to /Applications..."
  if [ -d "/Applications/NetherWrite.app" ]; then
    sudo rm -rf "/Applications/NetherWrite.app"
  fi
  sudo cp -R "${MOUNT_POINT}/NetherWrite.app" "/Applications/"
  
  echo "Detaching disk image..."
  hdiutil detach "${MOUNT_POINT}" -quiet
  
  echo "NetherWrite successfully installed to /Applications!"
  
elif [ "${OS_TYPE}" = "linux" ]; then
  INSTALL_APPIMAGE=false
  
  # Detect package manager
  if [ -f /etc/arch-release ] || [ -f /etc/manjaro-release ]; then
    echo "Arch Linux detected. Downloading pacman package..."
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/netherwrite-${VERSION}-1-x86_64.pkg.tar.zst"
    
    PKG_PATH="${TMP_DIR}/netherwrite.pkg.tar.zst"
    if curl -fsSL -o "${PKG_PATH}" "${DOWNLOAD_URL}"; then
      sudo pacman -U --noconfirm "${PKG_PATH}"
      echo "NetherWrite successfully installed via Pacman!"
    else
      echo "Pacman package download failed. Falling back to AppImage..."
      INSTALL_APPIMAGE=true
    fi
    
  elif [ -f /etc/debian_version ] || [ -f /etc/lsb-release ]; then
    echo "Debian/Ubuntu detected. Downloading Debian package..."
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/netherwrite_${VERSION}_amd64.deb"
    
    PKG_PATH="${TMP_DIR}/netherwrite.deb"
    if curl -fsSL -o "${PKG_PATH}" "${DOWNLOAD_URL}"; then
      sudo dpkg -i "${PKG_PATH}" || sudo apt-get install -f -y
      echo "NetherWrite successfully installed via Dpkg/Apt!"
    else
      echo "Debian package download failed. Falling back to AppImage..."
      INSTALL_APPIMAGE=true
    fi
  else
    INSTALL_APPIMAGE=true
  fi
  
  if [ "${INSTALL_APPIMAGE}" = "true" ]; then
    echo "Downloading AppImage..."
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/NetherWrite-${VERSION}.AppImage"
    
    APP_PATH="/usr/local/bin/netherwrite"
    echo "Downloading AppImage to ${APP_PATH}..."
    sudo curl -L -# -o "${APP_PATH}" "${DOWNLOAD_URL}"
    sudo chmod +x "${APP_PATH}"
    
    # Generate desktop entry
    DESKTOP_ENTRY="/usr/share/applications/netherwrite.desktop"
    echo "Creating desktop entry at ${DESKTOP_ENTRY}..."
    sudo tee "${DESKTOP_ENTRY}" > /dev/null <<EOF
[Desktop Entry]
Name=NetherWrite
Comment=Local-first knowledge management app
Exec=netherwrite %U
Terminal=false
Type=Application
Icon=netherwrite
StartupWMClass=NetherWrite
Categories=Office;Utility;
MimeType=text/markdown;text/plain;
EOF
    
    # Download icon
    sudo mkdir -p /usr/share/pixmaps
    sudo curl -fsSL -o /usr/share/pixmaps/netherwrite.png "https://raw.githubusercontent.com/${REPO}/main/build/icon.png"
    
    echo "NetherWrite AppImage successfully installed to /usr/local/bin/netherwrite!"
  fi
fi
