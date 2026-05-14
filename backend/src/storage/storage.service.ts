import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      region: config.get('S3_REGION', 'auto'),
      endpoint: config.get('S3_ENDPOINT'), // для R2: https://<accountid>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId:     config.get('S3_ACCESS_KEY'),
        secretAccessKey: config.get('S3_SECRET_KEY'),
      },
    });

    this.bucket    = config.get('S3_BUCKET', 'elearning');
    this.publicUrl = config.get('S3_PUBLIC_URL', ''); // публічний домен бакету
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    folder: 'videos' | 'thumbnails' | 'certificates' | 'avatars',
    mimeType: string,
  ): Promise<string> {
    const ext      = extname(originalName);
    const filename = `${folder}/${uuidv4()}${ext}`;

    try {
      await this.client.send(new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         filename,
        Body:        buffer,
        ContentType: mimeType,
        ACL: folder === 'videos' ? 'private' : 'public-read',
      }));
    } catch (err) {
      throw new InternalServerErrorException(`Помилка завантаження файлу: ${err.message}`);
    }

    if (folder !== 'videos') {
      return `${this.publicUrl}/${filename}`;
    }

    return filename;
  }

  async getSignedVideoUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async delete(key: string): Promise<void> {
    const fileKey = key.startsWith('http') ? key.split('/').slice(3).join('/') : key;
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }));
  }

  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimeType = 'application/pdf',
  ): Promise<string> {
    const key = `certificates/${filename}`;
    await this.client.send(new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
      ACL:         'public-read',
    }));
    return `${this.publicUrl}/${key}`;
  }
}
