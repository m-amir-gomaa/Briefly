{ pkgs, ... }:

{
  # ────────────────────────────────────────────────────────────────────────────
  # Briefly Standardized VM: NixOS-in-a-Box
  # ────────────────────────────────────────────────────────────────────────────

  # Bootloader for VM
  boot.loader.grub.enable = true;
  boot.loader.grub.device = "/dev/vda";

  # Networking
  networking.hostName = "briefly-vm";
  networking.firewall.allowedTCPPorts = [ 22 80 8080 9000 9001 ];

  # Docker Stack
  virtualisation.docker.enable = true;
  virtualisation.docker.onBoot = true;

  # SSH for Host -> VM communication
  services.openssh = {
    enable = true;
    settings.PermitRootLogin = "yes";
  };

  # Standard user for the team
  users.users.briefly = {
    isNormalUser = true;
    extraGroups = [ "wheel" "docker" ];
    password = "briefly_secret"; # Standardized for the team
    openssh.authorizedKeys.keys = [
      # The VM will automatically trust the host's SSH key if you add it here
    ];
  };

  # Packages needed inside the VM
  environment.systemPackages = with pkgs; [
    git
    vim
    curl
    htop
    docker-compose
    cloudflared # For the tunnel
  ];

  # QEMU VM Resources
  virtualisation.memorySize = 4096; # 4GB RAM
  virtualisation.cores = 2;
  virtualisation.diskSize = 40960; # 40GB Disk

  # QEMU Guest Agent for better host integration
  services.qemuGuest.enable = true;

  system.stateVersion = "24.05";
}
