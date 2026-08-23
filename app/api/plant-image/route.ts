import { NextResponse } from 'next/server';

// Extract the core plant name (remove parentheses, slashes, and extra details)
const extractCoreName = (name: string): string => {
  // Remove anything in parentheses: (Manila Rope) 
  let cleaned = name.replace(/\([^)]*\)/g, '').trim();
  
  // If there's a slash, take the first part: "Spathiphyllum/Peace Lily" -> "Spathiphyllum"
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/')[0].trim();
  }
  
  // Remove common suffixes like "var.", "sp.", etc.
  cleaned = cleaned.replace(/\b(var\.|sp\.)\b/g, '').trim();
  
  return cleaned || name;
};

export async function POST(request: Request) {
  try {
    const { plantName } = await request.json();

    if (!plantName) {
      return NextResponse.json(
        { error: 'Plant name is required' },
        { status: 400 }
      );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('Missing UNSPLASH_ACCESS_KEY');
      return NextResponse.json({ imageUrl: null });
    }

    // Extract core name first
    const coreName = extractCoreName(plantName);
    console.log(`Searching for: "${coreName}" (original: "${plantName}")`);

    // If core name is different, try it first
    const searchQueries = coreName !== plantName 
      ? [coreName, plantName] 
      : [plantName];

    for (const query of searchQueries) {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=3`;
      
      console.log('Fetching from Unsplash:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      });

      if (!response.ok) {
        console.error('Unsplash API error:', response.status);
        continue;
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return NextResponse.json({
          imageUrl: data.results[0].urls.regular || data.results[0].urls.small,
        });
      }
    }

    console.log('No image found for:', plantName);
    return NextResponse.json({ imageUrl: null });
  } catch (error) {
    console.error('Plant image error:', error);
    return NextResponse.json({ imageUrl: null });
  }
}