"""
API Alternatives for AgriConnect Weather and News Services

This file provides alternative APIs for weather, news, and other services 
in case the primary APIs are unavailable or have exceeded their limits.
"""

# ===== Weather API Alternatives =====

# 1. OpenWeatherMap API (Free tier: 1,000 calls/day)
# Sign up: https://home.openweathermap.org/users/sign_up
OPENWEATHER_API_DOCS = "https://openweathermap.org/api"
OPENWEATHER_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your key
OPENWEATHER_EXAMPLE_URL = "https://api.openweathermap.org/data/2.5/weather?q=Beirut&appid=YOUR_API_KEY&units=metric"

# 2. Visual Crossing Weather API (Free tier: 1,000 calls/day)
# Sign up: https://www.visualcrossing.com/sign-up
VISUALCROSSING_API_DOCS = "https://www.visualcrossing.com/resources/documentation/weather-api/timeline-weather-api/"
VISUALCROSSING_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your key
VISUALCROSSING_EXAMPLE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Beirut?unitGroup=metric&key=YOUR_API_KEY"

# 3. Tomorrow.io (Free tier: 1,000 calls/day)
# Sign up: https://app.tomorrow.io/signup
TOMORROW_API_DOCS = "https://docs.tomorrow.io/reference/welcome"
TOMORROW_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your key
TOMORROW_EXAMPLE_URL = "https://api.tomorrow.io/v4/timelines?location=33.8938,35.5018&fields=temperature&timesteps=1h&units=metric&apikey=YOUR_API_KEY"

# ===== News API Alternatives =====

# 1. GNews API (Free tier: 100 calls/day)
# Sign up: https://gnews.io/register
GNEWS_API_DOCS = "https://gnews.io/docs/v4"
GNEWS_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your key
GNEWS_EXAMPLE_URL = "https://gnews.io/api/v4/search?q=agriculture+lebanon&lang=en&country=lb&max=10&apikey=YOUR_API_KEY"

# 2. Contextual Web Search API via RapidAPI (Limited free tier)
# Sign up: https://rapidapi.com/contextualwebsearch/api/web-search/
WEBSEARCH_API_DOCS = "https://rapidapi.com/contextualwebsearch/api/web-search/"
WEBSEARCH_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your key
WEBSEARCH_API_HOST = "contextualwebsearch-websearch-v1.p.rapidapi.com"
WEBSEARCH_EXAMPLE_URL = "https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/NewsSearchAPI?q=agriculture+lebanon&pageNumber=1&pageSize=10&autoCorrect=true&safeSearch=false&withThumbnails=true"

# 3. The Guardian API (Free with restrictions)
# Sign up: https://open-platform.theguardian.com/access/
GUARDIAN_API_DOCS = "https://open-platform.theguardian.com/documentation/"
GUARDIAN_API_KEY = "YOUR_API_KEY_HERE"  # Replace with your key
GUARDIAN_EXAMPLE_URL = "https://content.guardianapis.com/search?q=agriculture+lebanon&api-key=YOUR_API_KEY"

# ===== Implementation Example =====

"""
Example implementation for OpenWeatherMap API:

import requests

def get_weather_from_openweathermap(city):
    api_key = "YOUR_API_KEY"
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric"
    
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return {
            "temperature": data["main"]["temp"],
            "description": data["weather"][0]["description"],
            "humidity": data["main"]["humidity"],
            "wind_speed": data["wind"]["speed"]
        }
    else:
        return {"error": f"Error {response.status_code}: {response.text}"}
"""

# ===== Environment Variables =====
"""
For deployment, it's better to use environment variables instead of hardcoding API keys.
You can set these in your .env file or in your hosting environment.

Examples:
- WEATHER_API_KEY=your_key_here
- NEWS_API_KEY=your_key_here
- OPENWEATHER_API_KEY=your_key_here
""" 