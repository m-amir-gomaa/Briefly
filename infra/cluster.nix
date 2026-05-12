{ pkgs, ... }:

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
  # The --join address is injected per-node by hive.nix (read from infra/nodes.json).
  # This base config only sets performance and binding parameters.
  services.cockroachdb = {
    enable = true;
    cacheSize = "25%";
    maxSqlMemory = "25%";
    httpAddress = "0.0.0.0";
    listenAddress = "0.0.0.0";
    extraArgs = [
      "--insecure"
      "--locality=node=${config.networking.hostName}"
    ];
  };

  # 3. Distributed Object Storage (MinIO)
  # Run in distributed mode. Requires 4+ drives across the cluster.
  services.minio = {
    enable = true;
    listenAddress = ":9000";
    consoleAddress = ":9001";
    # Distributed mode syntax for 5 nodes
    dataDir = [ "http://laptop-{alpha,beta,gamma,delta,epsilon}:9000/var/lib/minio/data" ];
    rootCredentialsFile = "/etc/nixos/secrets/minio-credentials";
  };

  # 4. Orchestration (K3s)
  # One node will be server, others agents. This config is for agents.
  services.k3s = {
    enable = true;
    role = "agent";
    serverAddr = "https://laptop-alpha:6443";
    tokenFile = "/var/lib/k3s/token"; # User must provide this
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
