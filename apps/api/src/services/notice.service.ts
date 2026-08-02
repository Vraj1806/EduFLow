import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';
import { createNotification } from './notification.service.js';

export interface CreateNoticeInput {
  title: string;
  content: string;
  facultyId: string;
  targetClass?: string;
  targetDiv?: string;
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  targetClass?: string;
  targetDiv?: string;
}

export async function createNotice(input: CreateNoticeInput) {
  return prisma.notice.create({
    data: input,
  });
}

export async function getNotices(facultyId: string) {
  return prisma.notice.findMany({
    where: { facultyId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getNoticeById(id: string, facultyId: string) {
  const notice = await prisma.notice.findFirst({
    where: { id, facultyId },
  });

  if (!notice) {
    throw new AppError(404, 'NOTICE_NOT_FOUND', 'Notice not found');
  }

  return notice;
}

export async function updateNotice(id: string, input: UpdateNoticeInput, facultyId: string) {
  await getNoticeById(id, facultyId);

  return prisma.notice.update({
    where: { id },
    data: input,
  });
}

export async function publishNotice(id: string, facultyId: string) {
  const notice = await getNoticeById(id, facultyId);

  if (notice.publishedAt) {
    throw new AppError(400, 'ALREADY_PUBLISHED', 'Notice is already published');
  }

  const published = await prisma.notice.update({
    where: { id },
    data: { publishedAt: new Date() },
  });

  await createNotification({
    type: 'NOTICE',
    title: 'Notice published',
    message: `"${published.title}" was published to ${published.targetClass ?? 'all classes'} ${published.targetDiv ?? ''}`.trim(),
    recipient: published.facultyId,
  });

  return published;
}

export async function deleteNotice(id: string, facultyId: string) {
  await getNoticeById(id, facultyId);
  await prisma.notice.delete({ where: { id } });
}

export async function getPublishedNotices(facultyId: string) {
  return prisma.notice.findMany({
    where: {
      facultyId,
      publishedAt: {
        not: null,
      },
    },
    orderBy: { publishedAt: 'desc' },
  });
}
