import Replicate from "replicate";

export default async function handler(req, res) {
  // CORS header'ları
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (OPTIONS) isteğini kabul et
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Sadece POST'a izin ver
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      console.log("Bad request body:", req.body);
      return res.status(400).json({ error: "Prompt is required" });
    }

    const replicate = new Replicate({
      // VERCEL'DEKİ ENV İSİM: REPLICATE_API_KEY OLMALI
      auth: process.env.REPLICATE_API_KEY,
    });

    // Ücretsiz/ucuz hızlı model
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt,
          aspect_ratio: "9:16",
        },
      }
    );

    // Çıktıdan URL çek
    let imageUrl;
    if (Array.isArray(output)) {
      imageUrl = output[0];
    } else if (typeof output === "string") {
      imageUrl = output;
    } else if (output && output.output) {
      imageUrl = Array.isArray(output.output)
        ? output.output[0]
        : output.output;
    }

    if (!imageUrl) {
      console.error("No image URL from Replicate:", output);
      return res.status(500).json({ error: "No image URL from Replicate" });
    }

    return res.status(200).json({ image_url: imageUrl });
  } catch (error) {
    console.error("Replicate Error:", error);
    return res
      .status(500)
      .json({ error: "Image generation failed", details: String(error) });
  }
}
