import requests
import json

API_KEY = "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"

def ask_openrouter(prompt, model="openai/gpt-3.5-turbo", max_tokens=100):
    """
    Send a prompt to OpenRouter API and get a response.
    
    Args:
        prompt (str): The user prompt
        model (str): The model to use. Defaults to GPT-3.5 Turbo
        max_tokens (int): Maximum number of tokens for the response
        
    Returns:
        str: The AI response or error message
    """
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://agriconnect.app",  # Optional but helps for rankings
        "X-Title": "AgriConnect"                   # Optional but helps for rankings
    }
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": max_tokens
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        # Continue with processing if successful
        if response.status_code == 200:
            result = response.json()
            
            if "choices" in result and len(result["choices"]) > 0:
                if "message" in result["choices"][0] and "content" in result["choices"][0]["message"]:
                    return result["choices"][0]["message"]["content"]
            
            return f"Invalid response format: {json.dumps(result)}"
        else:
            return f"Error: HTTP {response.status_code} - {response.text}"
    
    except requests.exceptions.RequestException as e:
        return f"Request error: {str(e)}"
    except json.JSONDecodeError:
        return f"JSON decode error: {response.text}"
    except Exception as e:
        return f"Unexpected error: {str(e)}" 