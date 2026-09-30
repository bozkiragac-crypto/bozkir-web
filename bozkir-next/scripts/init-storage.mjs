#!/usr/bin/env node
/** Depolama bucket'ını oluşturur (S3 uyumlu: SeaweedFS). */
import fs from 'node:fs';
import path from 'node:path';
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of (fs.existsSync(path.join(ROOT, '.env.local')) ? fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/) : [])) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const bucket = process.env.S3_BUCKET || 'bozkir-media';
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY || 'any', secretAccessKey: process.env.S3_SECRET_KEY || 'any' },
});

try {
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`✓ bucket oluşturuldu: ${bucket}`);
} catch (e) {
  console.log(`bucket zaten var veya oluşturulamadı (${bucket}): ${e.name}`);
}
