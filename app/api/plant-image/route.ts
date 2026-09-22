import { NextResponse } from 'next/server';

// Extract the core plant name (remove parentheses, slashes, and extra details)
const extractCoreName = (name: string): string => {
  let cleaned = name.replace(/\([^)]*\)/g, '').trim();
  
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/')[0].trim();
  }
  
  cleaned = cleaned.replace(/\b(var\.|sp\.)\b/g, '').trim();
  
  return cleaned || name;
};

export async function POST(request: Request) {
  try {
    const { plantName, scientificName } = await request.json();

    if (!plantName && !scientificName) {
      return NextResponse.json(
        { error: 'Plant name or scientific name is required' },
        { status: 400 }
      );
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('Missing UNSPLASH_ACCESS_KEY');
      return NextResponse.json({ imageUrl: null });
    }

    // Build search queries - prioritize scientific name for accuracy
    const searchQueries: string[] = [];
    
    if (scientificName && scientificName.trim()) {
      // Try the full scientific name first
      searchQueries.push(scientificName.trim());
      // Then try without the species part (genus only)
      const genus = scientificName.trim().split(' ')[0];
      if (genus && genus !== scientificName.trim()) {
        searchQueries.push(genus);
      }
    }
    
    if (plantName) {
      const coreName = extractCoreName(plantName);
      searchQueries.push(coreName);
      // Also try with "plant" appended for better context
      searchQueries.push(`${coreName} plant`);
    }

    console.log(`🔍 Searching for: "${plantName}" (${scientificName})`);
    console.log(`📋 Query order:`, searchQueries);

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
        console.log(`✅ Found image for query: "${query}"`);
        return NextResponse.json({
          imageUrl: data.results[0].urls.regular || data.results[0].urls.small,
          matchedQuery: query,
        });
      }
    }

    console.log('❌ No image found for:', plantName, scientificName);
    return NextResponse.json({ imageUrl: null });
  } catch (error) {
    console.error('Plant image error:', error);
    return NextResponse.json({ imageUrl: null });
  }
}