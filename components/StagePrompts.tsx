import React, { useState } from 'react';
import { ProjectState, Character, CharacterVariation, Scene, Shot, Keyframe } from '../types';
import { User, MapPin, Film, Save, X, Search, ChevronDown, ChevronRight } from 'lucide-react';

interface StagePromptsProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState> | ((prev: ProjectState) => ProjectState)) => void;
}

type PromptCategory = 'characters' | 'scenes' | 'keyframes' | 'all';

const StagePrompts: React.FC<StagePromptsProps> = ({ project, updateProject }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<PromptCategory>('all');
  const [editingPrompt, setEditingPrompt] = useState<{
    type: 'character' | 'character-variation' | 'scene' | 'keyframe' | 'video';
    id: string;
    variationId?: string;
    shotId?: string;
    value: string;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['characters', 'scenes', 'shots']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleStartEdit = (
    type: 'character' | 'character-variation' | 'scene' | 'keyframe' | 'video',
    id: string,
    currentValue: string,
    variationId?: string,
    shotId?: string
  ) => {
    setEditingPrompt({ type, id, value: currentValue, variationId, shotId });
  };

  const handleSaveEdit = () => {
    if (!editingPrompt) return;

    updateProject((prev: ProjectState) => {
      const newProject = { ...prev };

      if (editingPrompt.type === 'character') {
        const scriptData = newProject.scriptData;
        if (scriptData) {
          scriptData.characters = scriptData.characters.map(char =>
            char.id === editingPrompt.id
              ? { ...char, visualPrompt: editingPrompt.value }
              : char
          );
        }
      } else if (editingPrompt.type === 'character-variation') {
        const scriptData = newProject.scriptData;
        if (scriptData) {
          scriptData.characters = scriptData.characters.map(char => {
            if (char.id === editingPrompt.id) {
              return {
                ...char,
                variations: char.variations.map(variation =>
                  variation.id === editingPrompt.variationId
                    ? { ...variation, visualPrompt: editingPrompt.value }
                    : variation
                )
              };
            }
            return char;
          });
        }
      } else if (editingPrompt.type === 'scene') {
        const scriptData = newProject.scriptData;
        if (scriptData) {
          scriptData.scenes = scriptData.scenes.map(scene =>
            scene.id === editingPrompt.id
              ? { ...scene, visualPrompt: editingPrompt.value }
              : scene
          );
        }
      } else if (editingPrompt.type === 'keyframe') {
        newProject.shots = newProject.shots.map(shot => {
          if (shot.id === editingPrompt.shotId) {
            return {
              ...shot,
              keyframes: shot.keyframes.map(kf =>
                kf.id === editingPrompt.id
                  ? { ...kf, visualPrompt: editingPrompt.value }
                  : kf
              )
            };
          }
          return shot;
        });
      } else if (editingPrompt.type === 'video') {
        newProject.shots = newProject.shots.map(shot => {
          if (shot.id === editingPrompt.shotId) {
            return {
              ...shot,
              interval: shot.interval ? { ...shot.interval, videoPrompt: editingPrompt.value } : undefined
            };
          }
          return shot;
        });
      }

      return newProject;
    });

    setEditingPrompt(null);
  };

  const handleCancelEdit = () => {
    setEditingPrompt(null);
  };

  const filterBySearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const renderCharacters = () => {
    if (!project.scriptData || category !== 'all' && category !== 'characters') return null;
    
    const characters = project.scriptData.characters || [];
    const filteredCharacters = characters.filter(char => 
      filterBySearch(char.name) || 
      filterBySearch(char.visualPrompt || '') ||
      char.variations.some(v => filterBySearch(v.name) || filterBySearch(v.visualPrompt))
    );

    if (filteredCharacters.length === 0) return null;

    return (
      <div className="mb-8">
        <button
          onClick={() => toggleSection('characters')}
          className="flex items-center gap-2 mb-4 text-white hover:text-indigo-400 transition-colors"
        >
          {expandedSections.has('characters') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <User className="w-5 h-5" />
          <h2 className="text-xl font-bold">角色 ({filteredCharacters.length})</h2>
        </button>

        {expandedSections.has('characters') && (
          <div className="space-y-4 ml-7">
            {filteredCharacters.map(char => (
              <div key={char.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{char.name}</h3>
                    <p className="text-sm text-zinc-500">
                      {char.gender} · {char.age} · {char.personality}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartEdit('character', char.id, char.visualPrompt || '')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors"
                  >
                    编辑
                  </button>
                </div>

                {editingPrompt?.type === 'character' && editingPrompt.id === char.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingPrompt.value}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, value: e.target.value })}
                      className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-indigo-500 focus:outline-none min-h-[100px] text-sm font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 bg-zinc-950/50 p-3 rounded border border-zinc-800 font-mono">
                    {char.visualPrompt || '未设置提示词'}
                  </p>
                )}

                {/* Character Variations */}
                {char.variations && char.variations.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-zinc-800 space-y-3">
                    <h4 className="text-xs text-zinc-500 uppercase tracking-wider font-bold">角色变体</h4>
                    {char.variations.map(variation => (
                      <div key={variation.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-zinc-300">{variation.name}</span>
                          <button
                            onClick={() => handleStartEdit('character-variation', char.id, variation.visualPrompt, variation.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-0.5 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors"
                          >
                            编辑
                          </button>
                        </div>

                        {editingPrompt?.type === 'character-variation' && 
                         editingPrompt.id === char.id && 
                         editingPrompt.variationId === variation.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingPrompt.value}
                              onChange={(e) => setEditingPrompt({ ...editingPrompt, value: e.target.value })}
                              className="w-full bg-zinc-800 text-white p-2 rounded border border-zinc-700 focus:border-indigo-500 focus:outline-none min-h-[80px] text-xs font-mono"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1 px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded transition-colors"
                              >
                                <Save className="w-3 h-3" />
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                              >
                                <X className="w-3 h-3" />
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 font-mono">
                            {variation.visualPrompt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderScenes = () => {
    if (!project.scriptData || category !== 'all' && category !== 'scenes') return null;
    
    const scenes = project.scriptData.scenes || [];
    const filteredScenes = scenes.filter(scene => 
      filterBySearch(scene.location) || 
      filterBySearch(scene.visualPrompt || '')
    );

    if (filteredScenes.length === 0) return null;

    return (
      <div className="mb-8">
        <button
          onClick={() => toggleSection('scenes')}
          className="flex items-center gap-2 mb-4 text-white hover:text-indigo-400 transition-colors"
        >
          {expandedSections.has('scenes') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <MapPin className="w-5 h-5" />
          <h2 className="text-xl font-bold">场景 ({filteredScenes.length})</h2>
        </button>

        {expandedSections.has('scenes') && (
          <div className="space-y-4 ml-7">
            {filteredScenes.map(scene => (
              <div key={scene.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{scene.location}</h3>
                    <p className="text-sm text-zinc-500">
                      {scene.time} · {scene.atmosphere}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartEdit('scene', scene.id, scene.visualPrompt || '')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors"
                  >
                    编辑
                  </button>
                </div>

                {editingPrompt?.type === 'scene' && editingPrompt.id === scene.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingPrompt.value}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, value: e.target.value })}
                      className="w-full bg-zinc-800 text-white p-3 rounded border border-zinc-700 focus:border-indigo-500 focus:outline-none min-h-[100px] text-sm font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 bg-zinc-950/50 p-3 rounded border border-zinc-800 font-mono">
                    {scene.visualPrompt || '未设置提示词'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderKeyframes = () => {
    if (!project.shots || category !== 'all' && category !== 'keyframes') return null;
    
    const shots = project.shots.filter(shot => {
      const hasMatchingKeyframe = shot.keyframes.some(kf => 
        filterBySearch(kf.visualPrompt) || 
        filterBySearch(shot.actionSummary)
      );
      return hasMatchingKeyframe;
    });

    if (shots.length === 0) return null;

    return (
      <div className="mb-8">
        <button
          onClick={() => toggleSection('shots')}
          className="flex items-center gap-2 mb-4 text-white hover:text-indigo-400 transition-colors"
        >
          {expandedSections.has('shots') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <Film className="w-5 h-5" />
          <h2 className="text-xl font-bold">分镜关键帧 ({shots.length} 个镜头)</h2>
        </button>

        {expandedSections.has('shots') && (
          <div className="space-y-6 ml-7">
            {shots.map((shot, shotIndex) => {
              const scene = project.scriptData?.scenes.find(s => s.id === shot.sceneId);
              return (
                <div key={shot.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        镜头 {shotIndex + 1}
                      </span>
                      {scene && (
                        <span className="text-xs text-zinc-500">
                          {scene.location}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400">{shot.actionSummary}</p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {shot.cameraMovement} · {shot.shotSize || '标准镜头'}
                    </p>
                  </div>

                  <div className="space-y-3 pl-4 border-l-2 border-indigo-500/30">
                    {shot.keyframes.map((keyframe, kfIndex) => (
                      <div key={keyframe.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              keyframe.type === 'start' 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}>
                              {keyframe.type === 'start' ? '起始帧' : '结束帧'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              keyframe.status === 'completed' ? 'text-green-400' :
                              keyframe.status === 'generating' ? 'text-yellow-400' :
                              keyframe.status === 'failed' ? 'text-red-400' :
                              'text-zinc-500'
                            }`}>
                              {keyframe.status === 'completed' ? '已生成' :
                               keyframe.status === 'generating' ? '生成中' :
                               keyframe.status === 'failed' ? '失败' :
                               '待生成'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleStartEdit('keyframe', keyframe.id, keyframe.visualPrompt, undefined, shot.id)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-0.5 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors"
                          >
                            编辑
                          </button>
                        </div>

                        {editingPrompt?.type === 'keyframe' && 
                         editingPrompt.id === keyframe.id && 
                         editingPrompt.shotId === shot.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingPrompt.value}
                              onChange={(e) => setEditingPrompt({ ...editingPrompt, value: e.target.value })}
                              className="w-full bg-zinc-800 text-white p-2 rounded border border-zinc-700 focus:border-indigo-500 focus:outline-none min-h-[80px] text-xs font-mono"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-1 px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs rounded transition-colors"
                              >
                                <Save className="w-3 h-3" />
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                              >
                                <X className="w-3 h-3" />
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                            {keyframe.visualPrompt}
                          </p>
                        )}

                        {keyframe.imageUrl && (
                          <div className="mt-2 rounded overflow-hidden border border-zinc-800">
                            <img 
                              src={keyframe.imageUrl} 
                              alt={`关键帧 ${kfIndex + 1}`}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Video Prompt Section */}
                    {shot.interval && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/50">
                        <div className="bg-purple-950/30 border border-purple-500/30 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                视频生成提示词
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                shot.interval.status === 'completed' ? 'text-green-400 bg-green-500/10' :
                                shot.interval.status === 'generating' ? 'text-yellow-400 bg-yellow-500/10' :
                                shot.interval.status === 'failed' ? 'text-red-400 bg-red-500/10' :
                                'text-zinc-500'
                              }`}>
                                {shot.interval.status === 'completed' ? '✓ 已生成' :
                                 shot.interval.status === 'generating' ? '生成中' :
                                 shot.interval.status === 'failed' ? '失败' :
                                 '待生成'}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                // 如果没有保存的提示词，使用动作摘要作为默认值
                                const defaultPrompt = shot.interval!.videoPrompt || 
                                  `${shot.actionSummary}\n\n镜头运动：${shot.cameraMovement}\n模型：${shot.videoModel || 'sora-2'}`;
                                handleStartEdit('video', shot.interval!.id, defaultPrompt, undefined, shot.id);
                              }}
                              className="text-xs text-purple-400 hover:text-purple-300 px-2 py-0.5 border border-purple-500/30 rounded hover:bg-purple-500/10 transition-colors"
                            >
                              编辑
                            </button>
                          </div>

                          {editingPrompt?.type === 'video' && 
                           editingPrompt.shotId === shot.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingPrompt.value}
                                onChange={(e) => setEditingPrompt({ ...editingPrompt, value: e.target.value })}
                                className="w-full bg-zinc-800 text-white p-2 rounded border border-zinc-700 focus:border-purple-500 focus:outline-none min-h-[120px] text-xs font-mono"
                                placeholder="视频生成提示词"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="flex items-center gap-1 px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  保存
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                                {shot.interval.videoPrompt || (
                                  <span className="text-zinc-500">
                                    {`${shot.actionSummary}\n\n镜头运动：${shot.cameraMovement}\n使用模型：${shot.videoModel || 'sora-2'}`}
                                    <span className="block mt-1 text-yellow-600/70">
                                      ⚠ 此视频生成时未保存提示词，以上为推测内容
                                    </span>
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0A0A0A] via-[#121212] to-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-[#050505]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">提示词管理</h1>
              <p className="text-sm text-zinc-500">查看和编辑所有生成任务的提示词和变量</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索提示词、角色、场景..."
                className="w-full bg-zinc-900 border border-zinc-800 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PromptCategory)}
              className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">全部</option>
              <option value="characters">角色</option>
              <option value="scenes">场景</option>
              <option value="keyframes">关键帧</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {renderCharacters()}
          {renderScenes()}
          {renderKeyframes()}

          {/* Empty State */}
          {!project.scriptData && !project.shots.length && (
            <div className="text-center py-16">
              <div className="text-zinc-600 mb-4">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">暂无提示词数据</p>
                <p className="text-sm mt-2">请先在剧本阶段生成角色和场景，或在导演工作台生成分镜</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StagePrompts;
