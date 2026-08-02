import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';

/**
 * Face Recognition Service
 *
 * This service provides an abstraction layer for face detection and recognition.
 * Currently, it defines the interface that will be implemented when the actual
 * ML model (Python FastAPI service or similar) is integrated in a future phase.
 *
 * For now, this service handles face profile storage and management, with
 * placeholder methods for the ML operations that will be connected later.
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
 * TODO: This will be connected to the actual ML model in Phase 3+.
 * For now, this is a service abstraction that validates the integration point.
 */
export async function detectFaces(imageBase64: string): Promise<FaceDetectionResult> {
  // Placeholder: In production, this would call the Python FastAPI face detection service
  // or use a Node.js-compatible face detection library.

  // Basic validation
  if (!imageBase64 || imageBase64.length === 0) {
    throw new AppError(400, 'INVALID_IMAGE', 'Image data is required');
  }

  // Simulate face detection response
  // In production, replace this with actual ML model call:
  // const response = await fetch(`${FACE_SERVICE_URL}/detect`, { ... });

  return {
    detected: true,
    faceCount: 1,
    confidence: 0.95,
    boundingBox: { x: 100, y: 100, width: 200, height: 200 },
  };
}

/**
 * Generate face embedding from image.
 *
 * TODO: This will be connected to the actual ML model in Phase 3+.
 * For now, this is a service abstraction that validates the integration point.
 */
export async function generateEmbedding(imageBase64: string): Promise<FaceEmbedding> {
  // First, detect faces
  const detection = await detectFaces(imageBase64);

  if (!detection.detected) {
    throw new AppError(400, 'NO_FACE_DETECTED', 'No face detected in the image');
  }

  if (detection.faceCount > 1) {
    throw new AppError(400, 'MULTIPLE_FACES', 'Please ensure only one person is visible in the image');
  }

  // Placeholder: In production, this would call the Python FastAPI embedding service
  // or use a Node.js-compatible face recognition library (e.g., face-api.js).

  // Generate a placeholder embedding (128-dimensional vector)
  // In production, replace this with actual ML model call:
  // const response = await fetch(`${FACE_SERVICE_URL}/embed`, { ... });

  const placeholderVector = Array.from({ length: 128 }, () => Math.random());

  return {
    vector: placeholderVector,
    modelVersion: 'placeholder-v1.0',
  };
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
}
