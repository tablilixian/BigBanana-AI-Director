import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StageScript from './components/StageScript';
import StageAssets from './components/StageAssets';
import StageDirector from './components/StageDirector';
import StageExport from './components/StageExport';
import StagePrompts from './components/StagePrompts';
import Dashboard from './components/Dashboard';
import Onboarding, { shouldShowOnboarding, resetOnboarding } from './components/Onboarding';
import ModelConfigModal from './components/ModelConfig';
import { ProjectState } from './types';
import { Save, CheckCircle } from 'lucide-react';
import { saveProjectToDB } from './services/storageService';
import { setGlobalApiKey } from './services/aiService';
import { setLogCallback, clearLogCallback } from './services/renderLogService';
import { useAlert } from './components/GlobalAlert';
import { useAuthStore } from './src/stores/authStore';
import LoginPage from './src/pages/LoginPage';
import RegisterPage from './src/pages/RegisterPage';
import logoImg from './logo.png';
import './src/i18n';

type AuthView = 'login' | 'register' | 'app';

function App() {
  const { showAlert } = useAlert();
  const { user, loading: authLoading, initialize } = useAuthStore();
  const [authView, setAuthView] = useState<AuthView>('app');
  const [project, setProject] = useState<ProjectState | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const saveTimeoutRef = useRef<any>(null);
  const hideStatusTimeoutRef = useRef<any>(null);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user && authView === 'app') {
      setAuthView('login');
    }
  }, [user, authLoading, authView]);

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load API Key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('antsk_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setGlobalApiKey(storedKey);
    }
    if (shouldShowOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Handle onboarding quick start
  const handleOnboardingQuickStart = (option: 'script' | 'example') => {
    setShowOnboarding(false);
    console.log('Quick start option:', option);
  };

  // Show onboarding
  const handleShowOnboarding = () => {
    resetOnboarding();
    setShowOnboarding(true);
  };

  // Save API Key
  const handleSaveApiKey = (key: string) => {
    if (key) {
      setApiKey(key);
      setGlobalApiKey(key);
      localStorage.setItem('antsk_api_key', key);
    } else {
      setApiKey('');
      setGlobalApiKey('');
      localStorage.removeItem('antsk_api_key');
    }
  };

  // Show model config
  const handleShowModelConfig = () => {
    setShowModelConfig(true);
  };

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.name === 'ApiKeyError' || 
          event.error?.message?.includes('API Key missing') ||
          event.error?.message?.includes('AntSK API Key') ||
          event.error?.message?.includes('API Key 缺失')) {
        console.warn('检测到 API Key 错误，请配置 API Key...');
        setShowModelConfig(true);
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.name === 'ApiKeyError' ||
          event.reason?.message?.includes('API Key missing') ||
          event.reason?.message?.includes('AntSK API Key') ||
          event.reason?.message?.includes('API Key 缺失')) {
        console.warn('检测到 API Key 错误，请配置 API Key...');
        setShowModelConfig(true);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Setup render log callback
  useEffect(() => {
    if (project) {
      setLogCallback((log) => {
        setProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            renderLogs: [...(prev.renderLogs || []), log]
          };
        });
      });
    } else {
      clearLogCallback();
    }
    
    return () => clearLogCallback();
  }, [project?.id]);

  // Auto-save logic
  useEffect(() => {
    if (!project) return;

    setSaveStatus('unsaved');
    setShowSaveStatus(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveProjectToDB(project);
        setSaveStatus('saved');
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [project]);

  // Auto-hide save status
  useEffect(() => {
    if (saveStatus === 'saved') {
      if (hideStatusTimeoutRef.current) clearTimeout(hideStatusTimeoutRef.current);
      hideStatusTimeoutRef.current = setTimeout(() => {
        setShowSaveStatus(false);
      }, 2000);
    } else if (saveStatus === 'saving') {
      setShowSaveStatus(true);
      if (hideStatusTimeoutRef.current) clearTimeout(hideStatusTimeoutRef.current);
    }

    return () => {
      if (hideStatusTimeoutRef.current) clearTimeout(hideStatusTimeoutRef.current);
    };
  }, [saveStatus]);

  // Update project
  const updateProject = (updates: Partial<ProjectState> | ((prev: ProjectState) => ProjectState)) => {
    if (!project) return;
    setProject(prev => {
      if (!prev) return null;
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  };

  // Set stage
  const setStage = (stage: 'script' | 'assets' | 'director' | 'export' | 'prompts') => {
    if (isGenerating) {
      showAlert('当前正在执行生成任务（剧本分镜 / 首帧 / 视频等），切换页面会导致生成数据丢失，且已扣除的费用无法恢复。\n\n确定要离开当前页面吗？', {
        title: '生成任务进行中',
        type: 'warning',
        showCancel: true,
        confirmText: '确定离开',
        cancelText: '继续等待',
        onConfirm: () => {
          setIsGenerating(false);
          updateProject({ stage });
        }
      });
      return;
    }
    updateProject({ stage });
  };

  // Handle open project
  const handleOpenProject = (proj: ProjectState) => {
    setProject(proj);
  };

  // Handle exit project
  const handleExitProject = async () => {
    if (isGenerating) {
      showAlert('当前正在执行生成任务（剧本分镜 / 首帧 / 视频等），退出项目会导致生成数据丢失，且已扣除的费用无法恢复。\n\n确定要退出吗？', {
        title: '生成任务进行中',
        type: 'warning',
        showCancel: true,
        confirmText: '确定退出',
        cancelText: '继续等待',
        onConfirm: async () => {
          setIsGenerating(false);
          if (project) {
            await saveProjectToDB(project);
          }
          setProject(null);
        }
      });
      return;
    }
    if (project) {
        await saveProjectToDB(project);
    }
    setProject(null);
  };

  // Render stage
  const renderStage = () => {
    if (!project) return null;
    switch (project.stage) {
      case 'script':
        return (
          <StageScript
            project={project}
            updateProject={updateProject}
            onShowModelConfig={handleShowModelConfig}
            onGeneratingChange={setIsGenerating}
          />
        );
      case 'assets':
        return <StageAssets project={project} updateProject={updateProject} onGeneratingChange={setIsGenerating} />;
      case 'director':
        return <StageDirector project={project} updateProject={updateProject} onGeneratingChange={setIsGenerating} />;
      case 'export':
        return <StageExport project={project} />;
      case 'prompts':
        return <StagePrompts project={project} updateProject={updateProject} />;
      default:
        return <div className="text-[var(--text-primary)]">未知阶段</div>;
    }
  };

  // Auth handlers
  const handleLoginSuccess = () => {
    setAuthView('app');
  };

  const handleSwitchToRegister = () => {
    setAuthView('register');
  };

  const handleSwitchToLogin = () => {
    setAuthView('login');
  };

  // Show loading while checking auth
  if (authLoading && authView !== 'app') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  // Show login page
  if (authView === 'login') {
    return (
      <LoginPage
        onSwitchToRegister={handleSwitchToRegister}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Show register page
  if (authView === 'register') {
    return (
      <RegisterPage
        onSwitchToLogin={handleSwitchToLogin}
        onRegisterSuccess={handleLoginSuccess}
      />
    );
  }

  // Mobile warning
  if (isMobile) {
    return (
      <div className="h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <img src={logoImg} alt="Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">BigBanana AI Director</h1>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-8">
            <p className="text-[var(--text-tertiary)] text-base leading-relaxed mb-4">
              为了获得最佳体验，请使用 PC 端浏览器访问。
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              本应用需要较大的屏幕空间和桌面级浏览器环境才能正常运行。
            </p>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            <a href="https://director.tree456.com/" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-text)] transition-colors">
              访问产品首页了解更多
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  if (!project) {
    return (
       <>
         <Dashboard 
           onOpenProject={handleOpenProject} 
           onShowOnboarding={handleShowOnboarding}
           onShowModelConfig={handleShowModelConfig}
         />
         {showOnboarding && (
           <Onboarding 
             onComplete={handleOnboardingComplete}
             onQuickStart={handleOnboardingQuickStart}
             currentApiKey={apiKey}
             onSaveApiKey={handleSaveApiKey}
           />
         )}
         <ModelConfigModal
           isOpen={showModelConfig}
           onClose={() => setShowModelConfig(false)}
         />
       </>
    );
  }

  // Workspace view
  return (
    <div className="flex h-screen bg-[var(--bg-secondary)] font-sans text-[var(--text-secondary)] selection:bg-[var(--accent-bg)]">
      <Sidebar 
        currentStage={project.stage} 
        setStage={setStage} 
        onExit={handleExitProject} 
        projectName={project.title}
        onShowOnboarding={handleShowOnboarding}
        onShowModelConfig={() => setShowModelConfig(true)}
        isNavigationLocked={isGenerating}
      />
      
      <main className="ml-72 flex-1 h-screen overflow-hidden relative">
        {renderStage()}
        
        {showSaveStatus && (
          <div className="absolute top-4 right-6 pointer-events-none flex items-center gap-2 text-xs font-mono text-[var(--text-tertiary)] bg-[var(--overlay-medium)] px-2 py-1 rounded-full backdrop-blur-sm z-50 animate-in fade-in slide-in-from-top-2 duration-200">
             {saveStatus === 'saving' ? (
               <>
                 <Save className="w-3 h-3 animate-pulse" />
                 保存中...
               </>
             ) : (
               <>
                 <CheckCircle className="w-3 h-3 text-[var(--success)]" />
                 已保存
               </>
             )}
          </div>
        )}
      </main>

      {showOnboarding && (
        <Onboarding 
          onComplete={handleOnboardingComplete}
          onQuickStart={handleOnboardingQuickStart}
          currentApiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
        />
      )}

      <ModelConfigModal
        isOpen={showModelConfig}
        onClose={() => setShowModelConfig(false)}
      />
    </div>
  );
}

export default App;
