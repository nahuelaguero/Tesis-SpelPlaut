import { NextRequest, NextResponse } from "next/server";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Configuracion de AWS incompleta.");
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucketName() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("Falta la variable AWS_S3_BUCKET_NAME.");
  }

  return bucketName;
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function buildPublicUrl(key: string) {
  if (process.env.AWS_S3_PUBLIC_BASE_URL) {
    return `${process.env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  return `https://${getBucketName()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

function extractKey(value: string) {
  try {
    const parsed = new URL(value);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return value.replace(/^\/+/, "");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Debes adjuntar al menos una imagen." },
        { status: 400 }
      );
    }

    const client = getS3Client();
    const bucketName = getBucketName();
    const uploadedFiles: Array<{ key: string; url: string; name: string }> = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: `El archivo ${file.name} no tiene un formato soportado.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: `El archivo ${file.name} supera el limite de 5MB.`,
          },
          { status: 400 }
        );
      }

      const extension = sanitizeSegment(file.name.split(".").pop() || "jpg");
      const key = `canchas/${auth.userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: Buffer.from(await file.arrayBuffer()),
          ContentType: file.type,
        })
      );

      uploadedFiles.push({
        key,
        url: buildPublicUrl(key),
        name: file.name,
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Imagenes subidas exitosamente.",
      data: { files: uploadedFiles },
    });
  } catch (error) {
    console.error("Error subiendo imagenes:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "No se pudieron subir las imagenes.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const value = body.key || body.url;
    if (!value) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Debes indicar la imagen a eliminar." },
        { status: 400 }
      );
    }

    const key = extractKey(value);
    if (!key.startsWith(`canchas/${auth.userId}/`) && auth.rol !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No puedes eliminar esta imagen." },
        { status: 403 }
      );
    }

    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      })
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Imagen eliminada exitosamente.",
    });
  } catch (error) {
    console.error("Error eliminando imagen:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "No se pudo eliminar la imagen." },
      { status: 500 }
    );
  }
}
