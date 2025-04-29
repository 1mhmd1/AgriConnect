from utils.openrouter import ask_openrouter

# Test the OpenRouter API with a well-known model
def test_openai_api():
    prompt = "What is AgriConnect? (Pretend it's a farming app that connects farmers with buyers)"
    print("Testing OpenRouter API with GPT-3.5 Turbo model...")
    
    response = ask_openrouter(
        prompt=prompt,
        model="openai/gpt-3.5-turbo",
        max_tokens=50
    )
    
    print("\nFinal Response:", response)
    
if __name__ == "__main__":
    test_openai_api() 