/**
 * 全局配置组件
 * 包含 API Key 配置和折扣广告
 */

import React, { useState, useEffect } from 'react';
import { Key, Loader2, CheckCircle, AlertCircle, ExternalLink, Gift, Sparkles, ChevronDown } from 'lucide-react';
import { getGlobalApiKey, setGlobalApiKey, getProviders, updateProvider, getProviderById } from '../../services/modelRegistry';
import { verifyApiKey } from '../../services/modelService';

interface GlobalSettingsProps {
  onRefresh: () => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ onRefresh }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('global');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

  const providers = getProviders();

  useEffect(() => {
    // 加载当前选择提供商的 API Key
    loadProviderApiKey(selectedProvider);
  }, [selectedProvider]);

  const loadProviderApiKey = (providerId: string) => {
    if (providerId === 'global') {
      setApiKey(getGlobalApiKey() || '');
      if (getGlobalApiKey()) {
        setVerifyStatus('success');
        setVerifyMessage('API Key 已配置');
      } else {
        setVerifyStatus('idle');
        setVerifyMessage('');
      }
    } else {
      const provider = getProviderById(providerId);
      setApiKey(provider?.apiKey || '');
      if (provider?.apiKey) {
        setVerifyStatus('success');
        setVerifyMessage('API Key 已配置');
      } else {
        setVerifyStatus('idle');
        setVerifyMessage('');
      }
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value);
    setVerifyStatus('idle');
    setVerifyMessage('');
  };

  const handleVerifyAndSave = async () => {
    if (!apiKey.trim()) {
      setVerifyStatus('error');
      setVerifyMessage('请输入 API Key');
      return;
    }

    setIsVerifying(true);
    setVerifyStatus('idle');
    setVerifyMessage('');

    try {
      // 根据选择的提供商确定验证的 baseUrl
      let baseUrl: string | undefined;
      if (selectedProvider === 'bigmodel') {
        baseUrl = 'https://open.bigmodel.cn';
      } else if (selectedProvider === 'global') {
        // 全局默认使用 antsk
        baseUrl = 'https://api.antsk.cn';
      } else {
        // 其他特定提供商
        const provider = getProviderById(selectedProvider);
        baseUrl = provider?.baseUrl;
      }

      const result = await verifyApiKey(apiKey.trim(), baseUrl);
      
      if (result.success) {
        setVerifyStatus('success');
        setVerifyMessage('验证成功！API Key 已保存');
        
        // 保存到对应的位置
        if (selectedProvider === 'global') {
          setGlobalApiKey(apiKey.trim());
        } else {
          updateProvider(selectedProvider, { apiKey: apiKey.trim() });
        }
        
        onRefresh();
      } else {
        setVerifyStatus('error');
        setVerifyMessage(result.message);
      }
    } catch (error: any) {
      setVerifyStatus('error');
      setVerifyMessage(error.message || '验证过程出错');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    setVerifyStatus('idle');
    setVerifyMessage('');
    
    if (selectedProvider === 'global') {
      setGlobalApiKey('');
    } else {
      updateProvider(selectedProvider, { apiKey: '' });
    }
    
    onRefresh();
  };

  const getProviderLabel = () => {
    switch (selectedProvider) {
      case 'bigmodel':
        return 'BigModel API Key';
      case 'global':
        return '全局 API Key';
      default:
        return 'API Key';
    }
  };

  const getProviderPlaceholder = () => {
    switch (selectedProvider) {
      case 'bigmodel':
        return '输入 BigModel API Key (open.bigmodel.cn)...';
      case 'global':
        return '输入全局 API Key...';
      default:
        return '输入 API Key...';
    }
  };

  return (
    <div className="space-y-6">
      {/* 折扣广告卡片 */}
      <div className="bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-[var(--text-primary)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--warning-text)]" />
              推荐使用 BigBanana API
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              支持 GPT-5.1、GPT-5.2、Claude Sonnet 4.5、Gemini-3、Veo 3.1、Sora-2、GLM-4、CogView、Vidu 等多种模型。
              稳定快速，价格优惠。本开源项目由 BigBanana API 提供支持。
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://api.antsk.cn" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-bold rounded-lg hover:bg-[var(--btn-primary-hover)] transition-colors inline-flex items-center gap-1.5"
              >
                立即购买
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://open.bigmodel.cn" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:bg-[var(--border-secondary)] transition-colors inline-flex items-center gap-1.5"
              >
                BigModel
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 提供商选择 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-[var(--accent-text)]" />
          <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
            选择 API 类型
          </label>
        </div>
        
        <div className="relative">
          <select
            value={selectedProvider}
            onChange={handleProviderChange}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] px-4 py-3 text-sm rounded-lg focus:border-[var(--accent)] focus:outline-none appearance-none cursor-pointer"
            disabled={isVerifying}
          >
            <option value="global">🌐 全局 API Key (默认)</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.id === 'bigmodel' ? '🔷' : '🔶'} {provider.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
        </div>
        
        <p className="text-[10px] text-[var(--text-muted)] mt-2">
          选择要配置的 API 类型。全局 API Key 用于所有模型，特定 API Key 仅用于对应提供商的模型。
        </p>
      </div>

      {/* API Key 配置 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-[var(--accent-text)]" />
          <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
            {getProviderLabel()}
          </label>
          {selectedProvider === 'bigmodel' && (
            <span className="text-[10px] text-[var(--accent)]">(open.bigmodel.cn)</span>
          )}
          {selectedProvider === 'global' && (
            <span className="text-[10px] text-[var(--accent)]">(api.antsk.cn)</span>
          )}
        </div>
        
        <div className="space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setVerifyStatus('idle');
              setVerifyMessage('');
            }}
            placeholder={getProviderPlaceholder()}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] px-4 py-3 text-sm rounded-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-hover)] transition-all font-mono placeholder:text-[var(--text-muted)]"
            disabled={isVerifying}
          />
          
          {/* 状态提示 */}
          {verifyMessage && (
            <div className={`flex items-center gap-2 text-xs ${
              verifyStatus === 'success' ? 'text-[var(--success-text)]' : 'text-[var(--error-text)]'
            }`}>
              {verifyStatus === 'success' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {verifyMessage}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {apiKey && (
              <button
                onClick={handleClearKey}
                className="flex-1 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition-colors rounded-lg border border-[var(--border-primary)]"
              >
                清除 Key
              </button>
            )}
            <button
              onClick={handleVerifyAndSave}
              disabled={isVerifying || !apiKey.trim()}
              className="flex-1 py-3 bg-[var(--accent)] text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  验证中...
                </>
              ) : (
                '验证并保存'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-[var(--bg-elevated)]/50 rounded-lg border border-[var(--border-primary)]">
        <h4 className="text-xs font-bold text-[var(--text-tertiary)] mb-2">配置说明</h4>
        <ul className="text-[10px] text-[var(--text-muted)] space-y-1 list-disc list-inside">
          <li><strong>全局 API Key</strong>：用于所有模型调用（默认 api.antsk.cn）</li>
          <li><strong>BigModel API Key</strong>：专门用于 GLM、CogView、Vidu 等模型（open.bigmodel.cn）</li>
          <li>可以为不同提供商配置不同的 API Key</li>
          <li>所有配置仅保存在本地浏览器，不会上传到服务器</li>
        </ul>
      </div>
    </div>
  );
};

export default GlobalSettings;
