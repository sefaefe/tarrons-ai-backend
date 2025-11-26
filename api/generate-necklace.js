export default async function handler(req, res) {
  // Sadece POST isteklerine izin verelim
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Shopify tarafının gönderdiği değerler
    const { necklace_text, metal_color, prompt } = req.body;

    // Eğer frontend özel bir prompt yollamadıysa burda kendimiz oluşturuyoruz
    const finalPrompt =
      prompt ||
      `White background, 9:16 ratio, high-end product photo of a minimalist ${metal_color ||
        "silver"} name necklace that says "${necklace_text ||
        "Emily"}" in elegant cursive script, centered, for a jewelry ecommerce website.`;

    // 🔥 Yeni OpenAI image endpoint (gpt-image-1)
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
          n: 1,
        }),
      }
    );

    const data = await aiResponse.json();

    // OpenAI tarafında hata varsa loglayalım ve geri dönelim
    if (!aiResponse.ok) {
      console.error("OpenAI error:", data);
      return res
        .status(500)
        .json({ error: "OpenAI error", details: data });
    }

    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      console.error("No image URL in OpenAI response:", data);
      return res
        .status(500)
        .json({ error: "No image URL in response", details: data });
    }

    // Frontend’e URL’yi gönder
    return res.status(200).json({ image_url: imageUrl });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}

