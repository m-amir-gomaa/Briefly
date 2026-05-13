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

  # 2. Distributed SQL (CockroachDB)
  # Each node participates in the cluster
  services.cockroachdb = {
    enable = true;
    join = "laptop-alpha"; # The seed node (Laptop 1)
    cacheSize = "25%";
    maxSqlMemory = "25%";
    httpAddress = "0.0.0.0";
    listenAddress = "0.0.0.0";
    # Distributed settings
    extraArgs = [
      "--insecure" # Use certificates in production, insecure for hackathon
      "--locality=node=${config.networking.hostName}"
    ];
  };

  # 3. Distributed Object Storage (MinIO)
  # Run in distributed mode if multiple nodes are available.
  services.minio = {
    enable = true;
    listenAddress = ":9000";
    consoleAddress = ":9001";
    # Dynamic data dir: if you have multiple nodes, you'd list them here.
    # For now, we default to local storage to ensure it works on any node count.
    dataDir = [ "/var/lib/minio/data" ];
    rootCredentialsFile = "/etc/nixos/secrets/minio-credentials";
  };

  # 4. Orchestration (K3s)
  services.k3s = {
    enable = true;
    role = if config.networking.hostName == "laptop-alpha" then "server" else "agent";
    serverAddr = if config.networking.hostName == "laptop-alpha" then "" else "https://laptop-alpha:6443";
    tokenFile = "/var/lib/k3s/token";
  };

  # 5. Core Utilities
  environment.systemPackages = with pkgs; [
    cockroachdb
    minio-client
    k3s
    cloudflared
    htop
    vim
    git
  ];

  system.stateVersion = "24.05";
}
