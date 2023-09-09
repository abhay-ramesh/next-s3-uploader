import { createS3Client, generatePresignedUrls } from "next-s3-uploader";
import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { keys } = await req.json();
  const bucket = "check";
  const prefix = `userId/images/`;

  const s3Client = createS3Client({
    provider: process.env.S3_PROVIDER, // Store in .env
    endpoint: process.env.S3_ENDPOINT, // Store in .env (optional)
    region: process.env.S3_REGION, // Store in .env and use the same region as the bucket and make sure it is correct
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", // Store in .env (optional)
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY, // Store in .env
      secretAccessKey: process.env.S3_SECRET_KEY, // Store in .env
    },
  });

  const urls = await generatePresignedUrls(s3Client, keys, bucket, prefix);

  return new Response(JSON.stringify(urls), { status: 200 });
}
