import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Known non-plant terms to filter out
const invalidPlantTerms = [
  'machine', 'singing', 'dancing', 'computer', 
  'robot', 'device', 'app', 'software', 'company',
  'karaoke', 'speaker', 'audio', 'sound', 'music'
];

export async function POST(request: Request) {
  try {
    const { moisture, ph, temperature, humidity } = await request.json();

    console.log('📦 API received - Moisture:', moisture, '%, pH:', ph, ', Temp:', temperature, '°C, Humidity:', humidity, '%');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a plant recommendation expert for Philippine home gardening. Based on the following environmental conditions, recommend 3 indoor plants that are:

REQUIREMENTS:
- Native or common to the Philippines
- Easily available in local nurseries
- Popular among Filipino plant enthusiasts
- Suitable for indoor growing in tropical climate

Conditions:
- Soil Moisture: ${moisture}% (0% = bone dry, 100% = waterlogged)
- Soil pH: ${ph} (0-14 scale, 7 = neutral, <7 = acidic, >7 = alkaline)
- Temperature: ${temperature}°C
- Humidity: ${humidity}%

For each plant, provide:
1. Plant name (common Filipino name if available, otherwise English)
2. Scientific name
3. One sentence explaining why it matches these conditions (include both moisture and pH)
4. Complete plant care guide including:
   - Light requirements
   - Watering frequency
   - Ideal temperature range
   - Humidity preferences
   - Soil type and pH preferences
   - Fertilizer needs
   - Pro tips for beginners
   - Common problems to watch for

IMPORTANT: Avoid recommending Snake Plant and ZZ Plant unless the conditions are truly extreme. Prioritize other plants first.

Return ONLY valid JSON in this exact format:
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
      "soil": "Soil type and pH preferences",
      "fertilizer": "Fertilizer type and frequency",
      "tips": "Pro tips for beginners",
      "commonProblems": "Common issues to watch for"
    }
  }
]

IMPORTANT: Only recommend real plants that exist. Do not recommend karaoke machines, electronics, or any non-plant items. All recommendations must be actual plant species.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
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

    // Filter out invalid plant names
    if (Array.isArray(recommendations)) {
      recommendations = recommendations.filter((plant: any) => {
        const name = plant?.name?.toLowerCase() || '';
        const scientificName = plant?.scientificName?.toLowerCase() || '';
        
        // Check for invalid terms in both common and scientific names
        const hasInvalidTerm = invalidPlantTerms.some(term => 
          name.includes(term) || scientificName.includes(term)
        );
        
        // Ensure name is not too short and looks like a real plant name
        const isValidLength = name.length > 2;
        const hasPlantKeywords = ['plant', 'flower', 'leaf', 'tree', 'fern', 'palm', 'bamboo', 'orchid', 'rose', 'lily', 'cactus', 'succulent', 'ivy', 'vine', 'herb', 'shrub'].some(keyword => 
          name.includes(keyword) || scientificName.includes(keyword)
        );
        
        // Keep if: no invalid terms, valid length, and either has plant keyword OR scientific name exists
        return !hasInvalidTerm && isValidLength && (hasPlantKeywords || plant.scientificName?.length > 3);
      });
    }

    console.log('📦 Filtered recommendations:', JSON.stringify(recommendations, null, 2));

    // If all recommendations were filtered out, use fallback
    if (!recommendations || recommendations.length === 0) {
      const fallback = [
        {
          name: "Snake Plant",
          scientificName: "Sansevieria trifasciata",
          reason: "Extremely adaptable and tolerates a wide range of conditions.",
          care: {
            light: "Low to bright indirect light. Avoid direct sunlight.",
            water: "Water every 2-6 weeks. Let soil dry completely between waterings.",
            temperature: "18-27°C (65-80°F)",
            humidity: "Low to moderate. Very adaptable.",
            soil: "Well-draining cactus/succulent mix. pH 6.0-7.5",
            fertilizer: "Fertilize once in spring and summer with cactus fertilizer.",
            tips: "Very hard to kill! Perfect for beginners. Wipe leaves occasionally.",
            commonProblems: "Overwatering (yellow leaves), Cold damage, Root rot"
          }
        },
        {
          name: "ZZ Plant",
          scientificName: "Zamioculcas zamiifolia",
          reason: "Survives in low light and irregular watering schedules.",
          care: {
            light: "Low to bright indirect light. Very shade tolerant.",
            water: "Water every 2-3 weeks. Allow soil to dry completely.",
            temperature: "18-24°C (65-75°F)",
            humidity: "Low to high. Very adaptable.",
            soil: "Well-draining potting mix with perlite. pH 6.0-7.0",
            fertilizer: "Fertilize 2-3 times per year with balanced fertilizer.",
            tips: "Drought tolerant. Wipe leaves to keep them shiny.",
            commonProblems: "Yellow leaves (overwatering), Root rot, Slow growth"
          }
        },
        {
          name: "Pothos",
          scientificName: "Epipremnum aureum",
          reason: "Very forgiving plant that adapts to most indoor environments.",
          care: {
            light: "Low to bright indirect light. Variegation needs more light.",
            water: "Water when top 2 inches of soil are dry.",
            temperature: "18-29°C (65-85°F)",
            humidity: "Moderate to high. Benefits from occasional misting.",
            soil: "Well-draining potting mix. pH 6.0-7.0",
            fertilizer: "Fertilize monthly during growing season.",
            tips: "Trailing or climbing. Propagate easily from cuttings.",
            commonProblems: "Brown leaves (underwatering), Yellow leaves (overwatering), Leggy growth (not enough light)"
          }
        }
      ];
      return NextResponse.json({ recommendations: fallback });
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'AI service temporarily unavailable';
    const isQuotaError = errorMessage.includes('quota') || 
                         errorMessage.includes('rate limit') || 
                         errorMessage.includes('429') ||
                         errorMessage.includes('exhausted');
    
    return NextResponse.json(
      { 
        error: 'AI service temporarily unavailable',
        tip: isQuotaError 
          ? 'The AI service is currently experiencing high demand. Please try again in a few minutes.'
          : 'Please check your internet connection and try again.',
        isQuotaError: isQuotaError
      },
      { status: 503 }
    );
  }
}