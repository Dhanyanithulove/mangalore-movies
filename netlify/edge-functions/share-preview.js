export default async (request, context) => {
  const url = new URL(request.url);
  const movieId = url.searchParams.get("v");

  // 1. If not a movie link, load website normally (shows default logo)
  if (!movieId) return context.next();

  // 2. Detect WhatsApp, Facebook, Telegram, and Meta bots
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = /WhatsApp|facebookexternalhit|meta-externalagent|Meta-ExternalFetcher|Facebot|TelegramBot|Twitterbot|Googlebot|Discordbot/i.test(userAgent);

  // 3. If a real person opens the link in Chrome/Safari, load normally
  if (!isBot) return context.next();

  // 4. Fetch the movie details from Firebase
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/lottery-e3270/databases/(default)/documents/movies/${movieId}`;
    const dbRes = await fetch(firestoreUrl);

    if (dbRes.ok) {
      const doc = await dbRes.json();
      const fields = doc.fields || {};

      const title = fields.title?.stringValue || "MANGALORE MOVIES";
      const desc = fields.description?.stringValue || "Watch official trailer and download.";
      const banner = fields.bannerUrl?.stringValue || fields.posterUrl?.stringValue || "https://i.ibb.co/xtdHs2Zb/1000147633-1.png";

      // Specially optimized Open Graph tags for WhatsApp
      const botHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - MANGALORE MOVIES</title>
  <meta property="og:type" content="video.movie">
  <meta property="og:site_name" content="MANGALORE MOVIES">
  <meta property="og:title" content="${title} - MANGALORE MOVIES">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${banner}">
  <meta property="og:image:secure_url" content="${banner}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${url.href}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} - MANGALORE MOVIES">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${banner}">
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
    console.error("WhatsApp preview error:", err);
  }

  return context.next();
};
