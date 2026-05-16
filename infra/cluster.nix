{ pkgs, config, ... }:

{
  # ────────────────────────────────────────────────────────────────────────────
  # Briefly Cluster: Distributed Node Configuration
  # ────────────────────────────────────────────────────────────────────────────

  # 1. Networking (Tailscale Backbone)
  services.tailscale.enable = true;
  networking.firewall.checkReversePath = "loose"; # Recommended for Tailscale
  networking.firewall.allowedTCPPorts = [ 
    22    # SSH
    80    # HTTP
    443   # HTTPS
    26257 # CockroachDB SQL
    26258 # CockroachDB HTTP Console
    6379  # Redis
    9000  # MinIO API
    9001  # MinIO Console
    6443  # K3s API
  ];

  # 2. Deleted Conflicting Services
  # CockroachDB, MinIO, and K3s have been removed from the host OS layer.
  # They are exclusively managed by Docker Compose now to avoid port conflicts.

  # 3. Core Utilities
  environment.systemPackages = with pkgs; [
    htop
    vim
    git
  ];

  system.stateVersion = "24.05";
}
