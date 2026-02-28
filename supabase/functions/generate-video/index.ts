import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface VideoRequest {
  shotId: string
  model: string
  prompt: string
  startFrameUrl?: string
  endFrameUrl?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get user's API key
    const { data: profile } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('id', user.id)
      .single()

    const userApiKey = profile?.api_key
    if (!userApiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured. Please add your API key in settings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request
    const { shotId, model, prompt, startFrameUrl, endFrameUrl }: VideoRequest = await req.json()

    if (!shotId || !model || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing required fields: shotId, model, prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get shot info for validation
    const { data: shot, error: shotError } = await supabase
      .from('shots')
      .select('*, scripts(projects(user_id))')
      .eq('id', shotId)
      .single()

    if (shotError || !shot) {
      return new Response(JSON.stringify({ error: 'Shot not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify ownership
    // @ts-ignore
    if (shot.scripts.projects.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call AI provider based on model
    let taskId = ''
    let provider = ''

    if (model.startsWith('cogvideox') || model.startsWith('vidu')) {
      // BigModel (智谱) API
      provider = 'bigmodel'
      
      const requestBody: Record<string, unknown> = {
        model,
        prompt,
      }

      // Add image URLs
      if (startFrameUrl) {
        requestBody.image_url = startFrameUrl
      }
      if (endFrameUrl) {
        requestBody.end_image_url = endFrameUrl
      }

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/videos/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.task_id) {
        taskId = result.task_id
      } else if (result.error) {
        throw new Error(result.error.message || 'BigModel API error')
      } else {
        throw new Error('Failed to get task ID from BigModel')
      }
    } else if (model.startsWith('sora') || model.startsWith('veo')) {
      // Add other providers here (OpenAI, Google, etc.)
      throw new Error(`Model ${model} not supported yet`)
    } else {
      throw new Error(`Unknown model: ${model}`)
    }

    // Save task to database
    const { data: task, error: taskError } = await supabase
      .from('video_tasks')
      .insert({
        shot_id: shotId,
        task_id: taskId,
        provider,
        model,
        status: 'processing'
      })
      .select()
      .single()

    if (taskError) {
      console.error('Failed to save task:', taskError)
    }

    // Update shot status
    await supabase
      .from('shots')
      .update({
        video_status: 'generating',
        video_task_id: taskId,
        prompt
      })
      .eq('id', shotId)

    return new Response(JSON.stringify({
      success: true,
      taskId,
      status: 'processing'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
