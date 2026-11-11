export type ClusterInput = { id: string; x: number; y: number; /** Larger weights seed clusters first and pull the centre toward them. */ weight: number };

export type Cluster = {
  id: string;
  x: number;
  y: number;
  memberIds: readonly string[];
};

/**
 * Greedy clustering in screen space: the heaviest marker not yet taken seeds a cluster that takes
 * every free marker within `radius` pixels. Because it works on pixels, markers merge as the map
 * zooms out and split as it zooms in. A marker with no neighbours is a cluster of one. The result
 * is deterministic: ties go to the lower id, and clusters come out in seed order.
 */
export function clusterMarkers(items: readonly ClusterInput[], radius: number): Cluster[] {
  const ordered = [...items].sort((a, b) => b.weight - a.weight || (a.id < b.id ? -1 : 1));
  const taken = new Set<string>();
  const clusters: Cluster[] = [];

  for (const seed of ordered) {
    if (taken.has(seed.id)) continue;
    const members = ordered.filter((item) => !taken.has(item.id) && Math.hypot(item.x - seed.x, item.y - seed.y) <= radius);
    for (const member of members) taken.add(member.id);
    const total = members.reduce((sum, member) => sum + Math.max(member.weight, 1e-6), 0);
    clusters.push({
      id: members.length === 1 ? seed.id : `cluster:${members.map((member) => member.id).sort().join('+')}`,
      x: members.reduce((sum, member) => sum + member.x * Math.max(member.weight, 1e-6), 0) / total,
      y: members.reduce((sum, member) => sum + member.y * Math.max(member.weight, 1e-6), 0) / total,
      memberIds: members.map((member) => member.id),
    });
  }
  return clusters;
}
