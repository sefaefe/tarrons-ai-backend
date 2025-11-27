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
    const { imageBase64, necklaceText, metalColor } = req.body || {};

    // Gelen body'yi loglayalım (debug için)
    console.log("Request body:", req.body);

    if (!imageBase64 || !necklaceText || !metalColor) {
      return res.status(400).json({
        error: "imageBase64, necklaceText ve metalColor zorunlu",
      });
    }

    // Prompt'u backend'de oluşturuyoruz
    const prompt = `
A high-end studio product photo of a 925 sterling silver name necklace that says "${necklaceText}" in ${metalColor} color,
photographed on a realistic model similar to the uploaded photo, vertical 9:16, soft light, luxury jewelry style.
    `.trim();

    const replicate = new Replicate({
      // Vercel'de KEY ismi BÖYLE olmalı:
      auth: process.env.REPLICATE_API_KEY,
    });

    // Replicate modelini çalıştır
    const output = await replicate.run(
      "black forest gateau cake spelling out the words \"FLUX 1 . 1 Pro\", tasty, food photography",
      {
        input: {
          prompt,
          image: imageBase64,   // Kullanıcının yüklediği fotoğraf
          aspect_ratio: "9:16",
          output_format: "webp",
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
