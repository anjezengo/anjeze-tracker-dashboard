import type { NextApiRequest, NextApiResponse } from 'next';

type ParsedFilters = {
  years?: number[];
  initiatives?: string[];
  projects?: string[];
  subProjects?: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, options } = req.body as {
    query: string;
    options?: {
      years?: number[];
      initiatives?: string[];
      projects?: string[];
      subProjects?: string[];
    };
  };

  if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

  const ollamaUrl = process.env.OLLAMA_URL ?? 'https://ollama.com/v1';
  const ollamaKey = process.env.OLLAMA_API_KEY ?? '';
  const model = process.env.OLLAMA_MODEL ?? 'glm-5.1';

  const { years = [], initiatives = [], projects = [], subProjects = [] } = options ?? {};

  const systemPrompt = `You parse natural language queries for an NGO tracker dashboard into JSON filters.

Available filter values:
- years: ${years.join(', ') || 'use numbers like 2018, 2020'}
- initiatives: ${initiatives.slice(0, 20).join(', ') || 'unknown'}
- projects: ${projects.slice(0, 20).join(', ') || 'unknown'}
- subProjects: ${subProjects.slice(0, 30).join(', ') || 'unknown'}

Rules:
1. Return ONLY a JSON object, no explanation, no markdown.
2. Only include keys relevant to the query. Omit the rest.
3. Match values to the closest available option listed above — do not invent new values.
4. For year ranges like "2018 to 2021", include all years in that range as an array.
5. If the query doesn't reference any known filter, return {}.

Schema: { "years": number[], "initiatives": string[], "projects": string[], "subProjects": string[] }

Examples:
"what did we do in 2020" → {"years":[2020]}
"show 2019 and 2020 data" → {"years":[2019,2020]}
"medical activities" → {"initiatives":["Medical Initiative"]}
"goodie bags from 2016 to 2018" → {"years":[2016,2017,2018],"subProjects":["Infant Goodie Bag","Goodie Bags"]}
"holistic care work" → {"projects":["Holistic Care"]}
"ration support in 2021" → {"years":[2021],"subProjects":["Ration Support"]}`;

  try {
    const response = await fetch(`${ollamaUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ollamaKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.1,
        max_tokens: 256,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[nl-search] Ollama Cloud error:', response.status, errBody);
      return res.status(500).json({ error: `API ${response.status}: ${errBody.slice(0, 300)}` });
    }

    const data = await response.json();
    console.log('[nl-search] response:', JSON.stringify(data).slice(0, 500));
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ filters: null, summary: 'No filters found' });

    const filters: ParsedFilters = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ filters, summary: buildSummary(filters) });
  } catch (e: any) {
    console.error('[nl-search] error:', e?.message);
    return res.status(500).json({ error: e?.message ?? 'Parse failed' });
  }
}

function buildSummary(filters: ParsedFilters): string {
  const parts: string[] = [];
  if (filters.years?.length) parts.push(`Years: ${filters.years.join(', ')}`);
  if (filters.initiatives?.length) parts.push(`Initiatives: ${filters.initiatives.join(', ')}`);
  if (filters.projects?.length) parts.push(`Projects: ${filters.projects.join(', ')}`);
  if (filters.subProjects?.length) parts.push(`Sub-projects: ${filters.subProjects.join(', ')}`);
  return parts.join(' · ') || 'No filters found';
}
