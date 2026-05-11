{ pkgs, ... }:

{
  # ────────────────────────────────────────────────────────────────────────────
  # Briefly VPS: Production NixOS Configuration
  # ────────────────────────────────────────────────────────────────────────────

  # Enable networking and standard firewall
  networking.hostName = "briefly-vps";
  networking.firewall.allowedTCPPorts = [ 80 443 22 ];

  # Docker Configuration for the App Stack
  virtualisation.docker.enable = true;

  # Nginx Reverse Proxy (Optimized for SSE)
  services.nginx = {
    enable = true;
    recommendedProxySettings = true;
    recommendedTlsSettings = true;

    virtualHosts."briefly.softworks.ai" = {
      enableACME = true;
      forceSSL = true;
      locations."/" = {
        proxyPass = "http://localhost:8080"; # Go API
      };
      locations."/api/v1/events/" = {
        proxyPass = "http://localhost:8080";
        extraConfig = ''
          proxy_buffering off;
          proxy_cache off;
          proxy_set_header Connection "";
          chunked_transfer_encoding off;
        '';
      };
    };
  };

  # SSH Access for deploy-rs
  services.openssh.enable = true;
  users.users.root.openssh.authorizedKeys.keys = [
    # USER: Add your SSH public key here
    "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... briefly-deploy-key" 
  ];

  # System Packages
  environment.systemPackages = with pkgs; [
    git
    vim
    htop
    docker-compose
  ];

  system.stateVersion = "24.05"; 
}
