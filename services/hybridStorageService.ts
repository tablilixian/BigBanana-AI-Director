/**
 * HybridStorageService - 混合存储服务
 * 
 * 优先从 Supabase 读取（云端同步）
 * 回退到 IndexedDB（本地缓存）
 * 写入时双写（保持一致性）
 */

import { supabase } from '../src/api/supabase';
import { useAuthStore } from '../src/stores/authStore';
import type { ProjectState, AssetLibraryItem } from '../types';

// 复用现有的 IndexedDB 操作
import { 
  getAllProjectsMetadata, 
  createNewProjectState, 
  deleteProjectFromDB, 
  getAllAssetLibraryItems,
  deleteAssetFromLibrary,
  loadProjectFromDB,
  saveProjectToDB
} from './storageService';

// 本地存储的ID映射表（旧格式ID -> 云端UUID）
const ID_MAPPING_KEY = 'bigbanana_id_mapping';
const idMappingCache = new Map<string, string>();

// 初始化ID映射缓存
const initIdMapping = async () => {
  if (idMappingCache.size > 0) return;
  
  try {
    const mappingStr = localStorage.getItem(ID_MAPPING_KEY);
    if (mappingStr) {
      const mapping = JSON.parse(mappingStr) as Record<string, string>;
      Object.entries(mapping).forEach(([oldId, newId]) => {
        idMappingCache.set(oldId, newId);
      });
      console.log(`[HybridStorage] 加载ID映射: ${idMappingCache.size} 条`);
    }
  } catch (error) {
    console.error('[HybridStorage] 加载ID映射失败:', error);
  }
};

// 保存ID映射到本地存储
const saveIdMapping = () => {
  try {
    const mapping = Object.fromEntries(idMappingCache);
    localStorage.setItem(ID_MAPPING_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.error('[HybridStorage] 保存ID映射失败:', error);
  }
};

// 获取云端ID（旧ID -> 新UUID）
const getCloudId = (localId: string): string => {
  if (idMappingCache.has(localId)) {
    return idMappingCache.get(localId)!;
  }
  return localId;
};

// 设置ID映射
const setIdMapping = (localId: string, cloudId: string) => {
  if (localId !== cloudId) {
    idMappingCache.set(localId, cloudId);
    saveIdMapping();
    console.log(`[HybridStorage] 设置ID映射: ${localId} -> ${cloudId}`);
  }
};

export interface CloudProject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: string;
  settings: ProjectState | null;
  created_at: string;
  updated_at: string;
}

class HybridStorageService {
  private locks = new Map<string, { locked: boolean, timestamp: number, version: number }>();
  
  private isOnline(): boolean {
    return useAuthStore.getState().user !== null;
  }

  /**
   * 乐观锁：防止并发修改冲突
   * key: projectId, value: { locked: boolean, timestamp: number, version: number }
   */
  private acquireLock(projectId: string, currentVersion: number): boolean {
    const lock = this.locks.get(projectId);
    const now = Date.now();
    
    // 锁已过期（超过10秒）
    if (lock && now - lock.timestamp > 10000) {
      this.locks.delete(projectId);
      return true;
    }
    
    // 没有锁或版本号匹配，可以获取锁
    if (!lock || lock.version === currentVersion) {
      this.locks.set(projectId, {
        locked: true,
        timestamp: now,
        version: currentVersion
      });
      return true;
    }
    
    // 版本号不匹配，有其他操作在进行
    console.log(`[HybridStorage] 项目 ${projectId} 版本冲突，当前版本: ${currentVersion}, 锁版本: ${lock.version}`);
    return false;
  }
  
  /**
   * 释放乐观锁
   */
  private releaseLock(projectId: string): void {
    this.locks.delete(projectId);
  }
  
  /**
   * 递增版本号
   */
  private incrementVersion(project: ProjectState): ProjectState {
    return {
      ...project,
      version: (project.version || 0) + 1,
      lastModified: Date.now()
    };
  }

  /**
   * 获取所有项目（优先 Supabase，回退 IndexedDB）
   */
  async getAllProjects(): Promise<ProjectState[]> {
    const { user } = useAuthStore.getState();
    
    if (!user) {
      // 未登录，使用本地 IndexedDB
      console.log('[HybridStorage] 未登录，使用本地 IndexedDB');
      return getAllProjectsMetadata();
    }

    try {
      // 优先从 Supabase 获取
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, settings, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // 有云端数据，转换为 ProjectState
        const cloudProjects = data
          .filter(p => p.settings !== null)
          .map(p => this.cloudToProjectState(p as CloudProject));
        
        // 去重：确保项目ID唯一
        const uniqueProjects = Array.from(
          new Map(cloudProjects.map(p => [p.id, p])).values()
        );
        
        console.log(`[HybridStorage] 从云端获取 ${cloudProjects.length} 个项目，去重后 ${uniqueProjects.length} 个`);
        
        // 同步云端项目到本地（静默同步，不触发重复创建）
        this.syncCloudToLocal(uniqueProjects);
        
        return uniqueProjects;
      }

      // 云端没有数据，回退到本地
      console.log('[HybridStorage] 云端无数据，回退到本地 IndexedDB');
      return getAllProjectsMetadata();
    } catch (error) {
      console.error('[HybridStorage] 获取云端项目失败:', error);
      // 出错也回退到本地
      return getAllProjectsMetadata();
    }
  }

  /**
   * 静默同步云端项目到本地（避免重复创建）
   * 使用版本号判断是否需要更新
   */
  private async syncCloudToLocal(cloudProjects: ProjectState[]): Promise<void> {
    try {
      const localProjects = await getAllProjectsMetadata();
      const localIds = new Set(localProjects.map(p => p.id));
      const localTitles = new Map(localProjects.map(p => [p.title, p.id]));

      for (const cloudProject of cloudProjects) {
        const existingId = localIds.has(cloudProject.id) 
          ? cloudProject.id 
          : localTitles.get(cloudProject.title);

        if (!existingId) {
          await saveProjectToDB(cloudProject);
          console.log(`[HybridStorage] 静默同步项目到本地: ${cloudProject.title} (版本 ${cloudProject.version})`);
        } else {
          const localProject = await loadProjectFromDB(existingId);
          if (localProject) {
            if ((cloudProject.version || 0) > (localProject.version || 0)) {
              const updatedProject = { ...cloudProject, id: existingId };
              await saveProjectToDB(updatedProject);
              console.log(`[HybridStorage] 静默更新本地项目: ${cloudProject.title} (版本 ${localProject.version} -> ${cloudProject.version})`);
            } else if ((cloudProject.version || 0) === (localProject.version || 0) && cloudProject.lastModified > localProject.lastModified) {
              const updatedProject = { ...cloudProject, id: existingId };
              await saveProjectToDB(updatedProject);
              console.log(`[HybridStorage] 静默更新本地项目: ${cloudProject.title} (时间戳更新)`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[HybridStorage] 静默同步失败:', error);
    }
  }

  /**
   * 获取单个项目详情
   */
  async getProject(id: string): Promise<ProjectState | null> {
    const { user } = useAuthStore.getState();
    
    if (!user) {
      return loadProjectFromDB(id);
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data && data.settings) {
        return data.settings as ProjectState;
      }

      return loadProjectFromDB(id);
    } catch (error) {
      console.error('[HybridStorage] 获取云端项目详情失败:', error);
      return loadProjectFromDB(id);
    }
  }

  /**
   * 保存项目（双写：Supabase + IndexedDB）
   * 使用乐观锁和版本号防止并发冲突
   */
  async saveProject(project: ProjectState): Promise<void> {
    const { user } = useAuthStore.getState();

    // 递增版本号
    const updatedProject = this.incrementVersion(project);

    // 先保存到本地 IndexedDB（保证离线可用）
    await saveProjectToDB(updatedProject);

    // 如果已登录，同时保存到云端
    if (user) {
      try {
        // 初始化ID映射
        await initIdMapping();
        
        // 检查是否是旧格式项目ID（proj_xxx）
        const isOldFormat = project.id.startsWith('proj_');
        
        let cloudId = project.id;
        
        if (isOldFormat) {
          // 使用ID映射获取云端ID（而不是通过标题匹配）
          cloudId = getCloudId(project.id);
          
          // 如果映射表中没有，检查云端是否已有该项目的记录
          if (cloudId === project.id) {
            const { data: existing } = await supabase
              .from('projects')
              .select('id')
              .eq('user_id', user.id)
              .eq('title', project.title)
              .maybeSingle();
            
            if (existing) {
              // 云端已有该项目的记录，使用云端ID并保存映射
              cloudId = existing.id;
              setIdMapping(project.id, cloudId);
              console.log(`[HybridStorage] 旧格式项目 ${project.id} 已映射到云端ID ${cloudId}`);
            } else {
              // 云端没有该项目的记录，生成新的UUID并保存映射
              cloudId = crypto.randomUUID();
              setIdMapping(project.id, cloudId);
              console.log(`[HybridStorage] 旧格式项目 ${project.id} 已分配新云端ID ${cloudId}`);
            }
          }
        }
        
        // 获取乐观锁
        if (!this.acquireLock(cloudId, project.version || 0)) {
          console.log(`[HybridStorage] 项目 ${cloudId} 版本冲突，放弃保存`);
          return;
        }
        
        try {
          const { error } = await supabase
            .from('projects')
            .upsert({
              id: cloudId,
              user_id: user.id,
              title: project.title,
              description: project.rawScript?.substring(0, 500) || null,
              status: project.stage || 'script',
              settings: updatedProject,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (error) throw error;
          console.log(`[HybridStorage] 项目 ${project.id} (云端ID: ${cloudId}) 版本 ${updatedProject.version} 已同步到云端`);
        } finally {
          // 释放锁
          this.releaseLock(cloudId);
        }
      } catch (error) {
        console.error('[HybridStorage] 同步到云端失败:', error);
        // 本地保存成功，云端失败不影响
      }
    }
  }

  /**
   * 删除项目（双删）
   */
  async deleteProject(id: string): Promise<void> {
    const { user } = useAuthStore.getState();

    // 先删除本地
    await deleteProjectFromDB(id);

    // 如果已登录，同时删除云端
    if (user) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        console.log(`[HybridStorage] 项目 ${id} 已从云端删除`);
      } catch (error) {
        console.error('[HybridStorage] 从云端删除失败:', error);
      }
    }
  }

  /**
   * 登录后从云端同步数据到本地
   */
  async syncFromCloud(): Promise<number> {
    const { user } = useAuthStore.getState();
    
    if (!user) {
      console.log('[HybridStorage] 未登录，无法同步');
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, settings, updated_at')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log('[HybridStorage] 云端没有数据');
        return 0;
      }

      // 先获取所有本地项目，用于去重
      const localProjects = await getAllProjectsMetadata();
      const localIds = new Set(localProjects.map(p => p.id));
      const localTitles = new Map(localProjects.map(p => [p.title, p.id]));

      let syncedCount = 0;

      for (const cloudProject of data) {
        if (!cloudProject.settings) continue;

        // 检查是否已存在（通过 ID 或标题）
        const existingId = localIds.has(cloudProject.id) 
          ? cloudProject.id 
          : localTitles.get(cloudProject.settings.title);

        if (!existingId) {
          // 本地没有，直接保存
          await saveProjectToDB(cloudProject.settings);
          syncedCount++;
          console.log(`[HybridStorage] 新增项目: ${cloudProject.settings.title}`);
        } else {
          // 检查是否需要更新
          const localProject = await loadProjectFromDB(existingId);
          if (localProject && new Date(cloudProject.updated_at) > new Date(localProject.lastModified)) {
            // 云端更新，使用云端数据覆盖本地
            // 保持本地 ID 不变，避免重复创建
            const updatedProject = { ...cloudProject.settings, id: existingId };
            await saveProjectToDB(updatedProject);
            syncedCount++;
            console.log(`[HybridStorage] 更新项目: ${cloudProject.settings.title}`);
          }
        }
      }

      console.log(`[HybridStorage] 同步完成: ${syncedCount} 个项目`);
      return syncedCount;
    } catch (error) {
      console.error('[HybridStorage] 同步失败:', error);
      return 0;
    }
  }

  /**
   * 将本地所有数据导出到云端（手动触发）
   */
  async exportToCloud(): Promise<number> {
    const { user } = useAuthStore.getState();
    
    if (!user) {
      console.log('[HybridStorage] 未登录，无法导出');
      return 0;
    }

    const localProjects = await getAllProjectsMetadata();
    let exportedCount = 0;

    for (const project of localProjects) {
      const fullProject = await loadProjectFromDB(project.id);
      if (fullProject) {
        await this.saveProject(fullProject);
        exportedCount++;
      }
    }

    console.log(`[HybridStorage] 导出完成: ${exportedCount} 个项目`);
    return exportedCount;
  }

  /**
   * 转换云端数据到 ProjectState
   */
  private cloudToProjectState(cloud: CloudProject): ProjectState {
    if (cloud.settings) {
      return cloud.settings;
    }
    
    return {
      id: cloud.id,
      title: cloud.title,
      createdAt: new Date(cloud.created_at).getTime(),
      lastModified: new Date(cloud.updated_at).getTime(),
      version: 1,
      stage: 'script',
      rawScript: '',
      targetDuration: '60',
      language: '中文',
      visualStyle: 'anime',
      shotGenerationModel: '',
      scriptData: null,
      shots: [],
      isParsingScript: false,
      renderLogs: []
    };
  }
}

export const hybridStorage = new HybridStorageService();

// 导出便捷方法
export const getAllProjects = () => hybridStorage.getAllProjects();
export const getProject = (id: string) => hybridStorage.getProject(id);
export const saveProject = (project: ProjectState) => hybridStorage.saveProject(project);
export const deleteProject = (id: string) => hybridStorage.deleteProject(id);
export const syncFromCloud = () => hybridStorage.syncFromCloud();
export const exportToCloud = () => hybridStorage.exportToCloud();
