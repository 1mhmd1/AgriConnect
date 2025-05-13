import requests
import json

API_KEY = "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"

def is_agricultural_question(question):
    """
   
    """
    # List of agriculture-related keywords to check against
    agri_keywords = [
        'farm', 'farming', 'crop', 'crops', 'plant', 'plants', 'soil', 'fertilizer', 
        'pesticide', 'harvest', 'agriculture', 'agricultural', 'farmer', 'irrigation',
        'seed', 'seeds', 'grow', 'growth', 'pest', 'livestock', 'cattle', 'poultry',
        'organic', 'greenhouse', 'hydroponics', 'compost', 'planting', 'cultivation',
        'dairy', 'yield', 'rotation', 'sustainable', 'tractor', 'equipment', 'weed',
        'pruning', 'nursery', 'germination', 'drought', 'field', 'garden', 'gardening',
        'manure', 'horticulture', 'agronomy', 'weather', 'climate', 'seasonal', 'land',
        'produce', 'food', 'vegetable', 'fruit', 'grain', 'corn', 'wheat', 'rice', 'agribusiness'
    ]
    
    # Convert to lowercase for case-insensitive matching
    question_lower = question.lower()
    
    # Check if any agriculture keyword is in the question
    for keyword in agri_keywords:
        if keyword in question_lower:
            return True
            
    return False

def ask_openrouter(prompt, model="openai/gpt-3.5-turbo", max_tokens=100):
    """

    """
    # Check if the prompt is agricultural-related
    if not is_agricultural_question(prompt):
        return "I'm an agricultural assistant and can only answer questions related to farming, crops, livestock, soil, agriculture, gardening, and related topics. Please ask me something about agriculture."
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://agriconnect.app",  # Optional but helps for rankings
        "X-Title": "AgriConnect"                   # Optional but helps for rankings
    }
    
    # Add system message to instruct model to focus on agricultural topics
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are AgriGPT, an AI assistant specializing in agricultural topics. You only answer questions related to farming, crops, livestock, soil management, agricultural equipment, weather impacts on farming, pest control, irrigation, sustainable agriculture, and other agriculture-related topics. For non-agricultural questions, politely explain that you can only assist with agricultural topics."
            },
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