import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import {
  deleteStoredImage,
  keyFromUrl,
  storeProfilePhoto,
} from '../src/services/storage.service.js';
import { app, registerFaculty, resetDb } from './helpers.js';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('storage service', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('storeProfilePhoto with STORAGE_PROVIDER=none (default)', () => {
    it('keeps the data URL inline and records no key', async () => {
      const stored = await storeProfilePhoto(DATA_URL);
      expect(stored).toEqual({ url: DATA_URL, key: '', contentType: 'image/png' });
    });

    it('rejects a non-image data URL', async () => {
      await expect(storeProfilePhoto('data:text/plain;base64,aGk=')).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_IMAGE_FORMAT',
      });
    });

    it('rejects a malformed string', async () => {
      await expect(storeProfilePhoto('not a data url')).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_IMAGE_FORMAT',
      });
    });
  });

  describe('storeProfilePhoto with STORAGE_PROVIDER=s3 (unconfigured)', () => {
    beforeEach(() => {
      process.env.STORAGE_PROVIDER = 's3';
      process.env.S3_BUCKET = '';
    });

    afterEach(() => {
      delete process.env.STORAGE_PROVIDER;
      delete process.env.S3_BUCKET;
    });

    it('fails clearly when S3 credentials are missing', async () => {
      await expect(storeProfilePhoto(DATA_URL)).rejects.toMatchObject({
        statusCode: 503,
        code: 'STORAGE_NOT_CONFIGURED',
      });
    });
  });

  describe('storeProfilePhoto with STORAGE_PROVIDER=local', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(path.join(os.tmpdir(), 'eduflow-storage-'));
      process.env.STORAGE_PROVIDER = 'local';
      process.env.STORAGE_DIR = dir;
      process.env.STORAGE_BASE_URL = '/uploads';
    });

    afterEach(async () => {
      delete process.env.STORAGE_PROVIDER;
      delete process.env.STORAGE_DIR;
      delete process.env.STORAGE_BASE_URL;
      await rm(dir, { recursive: true, force: true });
    });

    it('writes the file and returns a /uploads/<key> URL', async () => {
      const stored = await storeProfilePhoto(DATA_URL);
      expect(stored.url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
      expect(stored.key.length).toBeGreaterThan(0);

      const file = await readFile(path.join(dir, stored.key));
      expect(file.length).toBeGreaterThan(0);
    });

    it('deleteStoredImage removes the file', async () => {
      const stored = await storeProfilePhoto(DATA_URL);
      await deleteStoredImage(stored.key);
      await expect(stat(path.join(dir, stored.key))).rejects.toThrow();
    });

    it('deleteStoredImage is a no-op for an empty key', async () => {
      await expect(deleteStoredImage('')).resolves.toBeUndefined();
    });
  });

  describe('keyFromUrl', () => {
    it('extracts a storage key from a stored URL', () => {
      expect(keyFromUrl('/uploads/9d11bfae-5f0c-4e1b-9f8a-0123456789ab.jpg')).toMatch(
        /^[0-9a-f-]{36}\.jpg$/,
      );
    });

    it('returns "" for inline data URLs and unknown paths', () => {
      expect(keyFromUrl(DATA_URL)).toBe('');
      expect(keyFromUrl('https://cdn.example.com/photo.jpg')).toBe('');
      expect(keyFromUrl('')).toBe('');
    });
  });

  describe('student profile photos through the API (local storage)', () => {
    let dir: string;
    let localApp: ReturnType<typeof createApp>;

    beforeEach(async () => {
      await resetDb();
      dir = await mkdtemp(path.join(os.tmpdir(), 'eduflow-storage-api-'));
      process.env.STORAGE_PROVIDER = 'local';
      process.env.STORAGE_DIR = dir;
      localApp = createApp();
    });

    afterEach(async () => {
      delete process.env.STORAGE_PROVIDER;
      delete process.env.STORAGE_DIR;
      await rm(dir, { recursive: true, force: true });
    });

    it('stores the uploaded photo and returns the /uploads URL', async () => {
      const session = await registerFaculty();
      const res = await request(localApp)
        .post('/api/students')
        .set('Cookie', session.accessToken)
        .send({
          studentId: '2025CS001',
          rollNumber: '01',
          name: 'Alice Wonder',
          email: 'alice@test.com',
          class: 'CS',
          division: 'A',
          semester: '3',
          department: 'Computer Science',
          profilePhoto: DATA_URL,
        });

      expect(res.status).toBe(201);
      const photoUrl = res.body.data.student.profilePhoto as string;
      expect(photoUrl).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);

      // The photo is servable over HTTP.
      const serve = await request(localApp).get(photoUrl);
      expect(serve.status).toBe(200);

      // Deleting the student removes the stored object.
      await request(localApp)
        .delete(`/api/students/${res.body.data.student.id}`)
        .set('Cookie', session.accessToken)
        .expect(204);
      await expect(stat(path.join(dir, path.basename(photoUrl)))).rejects.toThrow();
    });
  });

  describe('student profile photos with STORAGE_PROVIDER=none', () => {
    beforeEach(async () => {
      await resetDb();
    });

    it('persists the inline data URL unchanged', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/students')
        .set('Cookie', session.accessToken)
        .send({
          studentId: '2025CS001',
          rollNumber: '01',
          name: 'Alice Wonder',
          email: 'alice@test.com',
          class: 'CS',
          division: 'A',
          semester: '3',
          department: 'Computer Science',
          profilePhoto: DATA_URL,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.student.profilePhoto).toBe(DATA_URL);
    });
  });
});
