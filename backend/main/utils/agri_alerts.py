import http.client
import json
import requests
from datetime import datetime
import urllib.parse
from pytz import timezone
from datetime import timedelta
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('agri_alerts')

# API keys - only keep the ones that are currently used
METEOSTAT_API_KEY = "5145b68a2dmsh319eba253f334f7p111f6ajsncda195503063"
VISUAL_CROSSING_API_KEY = os.environ.get('VISUAL_CROSSING_API_KEY', "9R8MCVJBX8QR39S26E3FWYJH2")
NEWSDATA_API_KEY = os.environ.get('NEWSDATA_API_KEY', "pub_85747ecce9ac0a38cbff982351187fb3b2036")

# Lebanese cities coordinates
LEBANON_CITIES = {
    "Beirut": {"lat": 33.8938, "lon": 35.5018},
    "Tripoli": {"lat": 34.4334, "lon": 35.8433},
    "Sidon": {"lat": 33.5575, "lon": 35.3715},
    "Tyre": {"lat": 33.2704, "lon": 35.2037},
    "Nabatieh": {"lat": 33.3809, "lon": 35.4836},
    "Jounieh": {"lat": 33.9808, "lon": 35.6178},
    "Zahle": {"lat": 33.8467, "lon": 35.9017},
    "Baalbek": {"lat": 34.0058, "lon": 36.2186},
    "Byblos": {"lat": 34.1225, "lon": 35.6542},
    "Aley": {"lat": 33.8083, "lon": 35.6000},
    "Batroun": {"lat": 34.2553, "lon": 35.6581},
    "Bcharre": {"lat": 34.2509, "lon": 36.0119},
    "Halba": {"lat": 34.5428, "lon": 36.0797},
    "Jbeil": {"lat": 34.1211, "lon": 35.6497},
    "Jezzine": {"lat": 33.5389, "lon": 35.5844},
    "Joub Jannine": {"lat": 33.6261, "lon": 35.7786},
    "Marjayoun": {"lat": 33.3603, "lon": 35.5914},
    "Minieh": {"lat": 34.4736, "lon": 35.9528},
    "Zgharta": {"lat": 34.3972, "lon": 35.8944}
}

# Get user location - either from provided city or IP geolocation
def get_user_location(city=None):
    # Special case for "national" to fetch data for the entire country (less regional)
    if city and city.lower() == 'national':
        return 33.8547, 35.8623, "National"
    
    # If city is provided and exists in our database, use its coordinates
    if city and city in LEBANON_CITIES:
        lat = LEBANON_CITIES[city]["lat"]
        lon = LEBANON_CITIES[city]["lon"]
        return lat, lon, city
    
    # Otherwise, try to detect location using IP geolocation
    try:
        res = requests.get("https://ipinfo.io/json", timeout=5)
        if res.status_code != 200:
            logger.error(f"IP geolocation API error: {res.status_code} - {res.text}")
            return 33.8938, 35.5018, "Beirut"  # Default to Beirut if API fails
            
        data = res.json()
        if "loc" not in data or not data["loc"] or "," not in data["loc"]:
            logger.error(f"IP geolocation API returned invalid location data: {data}")
            return 33.8938, 35.5018, "Beirut"  # Default to Beirut if location data is invalid
            
        lat, lon = map(float, data["loc"].split(","))
        city = data.get("city", "your area")
        return lat, lon, city
    except Exception as e:
        logger.error(f"Error in get_user_location: {str(e)}")
        return 33.8938, 35.5018, "Beirut"  # Default to Beirut if location can't be detected

# Fetch today's weather data for that location
def fetch_weather_data(lat, lon):
    try:
        today_date = datetime.today().strftime('%Y-%m-%d')
        
        conn = http.client.HTTPSConnection("meteostat.p.rapidapi.com")
        headers = {
            'x-rapidapi-host': "meteostat.p.rapidapi.com",
            'x-rapidapi-key': METEOSTAT_API_KEY
        }

        conn.request("GET", f"/point/daily?lat={lat}&lon={lon}&start={today_date}&end={today_date}", headers=headers)
        res = conn.getresponse()
        data = res.read()
        
        if res.status != 200:
            logger.error(f"Meteostat API error: {res.status} - {data.decode('utf-8')}")
            return {}
            
        return json.loads(data)
    except Exception as e:
        logger.error(f"Error in fetch_weather_data: {str(e)}")
        return {}

# Fetch pest and disease news based on location
def fetch_pest_and_disease_news(lat, lon, city=None):
    try:
        logger.info(f"Fetching pest and disease news for {city if city else f'coordinates ({lat}, {lon})'}")
            
        # Use NewsData.io API
        logger.info("Using NewsData.io API")
        return fetch_news_from_newsdata(lat, lon, city)
        
    except Exception as e:
        logger.error(f"Error in fetch_pest_and_disease_news: {str(e)}")
        return []

# Helper function to classify news risk level
def classify_news_risk(text):
    # High risk keywords
    high_risk_keywords = [
        "outbreak", "severe", "emergency", "crisis", "warning", "dangerous", 
        "catastrophic", "imminent", "devastating", "destroyed", "infestation",
        "epidemic", "pandemic", "urgent", "critical", "immediate action",
        "rapidly spreading", "alert", "disaster", "severe damage"
    ]
    
    # Medium risk keywords
    medium_risk_keywords = [
        "risk", "concern", "issue", "problem", "challenge", "potential", 
        "threat", "could affect", "may impact", "monitor", "watch",
        "susceptible", "vulnerability", "caution", "prepare", "prevention"
    ]
    
    # Safe/positive keywords
    safe_keywords = [
        "solution", "prevention", "control", "manage", "effective", 
        "success", "improve", "innovation", "breakthrough", "resistant",
        "beneficial", "opportunity", "advantage", "positive", "progress",
        "development", "sustainable", "eco-friendly", "organic"
    ]
    
    # Count matches in each category
    high_count = sum(1 for keyword in high_risk_keywords if keyword in text)
    medium_count = sum(1 for keyword in medium_risk_keywords if keyword in text)
    safe_count = sum(1 for keyword in safe_keywords if keyword in text)
    
    # Determine risk level based on keyword prevalence
    weighted_high = high_count * 2
    weighted_medium = medium_count * 1
    weighted_safe = safe_count * 1.5  # Slightly favor positive news
    
    # Determine the final risk level
    if weighted_high > weighted_medium and weighted_high > weighted_safe:
        return "high"
    elif weighted_medium > weighted_safe:
        return "medium"
    else:
        return "safe"

# Helper function to generate risk analysis
def generate_risk_analysis(text, risk_level):
    if risk_level == "high":
        return "This represents a significant threat to crops that requires immediate attention and action."
    elif risk_level == "medium":
        return "This situation should be monitored closely and preventative measures may be necessary."
    else:  # safe
        return "This development offers potential benefits or solutions for agricultural practices."

# Helper function to extract location from article content
def extract_location(text, default_city=None):
    # We'll pass through any location mentioned in the article
    # If no specific location is mentioned, use default city or a generic reference
    if default_city:
        return default_city
    else:
        return "Unknown Location"

# Give plant-specific advice based on temperature
def generate_plant_alerts(temp, date):
    alerts = []

    if temp is None:
        return [{"type": "warning", "message": "Temperature data is unavailable."}]

    if temp < 10:
        alerts.append({"type": "cold", "message": f"Low Temperature Alert: {temp}°C – It's very cold! Consider bringing sensitive plants indoors or covering them to protect against frost."})
    elif temp < 15:
        alerts.append({"type": "cool", "message": f"Cool Temperature: {temp}°C – Reduce watering, protect tender plants, and consider covering them in the evening."})
    elif temp < 20:
        alerts.append({"type": "mild", "message": f"Mild Temperature: {temp}°C – Regular care for plants is okay, but avoid direct sun exposure for sensitive plants."})
    elif temp > 30:
        alerts.append({"type": "tropical", "message": f"Tropical Plants: {temp}°C – Shade & water early morning."})
    elif temp > 35:
        alerts.append({"type": "mediterranean", "message": f"Mediterranean Plants: {temp}°C – Deep watering & mulch to cool roots."})
    elif temp > 28:
        alerts.append({"type": "vegetables", "message": f"Vegetables: {temp}°C – Shade tender veggies, water regularly."})
    elif temp > 32:
        alerts.append({"type": "ornamentals", "message": f"Ornamentals: {temp}°C – Mist leaves, avoid pruning."})

    if not alerts:
        alerts.append({"type": "normal", "message": "Temperature is normal for all plant types today."})

    return alerts

# Fetch simplified severe weather alerts related to agriculture
def fetch_weather_alerts(lat, lon, city=None):
    try:
        logger.info(f"Fetching weather alerts for {city if city else f'coordinates ({lat}, {lon})'}")
        
        # Use Visual Crossing Weather API
        logger.info("Using Visual Crossing Weather API")
        return fetch_weather_from_visualcrossing(lat, lon, city)
        
    except Exception as e:
        logger.error(f"Error in fetch_weather_alerts: {str(e)}")
        return []

# Helper function to process weather alerts from API response
def process_weather_alerts(data, city=None):
    processed_alerts = []
    
    # Extract alerts from the response
    alerts = data.get("alerts", {}).get("alert", [])
    if not isinstance(alerts, list):
        alerts = []
    
    # Get forecast data for additional agricultural analysis
    forecast_days = data.get("forecast", {}).get("forecastday", [])
    
    # Process each alert
    for alert in alerts:
        # Extract alert data
        headline = alert.get("headline", "")
        description = alert.get("desc", "")
        
        # Skip alerts without sufficient content
        if not headline:
            continue
            
        # Combine content for analysis
        full_text = f"{headline} {description}".lower()
        
        # Check if the alert is relevant to agriculture
        if is_agricultural_relevant(full_text):
            # Classify risk level
            risk_level = classify_weather_alert_risk(full_text)
            
            # Generate risk analysis
            risk_analysis = generate_weather_risk_analysis(full_text, risk_level)
            
            processed_alerts.append({
                "title": headline,
                "description": description,
                "link": alert.get("link", ""),
                "published_at": alert.get("effective", ""),
                "risk_level": risk_level,
                "risk_analysis": risk_analysis,
                "source": "WeatherAPI.com",
                "location": city or "Lebanon",
                "type": determine_alert_type(full_text)
            })
    
    # Add agricultural forecasts based on weather conditions
    if len(forecast_days) > 0:
        # Calculate how many forecast alerts to generate based on existing alerts
        max_forecast_alerts = 3 if len(processed_alerts) == 0 else (2 if len(processed_alerts) <= 2 else 1)
        forecast_alerts_added = 0
        
        for day_data in forecast_days:
            if forecast_alerts_added >= max_forecast_alerts:
                break
                
            day = day_data.get("date", "")
            day_condition = day_data.get("day", {})
            
            max_temp = day_condition.get("maxtemp_c")
            min_temp = day_condition.get("mintemp_c")
            avg_temp = day_condition.get("avgtemp_c")
            condition = day_condition.get("condition", {}).get("text", "")
            rain_chance = day_condition.get("daily_chance_of_rain")
            
            # Generate agricultural alerts based on weather conditions
            agri_alerts = generate_agricultural_forecast_alerts(
                day, max_temp, min_temp, avg_temp, 
                condition, rain_chance, city
            )
            
            # Add generated alerts to our collection
            for alert in agri_alerts:
                processed_alerts.append(alert)
                forecast_alerts_added += 1
                if forecast_alerts_added >= max_forecast_alerts:
                    break
    
    return processed_alerts

# Helper function to check if weather alert is relevant to agriculture
def is_agricultural_relevant(text):
    agri_relevant_keywords = [
        "farm", "crop", "field", "plant", "harvest", "agriculture", "drought", 
        "flood", "irrigation", "soil", "rain", "precipitation", "temperature",
        "storm", "hail", "frost", "freeze", "heat", "wind", "humidity"
    ]
    
    return any(keyword in text for keyword in agri_relevant_keywords)

# Helper function to classify weather alert risk for agriculture
def classify_weather_alert_risk(text):
    # High risk keywords for weather
    high_risk_keywords = [
        "severe", "warning", "hazardous", "dangerous", "extreme", 
        "emergency", "heavy", "flood", "drought", "hurricane", 
        "tornado", "frost", "freeze", "heat wave", "hail storm", 
        "lightning", "wildfire", "landslide", "destructive"
    ]
    
    # Medium risk keywords
    medium_risk_keywords = [
        "advisory", "watch", "alert", "caution", "moderate", 
        "strong", "gusty", "windy", "rain", "thunderstorm", 
        "shower", "precipitation", "humid", "moisture"
    ]
    
    # Favorable keywords
    favorable_keywords = [
        "favorable", "ideal", "optimal", "mild", "light", 
        "sunny", "clear", "fair", "pleasant", "calm", 
        "stable", "moderate temperature", "suitable"
    ]
    
    # Count matches in each category
    high_count = sum(1 for keyword in high_risk_keywords if keyword in text)
    medium_count = sum(1 for keyword in medium_risk_keywords if keyword in text)
    favorable_count = sum(1 for keyword in favorable_keywords if keyword in text)
    
    # Determine risk level
    if high_count > 0:
        return "high"
    elif medium_count > 0:
        return "medium"
    else:
        return "safe"

# Helper function to generate risk analysis for weather alerts
def generate_weather_risk_analysis(text, risk_level):
    if risk_level == "high":
        return "These severe weather conditions pose significant risks to crops and agricultural infrastructure. Immediate protective measures are recommended."
    elif risk_level == "medium":
        return "These weather conditions may impact agricultural activities and crops. Precautionary measures should be considered."
    else:
        return "These weather conditions are generally favorable for agricultural activities."

# Helper function to determine alert type
def determine_alert_type(text):
    # Weather-related keywords
    weather_keywords = {
        "storm": ["storm", "thunder", "lightning", "hurricane", "tornado", "cyclone"],
        "flood": ["flood", "heavy rain", "downpour", "deluge", "inundation"],
        "drought": ["drought", "dry spell", "water shortage", "arid conditions"],
        "frost": ["frost", "freeze", "freezing", "cold snap", "winter kill"],
        "heatwave": ["heat wave", "heatwave", "hot spell", "extreme heat", "scorching"]
    }
    
    # Check for specific weather events
    for alert_type, keywords in weather_keywords.items():
        if any(keyword in text.lower() for keyword in keywords):
            return alert_type
    
    # Default to general if no specific type matched
    return "general"

# Helper function to generate agricultural alerts from forecast data
def generate_agricultural_forecast_alerts(day, max_temp, min_temp, avg_temp, condition, rain_chance, city):
    alerts = []
    
    # Temperature alerts
    if max_temp and max_temp > 35:
        alerts.append({
            "title": f"High Temperature Alert for {day}",
            "description": f"Temperatures expected to reach {max_temp}°C. Plants may experience heat stress. Increase irrigation and consider providing shade for sensitive crops.",
            "link": "",
            "published_at": datetime.now().isoformat(),
            "risk_level": "high" if max_temp > 38 else "medium",
            "risk_analysis": "High temperatures can cause plant stress, reduced pollination, and increased water needs.",
            "source": "AgriConnect Weather Analysis",
            "location": city or "Lebanon",
            "type": "heatwave"
        })
    elif min_temp and min_temp < 5:
        alerts.append({
            "title": f"Low Temperature Alert for {day}",
            "description": f"Temperatures expected to drop to {min_temp}°C. Protect sensitive crops from potential frost damage.",
            "link": "",
            "published_at": datetime.now().isoformat(),
            "risk_level": "high" if min_temp < 0 else "medium",
            "risk_analysis": "Low temperatures can damage or kill sensitive plants, particularly if frost forms.",
            "source": "AgriConnect Weather Analysis",
            "location": city or "Lebanon",
            "type": "frost"
        })
    
    # Rain alerts
    if rain_chance and rain_chance > 70:
        if "heavy" in condition.lower():
            alerts.append({
                "title": f"Heavy Rain Alert for {day}",
                "description": f"Heavy rainfall expected with {rain_chance}% probability. Consider securing irrigation channels and protecting sensitive crops.",
                "link": "",
                "published_at": datetime.now().isoformat(),
                "risk_level": "medium",
                "risk_analysis": "Heavy rain may cause soil erosion and waterlogging in low-lying fields.",
                "source": "AgriConnect Weather Analysis",
                "location": city or "Lebanon",
                "type": "general"
            })
        else:
            alerts.append({
                "title": f"Rain Forecast for {day}",
                "description": f"Rainfall expected with {rain_chance}% probability. Good opportunity for rain-fed crops but consider delaying spraying operations.",
                "link": "",
                "published_at": datetime.now().isoformat(),
                "risk_level": "safe",
                "risk_analysis": "Moderate rainfall is beneficial for most crops and can reduce irrigation needs.",
                "source": "AgriConnect Weather Analysis",
                "location": city or "Lebanon",
                "type": "general"
            })
    
    # Optimal conditions alert
    if 20 <= avg_temp <= 30 and rain_chance and rain_chance < 50 and "clear" in condition.lower():
        alerts.append({
            "title": f"Optimal Growing Conditions for {day}",
            "description": f"Ideal weather conditions forecasted with temperatures around {avg_temp}°C and clear skies. Excellent for most agricultural activities.",
            "link": "",
            "published_at": datetime.now().isoformat(),
            "risk_level": "safe",
            "risk_analysis": "These conditions are ideal for crop development, pollination, and outdoor agricultural work.",
            "source": "AgriConnect Weather Analysis",
            "location": city or "Lebanon",
            "type": "general"
        })
    
    return alerts

# Main function to get all alerts
def get_agricultural_alerts(city=None):
    try:
        logger.info(f"Fetching agricultural alerts for city: {city}")
        
        # Get latitude & longitude for the location
        lat, lon, city_name = get_user_location(city)
        logger.info(f"Location resolved to: {city_name} ({lat}, {lon})")
    
        # Get current temperature for the location
        current_temp = 25  # Default temperature if API fails
        current_date = datetime.now().strftime('%Y-%m-%d')
        current_conditions = "Unknown"
        
        # Use Visual Crossing to get accurate temperature data
        try:
            # Use the location directly without country restriction
            if city_name == "National":
                # For special modes use coordinates
                location = f"{lat},{lon}"
            elif city_name:
                # Just use city name directly
                location = city_name
            else:
                location = f"{lat},{lon}"
                
            # Make a lightweight call to Visual Crossing to get current conditions
            url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{location}?unitGroup=metric&key={VISUAL_CROSSING_API_KEY}&include=current"
            
            vc_response = requests.get(url)
            if vc_response.status_code == 200:
                vc_data = vc_response.json()
                # Get resolved location from API
                resolved_location = vc_data.get("resolvedAddress", city_name)
                current = vc_data.get("currentConditions", {})
                if "temp" in current:
                    current_temp = current["temp"]
                    current_conditions = current.get("conditions", "Unknown")
                    logger.info(f"Retrieved current temperature from Visual Crossing: {current_temp}°C, {current_conditions}")
                else:
                    # Fallback to Meteostat if needed
                    logger.warning("No current temperature in Visual Crossing response, falling back to Meteostat")
                    weather_data = fetch_weather_data(lat, lon)
                    if weather_data and "data" in weather_data and weather_data["data"]:
                        today_data = next((day for day in weather_data["data"] if day.get("date") == current_date), None)
                        if today_data and "tavg" in today_data:
                            current_temp = today_data["tavg"]
                            logger.info(f"Retrieved current temperature from Meteostat: {current_temp}°C")
            else:
                logger.warning(f"Visual Crossing API error: {vc_response.status_code}, falling back to Meteostat")
                # Try Meteostat as fallback
                weather_data = fetch_weather_data(lat, lon)
                if weather_data and "data" in weather_data and weather_data["data"]:
                    today_data = next((day for day in weather_data["data"] if day.get("date") == current_date), None)
                    if today_data and "tavg" in today_data:
                        current_temp = today_data["tavg"]
                        logger.info(f"Retrieved current temperature from Meteostat: {current_temp}°C")
        except Exception as e:
            logger.error(f"Error fetching temperature data: {str(e)}")
            # Continue with default temperature
    
        # Get weather alerts using Visual Crossing
        logger.info("Fetching weather alerts using Visual Crossing...")
        weather_alerts = fetch_weather_alerts(lat, lon, city_name)
        logger.info(f"Retrieved {len(weather_alerts)} weather alerts")
    
        # Get pest and disease alerts using NewsData.io
        logger.info("Fetching pest and disease news using NewsData.io...")
        pest_alerts = fetch_pest_and_disease_news(lat, lon, city_name)
        logger.info(f"Retrieved {len(pest_alerts)} pest/disease alerts")
    
        # Get plant care alerts based on current temperature
        logger.info("Generating plant care alerts...")
        plant_alerts = generate_plant_alerts(current_temp, current_date)
        logger.info(f"Generated {len(plant_alerts)} plant care alerts")
    
        # Combine all alerts into a single list
        all_alerts = []
    
        # Add weather alerts
        for alert in weather_alerts:
            if not isinstance(alert, dict):
                logger.warning(f"Skipping invalid weather alert: {alert}")
                continue
            if 'alert_type' not in alert:
                alert['alert_type'] = 'weather'
            all_alerts.append(alert)
    
        # Add pest/disease alerts
        for alert in pest_alerts:
            if not isinstance(alert, dict):
                logger.warning(f"Skipping invalid pest alert: {alert}")
                continue
            if 'alert_type' not in alert:
                alert['alert_type'] = 'pest'
            all_alerts.append(alert)
    
        # Add plant care alerts
        for alert in plant_alerts:
            if not isinstance(alert, dict):
                logger.warning(f"Skipping invalid plant alert: {alert}")
                continue
            if 'alert_type' not in alert:
                alert['alert_type'] = 'plant'
            all_alerts.append(alert)
    
        # Sort by risk level (high first, then medium, then safe)
        risk_order = {'high': 0, 'medium': 1, 'safe': 2}
        all_alerts.sort(key=lambda x: risk_order.get(x.get('risk_level', 'medium'), 1))
        
        logger.info(f"Total alerts combined: {len(all_alerts)}")
    
        # Add location and weather information to the response
        response = {
            'alerts': all_alerts,
            'location': {
                'city': city_name,
                'coordinates': {'lat': lat, 'lon': lon}
            },
            'weather': {
                'temp': current_temp,
                'conditions': current_conditions,
                'date': current_date
            }
        }
        
        return response
    except Exception as e:
        logger.error(f"Error in get_agricultural_alerts: {str(e)}")
        return {
            'alerts': [],
            'location': {
                'city': city or "Unknown",
                'coordinates': {'lat': None, 'lon': None}
            },
            'weather': {
                'temp': None,
                'conditions': "Unknown",
                'date': datetime.now().strftime('%Y-%m-%d')
            },
            'error': str(e)
        }

# Verify API keys when module is imported
if __name__ == "__main__":
    # Only verify when run directly, not when imported
    try:
        # Removed test_agricultural_alerts import since file was deleted
        print("Running basic test...")
        alerts = get_agricultural_alerts("Beirut")
        print(f"Retrieved {len(alerts.get('alerts', []))} alerts for Beirut")
    except Exception as e:
        print(f"Error in basic test: {e}")

# Fetch weather alerts using Visual Crossing Weather API
def fetch_weather_from_visualcrossing(lat, lon, city=None):
    """
    Fetch weather alerts from Visual Crossing Weather API.
    This is used instead of the disabled WeatherAPI.
    """
    try:
        logger.info(f"Fetching weather data from Visual Crossing for {city if city else f'coordinates ({lat}, {lon})'}")
        
        # Determine the query location
        if city == "National":
            # Default to coordinates for special modes
            location = f"{lat},{lon}"
        elif city:
            # Just use city name without country restriction
            location = city
        else:
            # Use coordinates directly
            location = f"{lat},{lon}"
        
        # Visual Crossing Timeline API - returns current conditions and forecast in one call
        url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{location}?unitGroup=metric&key={VISUAL_CROSSING_API_KEY}&include=current,days,alerts"
        
        response = requests.get(url)
        if response.status_code != 200:
            logger.error(f"Visual Crossing API error: {response.status_code} - {response.text}")
            return []
        
        data = response.json()
        
        # Process the weather data into alerts format
        processed_alerts = []
        
        # Get address or region information from API response
        location_name = data.get("resolvedAddress", city or "Unknown Location")
        
        # Process current conditions
        current = data.get("currentConditions", {})
        current_temp = current.get("temp")
        current_conditions = current.get("conditions", "")
        current_icon = current.get("icon", "")
        
        # Generate extreme temperature alerts
        if current_temp > 20:
            processed_alerts.append({
                "title": f"High Temperature Alert",
                "description": f"Current temperature of {current_temp}°C may cause heat stress to crops. Ensure adequate irrigation.",
                "link": "",
                "published_at": datetime.now().isoformat(),
                "risk_level": "high" if current_temp > 38 else "medium",
                "risk_analysis": "High temperatures can cause plant stress, reduced pollination, and increased water needs.",
                "source": "Visual Crossing Weather",
                "location": location_name,
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
                "source": "Visual Crossing Weather",
                "location": location_name,
                "type": "frost"
            })
        
        # Map weather conditions to agricultural alerts
        condition_alerts = {
            "rain": {
                "title": "Rain Alert",
                "description": f"Rainy conditions currently. {current_conditions}. Monitor soil moisture and ensure proper drainage.",
                "risk_level": "medium",
                "type": "general"
            },
            "snow": {
                "title": "Snow Alert",
                "description": f"Snow conditions currently. {current_conditions}. Protect sensitive crops from freezing.",
                "risk_level": "high",
                "type": "frost"
            },
            "thunder": {
                "title": "Thunderstorm Alert",
                "description": f"Thunderstorm conditions. {current_conditions}. Protect crops from heavy rain and potential hail.",
                "risk_level": "high",
                "type": "storm"
            },
            "fog": {
                "title": "Fog Alert",
                "description": f"Foggy conditions. {current_conditions}. High humidity may increase disease risk for some crops.",
                "risk_level": "medium",
                "type": "general"
            }
        }
        
        # Check current icon against our condition mapping
        for condition_key, alert_info in condition_alerts.items():
            if condition_key in current_icon.lower() or condition_key in current_conditions.lower():
                processed_alerts.append({
                    "title": alert_info["title"],
                    "description": alert_info["description"],
                    "link": "",
                    "published_at": datetime.now().isoformat(),
                    "risk_level": alert_info["risk_level"],
                    "risk_analysis": f"These weather conditions require attention for agricultural operations.",
                    "source": "Visual Crossing Weather",
                    "location": location_name,
                    "type": alert_info["type"]
                })
                break
        
        # Process forecast data for upcoming alerts
        forecast_days = data.get("days", [])
        
        # Limit to next 5 days
        forecast_days = forecast_days[:5] if len(forecast_days) > 5 else forecast_days
        
        for day_data in forecast_days:
            day_date = day_data.get("datetime", "")
            max_temp = day_data.get("tempmax")
            min_temp = day_data.get("tempmin")
            precip_prob = day_data.get("precipprob", 0)
            conditions = day_data.get("conditions", "")
            
            # Skip today as we already processed current conditions
            if day_date == datetime.now().strftime('%Y-%m-%d'):
                continue
                
            # Generate temperature alerts for forecasted days
            if max_temp and max_temp > 20:
                processed_alerts.append({
                    "title": f"High Temperature Alert for {day_date}",
                    "description": f"Temperatures expected to reach {max_temp}°C on {day_date}. Plants may experience heat stress. Increase irrigation and consider providing shade for sensitive crops.",
                    "link": "",
                    "published_at": datetime.now().isoformat(),
                    "risk_level": "high" if max_temp > 38 else "medium",
                    "risk_analysis": "High temperatures can cause plant stress, reduced pollination, and increased water needs.",
                    "source": "Visual Crossing Weather Forecast",
                    "location": location_name,
                    "type": "heatwave"
                })
            elif min_temp and min_temp < 5:
                processed_alerts.append({
                    "title": f"Low Temperature Alert for {day_date}",
                    "description": f"Temperatures expected to drop to {min_temp}°C on {day_date}. Protect sensitive crops from potential frost damage.",
                    "link": "",
                    "published_at": datetime.now().isoformat(),
                    "risk_level": "high" if min_temp < 0 else "medium",
                    "risk_analysis": "Low temperatures can damage or kill sensitive plants, particularly if frost forms.",
                    "source": "Visual Crossing Weather Forecast",
                    "location": location_name,
                    "type": "frost"
                })
            
            # Create precipitation alerts
            if precip_prob > 70:
                precip_type = "rain"
                if "snow" in conditions.lower():
                    precip_type = "snow"
                elif "thunder" in conditions.lower():
                    precip_type = "thunderstorm"
                
                processed_alerts.append({
                    "title": f"{precip_type.capitalize()} Forecast for {day_date}",
                    "description": f"High chance of {precip_type} ({precip_prob}%) on {day_date}. {conditions}. Plan agricultural activities accordingly.",
                    "link": "",
                    "published_at": datetime.now().isoformat(),
                    "risk_level": "medium",
                    "risk_analysis": f"{precip_type.capitalize()} may impact field operations and crop conditions.",
                    "source": "Visual Crossing Weather Forecast",
                    "location": location_name,
                    "type": "general"
                })
        
        # Process any severe weather alerts if available
        alerts = data.get("alerts", [])
        for alert in alerts:
            event = alert.get("event", "")
            description = alert.get("description", "")
            
            # Skip if no meaningful data
            if not event:
                continue
                
            # Determine risk level based on alert title
            risk_level = "medium"  # Default
            if any(word in event.lower() for word in ["severe", "extreme", "warning", "emergency"]):
                risk_level = "high"
            
            processed_alerts.append({
                "title": f"Weather Alert: {event}",
                "description": description,
                "link": "",
                "published_at": datetime.now().isoformat(),
                "risk_level": risk_level,
                "risk_analysis": "Official weather alert that may impact agricultural operations and crop safety.",
                "source": "Visual Crossing Weather Alerts",
                "location": location_name,
                "type": determine_alert_type(f"{event} {description}".lower())
            })
        
        # Sort by risk level (high first)
        risk_order = {'high': 0, 'medium': 1, 'safe': 2}
        processed_alerts.sort(key=lambda x: risk_order.get(x.get('risk_level', 'medium'), 1))
        
        return processed_alerts
        
    except Exception as e:
        logger.error(f"Error in fetch_weather_from_visualcrossing: {str(e)}")
        return []

# Fetch agricultural news from NewsData.io
def fetch_news_from_newsdata(lat, lon, city=None):
    """
    Fetch agricultural news from NewsData.io.
    This is used instead of the invalid NewsAPI.
    """
    try:
        logger.info(f"Fetching agricultural news from NewsData.io for {city if city else f'coordinates ({lat}, {lon})'}")
        
        # Build the search query for agricultural and pest-related news
        agricultural_keywords = "agriculture OR farming OR crops OR plantation OR harvest OR soil OR fertilizer"
        pest_keywords = "pest OR disease OR infestation OR blight OR fungus OR bacteria OR virus OR drought OR flood"
        
        # Base query
        query = f"({agricultural_keywords})"
        
        # Add location to narrow the search only if city is provided and not National
        if city and city != "National":
            query = f"{query} AND {city}"
        
        # NewsData.io API URL - search for news
        # No country restriction to fetch news from all countries the API supports
        url = f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&q={urllib.parse.quote(query)}&language=en"
        
        response = requests.get(url)
        if response.status_code != 200:
            logger.error(f"NewsData.io API error: {response.status_code} - {response.text}")
            return []
        
        data = response.json()
        
        # Check if the API call was successful
        if data.get("status") != "success":
            logger.error(f"NewsData.io API returned error: {data.get('results', {}).get('message', 'Unknown error')}")
            return []
        
        # Get the articles
        articles = data.get("results", [])
        logger.info(f"Retrieved {len(articles)} articles from NewsData.io")
        
        # Process articles
        processed_articles = []
        
        # Define agricultural and farming keywords for additional filtering
        agri_keywords = [
            "farm", "crop", "field", "plant", "harvest", "agriculture", 
            "cultivat", "soil", "irrigation", "fertilizer", "pesticide", 
            "organic", "sustainable", "yield", "seed", "produce", "dairy", 
            "livestock", "cattle", "poultry", "greenhouse", "orchard", 
            "plantation", "agricultural", "farmer", "farming", "grow", 
            "vegetable", "fruit", "grain", "corn", "wheat", "rice", "cotton"
        ]
        
        for article in articles:
            title = article.get("title", "")
            description = article.get("description", "")
            content = article.get("content", "")
            url = article.get("link", "")
            published_at = article.get("pubDate", "")
            source = article.get("source_id", "Unknown Source")
            
            # Skip articles without sufficient content
            if not title:
                continue
            
            # If description is empty, use content or a placeholder
            if not description:
                description = content if content else "No description available."
            
            # Combine content for analysis
            full_text = f"{title} {description} {content}".lower()
            
            # Check if the article is actually about agriculture - especially important in National mode
            if not any(keyword in full_text for keyword in agri_keywords):
                logger.info(f"Skipping non-agricultural article: {title}")
                continue
                
            # Classify risk level based on content
            risk_level = classify_news_risk(full_text)
            
            # Generate risk analysis based on the content
            risk_analysis = generate_risk_analysis(full_text, risk_level)
            
            # Determine location mention in the article
            if city == "National":
                # Use country from article if available, otherwise use a generic name
                country = article.get("country", [])
                if isinstance(country, list) and country:
                    article_location = f"National, {country[0]}"
                else:
                    article_location = "National"
            else:
                # Get country info if available
                country = article.get("country", [])
                source_country = country[0] if isinstance(country, list) and country else "Unknown"
                
                # Use extract_location to get any location mentioned in article
                article_location = extract_location(full_text, city or source_country)
            
            processed_articles.append({
                "title": title,
                "description": description,
                "link": url,
                "published_at": published_at,
                "risk_level": risk_level,
                "risk_analysis": risk_analysis,
                "source": source,
                "location": article_location
            })
        
        logger.info(f"Processed {len(processed_articles)} relevant articles from NewsData.io")
        return processed_articles
        
    except Exception as e:
        logger.error(f"Error in fetch_news_from_newsdata: {str(e)}")
        return [] 