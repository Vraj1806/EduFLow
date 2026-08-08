/**
 * Ambient types for the optional S3 adapter (`@aws-sdk/client-s3`).
 *
 * The SDK is only needed when STORAGE_PROVIDER=s3 and is loaded lazily at
 * runtime, so it is intentionally not a hard dependency. This declaration lets
 * the adapter type-check without the package installed; runtime import failures
 * are caught and surfaced as a clear 503.
 */
declare module '@aws-sdk/client-s3' {
  export const S3Client: new (options: unknown) => {
    send: (command: unknown) => Promise<unknown>;
  };
  export const PutObjectCommand: new (input: unknown) => unknown;
  export const DeleteObjectCommand: new (input: unknown) => unknown;
}
