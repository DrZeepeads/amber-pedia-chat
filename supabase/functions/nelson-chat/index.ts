import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mode, conversationId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
    if (!MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating embedding for query:', message);
    
    // Generate embedding using Mistral
    const embeddingResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [message],
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Mistral embedding error:', errorText);
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Searching for relevant chunks...');

    // Search for relevant chunks using vector similarity
    const { data: chunks, error: searchError } = await supabase.rpc('match_nelson_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    console.log(`Found ${chunks?.length || 0} relevant chunks`);

    // Build context from retrieved chunks
    const context = chunks
      ?.map((chunk: any) => 
        `Chapter: ${chunk.chapter_title}\n${chunk.section_title ? `Section: ${chunk.section_title}\n` : ''}${chunk.chunk_text}`
      )
      .join('\n\n---\n\n') || '';

    // Build system prompt based on mode
    const systemPrompt = mode === 'clinical'
      ? `You are Nelson-GPT, a clinical decision support assistant for pediatricians. Provide practical, evidence-based clinical guidance from Nelson Textbook of Pediatrics. Focus on diagnostic approaches, treatment protocols, and clinical management. Always cite your sources with chapter and page numbers.`
      : `You are Nelson-GPT, an academic teaching assistant for pediatric medicine. Provide comprehensive, educational responses based on Nelson Textbook of Pediatrics. Explain concepts thoroughly with relevant pathophysiology, differential diagnoses, and clinical pearls. Always cite your sources with chapter and page numbers.`;

    const userPrompt = context
      ? `Context from Nelson Textbook of Pediatrics:\n\n${context}\n\nQuestion: ${message}\n\nProvide a comprehensive answer based on the context above. Include citations to specific chapters and sections.`
      : `Question: ${message}\n\nNote: No specific context was found in the Nelson Textbook. Please provide general pediatric guidance and mention that specific references should be consulted.`;

    console.log('Streaming response from Mistral...');

    // Stream response from Mistral
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mistral chat error:', errorText);
      throw new Error('Failed to get response from Mistral');
    }

    // Store conversation and message
    if (conversationId) {
      const { error: messageError } = await supabase
        .from('nelson_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
        });
      
      if (messageError) {
        console.error('Error storing message:', messageError);
      }
    }

    // Return streaming response with citations
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let assistantMessage = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    assistantMessage += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      content,
                      citations: chunks?.map((c: any) => ({
                        chapter_title: c.chapter_title,
                        section_title: c.section_title,
                        page_number: c.page_number,
                        similarity: c.similarity,
                      })),
                    })}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }
          
          // Store assistant message
          if (conversationId && assistantMessage) {
            await supabase
              .from('nelson_messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: assistantMessage,
                citations: chunks || [],
              });
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in nelson-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
