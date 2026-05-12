{
  description = "Briefly Platform Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    let
      # Single-system VM build (x86_64-linux only — QEMU target)
      vmPkgs = nixpkgs.legacyPackages.x86_64-linux;

      # The standardized VM configuration imported from infra/vm.nix
      brieflyVM = vmPkgs.nixos ({
        imports = [ ./infra/vm.nix ];
      });
    in
    (flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core Languages (pinned versions)
            go_1_23
            nodejs_20
            python311

            # Infrastructure tools
            docker-compose
            cloudflared
            tailscale
            colmena
            qemu

            # Utilities
            git
            gnumake
            curl
            jq
          ];

          shellHook = ''
            echo "--- Briefly Development Environment ---"
            echo "Go:     $(go version)"
            echo "Node:   $(node --version)"
            echo "Python: $(python --version)"
            echo ""
            echo "Quick start:"
            echo "  Local dev:       docker compose up -d --build"
            echo "  Distributed:     docker compose -f docker-compose.distributed.yml up -d --build"
            echo "  Boot a VM:       nix run .#vm"
            echo "---"
          '';
        };
      }
    )) // {
      # Boot a standardized NixOS VM (works on Linux with KVM)
      # Usage: nix run .#vm
      apps.x86_64-linux.vm = {
        type = "app";
        program = "${brieflyVM.vm}/bin/run-briefly-vm-vm";
      };

      # Make the VM derivation inspectable
      packages.x86_64-linux.vm = brieflyVM.vm;

      # Colmena-compatible NixOS configurations (node-count-agnostic)
      nixosConfigurations = {
        # Any node can use this base config
        briefly-node = nixpkgs.lib.nixosSystem {
          system = "x86_64-linux";
          modules = [ ./infra/vm.nix ];
        };
      };
    };
}
