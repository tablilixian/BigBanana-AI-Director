import { supabase } from './supabase'
import type { Project, Script, Shot, Character, Scene, VideoTask, Json } from '../types/supabase'

// =====================================================
// Projects API
// =====================================================

export const projectApi = {
  // 获取用户所有项目
  list: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 获取单个项目（含关联数据）
  get: async (id: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        scripts(
          *,
          shots(
            *,
            characters(*),
            scenes(*)
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 创建项目
  create: async (title: string, description?: string): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ title, description })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 更新项目
  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 删除项目
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// Scripts API
// =====================================================

export const scriptApi = {
  // 获取项目的所有剧本
  list: async (projectId: string): Promise<Script[]> => {
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // 获取单个剧本
  get: async (id: string): Promise<Script> => {
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 创建剧本
  create: async (projectId: string, content?: string): Promise<Script> => {
    const { data, error } = await supabase
      .from('scripts')
      .insert({ project_id: projectId, content })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 更新剧本
  update: async (id: string, updates: Partial<Script>): Promise<Script> => {
    const { data, error } = await supabase
      .from('scripts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 删除剧本
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// Shots API
// =====================================================

export const shotApi = {
  // 获取剧本的所有镜头
  list: async (scriptId: string): Promise<Shot[]> => {
    const { data, error } = await supabase
      .from('shots')
      .select('*')
      .eq('script_id', scriptId)
      .order('shot_number', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // 获取单个镜头
  get: async (id: string): Promise<Shot> => {
    const { data, error } = await supabase
      .from('shots')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 创建镜头
  create: async (scriptId: string, shotNumber: number, data?: Partial<Shot>): Promise<Shot> => {
    const { data: shot, error } = await supabase
      .from('shots')
      .insert({ 
        script_id: scriptId, 
        shot_number: shotNumber,
        ...data
      })
      .select()
      .single()
    
    if (error) throw error
    return shot
  },

  // 更新镜头
  update: async (id: string, updates: Partial<Shot>): Promise<Shot> => {
    const { data, error } = await supabase
      .from('shots')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 删除镜头
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('shots')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// Characters API
// =====================================================

export const characterApi = {
  list: async (projectId: string): Promise<Character[]> => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  create: async (projectId: string, name: string, description?: string): Promise<Character> => {
    const { data, error } = await supabase
      .from('characters')
      .insert({ project_id: projectId, name, description })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: Partial<Character>): Promise<Character> => {
    const { data, error } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// Scenes API
// =====================================================

export const sceneApi = {
  list: async (projectId: string): Promise<Scene[]> => {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  create: async (projectId: string, name: string, description?: string): Promise<Scene> => {
    const { data, error } = await supabase
      .from('scenes')
      .insert({ project_id: projectId, name, description })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: Partial<Scene>): Promise<Scene> => {
    const { data, error } = await supabase
      .from('scenes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('scenes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// =====================================================
// Video Tasks API
// =====================================================

export const videoTaskApi = {
  // 查询任务状态
  get: async (shotId: string): Promise<VideoTask | null> => {
    const { data, error } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('shot_id', shotId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  // 获取任务列表
  list: async (shotId: string): Promise<VideoTask[]> => {
    const { data, error } = await supabase
      .from('video_tasks')
      .select('*')
      .eq('shot_id', shotId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}
