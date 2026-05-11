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

  # SSH for Host -> VM communication
  services.openssh = {
    enable = true;
    openFirewall = true;
    settings.PermitRootLogin = "yes";
  };

  # Standard user for the team
  users.users.briefly = {
    isNormalUser = true;
    extraGroups = [ "wheel" "docker" ];
    password = "briefly_secret"; # Standardized for the team
    openssh.authorizedKeys.keys = [
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG1BM44wWxyKlM5wkmoY384YtpvnEiyl59OyhDF89l4x mo.gomaa.formal@gmail.com"
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

  # Disable firewall entirely for the fortress VM
  networking.firewall.enable = false;

  # QEMU VM Resources
  virtualisation.memorySize = 4096;
  virtualisation.diskSize = 40960;

  # CPU: 2 cores via QEMU SMP
  virtualisation.qemu.options = [
    "-cpu host"
    "-enable-kvm"
    "-smp 2"
  ];

  # Port forwards — NixOS wires these through the default user-mode NIC safely.
  # SSH: host 2223 → guest 22
  # HTTP: host 8080 → guest 80
  virtualisation.forwardPorts = [
    { from = "host"; host.port = 2223; guest.port = 22; }
    { from = "host"; host.port = 9999; guest.port = 80; }
  ];

  # QEMU Guest Agent for better host integration
  services.qemuGuest.enable = true;

  system.stateVersion = "24.05";
}
