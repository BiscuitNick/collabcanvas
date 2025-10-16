import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { callAITest, type AIProvider, type AIResponse, type GPT5Model } from '../lib/aiApi';


const AITestPage: React.FC = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestStartTime, setRequestStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
  const [model, setModel] = useState<GPT5Model>('gpt-5-mini');

  // Update current time while loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && requestStartTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - requestStartTime);
      }, 100); // Update every 100ms
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, requestStartTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);
    setCurrentTime(0);
    const startTime = Date.now();
    setRequestStartTime(startTime);

    try {
      const result = await callAITest(prompt, aiProvider, model);
      
      // Add response time to debug info
      const responseTime = Date.now() - startTime;
      if (result.debug) {
        result.debug.response_time_ms = responseTime;
      }
      
      setResponse(result);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
      setRequestStartTime(null);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setResponse(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to access the AI test page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Canvas Agent</h1>
            <p className="text-gray-600">
              Convert natural language instructions into canvas commands. Create shapes, layouts, and complex designs through text.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Provider Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                AI Provider:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="aiProvider"
                    value="openai"
                    checked={aiProvider === 'openai'}
                    onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">OpenAI (GPT-5 Mini)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="aiProvider"
                    value="replicate"
                    checked={aiProvider === 'replicate'}
                    onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">Replicate (GPT-5 Nano)</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Choose between OpenAI's direct API or Replicate's hosted model
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPT-5 Model:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as GPT5Model)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="gpt-5">GPT-5 (Most Capable)</option>
                <option value="gpt-5-mini">GPT-5 Mini (Balanced)</option>
                <option value="gpt-5-nano">GPT-5 Nano (Fastest)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose the GPT-5 model variant for different speed/capability tradeoffs
              </p>
            </div>

            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Describe what you want to create:
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Create a red rectangle 100px x 200px at position 30, 30..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating Commands...' : 'Generate Canvas Commands'}
              </button>
              
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700">Generating canvas commands...</span>
                </div>
                <div className="flex items-center text-blue-600">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{currentTime}ms</span>
                </div>
              </div>
            </div>
          )}

          {response && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">AI Canvas Agent Response:</h3>
              <div className={`p-4 rounded-md border ${
                response.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {response.success ? (
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-green-800">Success</span>
                    </div>
                    <p className="text-green-700 mb-4">{response.data?.message}</p>
                    
                    {/* Total Request Time */}
                    {response.debug?.response_time_ms && (
                      <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">
                            Total Request Time: {response.debug.response_time_ms}ms
                          </span>
                        </div>
                      </div>
                    )}
                    
        {response.data?.commands && response.data.commands.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Canvas Commands:</h4>
            <div className="space-y-2">
              {response.data.commands.map((command, index) => (
                <div key={index} className="bg-white p-3 rounded border text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-blue-600">{command.action}</span>
                    {command.type && (
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{command.type}</span>
                    )}
                  </div>
                  <div className="text-gray-600 space-y-1">
                    {command.x !== undefined && command.y !== undefined && (
                      <div>Position: ({command.x}, {command.y})</div>
                    )}
                    {command.width !== undefined && command.height !== undefined && (
                      <div>Size: {command.width} × {command.height}px</div>
                    )}
                    {command.fill && (
                      <div className="flex items-center gap-2">
                        Color: 
                        <div 
                          className="w-4 h-4 rounded border" 
                          style={{ backgroundColor: command.fill }}
                        ></div>
                        <span className="font-mono text-xs">{command.fill}</span>
                      </div>
                    )}
                    {command.text && (
                      <div>Text: "{command.text}"</div>
                    )}
                    {command.fontSize && (
                      <div>Font Size: {command.fontSize}px</div>
                    )}
                    {command.rotation !== undefined && (
                      <div>Rotation: {command.rotation}°</div>
                    )}
                    {command.shapeId && (
                      <div>Shape ID: {command.shapeId}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Information */}
        {response.debug && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Debug Information:</h4>
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Provider:</span>
                  <span className="ml-2 text-blue-700">{response.debug.provider || aiProvider}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Model:</span>
                  <span className="ml-2 text-blue-700">{response.debug.model || (aiProvider === 'replicate' ? 'gpt-5-nano' : 'gpt-5-mini')}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Total Tokens:</span>
                  <span className="ml-2 text-blue-700">{response.debug.tokens_used || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Prompt Tokens:</span>
                  <span className="ml-2 text-blue-700">{response.debug.prompt_tokens || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Completion Tokens:</span>
                  <span className="ml-2 text-blue-700">{response.debug.completion_tokens || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Function Calls:</span>
                  <span className="ml-2 text-blue-700">{response.debug.function_calls || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Response Time:</span>
                  <span className="ml-2 text-blue-700">{response.debug.response_time_ms ? `${response.debug.response_time_ms}ms` : 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Prompt Length:</span>
                  <span className="ml-2 text-blue-700">{prompt.length} characters</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Max Tokens:</span>
                  <span className="ml-2 text-blue-700">16,000</span>
                </div>
              </div>
              
              {/* Token Usage Visualization */}
              {response.debug.tokens_used && response.debug.prompt_tokens && response.debug.completion_tokens && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-blue-800 mb-2">Token Usage Breakdown:</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(response.debug.completion_tokens / response.debug.tokens_used) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>Prompt: {response.debug.prompt_tokens}</span>
                    <span>Completion: {response.debug.completion_tokens}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw JSON Output */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Raw JSON Response:</h4>
          <pre className="bg-gray-100 p-4 rounded border text-xs overflow-auto max-h-96">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium text-red-800">Error</span>
                    </div>
                    <p className="text-red-700 mb-4">{response.error}</p>
                    
                    {/* Total Request Time for Errors */}
                    {response.debug?.response_time_ms && (
                      <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-red-800">
                            Total Request Time: {response.debug.response_time_ms}ms
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Canvas Command Examples:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• "Create a red rectangle 100px x 200px at position 30, 30"</li>
              <li>• "Add a blue circle with radius 50 at the center"</li>
              <li>• "Create text that says 'Hello World' in green"</li>
              <li>• "Make a 3x3 grid of squares"</li>
              <li>• "Create a login form with username and password fields"</li>
              <li>• "Build a navigation bar with 4 menu items"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestPage;
