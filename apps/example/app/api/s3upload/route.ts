import { createS3Client, generatePresignedUrls } from "next-s3-uploader";

export async function POST(req: Request) {
  const { keys } = await req.json();
  const bucket = "check";
  const prefix = `userId/images/`;

  const s3Client = createS3Client({
    provider: "minio", // Store in .env
    endpoint: "http://localhost:9000/", // Store in .env
    region: "ap-south-1", // Store in .env and use the same region as the bucket and make sure it is correct
    forcePathStyle: true, // Store in .env
    credentials: {
      accessKeyId: "ROOTNAME", // Store in .env
      secretAccessKey: "CHANGEME123", // Store in .env
    },
  });

  const urls = await generatePresignedUrls(s3Client, keys, bucket, prefix);

  return new Response(JSON.stringify(urls), { status: 200 });
}
