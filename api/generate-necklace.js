import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { imageBase64, necklaceText, metalColor } = req.body;

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Burada Replicate modelini çalıştırıyoruz
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",   // model adı (gerekirse sürümü ekleriz)
      {
        input: {
          prompt: `A portrait of a person wearing a ${metalColor} necklace with the word "${necklaceText}".`,
          image: imageBase64,
          aspect_ratio: "1:1",
          output_format: "webp"
        }
      }
    );

    // Replicate çıktısı URL döner
    return res.status(200).json({ imageUrl: output });
  } catch (error) {
    console.error("Replicate Error:", error);
    return res.status(500).json({ error: "Image generation failed", details: error });
  }
}
