{
  description = "Briefly Platform Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Core Languages
            go_1_22
            nodejs_20
            python311
            
            # Tools
            docker-compose
            cloudflared
            tailscale
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
            echo "To start the VM: nix-shell infra/vm.nix"
            echo "To start the stack: docker-compose up -d"
          '';
        };
      }
    );
}
