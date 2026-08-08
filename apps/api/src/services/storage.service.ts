import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getConfig } from '../config.js';
import { AppError } from '../middleware/error.js';

/**
 * Storage Service
 *
 * Profile-photo object storage behind one interface. The provider is chosen by
 * `STORAGE_PROVIDER`:
 *
 *   - `none`  (default) — pass-through: photos stay as inline data URLs in the DB.
 *   - `local` — files written under `STORAGE_DIR` and served at `STORAGE_BASE_URL`.
 *   - `s3`    — S3-compatible bucket (requires S3_* env vars and the optional
 *               `@aws-sdk/client-s3` dependency, which is loaded lazily).
 *
 * Data URLs are validated with the same rules as face registration (format +
 * 10 MB cap) so a photo that would be rejected at upload never reaches disk.
 */

const DATA_URL_PATTERN = /^data:image\/(png|jpg|jpeg|webp);base64,(.+)$/s;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export interface StoredImage {
  /** Value persisted in `Student.profilePhoto`. */
  url: string;
  /** Storage key used for deletion; empty for the `none` provider. */
  key: string;
  contentType: string;
}

function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new AppError(
      400,
      'INVALID_IMAGE_FORMAT',
      'Image must be a PNG, JPG, JPEG, or WebP data URL',
    );
  }
  const contentType = `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`;
  const base64 = match[2]!;
  const sizeInBytes = (base64.length * 3) / 4;
  if (sizeInBytes > MAX_IMAGE_BYTES) {
    throw new AppError(400, 'IMAGE_TOO_LARGE', 'Image size must not exceed 10MB');
  }
  return { buffer: Buffer.from(base64, 'base64'), contentType };
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

function newKey(contentType: string): string {
  return `${randomUUID()}.${extensionFor(contentType)}`;
}

/** Store a profile photo, returning the URL to persist in the database. */
export async function storeProfilePhoto(dataUrl: string): Promise<StoredImage> {
  const cfg = getConfig();
  const { buffer, contentType } = decodeDataUrl(dataUrl);

  if (cfg.STORAGE_PROVIDER === 'local') {
    const dir = path.resolve(process.cwd(), cfg.STORAGE_DIR);
    await mkdir(dir, { recursive: true });
    const key = newKey(contentType);
    await writeFile(path.join(dir, key), buffer, { flag: 'wx' });
    const base = cfg.STORAGE_BASE_URL.replace(/\/$/, '');
    return { url: `${base}/${key}`, key, contentType };
  }

  if (cfg.STORAGE_PROVIDER === 's3') {
    return storeS3(buffer, contentType);
  }

  // `none` (default): keep the data URL inline.
  return { url: dataUrl, key: '', contentType };
}

/** Remove a stored object. No-op for the `none` provider or an empty key. */
export async function deleteStoredImage(key: string): Promise<void> {
  const cfg = getConfig();
  if (!key) return;

  if (cfg.STORAGE_PROVIDER === 'local') {
    await rm(path.resolve(process.cwd(), cfg.STORAGE_DIR, key), { force: true });
    return;
  }

  if (cfg.STORAGE_PROVIDER === 's3') {
    await deleteS3(key);
  }
}

/** Extract a storage key from a stored URL, or '' when it is not a storage URL. */
export function keyFromUrl(url: string): string {
  const last = url.split('/').pop();
  if (last && /^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(last)) return last;
  return '';
}

// ---- S3 adapter (lazy, optional dependency) ----

interface S3Module {
  S3Client: new (options: unknown) => { send: (command: unknown) => Promise<unknown> };
  PutObjectCommand: new (input: unknown) => unknown;
  DeleteObjectCommand: new (input: unknown) => unknown;
}

async function loadS3Module(): Promise<S3Module> {
  try {
    return (await import('@aws-sdk/client-s3')) as unknown as S3Module;
  } catch {
    throw new AppError(
      503,
      'STORAGE_SDK_MISSING',
      'S3 storage requires the optional dependency: npm i @aws-sdk/client-s3 -w apps/api',
    );
  }
}

function requireS3Config() {
  const cfg = getConfig();
  if (!cfg.S3_BUCKET || !cfg.S3_ACCESS_KEY_ID || !cfg.S3_SECRET_ACCESS_KEY) {
    throw new AppError(
      503,
      'STORAGE_NOT_CONFIGURED',
      'S3 storage requires S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY',
    );
  }
  return cfg;
}

function s3PublicBase(cfg: ReturnType<typeof getConfig>): string {
  const base = cfg.S3_PUBLIC_URL || cfg.S3_ENDPOINT;
  if (!base) {
    throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'S3 storage requires S3_PUBLIC_URL or S3_ENDPOINT');
  }
  return base.replace(/\/$/, '');
}

async function storeS3(buffer: Buffer, contentType: string): Promise<StoredImage> {
  const cfg = requireS3Config();
  const { S3Client, PutObjectCommand } = await loadS3Module();
  const key = newKey(contentType);

  const client = new S3Client({
    region: cfg.S3_REGION || 'auto',
    endpoint: cfg.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: cfg.S3_ACCESS_KEY_ID,
      secretAccessKey: cfg.S3_SECRET_ACCESS_KEY,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return { url: `${s3PublicBase(cfg)}/${key}`, key, contentType };
}

async function deleteS3(key: string): Promise<void> {
  const cfg = requireS3Config();
  const { S3Client, DeleteObjectCommand } = await loadS3Module();
  const client = new S3Client({
    region: cfg.S3_REGION || 'auto',
    endpoint: cfg.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: cfg.S3_ACCESS_KEY_ID,
      secretAccessKey: cfg.S3_SECRET_ACCESS_KEY,
    },
  });
  await client.send(new DeleteObjectCommand({ Bucket: cfg.S3_BUCKET, Key: key }));
}
