import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";
import { requireAuth } from "@/lib/auth";
import { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    const subscription = await request.json();
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Suscripción inválida." },
        { status: 400 }
      );
    }

    await Usuario.updateOne(
      { _id: auth.userId },
      {
        $pull: { push_subscriptions: { endpoint: subscription.endpoint } },
      }
    );
    await Usuario.updateOne(
      { _id: auth.userId },
      {
        $push: {
          push_subscriptions: {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime ?? null,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
        },
      }
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Suscripción guardada.",
    });
  } catch (error) {
    console.error("Error guardando suscripción push:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireAuth(request);
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No autenticado." },
        { status: 401 }
      );
    }

    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Endpoint requerido." },
        { status: 400 }
      );
    }

    await Usuario.updateOne(
      { _id: auth.userId },
      { $pull: { push_subscriptions: { endpoint } } }
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Suscripción eliminada.",
    });
  } catch (error) {
    console.error("Error eliminando suscripción push:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
