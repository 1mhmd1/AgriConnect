# API Replacement Instructions

Based on our testing, we found that two of the three APIs used in `agri_alerts.py` are not working:

1. **WeatherAPI** (weatherapi.com): Status 403, Error: "API key has been disabled"
2. **News API** (newsapi.org): Status 401, Error: "API key is invalid"

The Meteostat API and IP location service (ipinfo.io) are still working properly.

## Recommended API Replacements

### 1. Replace WeatherAPI with OpenWeatherMap

- Sign up for a free API key at: https://home.openweathermap.org/users/sign_up
- The free tier provides 1,000 calls/day, which should be sufficient
- Update the WeatherAPI key in agri_alerts.py or set it as an environment variable:
  `WEATHER_API_KEY=your_openweathermap_key`

Example API calls:

- Current weather: `https://api.openweathermap.org/data/2.5/weather?q=Beirut&appid=YOUR_KEY&units=metric`
- 5-day forecast: `https://api.openweathermap.org/data/2.5/forecast?q=Beirut&appid=YOUR_KEY&units=metric`

### 2. Replace NewsAPI with The Guardian API

- Register for a free API key at: https://open-platform.theguardian.com/access/
- The Guardian API is free for non-commercial use
- Update the News API key in agri_alerts.py or set it as an environment variable:
  `NEWS_API_KEY=your_guardian_api_key`

Example API call:

- `https://content.guardianapis.com/search?q=agriculture+lebanon&api-key=YOUR_KEY`

## Environment Variables Setup

For security, it's recommended to use environment variables rather than hardcoding API keys:

1. For local development, create a `.env` file in your project root:

   ```
   OPENWEATHER_API_KEY=your_openweathermap_key
   GUARDIAN_API_KEY=your_guardian_api_key
   ```

2. For production deployment, set these variables in your hosting environment.

## Implementation Options

You have two options for implementing these changes:

### Option 1: Direct Replacement

Replace the API keys in the existing functions:

```python
# Update these constants at the top of agri_alerts.py
WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY', "your_openweathermap_key_here")
NEWS_API_KEY = os.environ.get('NEWS_API_KEY', "your_guardian_api_key_here")
```

Then modify the URL in the `fetch_weather_alerts` function to use OpenWeatherMap format, and update the `fetch_pest_and_disease_news` function to use The Guardian API format.

### Option 2: Fallback Implementation

Add alternative implementations that will be called when the primary API fails:

1. Modify the `fetch_weather_alerts` function to try OpenWeatherMap if WeatherAPI fails
2. Modify the `fetch_pest_and_disease_news` function to try The Guardian API if NewsAPI fails

This approach maintains backward compatibility while adding fallback options.

## Testing

After implementing these changes, you can test them with the following code:

```python
# Test the weather API
test_weather = fetch_weather_alerts(33.8938, 35.5018, "Beirut")
print(f"Retrieved {len(test_weather)} weather alerts")

# Test the news API
test_news = fetch_pest_and_disease_news(33.8938, 35.5018, "Beirut")
print(f"Retrieved {len(test_news)} news alerts")
```
