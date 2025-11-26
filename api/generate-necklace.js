export default async function handler(req, res) {
  // Sadece POST isteklerine izin veriyoruz
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base_image, necklace_text, metal_color, prompt } = req.body || {};

    // Güvenlik: prompt yoksa kendimiz oluşturuyoruz
    const finalPrompt =
      prompt ||
      `Ultra realistic studio shot of a premium 925 silver name necklace that says "${necklace_text ||
        "Tarrons"}" in ${metal_color || "silver"} color on a clean light background. Luxury, minimal, high-end jewelry photography, soft lighting.`;

    // 🔥 Gerçek OpenAI isteği (image generation)
    const aiResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: finalPrompt,
          size: "1024x1024",
        }),
      }
    );

    const data = await aiResponse.json();

    // OpenAI bir hata dönerse
    if (!aiResponse.ok) {
      console.error("OpenAI error:", data);
      return res
        .status(500)
        .json({ error: "OpenAI response error", details: data });
    }

    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      console.error("No image URL in OpenAI response:", data);
      return res
        .status(500)
        .json({ error: "No image URL returned from OpenAI" });
    }

    // Shopify frontend'in beklediği format: { image_url: "..." }
    return res.status(200).json({ image_url: imageUrl });
  } catch (err) {
    console.error("AI generation failed:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
