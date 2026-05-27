import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { moisture, temperature, humidity } = await request.json();

    console.log('📦 API received - Moisture:', moisture, '%, Temp:', temperature, '°C, Humidity:', humidity, '%');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a plant recommendation expert for Philippine home gardening. Based on the following environmental conditions, recommend 3 indoor plants that are:

REQUIREMENTS:
- Native or common to the Philippines
- Easily available in local nurseries (e.g., Manila, Cebu, Davao)
- Popular among Filipino plant enthusiasts
- Suitable for indoor growing in tropical climate

Conditions:
- Soil Moisture: ${moisture}% (0% = bone dry, 100% = waterlogged)
- Temperature: ${temperature}°C
- Humidity: ${humidity}%

For each plant, provide:
1. Plant name (common Filipino name if available, otherwise English)
2. Scientific name
3. One sentence explaining why it matches these conditions
4. Complete plant care guide including:
   - Light requirements
   - Watering frequency
   - Ideal temperature range
   - Humidity preferences
   - Soil type
   - Fertilizer needs
   - Pro tips for beginners
   - Common problems to watch for

Return ONLY valid JSON in this exact format, no other text:
[
  {
    "name": "Plant Name",
    "scientificName": "Scientificus name",
    "reason": "Brief reason why this plant matches the conditions.",
    "care": {
      "light": "Light requirements",
      "water": "Watering frequency and amount",
      "temperature": "Ideal temperature range in °C",
      "humidity": "Humidity preferences",
      "soil": "Soil type and mix recommendations",
      "fertilizer": "Fertilizer type and frequency",
      "tips": "Pro tips for beginners",
      "commonProblems": "Common issues to watch for (as a comma-separated string)"
    }
  }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    console.log('📦 Raw AI Response:', responseText);
    
    let recommendations;
    try {
      recommendations = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    console.log('📦 Parsed recommendations:', JSON.stringify(recommendations, null, 2));

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable' },
      { status: 503 }
    );
  }
}