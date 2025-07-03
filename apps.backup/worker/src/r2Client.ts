import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class R2Client {
  private client: S3Client;
  private bucketName: string;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    bucketName: string = 'nametobiz'
  ) {
    this.bucketName = bucketName;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadBundle(
    jobId: string,
    domain: string,
    themeName: string,
    files: Record<string, string>
  ): Promise<string[]> {
    const uploadedKeys: string[] = [];

    for (const [filePath, content] of Object.entries(files)) {
      // Key format: /bundles/{jobId}/{domain}/{themeName}{filePath}
      const key = `bundles/${jobId}/${domain}/${themeName}${filePath}`;
      
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: content,
          ContentType: this.getContentType(filePath),
          CacheControl: 'public, max-age=31536000, immutable',
        });

        await this.client.send(command);
        uploadedKeys.push(key);
        console.log(`✅ Uploaded: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to upload ${key}:`, error);
        throw error;
      }
    }

    return uploadedKeys;
  }

  private getContentType(filePath: string): string {
    if (filePath.endsWith('.html')) return 'text/html';
    if (filePath.endsWith('.css')) return 'text/css';
    if (filePath.endsWith('.js')) return 'application/javascript';
    if (filePath.endsWith('.json')) return 'application/json';
    return 'text/plain';
  }

  getPublicUrl(key: string, customDomain?: string): string {
    if (customDomain) {
      return `https://${customDomain}/site/${key}`;
    }
    // For now return the key, will be served via Cloudflare Worker
    return `/site/${key}`;
  }
} 