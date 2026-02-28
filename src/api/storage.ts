import { supabase } from './supabase'

type BucketName = 'avatars' | 'projects' | 'videos'

// =====================================================
// Storage API
// =====================================================

export const storageApi = {
  // 上传图片
  uploadImage: async (
    userId: string, 
    file: File, 
    options: {
      bucket?: BucketName
      path: string
    }
  ): Promise<string> => {
    const { bucket = 'projects', path } = options
    const filePath = `users/${userId}/${path}/${file.name}`
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type
      })
    
    if (error) throw error
    
    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return publicUrl
  },

  // 上传视频
  uploadVideo: async (
    userId: string, 
    file: File, 
    shotId: string
  ): Promise<string> => {
    const filePath = `users/${userId}/videos/${shotId}/${file.name}`
    
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type
      })
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)
    
    return publicUrl
  },

  // 上传头像
  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    const filePath = `users/${userId}/avatar.${file.name.split('.').pop()}`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type
      })
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    return publicUrl
  },

  // 删除文件
  delete: async (url: string, bucket: BucketName = 'projects'): Promise<void> => {
    // 从 URL 提取路径
    const path = url.split(`${bucket}/`)[1]
    if (!path) throw new Error('Invalid file URL')
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
  },

  // 获取公开 URL
  getPublicUrl: (path: string, bucket: BucketName = 'projects'): string => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return publicUrl
  },

  // 下载文件 (用于 AI 处理)
  download: async (url: string): Promise<Blob> => {
    const { data, error } = await supabase.storage
      .from('projects')
      .download(url)
    
    if (error) throw error
    return data
  }
}

// =====================================================
// 工具函数
// =====================================================

export const fileUtils = {
  // 将 File 转为 Base64
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  },

  // 验证文件类型
  validateImage: (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    return validTypes.includes(file.type)
  },

  validateVideo: (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/webm']
    return validTypes.includes(file.type)
  },

  // 验证文件大小 (返回 MB)
  validateSize: (file: File, maxMB: number = 10): boolean => {
    return file.size <= maxMB * 1024 * 1024
  }
}
