import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

// Create an S3 Client instance
export const createS3Client = (config: {
  provider: "aws" | "minio" | "other";
  endpoint?: string;
  region: string;
  forcePathStyle?: boolean;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}) => {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.credentials.accessKeyId,
      secretAccessKey: config.credentials.secretAccessKey,
    },
    // Set endpoint and forcePathStyle only if provider is not "aws"
    ...(config.provider !== "aws" && {
      endpoint: config.endpoint,
      forcePathStyle:
        config.forcePathStyle !== undefined ? config.forcePathStyle : true, // Default to true for non-AWS providers
    }),
  });
};

// Generate Presigned URLs for uploading objects to S3
export async function generatePresignedUrls(
  s3Client: S3Client,
  keys: string[],
  bucket: string,
  prefix?: string,
  privateBucket: boolean = false,
  operation: "upload" | "download" = "upload",
  options?: { expiresIn?: number }
) {
  const urls = [];

  for (const key of keys) {
    const newKey = `${prefix ?? ""}${key}`;
    const ObjectParams: PutObjectCommandInput | GetObjectCommandInput = {
      // Use a union type
      Bucket: bucket,
      Key: newKey,
    };

    if (operation === "upload") {
      const presignedPutUrl = await getSignedUrl(
        s3Client,
        new PutObjectCommand(ObjectParams as PutObjectCommandInput), // Cast to the appropriate type
        {
          expiresIn: options?.expiresIn ?? 3600,
        }
      );
      let s3ObjectUrl = "";

      if (!privateBucket) s3ObjectUrl = presignedPutUrl.split("?")[0];
      else {
        s3ObjectUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand(ObjectParams as GetObjectCommandInput), // Cast to the appropriate type
          {
            expiresIn: 3600,
          }
        );
      }

      urls.push({
        key: newKey,
        presignedPutUrl,
        s3ObjectUrl,
      });
    } else if (operation === "download") {
      const s3ObjectUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand(ObjectParams as GetObjectCommandInput), // Cast to the appropriate type
        {
          expiresIn: options?.expiresIn ?? 3600,
        }
      );

      urls.push({
        key: newKey,
        s3ObjectUrl,
      });
    }
  }

  return urls;
}
