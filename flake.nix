{
  description = "Briefly Platform Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    let
      # Define the VM here so it can be exported at the top level
      brieflyVM = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [ ./infra/vm.nix ];
      };
    in
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        # Expose the VM build target as a package for easy access
        packages.vm = brieflyVM.config.system.build.vm;

        # Standard Dev Shell
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core Languages
            go
            nodejs_20
            python311
            
            # Tools
            docker-compose
            cloudflared
            tailscale
            colmena
            cockroachdb
            k3s
            qemu
            
            # Utilities
            git
            gnumake
          ];

          shellHook = ''
            echo "--- Briefly Development Environment ---"
            echo "Go: $(go version)"
            echo "Node: $(node --version)"
            echo "Python: $(python --version)"
            echo "---"
            echo "To start the VM: nix build .#vm && ./result/bin/run-briefly-vm-vm"
            echo "To start the stack: docker compose up -d"
          '';
        };
      }
    ) // {
      nixosConfigurations.vm = brieflyVM;
    };
}
