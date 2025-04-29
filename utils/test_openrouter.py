from utils.openrouter import ask_openrouter

# Test the OpenRouter API
def test_api():
    prompt = "What is AgriConnect? (Pretend it's a farming app that connects farmers with buyers)"
    print("Testing OpenRouter API...")
    
    response = ask_openrouter(
        prompt=prompt,
        model="openai/gpt-3.5-turbo",
        max_tokens=100
    )
    
    print("\nResponse from AI:")
    print(response)
    
if __name__ == "__main__":
    test_api() 