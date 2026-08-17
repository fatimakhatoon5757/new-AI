return $input.all().map(item => {
  // Grab the raw JSON string inside content.parts[0].text
  const rawText = item.json?.content?.parts?.[0]?.text || '';
  
  let parsedContent = {};
  if (rawText) {
    try {
      // Clean leading/trailing markdown code fence backticks if present
      const cleanText = rawText.replace(/^```json\s*|^```\s*|```$/g, '').trim();
      parsedContent = JSON.parse(cleanText);
    } catch (error) {
      console.error('Failed to parse inner JSON string:', error);
    }
  }

  return {
    json: {
      candidate_name: parsedContent.candidate_name || null,
      total_experience_years: parsedContent.total_experience_years ? parseFloat(parsedContent.total_experience_years) : null,
      tech_stack: parsedContent.tech_stack || [],
      match_score: parsedContent.match_score ? parseInt(parsedContent.match_score, 10) : null,
      analysis_summary: parsedContent.analysis_summary || null,
      thoughtSignature: item.json?.content?.parts?.[0]?.thoughtSignature || null,
      role: item.json?.content?.role || null,
      finishReason: item.json?.finishReason || null,
      index: item.json?.index ?? null
    }
  };
});




