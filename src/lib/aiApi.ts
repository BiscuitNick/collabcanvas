export type AIProvider = 'openai' | 'replicate';

export type GPT5Model = 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano';

export interface AIResponse {
  success: boolean;
  data?: {
    commands: CanvasCommand[];
    message: string;
  };
  error?: string;
  debug?: {
    tokens_used?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    model?: string;
    response_time_ms?: number;
    function_calls?: number;
    provider?: string;
    raw_response_length?: number;
  };
}

export interface CanvasCommand {
  action: 'create' | 'move' | 'resize' | 'rotate';
  type?: 'rectangle' | 'circle';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  text?: string;
  fontSize?: number;
  shapeId?: string;
  rotation?: number;
}

interface AITestRequest {
  prompt: string;
  provider?: AIProvider;
  model?: GPT5Model;
}

/**
 * Calls the AI test Firebase function with a user prompt
 * @param prompt - The user's prompt to send to the AI
 * @param provider - The AI provider to use ('openai' or 'replicate')
 * @param model - The GPT-5 model to use ('gpt-5', 'gpt-5-mini', or 'gpt-5-nano')
 * @returns Promise<AIResponse> - The AI's response or error
 */
export const callAITest = async (prompt: string, provider: AIProvider = 'openai', model: GPT5Model = 'gpt-5-mini'): Promise<AIResponse> => {
  try {
    // Determine function URL based on provider and environment
    const isLocal = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    const functionUrl = provider === 'replicate' 
      ? (isLocal 
          ? 'http://localhost:5001/collab-canvas-kenkel/us-central1/ai_text_to_canvas_replicate'
          : 'https://us-central1-collab-canvas-kenkel.cloudfunctions.net/ai_text_to_canvas_replicate')
      : (isLocal
          ? 'http://localhost:5001/collab-canvas-kenkel/us-central1/ai_text_to_canvas'
          : 'https://us-central1-collab-canvas-kenkel.cloudfunctions.net/ai_text_to_canvas');
    
    console.log(`Calling AI Canvas Agent (${provider}) at:`, functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, provider, model } as AITestRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Function response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling AI test function:', error);
    throw error;
  }
};

/**
 * Calls the AI test Firebase function with a user prompt (alternative endpoint)
 * This version calls the Firebase function directly
 * @param prompt - The user's prompt to send to the AI
 * @returns Promise<AIResponse> - The AI's response or error
 */
export const callAITestDirect = async (prompt: string): Promise<AIResponse> => {
  try {
    // This would be the direct Firebase function URL
    // You'll need to replace this with your actual Firebase function URL
    const functionUrl = 'https://us-central1-collabcanvas.cloudfunctions.net/ai_test';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt } as AITestRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling AI test function directly:', error);
    throw error;
  }
};
