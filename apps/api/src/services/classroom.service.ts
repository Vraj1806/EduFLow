/**
 * Classroom Recognition Service
 *
 * This service handles multi-face detection and recognition from classroom photos.
 * It integrates with the face recognition model to identify registered students.
 *
 * TODO: Connect to actual ML model in production.
 * Currently uses placeholder logic for the ML integration points.
 */

import * as faceService from './face.service.js';
import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';

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

/**
 * Detect all faces in a classroom photo.
 *
 * TODO: Connect to actual multi-face detection model.
 */
export async function detectClassroomFaces(imageBase64: string): Promise<DetectedFace[]> {
  // Validate image
  faceService.validateImageForRegistration(imageBase64);

  // Placeholder: In production, this would call the ML model
  // Example: const response = await fetch(`${FACE_SERVICE_URL}/detect-multiple`, {...});

  // Simulated detection of multiple faces
  const simulatedFaceCount = Math.floor(Math.random() * 5) + 3; // 3-7 faces
  const detectedFaces: DetectedFace[] = [];

  for (let i = 0; i < simulatedFaceCount; i++) {
    detectedFaces.push({
      faceIndex: i,
      confidence: 0.85 + Math.random() * 0.15,
      boundingBox: {
        x: Math.random() * 500,
        y: Math.random() * 500,
        width: 150 + Math.random() * 50,
        height: 150 + Math.random() * 50,
      },
      embedding: Array.from({ length: 128 }, () => Math.random()),
    });
  }

  return detectedFaces;
}

/**
 * Compare detected face embeddings against registered student faces.
 *
 * TODO: Connect to actual face comparison/recognition model.
 */
async function compareFaceWithStudents(
  faceEmbedding: number[],
  classId: string,
  division: string,
  facultyId: string
): Promise<{ studentId: string; confidence: number } | null> {
  // Get all registered students in the class owned by this faculty
  const students = await prisma.student.findMany({
    where: {
      facultyId,
      class: classId,
      division,
      faceStatus: 'REGISTERED',
    },
    include: {
      faceProfile: true,
    },
  });

  // Placeholder: In production, compute cosine similarity or use ML model comparison
  // Example: const similarity = cosineSimilarity(faceEmbedding, studentEmbedding);

  // Simulated matching logic
  const threshold = 0.6; // Minimum confidence threshold
  let bestMatch: { studentId: string; confidence: number } | null = null;

  for (const student of students) {
    if (!student.faceProfile) continue;

    // Simulate face comparison
    const simulatedConfidence = 0.5 + Math.random() * 0.5;

    if (simulatedConfidence > threshold) {
      if (!bestMatch || simulatedConfidence > bestMatch.confidence) {
        bestMatch = {
          studentId: student.id,
          confidence: simulatedConfidence,
        };
      }
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
