import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';
import { invalidateEmbeddingCache } from './embeddingCache.js';
import * as mlClient from './ml.client.js';

/**
 * Face Recognition Service
 *
 * Abstraction layer for face detection and recognition. Detection and embedding
 * operations are delegated to the ML sidecar via `ml.client.ts`; this service
 * owns face profile storage and management.
 */

export interface FaceDetectionResult {
  detected: boolean;
  faceCount: number;
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FaceEmbedding {
  vector: number[];
  modelVersion: string;
}

/**
 * Detect faces in an image.
 *
 * Delegates to the ML sidecar. Returns `detected:false` when no face is found
 * (not an error) so callers can branch on the result.
 */
export async function detectFaces(imageBase64: string): Promise<FaceDetectionResult> {
  validateImageForRegistration(imageBase64);

  const result = await mlClient.detect(imageBase64);
  return {
    detected: result.detected,
    faceCount: result.faceCount,
    confidence: result.confidence,
    boundingBox: result.boundingBox,
  };
}

/**
 * Generate a face embedding from an image containing exactly one face.
 *
 * The ML sidecar rejects no-face images with 400 and multi-face images with
 * 422; those are translated into the domain error codes below.
 */
export async function generateEmbedding(imageBase64: string): Promise<FaceEmbedding> {
  validateImageForRegistration(imageBase64);

  try {
    const result = await mlClient.embed(imageBase64);
    return {
      vector: result.embedding,
      modelVersion: result.modelVersion,
    };
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 400) {
      throw new AppError(400, 'NO_FACE_DETECTED', 'No face detected in the image');
    }
    if (err instanceof AppError && err.statusCode === 422) {
      throw new AppError(422, 'MULTIPLE_FACES', 'Please ensure only one person is visible in the image');
    }
    throw err;
  }
}

/**
 * Validate image quality for face registration.
 */
export function validateImageForRegistration(imageBase64: string): void {
  if (!imageBase64 || imageBase64.length === 0) {
    throw new AppError(400, 'INVALID_IMAGE', 'Image data is required');
  }

  // Check if it's a valid base64 string
  const base64Pattern = /^data:image\/(png|jpg|jpeg|webp);base64,/;
  if (!base64Pattern.test(imageBase64)) {
    throw new AppError(400, 'INVALID_IMAGE_FORMAT', 'Image must be in PNG, JPG, JPEG, or WebP format');
  }

  // Check size (max 10MB)
  const sizeInBytes = (imageBase64.length * 3) / 4;
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (sizeInBytes > maxSize) {
    throw new AppError(400, 'IMAGE_TOO_LARGE', 'Image size must not exceed 10MB');
  }
}

/**
 * Register a student's face profile.
 */
export async function registerFaceProfile(studentId: string, imageBase64: string, facultyId: string) {
  // Validate image
  validateImageForRegistration(imageBase64);

  // Generate embedding
  const embedding = await generateEmbedding(imageBase64);

  // Check if student exists and belongs to the faculty
  const student = await prisma.student.findFirst({ where: { id: studentId, facultyId } });
  if (!student) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  // Store or update face profile
  const faceProfile = await prisma.faceProfile.upsert({
    where: { studentId },
    create: {
      studentId,
      embedding: JSON.stringify(embedding.vector),
      modelVersion: embedding.modelVersion,
    },
    update: {
      embedding: JSON.stringify(embedding.vector),
      modelVersion: embedding.modelVersion,
      updatedAt: new Date(),
    },
  });

  // Update student face status
  await prisma.student.update({
    where: { id: studentId },
    data: { faceStatus: 'REGISTERED' },
  });

  // Evict stale cached embeddings so the next recognition uses the fresh vector.
  invalidateEmbeddingCache(facultyId, student.class, student.division);

  return {
    id: faceProfile.id,
    studentId: faceProfile.studentId,
    modelVersion: faceProfile.modelVersion,
    createdAt: faceProfile.createdAt,
    updatedAt: faceProfile.updatedAt,
  };
}

/**
 * Get face profile status for a student.
 */
export async function getFaceProfileStatus(studentId: string, facultyId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, facultyId },
    include: { faceProfile: true },
  });

  if (!student) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  return {
    studentId: student.id,
    faceStatus: student.faceStatus,
    registered: student.faceStatus === 'REGISTERED',
    faceProfile: student.faceProfile
      ? {
          id: student.faceProfile.id,
          modelVersion: student.faceProfile.modelVersion,
          registeredAt: student.faceProfile.createdAt,
          lastUpdated: student.faceProfile.updatedAt,
        }
      : null,
  };
}

/**
 * Delete a student's face profile.
 */
export async function deleteFaceProfile(studentId: string, facultyId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, facultyId } });
  if (!student) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  await prisma.faceProfile.deleteMany({ where: { studentId } });

  await prisma.student.update({
    where: { id: studentId },
    data: { faceStatus: 'NOT_REGISTERED' },
  });

  // Evict stale cached embeddings so a removed face is not still matched.
  invalidateEmbeddingCache(facultyId, student.class, student.division);
}
