{
  description = "Project Briefly — AI-powered project intake platform";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    deploy-rs.url = "github:serokell/deploy-rs";
  };

  outputs = { self, nixpkgs, flake-utils, deploy-rs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        # --- Dev Shell for all teammates (no Nix knowledge needed) ---
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Backend
            go_1_22
            gopls
            golangci-lint
            # AI service
            python312
            python312Packages.pip
            python312Packages.virtualenv
            # Frontend
            nodejs_20
            # Database tooling
            postgresql_16
            redis
            # Utilities
            jq
            curl
            git
            docker
            docker-compose
          ];
          shellHook = ''
            echo ""
            echo "  ██████╗ ██████╗ ██╗███████╗███████╗██╗  ██╗   ██╗"
            echo "  ██╔══██╗██╔══██╗██║██╔════╝██╔════╝██║  ╚██╗ ██╔╝"
            echo "  ██████╔╝██████╔╝██║█████╗  █████╗  ██║   ╚████╔╝ "
            echo "  ██╔══██╗██╔══██╗██║██╔══╝  ██╔══╝  ██║    ╚██╔╝  "
            echo "  ██████╔╝██║  ██║██║███████╗███████╗███████╗██║   "
            echo "  ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚═╝   "
            echo ""
            echo "  Project: Briefly — AI Intake Platform"
            echo "  Stack: Go + Python/LangGraph + React/Vite"
            echo "  Run: docker-compose up -d  (to start Postgres + Redis)"
            echo ""
            export GOPATH="$PWD/.gopath"
            export PATH="$GOPATH/bin:$PATH"

            # Setup Python virtual environment automatically
            VENV_DIR="$PWD/.venv"
            if [ ! -d "$VENV_DIR" ]; then
              echo "🐍 Creating Python virtual environment..."
              python -m venv "$VENV_DIR"
            fi
            
            # Activate the virtual environment
            source "$VENV_DIR/bin/activate"
            
            # Install requirements if they exist
            if [ -f "$PWD/ai_service/requirements.txt" ]; then
              pip install -q -r "$PWD/ai_service/requirements.txt"
            fi
          '';
        };

        # --- Operator shell (Nix lead only) ---
        devShells.ops = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Infra & deploy tooling
            deploy-rs.packages.${system}.deploy-rs
            sops
            age
            ssh-to-age
            nixos-rebuild
            # Monitoring
            htop
            tcpdump
          ];
          shellHook = ''
            echo "🔐 Ops shell loaded. Handle with care."
          '';
        };
      });
}
