/**
 * Agricultural Alerts System
 * Fetches and displays agricultural alerts for landowners
 *
 * This file uses an approach to prevent duplicate declarations when included in multiple pages:
 * 1. It checks if global variables/functions already exist before declaring them
 * 2. All functions are attached to the window object to make them globally accessible
 * 3. The entire file is wrapped in an IIFE to avoid polluting the global namespace
 * 4. Initialization only happens once through the agricAlertsInitialized flag
 */

// Lebanese cities for the location dropdown
// Check if lebaneseCities already exists globally before declaring it
if (typeof window.lebaneseCities === "undefined") {
  window.lebaneseCities = [
    "Beirut",
    "Tripoli",
    "Sidon",
    "Tyre",
    "Nabatieh",
    "Jounieh",
    "Zahle",
    "Baalbek",
    "Byblos",
    "Aley",
    "Batroun",
    "Bcharre",
    "Halba",
    "Jbeil",
    "Jezzine",
    "Joub Jannine",
    "Marjayoun",
    "Minieh",
    "Zgharta",
  ];
}

// Wrap all functions in an IIFE (Immediately Invoked Function Expression)
// to prevent global namespace pollution and redeclaration issues
(function () {
  // Only define these functions if they don't already exist
  if (typeof window.fetchAgriculturalAlerts !== "function") {
    // Main function to fetch agricultural alerts
    window.fetchAgriculturalAlerts = async function (city = null) {
      try {
        let url = "/api/agriculture-alerts/";
        // Append city parameter if provided
        if (city) {
          url += `?city=${encodeURIComponent(city)}`;
        }

        console.log("Fetching agricultural alerts from:", url);
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server response:", response.status, errorText);
          throw new Error(
            `HTTP error ${response.status}: ${errorText || "Unknown error"}`
          );
        }

        const data = await response.json();

        // Debug log the data
        console.log("Agricultural Alerts Data:", data);

        // Create the structured data the UI expects
        const structuredData = {
          location: data.location || { city: city || "Auto-detected" },
          weather: data.weather || {
            temp: 25,
            date: new Date().toLocaleDateString(),
          },
          pest_alerts: [],
          weather_alerts: [],
          plant_alerts: [],
        };

        // Process alerts by type (if alerts exist in the response)
        const alerts = data.alerts || data;
        if (Array.isArray(alerts)) {
          alerts.forEach((alert) => {
            if (alert.alert_type === "weather") {
              structuredData.weather_alerts.push(alert);
            } else if (alert.alert_type === "pest") {
              structuredData.pest_alerts.push(alert);
            } else if (alert.alert_type === "plant") {
              structuredData.plant_alerts.push(alert);
            }
          });
        }

        console.log("Structured alerts data:", structuredData);

        // Warning in console if no weather alerts found
        if (structuredData.weather_alerts.length === 0) {
          console.warn("Warning: No weather alerts data returned from API");
        }

        // Add indicator if there are no alerts at all
        structuredData.hasAlerts =
          structuredData.weather_alerts.length > 0 ||
          structuredData.pest_alerts.length > 0 ||
          structuredData.plant_alerts.length > 0;

        return structuredData;
      } catch (error) {
        console.error("Failed to fetch agricultural alerts:", error);
        throw new Error(`Error: ${error.message}`);
      }
    };

    // Function to create alert UI
    window.createAlertsUI = function (alertsData) {
      if (!alertsData) return null;

      const alertsContainer = document.createElement("div");
      alertsContainer.className = "agri-alerts-container";

      // Add location selector
      const locationSelector = document.createElement("div");
      locationSelector.className = "location-selector";

      const locationLabel = document.createElement("label");
      locationLabel.textContent = "Select Location:";
      locationLabel.htmlFor = "citySelector";

      const citySelect = document.createElement("select");
      citySelect.id = "citySelector";

      // Add the "Auto-detect" option
      const autoDetectOption = document.createElement("option");
      autoDetectOption.value = "";
      autoDetectOption.textContent = "Auto-detect";
      citySelect.appendChild(autoDetectOption);

      // Add the "National" option
      const nationalOption = document.createElement("option");
      nationalOption.value = "national";
      nationalOption.textContent = "National (Country-wide)";
      citySelect.appendChild(nationalOption);

      // Add all Lebanese cities
      window.lebaneseCities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        // Set current city as selected if it matches
        if (alertsData.location && alertsData.location.city === city) {
          option.selected = true;
        }
        citySelect.appendChild(option);
      });

      // Add change handler for city selection
      citySelect.addEventListener("change", async () => {
        const selectedCity = citySelect.value;

        // Show loading state in modal body
        const modalBody = document.querySelector(".alerts-modal-body");
        if (modalBody) {
          modalBody.innerHTML =
            '<div class="alerts-loading"><i class="fas fa-spinner fa-spin"></i> Loading alerts for ' +
            (selectedCity || "your area") +
            "...</div>";
        }

        // Fetch new alerts for selected city
        const newAlertsData = await window.fetchAgriculturalAlerts(
          selectedCity
        );

        // Update the UI with new alerts
        if (newAlertsData && modalBody) {
          const newAlertsUI = window.createAlertsUI(newAlertsData);
          if (newAlertsUI) {
            modalBody.innerHTML = "";
            modalBody.appendChild(newAlertsUI);
          } else {
            modalBody.innerHTML =
              '<div class="alerts-error">No alerts available for ' +
              (selectedCity || "your area") +
              ".</div>";
          }
        }
      });

      locationSelector.appendChild(locationLabel);
      locationSelector.appendChild(citySelect);
      alertsContainer.appendChild(locationSelector);

      // Add location and weather info
      if (alertsData.location && alertsData.weather) {
        const locationHeader = document.createElement("div");
        locationHeader.className = "alerts-location-header";

        const locationCity = alertsData.location.city || "Unknown Location";
        const weatherTemp = alertsData.weather.temp
          ? `${alertsData.weather.temp}°C`
          : "N/A";
        const weatherDate = alertsData.weather.date || "Today";

        locationHeader.innerHTML = `
                <h3><i class="fas fa-map-marker-alt"></i> ${locationCity}</h3>
                <div class="weather-info">
                    <span><i class="fas fa-thermometer-half"></i> ${weatherTemp}</span>
                    <span><i class="fas fa-calendar-day"></i> ${weatherDate}</span>
                </div>
            `;

        alertsContainer.appendChild(locationHeader);
      }

      // Check if there are no alerts at all
      if (!alertsData.hasAlerts) {
        const noAlertsMessage = document.createElement("div");
        noAlertsMessage.className = "no-alerts-message";
        noAlertsMessage.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <p>Good news! There are no agricultural alerts for ${
              alertsData.location.city || "your area"
            } today.</p>
            <p>This means current conditions are favorable for most agricultural activities.</p>
          </div>
        `;
        alertsContainer.appendChild(noAlertsMessage);
      }

      // Plant care alerts
      if (alertsData.plant_alerts && alertsData.plant_alerts.length > 0) {
        const plantAlertsSection = document.createElement("div");
        plantAlertsSection.className = "alerts-section plant-alerts";

        const sectionHeader = document.createElement("h4");
        sectionHeader.innerHTML =
          '<i class="fas fa-leaf"></i> Plant Care Recommendations';
        plantAlertsSection.appendChild(sectionHeader);

        const alertsList = document.createElement("ul");
        alertsData.plant_alerts.forEach((alert) => {
          const alertItem = document.createElement("li");
          alertItem.className = `alert-item ${alert.type}`;
          alertItem.textContent = alert.message;
          alertsList.appendChild(alertItem);
        });

        plantAlertsSection.appendChild(alertsList);
        alertsContainer.appendChild(plantAlertsSection);
      }

      // Pest and disease alerts
      const pestAlertsSection = document.createElement("div");
      pestAlertsSection.className = "alerts-section pest-alerts";

      const pestSectionHeader = document.createElement("h4");
      pestSectionHeader.innerHTML =
        '<i class="fas fa-bug"></i> Pest & Disease Alerts';
      pestAlertsSection.appendChild(pestSectionHeader);

      if (alertsData.pest_alerts && alertsData.pest_alerts.length > 0) {
        // Create separate containers for high, medium and safe risk levels
        const highRiskContainer = document.createElement("div");
        highRiskContainer.className = "risk-container high-risk";
        const highRiskHeader = document.createElement("h5");
        highRiskHeader.className = "risk-header high-risk";
        highRiskHeader.innerHTML =
          '<i class="fas fa-exclamation-triangle"></i> High Risk Alerts';
        highRiskContainer.appendChild(highRiskHeader);

        const mediumRiskContainer = document.createElement("div");
        mediumRiskContainer.className = "risk-container medium-risk";
        const mediumRiskHeader = document.createElement("h5");
        mediumRiskHeader.className = "risk-header medium-risk";
        mediumRiskHeader.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> Medium Risk Alerts';
        mediumRiskContainer.appendChild(mediumRiskHeader);

        const safeContainer = document.createElement("div");
        safeContainer.className = "risk-container safe";
        const safeHeader = document.createElement("h5");
        safeHeader.className = "risk-header safe";
        safeHeader.innerHTML =
          '<i class="fas fa-check-circle"></i> Safe/Beneficial Updates';
        safeContainer.appendChild(safeHeader);

        // Track if we have items in each category
        let hasHighRisk = false;
        let hasMediumRisk = false;
        let hasSafe = false;

        alertsData.pest_alerts.forEach((alert) => {
          const alertItem = document.createElement("li");
          alertItem.className = `alert-item pest ${
            alert.risk_level || "unknown"
          }-risk`;

          // Debug logging for each alert
          console.log(`Rendering alert: ${alert.title}`);
          console.log(`Alert location: ${alert.location}`);

          const alertTitle = document.createElement("h5");
          alertTitle.className = "alert-title";

          // Add location to title if available
          if (alert.location) {
            console.log(`Adding location to title: ${alert.location}`);
            alertTitle.innerHTML = `${alert.title} <span class="alert-location">(${alert.location})</span>`;
          } else {
            console.log("No location available for this alert");
            alertTitle.textContent = alert.title;
          }

          const alertDescription = document.createElement("p");
          alertDescription.className = "alert-description";
          // Limit description length
          const maxLength = 150;
          alertDescription.textContent =
            alert.description.length > maxLength
              ? alert.description.substring(0, maxLength) + "..."
              : alert.description;

          // Create risk analysis element
          const riskAnalysis = document.createElement("p");
          riskAnalysis.className = "risk-analysis";
          riskAnalysis.textContent = alert.risk_analysis || "";

          // Create source element
          const sourceElement = document.createElement("p");
          sourceElement.className = "alert-source";
          sourceElement.innerHTML = `<strong>Source:</strong> ${
            alert.source || "Unknown"
          }`;

          const alertLink = document.createElement("a");
          alertLink.href = alert.link;
          alertLink.target = "_blank";
          alertLink.className = "alert-link";
          alertLink.textContent = "Read full article";

          alertItem.appendChild(alertTitle);
          alertItem.appendChild(alertDescription);
          if (alert.risk_analysis) {
            alertItem.appendChild(riskAnalysis);
          }
          alertItem.appendChild(sourceElement);
          alertItem.appendChild(alertLink);

          // Add to the appropriate risk container
          if (alert.risk_level === "high") {
            if (!highRiskContainer.querySelector("ul")) {
              const ul = document.createElement("ul");
              highRiskContainer.appendChild(ul);
            }
            highRiskContainer.querySelector("ul").appendChild(alertItem);
            hasHighRisk = true;
          } else if (alert.risk_level === "medium") {
            if (!mediumRiskContainer.querySelector("ul")) {
              const ul = document.createElement("ul");
              mediumRiskContainer.appendChild(ul);
            }
            mediumRiskContainer.querySelector("ul").appendChild(alertItem);
            hasMediumRisk = true;
          } else {
            if (!safeContainer.querySelector("ul")) {
              const ul = document.createElement("ul");
              safeContainer.appendChild(ul);
            }
            safeContainer.querySelector("ul").appendChild(alertItem);
            hasSafe = true;
          }
        });

        // Only add containers that have items
        if (hasHighRisk) {
          pestAlertsSection.appendChild(highRiskContainer);
        }
        if (hasMediumRisk) {
          pestAlertsSection.appendChild(mediumRiskContainer);
        }
        if (hasSafe) {
          pestAlertsSection.appendChild(safeContainer);
        }
      } else {
        // Display a message when no pest alerts are available
        const noAlertsMessage = document.createElement("div");
        noAlertsMessage.className = "no-alerts-message";
        noAlertsMessage.innerHTML = `
          <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            <p>No pest or disease alerts for ${
              alertsData.location.city || "your area"
            } today.</p>
          </div>
        `;
        pestAlertsSection.appendChild(noAlertsMessage);
      }

      alertsContainer.appendChild(pestAlertsSection);

      // Weather alerts
      const weatherAlertsSection = document.createElement("div");
      weatherAlertsSection.className = "alerts-section weather-alerts";

      const weatherSectionHeader = document.createElement("h4");
      weatherSectionHeader.innerHTML =
        '<i class="fas fa-cloud-sun-rain"></i> Weather Alerts';
      weatherAlertsSection.appendChild(weatherSectionHeader);

      if (alertsData.weather_alerts && alertsData.weather_alerts.length > 0) {
        // Create separate containers for high, medium and safe risk levels
        const highRiskContainer = document.createElement("div");
        highRiskContainer.className = "risk-container high-risk";
        const highRiskHeader = document.createElement("h5");
        highRiskHeader.className = "risk-header high-risk";
        highRiskHeader.innerHTML =
          '<i class="fas fa-exclamation-triangle"></i> High Risk Weather';
        highRiskContainer.appendChild(highRiskHeader);

        const mediumRiskContainer = document.createElement("div");
        mediumRiskContainer.className = "risk-container medium-risk";
        const mediumRiskHeader = document.createElement("h5");
        mediumRiskHeader.className = "risk-header medium-risk";
        mediumRiskHeader.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> Medium Risk Weather';
        mediumRiskContainer.appendChild(mediumRiskHeader);

        const safeContainer = document.createElement("div");
        safeContainer.className = "risk-container safe";
        const safeHeader = document.createElement("h5");
        safeHeader.className = "risk-header safe";
        safeHeader.innerHTML =
          '<i class="fas fa-check-circle"></i> Favorable Weather';
        safeContainer.appendChild(safeHeader);

        // Track if we have items in each category
        let hasHighRisk = false;
        let hasMediumRisk = false;
        let hasSafe = false;

        alertsData.weather_alerts.forEach((alert) => {
          const alertItem = document.createElement("li");
          alertItem.className = `alert-item weather ${
            alert.risk_level || "unknown"
          }-risk`;

          const alertContent = document.createElement("div");
          alertContent.className = "alert-content";

          const alertIcon = document.createElement("i");

          if (alert.type === "drought") {
            alertIcon.className = "fas fa-tint-slash";
          } else if (alert.type === "frost") {
            alertIcon.className = "fas fa-snowflake";
          } else if (alert.type === "heatwave") {
            alertIcon.className = "fas fa-temperature-high";
          } else {
            alertIcon.className = "fas fa-cloud";
          }

          alertItem.appendChild(alertIcon);

          // Debug logging for weather alert
          console.log(`Rendering weather alert: ${alert.title}`);
          console.log(`Weather alert location: ${alert.location}`);

          const alertTitle = document.createElement("h5");
          // Add location to title if available
          if (alert.location) {
            console.log(`Adding weather location to title: ${alert.location}`);
            alertTitle.innerHTML = `${alert.title} <span class="alert-location">(${alert.location})</span>`;
          } else {
            console.log("No location available for this weather alert");
            alertTitle.textContent = alert.title;
          }
          alertContent.appendChild(alertTitle);

          const alertMessage = document.createElement("p");
          alertMessage.textContent = alert.description;
          alertContent.appendChild(alertMessage);

          // Add risk analysis
          if (alert.risk_analysis) {
            const riskAnalysis = document.createElement("p");
            riskAnalysis.className = "risk-analysis";
            riskAnalysis.textContent = alert.risk_analysis;
            alertContent.appendChild(riskAnalysis);
          }

          // Add source
          const sourceElement = document.createElement("p");
          sourceElement.className = "alert-source";
          sourceElement.innerHTML = `<strong>Source:</strong> ${
            alert.source || "Unknown"
          }`;
          alertContent.appendChild(sourceElement);

          // Add read more link
          if (alert.link) {
            const alertLink = document.createElement("a");
            alertLink.href = alert.link;
            alertLink.className = "alert-link";
            alertLink.target = "_blank";
            alertLink.textContent = "Read more";
            alertContent.appendChild(alertLink);
          }

          alertItem.appendChild(alertContent);

          // Add to the appropriate risk container
          if (alert.risk_level === "high") {
            if (!highRiskContainer.querySelector("ul")) {
              const ul = document.createElement("ul");
              highRiskContainer.appendChild(ul);
            }
            highRiskContainer.querySelector("ul").appendChild(alertItem);
            hasHighRisk = true;
          } else if (alert.risk_level === "medium") {
            if (!mediumRiskContainer.querySelector("ul")) {
              const ul = document.createElement("ul");
              mediumRiskContainer.appendChild(ul);
            }
            mediumRiskContainer.querySelector("ul").appendChild(alertItem);
            hasMediumRisk = true;
          } else {
            if (!safeContainer.querySelector("ul")) {
              const ul = document.createElement("ul");
              safeContainer.appendChild(ul);
            }
            safeContainer.querySelector("ul").appendChild(alertItem);
            hasSafe = true;
          }
        });

        // Only add containers that have items
        if (hasHighRisk) {
          weatherAlertsSection.appendChild(highRiskContainer);
        }
        if (hasMediumRisk) {
          weatherAlertsSection.appendChild(mediumRiskContainer);
        }
        if (hasSafe) {
          weatherAlertsSection.appendChild(safeContainer);
        }
      } else {
        // Display a message when no weather alerts are available
        const noAlertsMessage = document.createElement("div");
        noAlertsMessage.className = "no-alerts-message";
        noAlertsMessage.innerHTML = `
          <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            <p>No weather alerts for ${
              alertsData.location.city || "your area"
            } today.</p>
            <p>Current weather conditions are favorable for agricultural activities.</p>
          </div>
        `;
        weatherAlertsSection.appendChild(noAlertsMessage);
      }

      alertsContainer.appendChild(weatherAlertsSection);

      // Add footer with refresh button and dismiss option
      const alertsFooter = document.createElement("div");
      alertsFooter.className = "alerts-footer";

      const refreshButton = document.createElement("button");
      refreshButton.className = "refresh-alerts-btn";
      refreshButton.innerHTML =
        '<i class="fas fa-sync-alt"></i> Refresh Alerts';
      refreshButton.onclick = showAgriculturalAlerts;

      const dismissButton = document.createElement("button");
      dismissButton.className = "dismiss-alerts-btn";
      dismissButton.innerHTML = "Dismiss for today";
      dismissButton.onclick = dismissAlertsForToday;

      alertsFooter.appendChild(refreshButton);
      alertsFooter.appendChild(dismissButton);
      alertsContainer.appendChild(alertsFooter);

      return alertsContainer;
    };

    // Function to show agricultural alerts in a modal
    window.showAgriculturalAlerts = async function (
      city = null,
      autoTriggered = false
    ) {
      // Create modal container if it doesn't exist
      let alertsModal = document.getElementById("agriAlertsModal");

      if (!alertsModal) {
        alertsModal = document.createElement("div");
        alertsModal.id = "agriAlertsModal";
        alertsModal.className = "agri-alerts-modal";

        // Add close button
        const closeBtn = document.createElement("span");
        closeBtn.className = "alerts-close-btn";
        closeBtn.innerHTML = "&times;";
        closeBtn.onclick = closeAlertsModal;

        // Add modal content container
        const modalContent = document.createElement("div");
        modalContent.className = "alerts-modal-content";

        // Add title
        const modalTitle = document.createElement("div");
        modalTitle.className = "alerts-modal-title";
        modalTitle.innerHTML =
          '<h3><i class="fas fa-exclamation-circle"></i> Agricultural Alerts</h3>';

        // Add body container for alerts
        const modalBody = document.createElement("div");
        modalBody.className = "alerts-modal-body";
        modalBody.innerHTML =
          '<div class="alerts-loading"><i class="fas fa-spinner fa-spin"></i> Loading alerts...</div>';

        // Assemble modal elements
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(modalBody);
        alertsModal.appendChild(modalContent);

        // Add modal to page
        document.body.appendChild(alertsModal);

        // Add keyboard event for closing with Escape key
        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            closeAlertsModal();
          }
        });
      }

      // Show the modal
      alertsModal.style.display = "block";

      try {
        // Try to fetch alerts
        const alertsData = await window.fetchAgriculturalAlerts(city);

        // Filter alerts if auto-triggered to only show high risk ones
        let filteredData = { ...alertsData };
        if (autoTriggered) {
          // Only keep high risk alerts if auto-triggered
          if (filteredData.pest_alerts) {
            filteredData.pest_alerts = filteredData.pest_alerts.filter(
              (alert) => alert.risk_level === "high"
            );
          }
          if (filteredData.weather_alerts) {
            filteredData.weather_alerts = filteredData.weather_alerts.filter(
              (alert) => alert.risk_level === "high"
            );
          }

          // Update the hasAlerts flag based on filtered data
          filteredData.hasAlerts =
            (filteredData.weather_alerts &&
              filteredData.weather_alerts.length > 0) ||
            (filteredData.pest_alerts && filteredData.pest_alerts.length > 0) ||
            (filteredData.plant_alerts && filteredData.plant_alerts.length > 0);

          // If no high risk alerts and this was auto-triggered, close modal and exit
          if (!filteredData.hasAlerts) {
            closeAlertsModal();
            return;
          }
        }

        // Update modal body with alerts UI
        const modalBody = document.querySelector(".alerts-modal-body");
        if (modalBody) {
          const alertsUI = window.createAlertsUI(filteredData);
          if (alertsUI) {
            modalBody.innerHTML = "";
            modalBody.appendChild(alertsUI);
          } else {
            modalBody.innerHTML =
              '<div class="alerts-error">No alerts available at this time.</div>';
          }
        }

        // Record that we've shown alerts today
        localStorage.setItem("agriAlertsLastShown", new Date().toDateString());
      } catch (error) {
        console.error("Error displaying alerts:", error);
        const modalBody = document.querySelector(".alerts-modal-body");
        if (modalBody) {
          modalBody.innerHTML = `<div class="alerts-error">Failed to load alerts: ${error.message}</div>`;
        }
      }
    };

    // Function to close the alerts modal
    window.closeAlertsModal = function () {
      const alertsModal = document.getElementById("agriAlertsModal");
      if (alertsModal) {
        alertsModal.style.display = "none";
      }
    };

    // Function to dismiss alerts for today
    window.dismissAlertsForToday = function () {
      // Save the current date to localStorage to prevent showing alerts again today
      localStorage.setItem("agriAlertsLastShown", new Date().toDateString());

      // Close the modal
      window.closeAlertsModal();
    };
  }

  // Initialize function for agricultural alerts
  function initAgriculturalAlerts() {
    console.log("Initializing agricultural alerts...");

    // Check if we're on a landowner page
    const isLandownerPage = window.location.pathname.includes("/landowner");
    const isLandowner =
      document.body.classList.contains("landowner") ||
      document.querySelector('[data-role="landowner"]') !== null;

    // If we've already initialized, don't do it again
    if (window.agricAlertsInitialized) {
      console.log("Agricultural alerts already initialized.");
      return;
    }

    // Find alert buttons and add click handlers
    const alertButtons = document.querySelectorAll(".agri-alerts-btn");

    alertButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        // Show alerts with default city (null will use auto-detection)
        // Pass false for autoTriggered since user explicitly requested to see alerts
        window.showAgriculturalAlerts(null, false);
      });
    });

    // Mark as initialized
    window.agricAlertsInitialized = true;
  }

  // Add a function to remove the "All Lebanon" option from all select dropdowns
  function removeAllLebanonOption() {
    // Find all select elements in the DOM
    const selects = document.querySelectorAll("select");

    // Loop through all select elements
    selects.forEach(function (select) {
      // Loop through all options in the select
      Array.from(select.options).forEach(function (option) {
        // If the option text contains "All Lebanon", remove it
        if (option.text.includes("All Lebanon")) {
          select.removeChild(option);
        }
      });
    });
  }

  // Set up a MutationObserver to watch for dynamically added select elements
  document.addEventListener("DOMContentLoaded", function () {
    // Call immediately to clean up any existing dropdowns
    removeAllLebanonOption();

    // Set up an observer to watch for dynamically added options
    const observer = new MutationObserver(function () {
      removeAllLebanonOption();
    });

    // Start observing the document
    observer.observe(document, {
      childList: true,
      subtree: true,
    });

    // Initialize agricultural alerts
    initAgriculturalAlerts();
  });
})();
