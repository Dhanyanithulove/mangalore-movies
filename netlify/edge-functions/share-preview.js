export default async (request, context) => {
  const url = new URL(request.url);
  const movieId = url.searchParams.get("v");

  // 1. If not a movie link, serve the homepage normally
  if (!movieId) return context.next();

  // 2. Bot detection covering all WhatsApp, Facebook, Telegram, and Apple scrapers
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = /WhatsApp|facebookexternalhit|Facebot|meta-externalagent|Meta-ExternalFetcher|TelegramBot|Twitterbot|Googlebot|Discordbot|Applebot/i.test(userAgent);

  // If a human visitor clicks the link, serve the website
  if (!isBot) return context.next();

  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/lottery-e3270/databases/(default)/documents/movies/${movieId}`;
    const dbRes = await fetch(firestoreUrl);

    if (dbRes.ok) {
      const doc = await dbRes.json();
      const fields = doc.fields || {};

      const title = fields.title?.stringValue || "MANGALORE MOVIES";
      const desc = fields.description?.stringValue || "Watch official trailer and download.";
      
      // Look for bannerUrl, previewThumbnailUrl, posterUrl, or fall back to YouTube thumbnail
      let img = fields.bannerUrl?.stringValue || 
                fields.previewThumbnailUrl?.stringValue || 
                fields.posterUrl?.stringValue || "";

      // If no valid image is provided, fall back to the YouTube HQ thumbnail directly
      if (!img && fields.youtubeId?.stringValue) {
        img = `https://img.youtube.com/vi/${fields.youtubeId.stringValue}/hqdefault.jpg`;
      }

      // Ensure HTTPS protocol
      if (img.startsWith("http://")) {
        img = img.replace("http://", "https://");
      }

      const botHtml = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <title>${title} - MANGALORE MOVIES</title>
  
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MANGALORE MOVIES">
  <meta property="og:title" content="${title} - MANGALORE MOVIES">
  <meta property="og:description" content="${desc}">
  
  <meta property="og:image" content="${img}">
  <meta property="og:image:secure_url" content="${img}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${url.href}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} - MANGALORE MOVIES">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${img}">
</head>
<body>
  <script>window.location.href = "/?v=${movieId}";</script>
</body>
</html>`;

      return new Response(botHtml, {
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300"
        },
      });
    }
  } catch (err) {
    console.error("WhatsApp Preview Error:", err);
  }

  return context.next();
};
