import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import z from "zod";

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

const configSchema = z.object({
  provider: z.enum(["aws", "minio", "other"]),
  endpoint: z.string().optional(),
  region: z.string(),
  forcePathStyle: z.boolean().optional(),
  credentials: z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
  }),
});

type createS3ClientConfig = z.infer<typeof configSchema>;

// Create an S3 Client instance
/**
 * @param provider S3 provider (aws, minio, other)
 * @param endpoint S3 endpoint (required if provider is not "aws")
 * @param region S3 region
 * @param forcePathStyle Whether to force path style URLs (required if provider is not "aws")
 * @param credentials S3 credentials (accessKeyId and secretAccessKey)
 * @returns S3Client instance
 * @example
 * const s3Client = createS3Client({
 *  provider: "aws",
 *  region: "us-east-1",
 *  credentials: {
 *    accessKeyId: "accessKeyId",
 *    secretAccessKey: "secretAccessKey",
 *  },
 * });
 **/
export const createS3Client = (config: createS3ClientConfig) => {
  if (!config.provider) throw new Error("Missing provider");
  if (!config.region) throw new Error("Missing region");
  if (!config.credentials) throw new Error("Missing credentials");
  if (!config.credentials.accessKeyId)
    throw new Error("Missing credentials.accessKeyId");
  if (!config.credentials.secretAccessKey)
    throw new Error("Missing credentials.secretAccessKey");

  if (config.provider !== "aws" && !config.endpoint)
    throw new Error("Missing endpoint");

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

const uploadConfigSchema = z.object({
  keys: z.array(z.string()),
  bucket: z.string(),
  prefix: z.string().optional(),
  privateBucket: z.boolean().optional(),
  options: z.object({
    expiresIn: z.number().optional(),
  }),
});

// Generate Presigned URLs for uploading objects to S3
/**
 * @param s3Client S3Client instance
 * @param keys Array of keys to generate presigned URLs for
 * @param bucket S3 bucket name
 * @param prefix Prefix to add to the key
 * @param privateBucket Whether the bucket is private or not
 * @param operation Whether to generate presigned URLs for uploading or downloading
 * @param options Options for the presigned URL
 * @returns Array of presigned URLs
 * @example
 * const urls = await generatePresignedUrls(s3Client, ["file1.txt", "file2.txt"], "my-bucket", "my-prefix/", false, "upload", { expiresIn: 3600 });
 **/
export async function generatePresignedUrls(
  s3Client: S3Client,
  keys: string[],
  bucket: string,
  prefix?: string,
  privateBucket: boolean = false,
  operation: "upload" | "download" = "upload",
  options: { expiresIn: number } = { expiresIn: 3600 }
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
          expiresIn: options.expiresIn,
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
          expiresIn: options.expiresIn,
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
