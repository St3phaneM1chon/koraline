#!/usr/bin/env bash
##############################################################################
# 00-create-utm-vm.sh — Create UTM VM for FusionPBX on Mac Studio M4 Max
#
# Prerequisites:
#   - UTM installed (/Applications/UTM.app)
#   - Debian 12 ARM64 ISO downloaded
#
# This script creates the VM via AppleScript (UTM CLI).
# After creation, manually install Debian, then run 01-install-fusionpbx.sh.
##############################################################################

set -euo pipefail

VM_NAME="FusionPBX"
ISO_PATH="/Volumes/AI_Project/vm-images/debian-13-arm64-netinst.iso"
DISK_SIZE_GB=40
RAM_MB=8192
CPU_CORES=4

echo "============================================"
echo " UTM VM Creation: $VM_NAME"
echo "============================================"
echo ""
echo "  CPUs:   $CPU_CORES"
echo "  RAM:    ${RAM_MB}MB (8 GB)"
echo "  Disk:   ${DISK_SIZE_GB}GB"
echo "  ISO:    $ISO_PATH"
echo ""

# Check UTM
if [ ! -d "/Applications/UTM.app" ]; then
    echo "ERROR: UTM not installed. Run: brew install --cask utm"
    exit 1
fi

# Check ISO
if [ ! -f "$ISO_PATH" ]; then
    echo "ERROR: Debian ISO not found at $ISO_PATH"
    echo "Download: curl -L -o '$ISO_PATH' 'https://cdimage.debian.org/debian-cd/current/arm64/iso-cd/debian-12.10.0-arm64-netinst.iso'"
    exit 1
fi

echo "Creating VM via UTM..."
echo ""
echo "NOTE: UTM doesn't have a full CLI for VM creation."
echo "Please create the VM manually in UTM with these settings:"
echo ""
echo "  1. Open UTM → Click '+' → Virtualize → Linux"
echo "  2. Boot ISO: $ISO_PATH"
echo "  3. Hardware:"
echo "     - CPU cores: $CPU_CORES"
echo "     - RAM: ${RAM_MB} MB"
echo "     - Storage: ${DISK_SIZE_GB} GB (VirtIO)"
echo "  4. Network: Bridged (for LAN access) or Shared (NAT with port forwarding)"
echo "     For production: Bridged mode recommended"
echo "  5. Name: $VM_NAME"
echo ""
echo "  After Debian install, configure:"
echo "     - Hostname: pbx"
echo "     - Domain: biocyclepeptides.com"
echo "     - Root password: (set a strong one)"
echo "     - Username: admin"
echo "     - Partitioning: Use entire disk"
echo "     - Software: SSH server + standard system utilities ONLY"
echo "     - No desktop environment needed"
echo ""

# Try to open UTM
open -a UTM 2>/dev/null && echo "UTM opened."

echo "============================================"
echo " After Debian is installed:"
echo "============================================"
echo ""
echo "  1. Note the VM's IP address:"
echo "     ssh admin@<vm-ip> 'ip addr show | grep inet'"
echo ""
echo "  2. Copy and run the FusionPBX installer:"
echo "     scp scripts/voip/01-install-fusionpbx.sh root@<vm-ip>:~/"
echo "     ssh root@<vm-ip> 'bash ~/01-install-fusionpbx.sh'"
echo ""
echo "  3. Configure SIP trunks:"
echo "     scp scripts/voip/02-configure-sip-trunks.sh root@<vm-ip>:~/"
echo "     ssh root@<vm-ip> 'bash ~/02-configure-sip-trunks.sh'"
echo ""
echo "  4. Configure IVR:"
echo "     scp scripts/voip/03-configure-ivr.sh root@<vm-ip>:~/"
echo "     ssh root@<vm-ip> 'bash ~/03-configure-ivr.sh'"
echo ""
echo "  5. Configure CDR webhook:"
echo "     scp scripts/voip/04-configure-cdr-webhook.sh root@<vm-ip>:~/"
echo "     ssh root@<vm-ip> 'bash ~/04-configure-cdr-webhook.sh'"
echo ""
echo "  6. Health check:"
echo "     scp scripts/voip/05-health-check.sh root@<vm-ip>:~/"
echo "     ssh root@<vm-ip> 'bash ~/05-health-check.sh'"
echo ""
echo "============================================"
echo " Port Forwarding (Router)"
echo "============================================"
echo ""
echo "  Forward these ports to the VM's LAN IP:"
echo "  - TCP 443   → HTTPS / WSS (FusionPBX GUI + WebRTC)"
echo "  - TCP 5060  → SIP signaling (registration)"
echo "  - TCP 5061  → SIP-TLS"
echo "  - UDP 5060  → SIP signaling"
echo "  - UDP 5080  → SIP external profile"
echo "  - TCP 7443  → mod_verto WSS (WebRTC)"
echo "  - UDP 16384-32768 → RTP media (voice)"
echo ""
echo "  IMPORTANT: Disable SIP ALG on your router!"
echo ""
echo "============================================"
echo " DNS (already configured)"
echo "============================================"
echo ""
echo "  pbx.biocyclepeptides.com → 109.231.76.127 (A record, TTL 600)"
echo "  _sip._udp.pbx            → pbx.biocyclepeptides.com:5060 (SRV)"
echo "  _sip._tcp.pbx            → pbx.biocyclepeptides.com:5060 (SRV)"
echo "  _sips._tcp.pbx           → pbx.biocyclepeptides.com:5061 (SRV)"
echo ""
