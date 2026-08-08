/**
 * Classroom Recognition Service
 *
 * This service handles multi-face detection and recognition from classroom photos.
 * It integrates with the ML sidecar to identify registered students.
 */

import * as faceService from './face.service.js';
import { getConfig } from '../config.js';
import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';
import * as mlClient from './ml.client.js';
import { getEmbeddings, setEmbeddings } from './embeddingCache.js';

export interface DetectedFace {
  faceIndex: number;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  embedding?: number[];
}

export interface RecognizedStudent {
  studentId: string;
  studentName: string;
  rollNumber: string;
  confidence: number;
  faceIndex: number;
}

export interface ClassroomRecognitionResult {
  totalFaces: number;
  recognizedStudents: RecognizedStudent[];
  unknownFaces: DetectedFace[];
}

async function loadCachedEmbeddings(
  facultyId: string,
  classId: string,
  division: string,
): Promise<{ studentId: string; embedding: number[] }[]> {
  const cached = getEmbeddings(facultyId, classId, division);
  if (cached) return cached;

  const students = await prisma.student.findMany({
    where: { facultyId, class: classId, division, faceStatus: 'REGISTERED' },
    include: { faceProfile: true },
  });

  const entries: { studentId: string; embedding: number[] }[] = [];
  for (const student of students) {
    if (!student.faceProfile) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(student.faceProfile.embedding);
    } catch {
      continue;
    }
    if (Array.isArray(parsed)) {
      entries.push({ studentId: student.id, embedding: parsed as number[] });
    }
  }

  setEmbeddings(facultyId, classId, division, entries);
  return entries;
}

/**
 * Detect all faces in a classroom photo.
 *
 * Delegates to the ML sidecar's `/detect-multi` endpoint. A photo with no
 * detectable faces surfaces as NO_FACES_DETECTED.
 */
export async function detectClassroomFaces(imageBase64: string): Promise<DetectedFace[]> {
  // Validate image
  faceService.validateImageForRegistration(imageBase64);

  try {
    const result = await mlClient.detectMulti(imageBase64);
    return result.faces.map((face) => ({
      faceIndex: face.faceIndex,
      confidence: face.confidence,
      boundingBox: face.boundingBox,
      embedding: face.embedding,
    }));
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 400) {
      throw new AppError(400, 'NO_FACES_DETECTED', 'No faces detected in the classroom photo');
    }
    throw err;
  }
}

/** Cosine similarity between two unit-normalized embeddings in [0, 1]. */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dot / denominator;
}

/**
 * Compare a detected face embedding against registered student faces using
 * cosine similarity. Returns the best match that clears the configured
 * `ML_CONFIDENCE_THRESHOLD`, or null when nothing matches.
 *
 * Uses the in-memory embedding cache so repeated recognition requests for the
 * same class do not re-query and re-parse the database each time.
 */
async function compareFaceWithStudents(
  faceEmbedding: number[],
  classId: string,
  division: string,
  facultyId: string
): Promise<{ studentId: string; confidence: number } | null> {
  const cachedStudents = await loadCachedEmbeddings(facultyId, classId, division);
  const threshold = getConfig().ML_CONFIDENCE_THRESHOLD;
  let bestMatch: { studentId: string; confidence: number } | null = null;

  for (const entry of cachedStudents) {
    if (entry.embedding.length !== faceEmbedding.length) continue;

    const confidence = cosineSimilarity(faceEmbedding, entry.embedding);
    if (confidence >= threshold && (!bestMatch || confidence > bestMatch.confidence)) {
      bestMatch = { studentId: entry.studentId, confidence };
    }
  }

  return bestMatch;
}

/**
 * Process classroom photo and recognize registered students.
 */
export async function recognizeClassroom(
  imageBase64: string,
  classId: string,
  division: string,
  facultyId: string
): Promise<ClassroomRecognitionResult> {
  // Step 1: Detect all faces in the photo
  const detectedFaces = await detectClassroomFaces(imageBase64);

  if (detectedFaces.length === 0) {
    throw new AppError(400, 'NO_FACES_DETECTED', 'No faces detected in the classroom photo');
  }

  // Step 2: Compare each detected face with registered students
  const recognizedStudents: RecognizedStudent[] = [];
  const unknownFaces: DetectedFace[] = [];
  const recognizedStudentIds = new Set<string>();

  for (const face of detectedFaces) {
    if (!face.embedding) {
      unknownFaces.push(face);
      continue;
    }

    const match = await compareFaceWithStudents(face.embedding, classId, division, facultyId);

    if (match && !recognizedStudentIds.has(match.studentId)) {
      // Get student details
      const student = await prisma.student.findUnique({
        where: { id: match.studentId },
        select: {
          id: true,
          name: true,
          rollNumber: true,
          studentId: true,
        },
      });

      if (student) {
        recognizedStudents.push({
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          confidence: match.confidence,
          faceIndex: face.faceIndex,
        });
        recognizedStudentIds.add(match.studentId);
      }
    } else if (!match) {
      unknownFaces.push(face);
    }
    // If already recognized, skip duplicate
  }

  return {
    totalFaces: detectedFaces.length,
    recognizedStudents,
    unknownFaces,
  };
}
