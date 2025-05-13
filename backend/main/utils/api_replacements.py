import os
import requests
import json
import logging
from datetime import datetime
import urllib.parse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('api_replacements')

# OpenWeatherMap API (alternative to WeatherAPI.com)
OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', "GET_FREE_KEY_FROM_OPENWEATHERMAP")

# The Guardian API (alternative to NewsAPI)
GUARDIAN_API_KEY = os.environ.get('GUARDIAN_API_KEY', "GET_FREE_KEY_FROM_GUARDIAN")

def fetch_weather_from_openweathermap(lat, lon, city=None):
    """
    Fetch weather alerts from OpenWeatherMap API.
    This is an alternative to WeatherAPI.com which had a disabled key.
    """
    try:
        # For national mode, fetch data for the capital
        if city == "National":
            city_param = "Beirut"
        elif city:
            city_param = city
        else:
            # Use coordinates
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        
        # If we have a city name, use that instead of coordinates
        if city and city != "National":
            url = f"https://api.openweathermap.org/data/2.5/weather?q={city_param},lb&appid={OPENWEATHER_API_KEY}&units=metric"
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?q={city_param},lb&appid={OPENWEATHER_API_KEY}&units=metric"
        
        # Get current weather
        response = requests.get(url)
        if response.status_code != 200:
            logger.error(f"OpenWeatherMap API error: {response.status_code} - {response.text}")
            return []
        
        current_data = response.json()
        
        # Get forecast (5 days, 3-hour steps)
        forecast_response = requests.get(forecast_url)
        if forecast_response.status_code != 200:
            logger.error(f"OpenWeatherMap Forecast API error: {forecast_response.status_code} - {forecast_response.text}")
            forecast_data = {"list": []}
        else:
            forecast_data = forecast_response.json()
        
        # Process the weather data into alerts format
        processed_alerts = []
        
        # Current weather conditions
        current_temp = current_data.get("main", {}).get("temp")
        current_condition = current_data.get("weather", [{}])[0].get("main")
        current_description = current_data.get("weather", [{}])[0].get("description")
        
        # If any extreme weather conditions, create an alert
        if current_temp > 35:
            processed_alerts.append({
                "title": f"High Temperature Alert",
                "description": f"Current temperature of {current_temp}°C may cause heat stress to crops. Ensure adequate irrigation.",
                "link": "",
                "published_at": datetime.now().isoformat(),
                "risk_level": "high" if current_temp > 38 else "medium",
                "risk_analysis": "High temperatures can cause plant stress, reduced pollination, and increased water needs.",
                "source": "OpenWeatherMap",
                "location": city or "Lebanon",
                "type": "heatwave"
            })
        elif current_temp < 5:
            processed_alerts.append({
                "title": f"Low Temperature Alert",
                "description": f"Current temperature of {current_temp}°C poses risk of frost damage. Protect sensitive crops.",
                "link": "",
                "published_at": datetime.now().isoformat(),
                "risk_level": "high" if current_temp < 0 else "medium",
                "risk_analysis": "Low temperatures can damage or kill sensitive plants, particularly if frost forms.",
                "source": "OpenWeatherMap",
                "location": city or "Lebanon",
                "type": "frost"
            })
            
        # Create alerts based on current weather condition
        weather_alerts = {
            "Thunderstorm": {
                "title": "Thunderstorm Alert", 
                "description": f"Thunderstorms in the area. {current_description}. Protect crops from heavy rain and wind damage.",
                "risk_level": "high",
                "type": "storm"
            },
            "Drizzle": {
                "title": "Light Rain Alert", 
                "description": f"Light rain in the area. {current_description}. Good for most crops but monitor soil moisture.",
                "risk_level": "safe",
                "type": "general"
            },
            "Rain": {
                "title": "Rain Alert", 
                "description": f"Rain in the area. {current_description}. Ensure proper drainage to prevent waterlogging.",
                "risk_level": "medium",
                "type": "general"
            },
            "Snow": {
                "title": "Snow Alert", 
                "description": f"Snow in the area. {current_description}. Protect crops from freezing conditions.",
                "risk_level": "high",
                "type": "frost"
            },
            "Clear": {
                "title": "Clear Weather", 
                "description": f"Clear skies. {current_description}. Good conditions for most agricultural activities.",
                "risk_level": "safe",
                "type": "general"
            },
            "Clouds": {
                "title": "Cloudy Weather", 
                "description": f"Cloudy conditions. {current_description}. Reduced sunlight might slow photosynthesis slightly.",
                "risk_level": "safe",
                "type": "general"
            }
        }
        
        if current_condition in weather_alerts:
            alert_info = weather_alerts[current_condition]
            processed_alerts.append({
                "title": alert_info["title"],
                "description": alert_info["description"],
                "link": "",
                "published_at": datetime.now().isoformat(),
                "risk_level": alert_info["risk_level"],
                "risk_analysis": f"These weather conditions have {alert_info['risk_level']} impact on agricultural activities.",
                "source": "OpenWeatherMap",
                "location": city or "Lebanon",
                "type": alert_info["type"]
            })
            
        # Process forecast data for upcoming warnings
        forecast_items = forecast_data.get("list", [])
        upcoming_days = {}
        
        # Group forecast by day
        for item in forecast_items:
            dt = datetime.fromtimestamp(item.get("dt", 0))
            day = dt.strftime('%Y-%m-%d')
            
            if day not in upcoming_days:
                upcoming_days[day] = []
                
            upcoming_days[day].append(item)
        
        # Process each day's forecast
        for day, items in upcoming_days.items():
            # Find max and min temps for the day
            max_temp = max([item.get("main", {}).get("temp_max", 0) for item in items])
            min_temp = min([item.get("main", {}).get("temp_min", 0) for item in items])
            
            # Count rain occurrences
            rain_count = sum(1 for item in items if "Rain" in item.get("weather", [{}])[0].get("main", ""))
            rain_probability = int((rain_count / len(items)) * 100) if items else 0
            
            # Create temperature alerts
            if max_temp > 35:
                processed_alerts.append({
                    "title": f"High Temperature Alert for {day}",
                    "description": f"Temperatures expected to reach {max_temp}°C. Plants may experience heat stress. Increase irrigation and consider providing shade for sensitive crops.",
                    "link": "",
                    "published_at": datetime.now().isoformat(),
                    "risk_level": "high" if max_temp > 38 else "medium",
                    "risk_analysis": "High temperatures can cause plant stress, reduced pollination, and increased water needs.",
                    "source": "OpenWeatherMap Forecast",
                    "location": city or "Lebanon",
                    "type": "heatwave"
                })
            elif min_temp < 5:
                processed_alerts.append({
                    "title": f"Low Temperature Alert for {day}",
                    "description": f"Temperatures expected to drop to {min_temp}°C. Protect sensitive crops from potential frost damage.",
                    "link": "",
                    "published_at": datetime.now().isoformat(),
                    "risk_level": "high" if min_temp < 0 else "medium",
                    "risk_analysis": "Low temperatures can damage or kill sensitive plants, particularly if frost forms.",
                    "source": "OpenWeatherMap Forecast",
                    "location": city or "Lebanon",
                    "type": "frost"
                })
            
            # Create rain alerts
            if rain_probability > 70:
                processed_alerts.append({
                    "title": f"Rain Forecast for {day}",
                    "description": f"High chance of rain ({rain_probability}%). Ensure proper drainage and postpone spraying operations.",
                    "link": "",
                    "published_at": datetime.now().isoformat(),
                    "risk_level": "medium",
                    "risk_analysis": "Heavy rain may cause soil erosion and waterlogging in low-lying fields.",
                    "source": "OpenWeatherMap Forecast",
                    "location": city or "Lebanon",
                    "type": "general"
                })
        
        # Sort by risk level
        risk_order = {'high': 0, 'medium': 1, 'safe': 2}
        processed_alerts.sort(key=lambda x: risk_order.get(x.get('risk_level', 'medium'), 1))
        
        return processed_alerts
        
    except Exception as e:
        logger.error(f"Error in fetch_weather_from_openweathermap: {str(e)}")
        return []

def fetch_news_from_guardian(lat, lon, city=None):
    """
    Fetch agricultural news from The Guardian API.
    This is an alternative to NewsAPI which had an invalid key.
    """
    try:
        # Build search query
        agricultural_keywords = "agriculture OR farming OR crops OR plantation OR harvest OR soil OR fertilizer"
        pest_keywords = "pest OR disease OR infestation OR blight OR fungus OR bacteria OR virus OR drought OR flood"
        
        # Base query
        query = f"({agricultural_keywords} AND {pest_keywords})"
        
        # Add location filter
        if city == "National":
            # For national mode, just use coordinates
            location = f"{lat},{lon}"
        elif city:
            # For specific cities, use the city name with Lebanon as the country
            location = f"{city},lebanon"
            query = f"{query} AND {city}"
        else:
            query = f"{query} AND Lebanon"
            
        # Guardian API URL
        url = f"https://content.guardianapis.com/search?q={urllib.parse.quote(query)}&api-key={GUARDIAN_API_KEY}&show-fields=headline,trailText,bodyText&page-size=20"
        
        logger.info(f"Fetching news from Guardian API with query: {query}")
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Guardian API error: {response.status_code} - {response.text}")
            return []
            
        data = response.json()
        
        # Check if we got results
        results = data.get("response", {}).get("results", [])
        logger.info(f"Retrieved {len(results)} articles from Guardian API")
        
        if not results:
            return []
            
        # Process articles
        processed_articles = []
        
        for article in results:
            # Extract data
            title = article.get("webTitle", "")
            url = article.get("webUrl", "")
            published_at = article.get("webPublicationDate", "")
            
            # Extract fields
            fields = article.get("fields", {})
            description = fields.get("trailText", "")
            content = fields.get("bodyText", "")
            
            # Skip articles without sufficient content
            if not title or not description:
                continue
                
            # Combine content for analysis
            full_text = f"{title} {description} {content}".lower()
            
            # Classify risk level based on content
            from utils.agri_alerts import classify_news_risk, generate_risk_analysis, extract_location
            
            risk_level = classify_news_risk(full_text)
            risk_analysis = generate_risk_analysis(full_text, risk_level)
            
            # Handle location
            if city == "National":
                article_location = "National, Lebanon"
            else:
                article_location = extract_location(full_text, city)
            
            # Add to results
            processed_articles.append({
                "title": title,
                "description": description,
                "link": url,
                "published_at": published_at,
                "risk_level": risk_level,
                "risk_analysis": risk_analysis,
                "source": "The Guardian",
                "location": article_location
            })
            
        logger.info(f"Processed {len(processed_articles)} relevant articles from Guardian")
        return processed_articles
        
    except Exception as e:
        logger.error(f"Error in fetch_news_from_guardian: {str(e)}")
        return [] 