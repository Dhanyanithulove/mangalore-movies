export default async (request, context) => {
  const url = new URL(request.url);
  const movieId = url.searchParams.get("v");

  // 1. If not a movie link, load website normally (shows logo)
  if (!movieId) return context.next();

  // 2. Detect social media bots
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = /WhatsApp|TelegramBot|facebookexternalhit|Twitterbot|Googlebot|Discordbot/i.test(userAgent);

  // 3. If a real human clicked, load website normally
  if (!isBot) return context.next();

  // 4. If a bot is reading the link, fetch movie details from Firebase
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/lottery-e3270/databases/(default)/documents/movies/${movieId}`;
    const dbRes = await fetch(firestoreUrl);

    if (dbRes.ok) {
      const doc = await dbRes.json();
      const fields = doc.fields || {};

      const title = fields.title?.stringValue || "MANGALORE MOVIES";
      const desc = fields.description?.stringValue || "Watch official trailer and download.";
      const banner = fields.bannerUrl?.stringValue || fields.posterUrl?.stringValue || "https://i.ibb.co/xtdHs2Zb/1000147633-1.png";

      const botHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MANGALORE MOVIES">
  <meta property="og:title" content="${title} - MANGALORE MOVIES">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${banner}">
  <meta property="og:url" content="${url.href}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} - MANGALORE MOVIES">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${banner}">
  <title>${title} - MANGALORE MOVIES</title>
</head>
<body>
  <script>window.location.href = "/?v=${movieId}";</script>
</body>
</html>`;

      return new Response(botHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  } catch (err) {
    console.error("Bot preview error:", err);
  }

  return context.next();
};
