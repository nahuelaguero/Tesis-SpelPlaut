import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function extractKey(value: string): string {
  try {
    const parsed = new URL(value);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return value.replace(/^\/+/, "");
  }
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return new NextResponse("Missing key parameter", { status: 400 });
  }

  const resolvedKey = extractKey(key);

  const bucket = process.env.AWS_S3_BUCKET_NAME;
  if (!bucket || !process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
    return new NextResponse("Server configuration error", { status: 500 });
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: resolvedKey });
    const response = await getS3Client().send(command);

    const body = response.Body;
    if (!body) {
      return new NextResponse("Image not found", { status: 404 });
    }

    return new NextResponse(body as ReadableStream, {
      headers: {
        "Content-Type": response.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Image not found", { status: 404 });
  }
}
