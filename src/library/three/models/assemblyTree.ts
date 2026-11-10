/** One node of a machine's assembly breakdown. Nodes without children are the parts a scene draws. */
export type AssemblyNode = {
  id: string;
  name: string;
  /** Quiet text after the name: a part count, a size, a position. */
  detail?: string;
  children?: readonly AssemblyNode[];
};

/** A node with its depth and parent, in the order a tree view lists them. */
export type AssemblyRow = { node: AssemblyNode; depth: number; parentId: string | null };

/** Every node of the tree, depth first, parents before their children. */
export function flattenAssemblies(root: AssemblyNode): AssemblyRow[] {
  const rows: AssemblyRow[] = [];
  const visit = (node: AssemblyNode, depth: number, parentId: string | null) => {
    rows.push({ node, depth, parentId });
    for (const child of node.children ?? []) visit(child, depth + 1, node.id);
  };
  visit(root, 0, null);
  return rows;
}

export function findAssembly(root: AssemblyNode, id: string): AssemblyNode | undefined {
  return flattenAssemblies(root).find((row) => row.node.id === id)?.node;
}

/** The nodes from the root down to `id`, inclusive. Empty when the id is not in the tree. */
export function assemblyPath(root: AssemblyNode, id: string): AssemblyNode[] {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const below = assemblyPath(child, id);
    if (below.length > 0) return [root, ...below];
  }
  return [];
}

/** Ids of the drawable parts under a node: the node itself when it is a leaf. Empty for an unknown id. */
export function assemblyLeafIds(root: AssemblyNode, id: string): string[] {
  const node = findAssembly(root, id);
  if (!node) return [];
  return flattenAssemblies(node)
    .filter((row) => !row.node.children || row.node.children.length === 0)
    .map((row) => row.node.id);
}

/**
 * Whether a part stays solid when `selectedId` is isolated. Nothing selected (or the root, or an
 * unknown id) keeps every part solid; otherwise only the parts under the selection do.
 */
export function isAssemblyActive(root: AssemblyNode, selectedId: string | null, leafId: string): boolean {
  if (selectedId === null || selectedId === root.id) return true;
  const leaves = assemblyLeafIds(root, selectedId);
  return leaves.length === 0 || leaves.includes(leafId);
}

/** Number of drawable parts under a node. */
export function assemblyPartCount(node: AssemblyNode): number {
  return assemblyLeafIds(node, node.id).length;
}
