// Initialize all components when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize components
  initializeMenuNavigation();
  initializeProfileImage();
  initializeProfileTabs();
  initializeTagsInput();
  initializeFormSubmissions();
  initializeBackButton();
  initializePasswordToggles();
  initializePasswordStrengthMeter();
  setupPasswordValidation();
});

// Notification function
function showNotification(message, type = "success") {
  const container = document.getElementById("notificationContainer");
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const icon = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";

  notification.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="notification-content">
      <div class="notification-title">${
        type === "success" ? "Success" : "Error"
      }</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Menu Navigation
function initializeMenuNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  const contentSections = document.querySelectorAll(".content-section");

  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = item.getAttribute("data-section");

      menuItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      contentSections.forEach((section) => {
        section.classList.remove("active");
        if (section.id === targetId) {
          section.classList.add("active");
        }
      });
    });
  });
}

// Profile Image Upload
function initializeProfileImage() {
  const profileImageContainer = document.querySelector(
    ".profile-image-container"
  );
  const profileImage = document.getElementById("profileImage");
  const profileImageInput = document.getElementById("profileImageInput");

  if (profileImageContainer && profileImageInput) {
    profileImageContainer.addEventListener("click", () => {
      profileImageInput.click();
    });

    profileImageInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        // Create form data
        const formData = new FormData();
        formData.append("form_type", "base_profile");
        formData.append("profile_picture", file);

        try {
          const csrfToken = getCookie("csrftoken");
          const response = await fetch(window.location.href, {
            method: "POST",
            body: formData,
            headers: {
              "X-Requested-With": "XMLHttpRequest",
              "X-CSRFToken": csrfToken,
              Accept: "application/json",
            },
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.status === "success" && data.data.profile_picture) {
              // Update the image source with the new URL from the server
              profileImage.src = data.data.profile_picture;
              showNotification("Profile picture updated successfully!");
            } else {
              throw new Error("Failed to update profile picture");
            }
          } else {
            throw new Error("Failed to update profile picture");
          }
        } catch (error) {
          console.error("Error uploading profile picture:", error);
          showNotification("Failed to update profile picture.", "error");
        }
      }
    });
  }
}

// Profile Tab Navigation
function initializeProfileTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons and panes
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      // Add active class to clicked button and corresponding pane
      this.classList.add("active");
      const tabId = this.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });
}

// Tags Input
function initializeTagsInput() {
  const tagsInputs = document.querySelectorAll(".tags-input");

  tagsInputs.forEach((input) => {
    const inputField = input.querySelector("input");

    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && inputField.value.trim()) {
        e.preventDefault();
        addTag(inputField.value.trim(), input);
        inputField.value = "";
      }
    });
  });
}

function addTag(text, container) {
  const tag = document.createElement("div");
  tag.className = "tag";
  tag.textContent = text;

  tag.addEventListener("click", () => {
    tag.remove();
  });

  const input = container.querySelector("input");
  container.insertBefore(tag, input);
}

// Helper function to get CSRF token
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Form Submissions
function initializeFormSubmissions() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData();
      const csrfToken = getCookie("csrftoken"); // Get CSRF token from cookie

      if (form.id === "baseProfileForm") {
        // Handle base profile form
        formData.append("form_type", "base_profile");
        formData.append("fullName", form.querySelector("#fullName").value);
        formData.append("phone", form.querySelector("#phone").value);
        formData.append("location", form.querySelector("#location").value);
      } else if (form.id === "farmerProfileForm") {
        // Handle farmer profile form
        formData.append("form_type", "farmer_profile");

        // Get farming method and experience
        formData.append(
          "farming_method",
          form.querySelector("#farmingMethod").value
        );
        formData.append(
          "experience_years",
          form.querySelector("#experience").value
        );

        // Get crops
        const cropTags = form
          .querySelector("#crops")
          .parentElement.querySelectorAll(".tag");
        const crops = Array.from(cropTags).map((tag) => tag.textContent);
        formData.append("crops[]", JSON.stringify(crops));

        // Get livestock
        const livestockTags = form
          .querySelector("#livestock")
          .parentElement.querySelectorAll(".tag");
        const livestock = Array.from(livestockTags).map(
          (tag) => tag.textContent
        );
        formData.append("livestock[]", JSON.stringify(livestock));

        // Get equipment
        const equipmentTags = form
          .querySelector("#equipment")
          .parentElement.querySelectorAll(".tag");
        const equipment = Array.from(equipmentTags).map(
          (tag) => tag.textContent
        );
        formData.append("equipment[]", JSON.stringify(equipment));
      } else if (form.id === "securityForm") {
        // Handle security/password change form
        formData.append("form_type", "password_change");
        formData.append(
          "current_password",
          form.querySelector("#currentPassword").value
        );
        formData.append(
          "new_password",
          form.querySelector("#newPassword").value
        );
        formData.append(
          "confirm_password",
          form.querySelector("#confirmPassword").value
        );

        // Validate passwords match
        if (
          form.querySelector("#newPassword").value !==
          form.querySelector("#confirmPassword").value
        ) {
          showNotification("New passwords don't match!", "error");
          return;
        }
      } else if (form.id === "landownerProfileForm") {
        // Handle landowner profile form
        formData.append("form_type", "landowner_profile");

        // Get land images
        const landImagesInput = form.querySelector("#landImages");
        if (landImagesInput.files.length > 0) {
          for (let i = 0; i < landImagesInput.files.length; i++) {
            formData.append("land_images", landImagesInput.files[i]);
          }
        }

        // Get land size
        formData.append("land_size", form.querySelector("#landSize").value);

        // Get soil type
        formData.append("soil_type", form.querySelector("#soilType").value);

        // Get water source
        formData.append(
          "water_source",
          form.querySelector("#waterSource").value
        );

        // Get lease terms
        const leaseTerms = Array.from(
          form.querySelectorAll('input[name="lease_terms"]:checked')
        )
          .map((checkbox) => checkbox.value)
          .join(",");
        formData.append("lease_terms", leaseTerms);

        // Get price per acre
        formData.append(
          "price_per_acre",
          form.querySelector("#pricePerAcre").value
        );

        // Get location
        formData.append("location", form.querySelector("#location").value);

        // Get description
        formData.append(
          "description",
          form.querySelector("#description").value
        );
      }

      try {
        const response = await fetch(window.location.href, {
          method: "POST",
          body: formData,
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRFToken": csrfToken,
            Accept: "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Server error response:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "success") {
          showNotification(data.message || "Changes saved successfully");
        } else {
          throw new Error(data.message || "Server returned error status");
        }
      } catch (error) {
        console.error("❌ Form submission error:", error);
        showNotification(
          error.message || "Error saving changes. Please try again.",
          "error"
        );
      }
    });
  });
}

// Back Button
function initializeBackButton() {
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", function () {
      window.history.back();
    });
  }
}

// Password Toggle Functionality
function initializePasswordToggles() {
  const toggleButtons = document.querySelectorAll(".password-toggle-btn");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });
}

// Password Strength Meter
function initializePasswordStrengthMeter() {
  const passwordInput = document.getElementById("newPassword");
  if (!passwordInput) return;

  const strengthMeter = document.querySelector(".password-strength");
  const strengthText = document.querySelector(".password-strength-text span");

  passwordInput.addEventListener("input", function () {
    const password = this.value;
    const strength = checkPasswordStrength(password);

    // Remove all classes
    strengthMeter.classList.remove("weak", "medium", "strong", "very-strong");

    if (password.length === 0) {
      strengthText.textContent = "None";
    } else {
      switch (strength) {
        case 0:
          strengthMeter.classList.add("weak");
          strengthText.textContent = "Weak";
          break;
        case 1:
          strengthMeter.classList.add("medium");
          strengthText.textContent = "Medium";
          break;
        case 2:
          strengthMeter.classList.add("strong");
          strengthText.textContent = "Strong";
          break;
        case 3:
          strengthMeter.classList.add("very-strong");
          strengthText.textContent = "Very Strong";
          break;
      }
    }

    // Update requirement checks
    updatePasswordRequirements(password);
  });
}

function checkPasswordStrength(password) {
  if (password.length === 0) return -1;

  let strength = 0;

  // Check length
  if (password.length >= 8) strength++;

  // Check for mixed case
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;

  // Check for numbers
  if (password.match(/\d/)) strength++;

  // Check for special characters
  if (password.match(/[^a-zA-Z\d]/)) strength++;

  return Math.floor(strength / 1.5);
}

function updatePasswordRequirements(password) {
  const requirementItems = document.querySelectorAll(
    ".password-requirements li"
  );

  // Reset classes
  requirementItems.forEach((item) => item.classList.remove("met"));

  if (password.length >= 8) {
    requirementItems[0].classList.add("met");
  }

  if (password.match(/[A-Z]/)) {
    requirementItems[1].classList.add("met");
  }

  if (password.match(/\d/)) {
    requirementItems[2].classList.add("met");
  }

  if (password.match(/[^a-zA-Z\d]/)) {
    requirementItems[3].classList.add("met");
  }
}

// Password validation and strength meter
function setupPasswordValidation() {
  const passwordField = document.getElementById("newPassword");
  const confirmPasswordField = document.getElementById("confirmPassword");
  const passwordStrength = document.querySelector(".password-strength");
  const passwordStrengthText = document.querySelector(
    ".password-strength-text"
  );
  const passwordRequirements = document.querySelectorAll(
    ".password-requirements li"
  );

  if (!passwordField) return;

  // Password validation rules
  const passwordRules = {
    length: { regex: /.{8,}/, element: document.getElementById("req-length") },
    uppercase: {
      regex: /[A-Z]/,
      element: document.getElementById("req-uppercase"),
    },
    lowercase: {
      regex: /[a-z]/,
      element: document.getElementById("req-lowercase"),
    },
    number: { regex: /[0-9]/, element: document.getElementById("req-number") },
    special: {
      regex: /[^A-Za-z0-9]/,
      element: document.getElementById("req-special"),
    },
  };

  // Check password strength
  function checkPasswordStrength(password) {
    if (!password) {
      updateStrengthMeter(0, "");
      return;
    }

    let strength = 0;
    let status = "";

    // Update requirement indicators
    Object.keys(passwordRules).forEach((rule) => {
      const { regex, element } = passwordRules[rule];
      const isMet = regex.test(password);

      if (element) {
        if (isMet) {
          element.classList.add("met");
          strength += 1;
        } else {
          element.classList.remove("met");
        }
      }
    });

    // Determine strength level
    if (strength === 0) {
      status = "";
    } else if (strength <= 2) {
      status = "weak";
    } else if (strength <= 3) {
      status = "medium";
    } else if (strength <= 4) {
      status = "strong";
    } else {
      status = "very-strong";
    }

    updateStrengthMeter(strength, status);
  }

  // Update the strength meter UI
  function updateStrengthMeter(strength, status) {
    if (passwordStrength) {
      passwordStrength.className = "password-strength";
      if (status) {
        passwordStrength.classList.add(status);
      }
    }

    if (passwordStrengthText) {
      let strengthText = "";
      switch (status) {
        case "weak":
          strengthText = '<span style="color: var(--error-color);">Weak</span>';
          break;
        case "medium":
          strengthText =
            '<span style="color: var(--warning-color);">Medium</span>';
          break;
        case "strong":
          strengthText =
            '<span style="color: var(--info-color);">Strong</span>';
          break;
        case "very-strong":
          strengthText =
            '<span style="color: var(--success-color);">Very Strong</span>';
          break;
        default:
          strengthText = "";
      }

      passwordStrengthText.innerHTML = strengthText
        ? `Password Strength: ${strengthText}`
        : "";
    }
  }

  // Validate passwords match
  function validatePasswordsMatch() {
    if (!confirmPasswordField || !passwordField) return;

    const password = passwordField.value;
    const confirmPassword = confirmPasswordField.value;

    if (confirmPassword && password !== confirmPassword) {
      confirmPasswordField.setCustomValidity("Passwords do not match");
    } else {
      confirmPasswordField.setCustomValidity("");
    }
  }

  // Check if password meets minimum requirements
  function passwordMeetsRequirements(password) {
    return Object.keys(passwordRules).every((rule) => {
      return passwordRules[rule].regex.test(password);
    });
  }

  // Event listeners
  if (passwordField) {
    passwordField.addEventListener("input", function () {
      const password = this.value;
      checkPasswordStrength(password);
      validatePasswordsMatch();

      // Check if password meets all requirements
      if (password && !passwordMeetsRequirements(password)) {
        this.setCustomValidity("Please meet all password requirements");
      } else {
        this.setCustomValidity("");
      }
    });
  }

  if (confirmPasswordField) {
    confirmPasswordField.addEventListener("input", validatePasswordsMatch);
  }

  // Initialize strength meter
  if (passwordField) {
    checkPasswordStrength(passwordField.value);
  }
}
