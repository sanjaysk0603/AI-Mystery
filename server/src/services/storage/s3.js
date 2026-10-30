import { DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env.js';

const client = new S3Client({ region: env.AWS_REGION || 'us-east-1' });

export async function saveS3(key, bytes, mimeType) {
  await client.send(new PutObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key, Body: bytes, ContentType: mimeType }));
  const urlKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${urlKey}`;
}

export async function removeS3Case(caseId) {
  if (!/^[a-z0-9_-]+$/i.test(caseId)) throw new Error('Invalid case id.');
  const prefix = `cases/${caseId}/`;
  let continuationToken;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: env.AWS_S3_BUCKET, Prefix: prefix, ContinuationToken: continuationToken }));
    if (page.Contents?.length) await client.send(new DeleteObjectsCommand({ Bucket: env.AWS_S3_BUCKET, Delete: { Objects: page.Contents.map(({ Key }) => ({ Key })) } }));
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);
}
