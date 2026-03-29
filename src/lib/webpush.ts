import webpush from "web-push";
import connectDB from "@/lib/mongodb";
import Usuario from "@/models/Usuario";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  await connectDB();

  const user = await Usuario.findById(userId).select("push_subscriptions").lean() as {
    push_subscriptions?: { endpoint: string; expirationTime?: number | null; keys: { p256dh: string; auth: string } }[];
  } | null;

  if (!user?.push_subscriptions?.length) return;

  const deadEndpoints: string[] = [];

  await Promise.all(
    user.push_subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoints.push(sub.endpoint);
        } else {
          console.error("Push send error:", err);
        }
      }
    })
  );

  if (deadEndpoints.length > 0) {
    await Usuario.updateOne(
      { _id: userId },
      { $pull: { push_subscriptions: { endpoint: { $in: deadEndpoints } } } }
    );
  }
}
