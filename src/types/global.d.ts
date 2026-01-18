// Minimal Node-like globals for environments without @types/node.
declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};



