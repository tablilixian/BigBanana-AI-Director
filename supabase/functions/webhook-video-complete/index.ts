import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This function handles webhooks from AI providers
// Note: In production, you should verify the webhook signature

interface WebhookPayload {
  task_id: string
  status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING'
  video_result?: string
  error?: {
    message: string
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook payload
    const payload: WebhookPayload = await req.json()
    
    const { task_id, status, video_result, error } = payload

    if (!task_id) {
      return new Response(JSON.stringify({ error: 'Missing task_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Webhook received for task: ${task_id}, status: ${status}`)

    // Find the task in database
    const { data: task, error: taskError } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('task_id', task_id)
      .single()

    if (taskError || !task) {
      console.error('Task not found:', task_id)
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update task status
    const updates: Record<string, unknown> = {
      status: status === 'SUCCEEDED' ? 'completed' : status === 'FAILED' ? 'failed' : 'processing'
    }

    if (status === 'SUCCEEDED' && video_result) {
      updates.result_url = video_result
      updates.completed_at = new Date().toISOString()
    }

    if (status === 'FAILED' && error) {
      updates.error_message = error.message
      updates.completed_at = new Date().toISOString()
    }

    await supabase
      .from('video_tasks')
      .update(updates)
      .eq('task_id', task_id)

    // Update shot status
    const shotUpdates: Record<string, unknown> = {
      video_status: status === 'SUCCEEDED' ? 'completed' : status === 'FAILED' ? 'failed' : 'generating'
    }

    if (status === 'SUCCEEDED' && video_result) {
      shotUpdates.video_url = video_result
    }

    if (status === 'FAILED') {
      shotUpdates.metadata = { ...task.shot?.metadata, error: error?.message }
    }

    await supabase
      .from('shots')
      .update(shotUpdates)
      .eq('id', task.shot_id)

    console.log(`Task ${task_id} updated successfully`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
