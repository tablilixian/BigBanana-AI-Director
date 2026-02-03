import React, { useState, useEffect } from 'react';
import { Video, Loader2, Edit2 } from 'lucide-react';
import { Shot, AspectRatio, VideoDuration } from '../../types';
import { VideoSettingsPanel } from '../AspectRatioSelector';
import { 
  getDefaultAspectRatio, 
  getDefaultVideoDuration,
  getVideoModels,
  getActiveVideoModel,
} from '../../services/modelRegistry';
import { VideoModelDefinition } from '../../types/model';

interface VideoGeneratorProps {
  shot: Shot;
  hasStartFrame: boolean;
  hasEndFrame: boolean;
  onGenerate: (aspectRatio: AspectRatio, duration: VideoDuration, modelId: string) => void;
  onEditPrompt: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  shot,
  hasStartFrame,
  hasEndFrame,
  onGenerate,
  onEditPrompt
}) => {
  // 获取可用的视频模型
  const videoModels = getVideoModels().filter(m => m.isEnabled);
  const defaultModel = getActiveVideoModel();
  
  // 状态
  const [selectedModelId, setSelectedModelId] = useState<string>(
    shot.videoModel || defaultModel?.id || videoModels[0]?.id || 'sora-2'
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatio());
  const [duration, setDuration] = useState<VideoDuration>(() => getDefaultVideoDuration());
  
  // 当前选中的模型
  const selectedModel = videoModels.find(m => m.id === selectedModelId) as VideoModelDefinition | undefined;
  const modelType: 'sora' | 'veo' = selectedModel?.params.mode === 'async' ? 'sora' : 'veo';
  
  const isGenerating = shot.interval?.status === 'generating';
  const hasVideo = !!shot.interval?.videoUrl;

  // 当模型变化时，更新横竖屏和时长的默认值
  useEffect(() => {
    if (selectedModel) {
      // 如果当前选择的横竖屏不被新模型支持，切换到默认值
      if (!selectedModel.params.supportedAspectRatios.includes(aspectRatio)) {
        setAspectRatio(selectedModel.params.defaultAspectRatio);
      }
      // 如果当前选择的时长不被新模型支持，切换到默认值
      if (!selectedModel.params.supportedDurations.includes(duration)) {
        setDuration(selectedModel.params.defaultDuration);
      }
    }
  }, [selectedModelId]);

  const handleGenerate = () => {
    onGenerate(aspectRatio, duration, selectedModelId);
  };

  return (
    <div className="bg-[#141414] rounded-xl p-5 border border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Video className="w-3 h-3 text-indigo-500" />
          视频生成
          <button 
            onClick={onEditPrompt}
            className="p-1 text-yellow-400 hover:text-white transition-colors"
            title="预览/编辑视频提示词"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </h4>
        {shot.interval?.status === 'completed' && (
          <span className="text-[10px] text-green-500 font-mono flex items-center gap-1">
            ● READY
          </span>
        )}
      </div>
      
      {/* Model Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
          选择视频模型
        </label>
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          className="w-full bg-black text-white border border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-colors"
          disabled={isGenerating}
        >
          {videoModels.map((model) => {
            const vm = model as VideoModelDefinition;
            const modeLabel = vm.params.mode === 'async' ? '异步' : '同步';
            return (
              <option key={model.id} value={model.id}>
                {model.name} ({modeLabel})
              </option>
            );
          })}
        </select>
        {selectedModel && (
          <p className="text-[9px] text-zinc-600 font-mono">
            ✦ {selectedModel.name}: 
            {selectedModel.params.mode === 'async' 
              ? ` 支持 ${selectedModel.params.supportedAspectRatios.join('/')}，可选 ${selectedModel.params.supportedDurations.join('/')}秒`
              : ` 高速生成，支持 ${selectedModel.params.supportedAspectRatios.join('/')}`
            }
          </p>
        )}
      </div>

      {/* 视频设置：横竖屏 & 时长 */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
          视频设置
        </label>
        <VideoSettingsPanel
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          duration={duration}
          onDurationChange={setDuration}
          modelType={modelType}
          disabled={isGenerating}
          supportedAspectRatios={selectedModel?.params.supportedAspectRatios}
          supportedDurations={selectedModel?.params.supportedDurations}
        />
      </div>
      
      {/* Video Preview */}
      {hasVideo ? (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700 relative shadow-lg">
          <video src={shot.interval.videoUrl} controls className="w-full h-full" />
        </div>
      ) : (
        <div className="w-full aspect-video bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center">
          <span className="text-xs text-zinc-600 font-mono">PREVIEW AREA</span>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!hasStartFrame || isGenerating}
        className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
          hasVideo 
            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
        } ${(!hasStartFrame) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            生成视频中 ({aspectRatio}, {modelType === 'sora' ? `${duration}秒` : selectedModel?.name})...
          </>
        ) : (
          <>{hasVideo ? '重新生成视频' : '开始生成视频'}</>
        )}
      </button>
      
      {/* Status Messages */}
      {!hasEndFrame && (
        <div className="text-[9px] text-zinc-500 text-center font-mono">
          * 未检测到结束帧，将使用单图生成模式 (Image-to-Video)
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
