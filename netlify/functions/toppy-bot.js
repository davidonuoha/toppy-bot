
import { neon } from "@neondatabase/serverless";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("TOPPY is online");
  }

  if (!BOT_TOKEN || !WEBHOOK_SECRET || !DATABASE_URL) {
    return Response.json(
      { error: "Missing environment variables" },
      { status: 500 }
    );
  }

  if (
    req.headers.get("X-Telegram-Bot-Api-Secret-Token") !==
    WEBHOOK_SECRET
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const sql = neon(DATABASE_URL);
    await sql`SELECT 1`;

    const update = await req.json();
    const message = update.message;
    if (!message?.chat?.id) {
      return Response.json({ ok: true });
    }

    const chatId = message.chat.id;
    const input = (message.text || "").trim().toLowerCase();

    let reply;

    if (input === "/start") {
      reply =
        "Welcome to TOPPY! 🎯\n\nYour prediction bot is being configured.\n\nSend /help to see available commands.";
    } else if (input === "/help") {
      reply =
        "TOPPY Commands\n\n/start - Start the bot\n/help - Show commands\n/status - Check bot status";
    } else if (input === "/status") {
      reply = "TOPPY is online. Database connection successful.";
    } else {
      reply = "I didn't understand that command. Send /help.";
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      }
    );

    if (!telegramResponse.ok) {
      throw new Error("Telegram message delivery failed");
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("TOPPY error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
    
