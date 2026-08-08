/**
 * In-memory cache for parsed face-embedding vectors, keyed by
 * "facultyId:classId:division".  Imported by both `classroom.service.ts` (reads)
 * and `face.service.ts` (invalidates on profile create/update/delete).
 */

interface CachedStudent {
  studentId: string;
  embedding: number[];
}

const embeddingCache = new Map<string, CachedStudent[]>();

function cacheKey(facultyId: string, classId: string, division: string): string {
  return `${facultyId}:${classId}:${division}`;
}

export function getEmbeddings(facultyId: string, classId: string, division: string): CachedStudent[] | undefined {
  return embeddingCache.get(cacheKey(facultyId, classId, division));
}

export function setEmbeddings(
  facultyId: string,
  classId: string,
  division: string,
  entries: CachedStudent[],
): void {
  embeddingCache.set(cacheKey(facultyId, classId, division), entries);
}

/**
 * Evict cached embeddings for a specific class/division (pass all three
 * arguments) or for every class if called with no arguments.
 */
export function invalidateEmbeddingCache(
  facultyId?: string,
  classId?: string,
  division?: string,
): void {
  if (facultyId && classId && division) {
    embeddingCache.delete(cacheKey(facultyId, classId, division));
    return;
  }
  embeddingCache.clear();
}
