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
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Replicate modelini çalıştır
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt,
          aspect_ratio: "9:16",
          output_format: "webp",
        },
      }
    );

    // Çıktı genelde tek URL'lik bir array oluyor
    const imageUrl = Array.isArray(output) ? output[0] : output;

    return res.status(200).json({ image_url: imageUrl });
  } catch (error) {
    console.error("Replicate Error:", error);
    return res
      .status(500)
      .json({ error: "Image generation failed", details: String(error) });
  }
}
