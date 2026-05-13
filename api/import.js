export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL manquante" });

  try {
    const isVinted = url.includes("vinted.fr");
    const isLeboncoin = url.includes("leboncoin.fr");

    if (!isVinted && !isLeboncoin) {
      return res.status(400).json({ error: "URL non supportée. Utilise Vinted ou Leboncoin." });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: "Impossible d'accéder à la page. Vérifie l'URL." });
    }

    const html = await response.text();
    let result = { nom: null, prix: null, categorie: "autre", image: null, plateforme: null };

    if (isVinted) {
      result.plateforme = "Vinted";

      // Titre
      const titleMatch =
        html.match(/"title"\s*:\s*"([^"]{3,100})"/)?.[1] ||
        html.match(/<h1[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]{3,100})<\/h1>/i)?.[1] ||
        html.match(/<meta\s+property="og:title"\s+content="([^"]{3,100})"/i)?.[1] ||
        html.match(/"item_title"\s*:\s*"([^"]{3,100})"/)?.[1];

      // Prix
      const priceMatch =
        html.match(/"price"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/)?.[1] ||
        html.match(/(\d+(?:[.,]\d+)?)\s*€/)?.[1] ||
        html.match(/"amount"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/)?.[1];

      // Image
      const imageMatch =
        html.match(/"photo"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/)?.[1] ||
        html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];

      // Catégorie
      const catText = html.toLowerCase();
      if (catText.includes("chaussure") || catText.includes("vêtement") || catText.includes("robe") || catText.includes("pantalon") || catText.includes("veste") || catText.includes("pull") || catText.includes("sneaker") || catText.includes("basket")) result.categorie = "vetements";
      else if (catText.includes("téléphone") || catText.includes("smartphone") || catText.includes("iphone") || catText.includes("samsung") || catText.includes("console") || catText.includes("playstation") || catText.includes("nintendo") || catText.includes("xbox") || catText.includes("ordinateur") || catText.includes("laptop")) result.categorie = "electronique";
      else if (catText.includes("vélo") || catText.includes("velo") || catText.includes("trottinette") || catText.includes("cyclisme")) result.categorie = "velos";

      if (titleMatch) result.nom = titleMatch.replace(/\\u[\dA-F]{4}/gi, c => String.fromCharCode(parseInt(c.replace(/\\u/i, ''), 16))).replace(/\\"/g, '"').trim();
      if (priceMatch) result.prix = parseFloat(priceMatch.replace(",", "."));
      if (imageMatch) result.image = imageMatch;
    }

    if (isLeboncoin) {
      result.plateforme = "Leboncoin";

      // Leboncoin injecte ses données dans __NEXT_DATA__
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>({.*?})<\/script>/s);

      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          // Navigue dans la structure Next.js
          const props = nextData?.props?.pageProps;
          const ad = props?.ad || props?.listing || props?.adView?.ad;

          if (ad) {
            result.nom = ad.subject || ad.title || null;
            result.prix = ad.price?.[0] || ad.price || null;
            result.image = ad.images?.urls?.[0] || ad.images?.thumb_url || null;

            const cat = (ad.category_name || ad.category?.name || "").toLowerCase();
            if (cat.includes("vêtement") || cat.includes("chaussure") || cat.includes("mode")) result.categorie = "vetements";
            else if (cat.includes("informatique") || cat.includes("téléphonie") || cat.includes("console") || cat.includes("électronique") || cat.includes("jeux")) result.categorie = "electronique";
            else if (cat.includes("vélo") || cat.includes("trottinette") || cat.includes("cyclisme")) result.categorie = "velos";
          }
        } catch {}
      }

      // Fallback si pas de __NEXT_DATA__
      if (!result.nom) {
        result.nom =
          html.match(/<meta\s+property="og:title"\s+content="([^"]{3,150})"/i)?.[1] ||
          html.match(/<h1[^>]*>([^<]{3,150})<\/h1>/i)?.[1] || null;
      }
      if (!result.prix) {
        const priceMatch = html.match(/(\d+(?:[.,]\d+)?)\s*€/)?.[1];
        if (priceMatch) result.prix = parseFloat(priceMatch.replace(",", "."));
      }
      if (!result.image) {
        result.image = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] || null;
      }
    }

    if (!result.nom && !result.prix) {
      return res.status(422).json({ error: "Impossible d'extraire les données. L'annonce est peut-être privée ou expirée." });
    }

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
}
