/*
  infra/hive.nix — Briefly Cluster: Colmena Deployment Manifest
  
  Node-count-agnostic. The cluster membership is driven by infra/nodes.json.
  Add or remove nodes there — this file does not need to change.

  Usage:
    colmena apply                     # deploy to all nodes in nodes.json
    colmena apply --on laptop-alpha   # deploy to one specific node
    colmena apply --on 'laptop-*'     # deploy to nodes matching a pattern

  Prerequisites:
    - All nodes must be reachable via Tailscale
    - You must have SSH access to each node (brieflyVM sets this up)
    - Run `nix develop` first to get colmena in your PATH
*/

let
  # Read the node registry at evaluation time
  nodes = builtins.fromJSON (builtins.readFile ./nodes.json);

  # The Tailscale IP of the lead node (first node with role == "lead")
  leadNode = builtins.head (builtins.filter (n: n.role == "lead") nodes);
  leadIP   = leadNode.tailscaleIP;

  # Build a single node's Colmena config from a node record
  mkNode = node: {
    deployment = {
      targetHost = node.tailscaleIP;
      targetUser = "briefly";
      tags = [ node.role ];
    };

    networking.hostName = node.name;

    # The lead node is the CockroachDB seed and has no --join flag
    services.cockroachdb.join = if node.role == "lead" then "" else leadIP;
  };

in
{
  meta = {
    nixpkgs = import <nixpkgs> { system = "x86_64-linux"; };
    description = "Briefly Distributed Cluster (node-count-agnostic)";
  };

  # All nodes share the base cluster configuration
  defaults = { pkgs, ... }: {
    imports = [ ./cluster.nix ];
  };

  # Dynamically generate a Colmena host entry for every node in nodes.json
  # This listToAttrs call turns the JSON array into the attrset Colmena expects.
} // (builtins.listToAttrs (map (node: {
    name  = node.name;
    value = { ... }: mkNode node;
  }) nodes))
