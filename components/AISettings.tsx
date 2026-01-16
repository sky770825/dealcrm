// AI 模型設定組件
import React, { useState, useEffect } from 'react';
import { getAvailableModels, setApiKey, getApiKeys } from '../services/aiService';
import { sanitizeInput } from '../utils/security';

interface ModelConfig {
  name: string;
  provider: string;
  model: string;
  priority: number;
  enabled: boolean;
  apiKey?: string;
}

const AISettings: React.FC = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [apiKeys, setApiKeysState] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const available = await getAvailableModels();
      const keys = await getApiKeys();
      setModels(available);
      setApiKeysState(keys);
    } catch (error) {
      console.error('載入模型失敗:', error);
    }
  };

  const handleApiKeyChange = async (provider: string, key: string) => {
    // 清理輸入，防止注入攻擊
    const sanitizedKey = sanitizeInput(key);
    const newKeys = { ...apiKeys, [provider]: sanitizedKey };
    setApiKeysState(newKeys);
    await setApiKey(provider, sanitizedKey);
    loadModels();
  };

  const testModel = async (provider: string) => {
    setTesting({ ...testing, [provider]: true });
    setTestResults({ ...testResults, [provider]: '測試中...' });

    try {
      const { callAI } = await import('../services/aiService');
      const model = models.find(m => m.provider === provider);
      if (!model) {
        setTestResults({ ...testResults, [provider]: '❌ 找不到模型配置' });
        return;
      }
      
      // 使用安全的輸入
      const testPrompt = sanitizeInput('你好，請簡單自我介紹');
      const response = await callAI(testPrompt, '你是一個友善的助手', model);
      
      if (response.success) {
        const safeText = sanitizeInput(response.text.substring(0, 50));
        setTestResults({ ...testResults, [provider]: `✅ 成功：${safeText}...` });
      } else {
        setTestResults({ ...testResults, [provider]: `❌ 失敗：${response.error || '未知錯誤'}` });
      }
    } catch (error: any) {
      const safeError = sanitizeInput(error.message || '連線失敗');
      setTestResults({ ...testResults, [provider]: `❌ 錯誤：${safeError}` });
    } finally {
      setTesting({ ...testing, [provider]: false });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">AI 模型設定</h2>
        <p className="text-sm text-slate-600">
          配置多個免費 AI 模型，系統會自動選擇最佳可用的模型。支援自動切換和組合。
        </p>
      </div>

      <div className="space-y-4">
        {models.map((model) => (
          <div key={model.provider} className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{model.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">模型：{model.model}</p>
                <p className="text-xs text-slate-500">優先級：{model.priority}</p>
              </div>
              <div className={`px-3 py-1 rounded text-xs font-medium ${
                model.enabled ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'
              }`}>
                {model.enabled ? '✓ 已啟用' : '✗ 未啟用'}
              </div>
            </div>

            {model.provider !== 'huggingface' && model.provider !== 'ollama' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                  API Key {model.provider === 'groq' && '(免費申請：https://console.groq.com)'}
                  {model.provider === 'together' && '(免費申請：https://api.together.xyz)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeys[model.provider] || ''}
                    onChange={(e) => handleApiKeyChange(model.provider, e.target.value)}
                    placeholder={`輸入 ${model.name} API Key`}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => testModel(model.provider)}
                    disabled={testing[model.provider] || !apiKeys[model.provider]}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {testing[model.provider] ? '測試中...' : '測試連接'}
                  </button>
                </div>
                {testResults[model.provider] && (
                  <p className="text-xs text-slate-600">{testResults[model.provider]}</p>
                )}
              </div>
            )}

            {model.provider === 'huggingface' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  ✅ <strong>完全免費，無需 API Key</strong>！Hugging Face 提供免費 Inference API，支援多種開源模型。
                  首次使用時模型可能需要載入（約 10-30 秒），之後即可正常使用。
                  如需更高配額，可申請 API Key：https://huggingface.co/settings/tokens
                </p>
              </div>
            )}

            {model.provider === 'ollama' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-700">
                  💡 Ollama 是本地模型，需要先安裝 Ollama：https://ollama.ai
                  安裝後運行：ollama pull llama2
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2 text-sm">使用說明</h4>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li><strong>Hugging Face 模型完全免費，無需 API Key</strong> - 系統已預設多個模型，會自動選擇最佳可用</li>
          <li>系統會按照優先級自動選擇可用的模型（優先使用免費模型）</li>
          <li>如果第一個模型失敗，會自動切換到下一個（最多嘗試 3 個）</li>
          <li>Hugging Face 模型首次使用時可能需要載入時間（10-30 秒），請耐心等待</li>
          <li>可選配置 Groq 或 Together AI 的 API Key 以獲得更好的性能和穩定性</li>
        </ul>
      </div>
    </div>
  );
};

export default AISettings;
