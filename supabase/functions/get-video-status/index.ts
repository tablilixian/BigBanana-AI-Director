import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get shot ID from query params
    const url = new URL(req.url)
    const shotId = url.searchParams.get('shotId')

    if (!shotId) {
      return new Response(JSON.stringify({ error: 'Missing shotId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get shot and verify ownership
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

    // @ts-ignore
    if (shot.scripts.projects.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get latest task for this shot
    const { data: task } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('shot_id', shotId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If task exists and is completed/failed, query AI provider for latest status
    let currentStatus = shot.video_status || 'pending'
    let videoUrl = shot.video_url

    if (task && task.status === 'processing' && task.task_id) {
      // Query provider for status
      try {
        let providerStatus = 'processing'
        
        if (task.provider === 'bigmodel') {
          // Get user's API key for querying
          const { data: profile } = await supabase
            .from('profiles')
            .select('api_key')
            .eq('id', user.id)
            .single()
          
          if (profile?.api_key) {
            const response = await fetch(
              `https://open.bigmodel.cn/api/paas/v4/async-result/${task.task_id}`,
              {
                headers: {
                  'Authorization': `Bearer ${profile.api_key}`
                }
              }
            )
            
            const result = await response.json()
            
            if (result.task_status === 'SUCCEEDED') {
              providerStatus = 'completed'
              videoUrl = result.video_result
              
              // Update database
              await supabase
                .from('video_tasks')
                .update({
                  status: 'completed',
                  result_url: videoUrl,
                  completed_at: new Date().toISOString()
                })
                .eq('id', task.id)
              
              await supabase
                .from('shots')
                .update({
                  video_status: 'completed',
                  video_url: videoUrl
                })
                .eq('id', shotId)
              
              currentStatus = 'completed'
            } else if (result.task_status === 'FAILED') {
              providerStatus = 'failed'
              
              await supabase
                .from('video_tasks')
                .update({
                  status: 'failed',
                  error_message: result.message || 'Generation failed',
                  completed_at: new Date().toISOString()
                })
                .eq('id', task.id)
              
              await supabase
                .from('shots')
                .update({
                  video_status: 'failed'
                })
                .eq('id', shotId)
              
              currentStatus = 'failed'
            }
          }
        }
      } catch (error) {
        console.error('Error querying provider status:', error)
      }
    }

    return new Response(JSON.stringify({
      shotId,
      status: currentStatus,
      videoUrl,
      taskId: task?.task_id
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
 