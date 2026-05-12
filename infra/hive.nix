let
  # Define the active nodes in the cluster. 
  # This can be changed to match the actual laptops available.
  nodeNames = [ "laptop-alpha" "laptop-beta" "laptop-gamma" ];
in
{
  meta = {
    nixpkgs = import <nixpkgs> { system = "x86_64-linux"; };
    description = "Briefly Platform: Distributed Cluster";
  };

  # Common configuration for all nodes
  defaults = { pkgs, ... }: {
    imports = [ ./cluster.nix ];
  };

  # Generate configurations for each node
} // (builtins.listToAttrs (map (name: {
  name = name;
  value = { ... }: {
    networking.hostName = name;
    # Alpha node is always the server/seed
    services.k3s.role = if name == "laptop-alpha" then "server" else "agent";
    services.cockroachdb.join = if name == "laptop-alpha" then "" else "laptop-alpha";
  };
}) nodeNames))
