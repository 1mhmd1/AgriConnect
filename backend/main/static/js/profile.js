document.addEventListener("DOMContentLoaded", function () {
  // Initialize land uploads first to prevent conflicts
  initializeLandImageUpload();

  // Then initialize other components
  initializeMenuNavigation();
  initializeProfileImage();
  initializeProfileTabs();
  initializeTagsInput();
  initializeFormSubmissions();
  initializeBackButton();

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-btn");
  if (tabButtons.length > 0) {
    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Find the tab content container
        const tabContent = this.closest(".profile-tabs")?.nextElementSibling;
        if (!tabContent) return;

        // Get all tab buttons and panes within this tab content
        const allTabButtons =
          this.closest(".profile-tabs")?.querySelectorAll(".tab-btn");
        const allTabPanes = tabContent.querySelectorAll(".tab-pane");

        if (!allTabButtons || !allTabPanes) return;

        // Remove active class from all buttons and panes
        allTabButtons.forEach((btn) => btn.classList.remove("active"));
        allTabPanes.forEach((pane) => pane.classList.remove("active"));

        // Add active class to clicked button
        this.classList.add("active");

        // Add active class to corresponding pane
        const tabId = this.getAttribute("data-tab");
        const targetPane = document.getElementById(`${tabId}-tab`);
        if (targetPane) {
          targetPane.classList.add("active");
        } else {
          console.error(`Tab pane with id ${tabId}-tab not found`);
        }

        // Additionally handle special case for landowner profile section
        if (tabId === "landowner") {
          const landownerProfile = document.getElementById("landowner-profile");
          if (landownerProfile) {
            landownerProfile.style.display = "block";
          }
        } else {
          const landownerProfile = document.getElementById("landowner-profile");
          if (landownerProfile) {
            landownerProfile.style.display = "none";
          }
        }
      });
    });
  }
});

// Notification function
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add to DOM
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Menu Navigation (unchanged)
function initializeMenuNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  const contentSections = document.querySelectorAll(".content-section");

  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = item.getAttribute("href").substring(1);

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

// Profile Image Upload (unchanged)
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

    profileImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          profileImage.src = e.target.result;
          showNotification("Profile picture updated successfully!");
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Profile Tab Navigation (unchanged)
function initializeProfileTabs() {
  const profileTabs = document.querySelectorAll(".profile-tabs .tab-btn");
  const tabPanes = document.querySelectorAll(".tab-content .tab-pane");

  profileTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = `${tab.getAttribute("data-tab")}-tab`;

      profileTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      tabPanes.forEach((pane) => {
        pane.classList.remove("active");
        if (pane.id === targetId) {
          pane.classList.add("active");
        }
      });
    });
  });
}

// Tags Input (unchanged)
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

// Land Image Upload (FIXED VERSION)
function initializeLandImageUpload() {
  document.querySelectorAll(".image-upload-container").forEach((container) => {
    setupImageUpload(container);
  });

  const landListings = document.querySelector(".land-listings");
  const addListingBtn = createAddListingButton();
  landListings.appendChild(addListingBtn);

  addListingBtn.addEventListener("click", () => {
    const listingCount = landListings.querySelectorAll(".land-card").length + 1;
    const newCard = createLandCard(listingCount);
    landListings.insertBefore(newCard, addListingBtn);

    setupImageUpload(newCard.querySelector(".image-upload-container"));
    initializeFormSubmission(newCard.querySelector("form"));
  });
}

function setupImageUpload(container) {
  if (container.dataset.initialized) return;
  container.dataset.initialized = "true";

  const input = container.querySelector('input[type="file"]');
  const previewGrid = container.querySelector(".image-preview-grid");

  // Clone input to remove existing listeners
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);

  newInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = createImagePreview(e.target.result);
          previewGrid.appendChild(preview);
          validateImageUpload(container);
        };
        reader.readAsDataURL(file);
      }
    });
  });
}

function createImagePreview(imageSrc) {
  const preview = document.createElement("div");
  preview.className = "image-preview";
  preview.innerHTML = `
    <img src="${imageSrc}" alt="Land preview">
    <button type="button" class="remove-image">
      <i class="fas fa-times"></i>
    </button>
  `;

  preview.querySelector(".remove-image").addEventListener("click", () => {
    preview.remove();
    validateImageUpload(preview.closest(".image-upload-container"));
  });

  return preview;
}

function validateImageUpload(container) {
  const previewGrid = container.querySelector(".image-preview-grid");
  const input = container.querySelector('input[type="file"]');
  const hasImages = previewGrid.children.length > 0;

  input.setCustomValidity(hasImages ? "" : "Please upload at least one image");
}

function createAddListingButton() {
  const button = document.createElement("button");
  button.className = "save-btn";
  button.style.marginTop = "2rem";
  button.innerHTML = '<i class="fas fa-plus"></i> Add New Land Listing';
  return button;
}

function createLandCard(listingCount) {
  const card = document.createElement("div");
  card.className = "land-card";
  card.innerHTML = `
    <h3>Land Listing #${listingCount}</h3>
    <form class="profile-form" id="landownerProfileForm">
      <div class="form-group">
        <label for="landImages${listingCount}">Land Images (Required)</label>
        <div class="image-upload-container">
          <div class="image-preview-grid" id="landImagesPreview${listingCount}">
            <!-- Images will be previewed here -->
          </div>
          <div class="image-upload-box">
            <input
              type="file"
              id="landImages${listingCount}"
              accept="image/*"
              multiple
              required
            />
            <label for="landImages${listingCount}" class="upload-label">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Click to upload images</span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="landSize${listingCount}">Size (Acres)</label>
        <input
          type="number"
          id="landSize${listingCount}"
          min="0"
          step="0.1"
          required
        />
      </div>
      <div class="form-group">
        <label for="soilType${listingCount}">Soil Type</label>
        <select id="soilType${listingCount}" required>
          <option value="loam">Loam</option>
          <option value="clay">Clay</option>
          <option value="sandy">Sandy</option>
        </select>
      </div>
      <div class="form-group">
        <label for="waterSource${listingCount}">Water Source</label>
        <select id="waterSource${listingCount}" required>
          <option value="well">Well</option>
          <option value="river">River</option>
          <option value="canal">Canal</option>
        </select>
      </div>
      <div class="form-group">
        <label>Lease Terms</label>
        <div class="checkbox-group">
          <label><input type="checkbox" value="short-term" name="lease_terms${listingCount}[]"> Short-Term</label>
          <label><input type="checkbox" value="long-term" name="lease_terms${listingCount}[]"> Long-Term</label>
          <label><input type="checkbox" value="lease-to-own" name="lease_terms${listingCount}[]"> Lease-to-Own</label>
        </div>
      </div>
      <div class="form-group">
        <label for="pricePerAcre${listingCount}">Price per Acre</label>
        <input
          type="number"
          id="pricePerAcre${listingCount}"
          min="0"
          step="0.01"
          required
        />
      </div>
      <button type="submit" class="save-btn">Save Changes</button>
      <button type="button" class="delete-btn">Delete Listing</button>
    </form>
  `;

  // Add delete functionality
  const deleteBtn = card.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this listing?")) {
      card.remove();
      showNotification("Land listing deleted successfully!");
    }
  });

  return card;
}

// Rest of the code remains the same as in your original version
// (Form Submissions, Back Button, Notification System, API Functions)

function initializeFormSubmission(form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Special handling for land listing forms
    if (form.closest(".land-card")) {
      const imageUpload = form.querySelector(".image-upload-container");
      if (
        imageUpload.querySelector(".image-preview-grid").children.length === 0
      ) {
        showNotification(
          "Please upload at least one image for the land listing",
          "error"
        );
        return;
      }

      // Create FormData object for file upload
      const formData = new FormData();
      formData.append("form_type", "land_listing");

      // Get all form inputs
      const inputs = form.querySelectorAll("input, select");
      inputs.forEach((input) => {
        if (input.type === "file") {
          // Handle file inputs
          const files = input.files;
          for (let i = 0; i < files.length; i++) {
            formData.append("landImages", files[i]);
          }
        } else if (input.type === "checkbox") {
          // Handle checkboxes (lease terms)
          if (input.checked) {
            formData.append("lease_terms[]", input.value);
          }
        } else {
          // Handle other inputs
          const fieldName = input.id.replace(/[0-9]/g, "");
          formData.append(fieldName, input.value);
        }
      });

      // Submit the form data
      fetch("/profile/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      })
        .then((response) => {
          if (response.ok) {
            showNotification("Land listing saved successfully!");
            window.location.reload();
          } else {
            showNotification(
              "Error saving land listing. Please try again.",
              "error"
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showNotification(
            "Error saving land listing. Please try again.",
            "error"
          );
        });
    } else {
      // Handle base profile form
      const formData = new FormData(form);
      formData.append("form_type", "base_profile");

      fetch("/profile/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            showNotification(data.message);
            // Update form fields with saved values
            if (data.phone) {
              document.getElementById("phone").value = data.phone;
            }
            if (data.location) {
              document.getElementById("location").value = data.location;
            }
          } else {
            showNotification(
              data.message || "Error saving changes. Please try again.",
              "error"
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          showNotification("Error saving changes. Please try again.", "error");
        });
    }
  });
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

function initializeFormSubmissions() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(this);

      // Add CSRF token if not already present
      if (!formData.has("csrfmiddlewaretoken")) {
        const csrfToken = document.querySelector(
          "[name=csrfmiddlewaretoken]"
        ).value;
        formData.append("csrfmiddlewaretoken", csrfToken);
      }

      // Send form data to server
      fetch(window.location.href, {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRFToken": getCookie("csrftoken"),
        },
      })
        .then((response) => {
          // Log response status and headers for debugging
          console.log("Response status:", response.status);
          console.log(
            "Response headers:",
            Object.fromEntries(response.headers.entries())
          );

          // Check if the response is a redirect
          if (response.redirected) {
            window.location.href = response.url;
            return;
          }

          // Get the content type of the response
          const contentType = response.headers.get("content-type");

          // Handle JSON response
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          }

          // Handle HTML response (likely an error page)
          return response.text().then((html) => {
            // Log the HTML response for debugging
            console.log(
              "Received HTML response:",
              html.substring(0, 500) + "..."
            );

            // Check for specific error messages in the HTML
            if (html.includes("CSRF verification failed")) {
              throw new Error(
                "Session expired. Please refresh the page and try again."
              );
            } else if (html.includes("403 Forbidden")) {
              throw new Error(
                "You don't have permission to perform this action."
              );
            } else if (html.includes("400 Bad Request")) {
              throw new Error(
                "Invalid form data. Please check your input and try again."
              );
            } else if (html.includes("500 Internal Server Error")) {
              throw new Error("Server error. Please try again later.");
            } else {
              throw new Error(
                "Server returned an unexpected response. Please try again."
              );
            }
          });
        })
        .then((data) => {
          if (data && data.status === "success") {
            showNotification(data.message || "Changes saved successfully");

            // If this is a landowner form submission, reload the page to show the new land listing
            if (this.id === "landownerProfileForm") {
              window.location.reload();
            } else {
              // Update form fields with saved values if applicable
              if (data.phone) {
                document.getElementById("phone").value = data.phone;
              }
              if (data.location) {
                document.getElementById("location").value = data.location;
              }
            }
          } else if (data && data.error) {
            showNotification(data.error, "error");
          } else {
            showNotification("Changes saved successfully");
          }
        })
        .catch((error) => {
          console.error("Form submission error:", error);

          // Check if the error has a response property
          if (error.response) {
            // Handle response errors
            const status = error.response.status;
            let errorMessage = "An error occurred while saving changes.";

            switch (status) {
              case 400:
                errorMessage =
                  "Invalid form data. Please check your input and try again.";
                break;
              case 403:
                errorMessage =
                  "You don't have permission to perform this action.";
                break;
              case 404:
                errorMessage = "The requested resource was not found.";
                break;
              case 500:
                errorMessage = "Server error. Please try again later.";
                break;
              default:
                errorMessage = `Error (${status}): Please try again.`;
            }

            showNotification(errorMessage, "error");
          } else {
            // Handle other types of errors
            showNotification(
              error.message || "Error saving changes. Please try again.",
              "error"
            );
          }
        });
    });
  });
}

function initializeBackButton() {
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", function () {
      window.history.back();
    });
  }
}

// Helper function to handle form submission
async function submitForm(form, formType) {
  try {
    const formData = new FormData(form);
    formData.append("form_type", formType);

    // Add CSRF token
    const csrfToken = getCookie("csrftoken");
    if (!csrfToken) {
      throw new Error("CSRF token not found");
    }

    // Get the form's action URL or use the current URL
    const actionUrl = form.getAttribute("action") || window.location.href;

    const response = await fetch(actionUrl, {
      method: "POST",
      body: formData,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRFToken": csrfToken,
      },
    });

    // Log response details for debugging
    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Server error occurred");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Form submission error:", error);
    throw error;
  }
}

// Handle base profile form submission
const baseProfileForm = document.getElementById("baseProfileForm");
if (baseProfileForm) {
  baseProfileForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    try {
      const data = await submitForm(this, "base_profile");
      if (data.status === "success") {
        showNotification(data.message);
        if (data.phone) {
          document.querySelector(
            ".profile-info p:nth-child(2)"
          ).textContent = `Phone: ${data.phone}`;
        }
        if (data.location) {
          document.querySelector(
            ".profile-info p:nth-child(3)"
          ).textContent = `Location: ${data.location}`;
        }
      } else {
        showNotification(data.message, "error");
      }
    } catch (error) {
      showNotification(
        error.message || "An error occurred while updating your profile",
        "error"
      );
    }
  });
}

// Handle farmer profile form submission
const farmerProfileForm = document.getElementById("farmerProfileForm");
if (farmerProfileForm) {
  farmerProfileForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    try {
      const data = await submitForm(this, "farmer");
      if (data.status === "success") {
        showNotification(data.message);
      } else {
        showNotification(data.message, "error");
      }
    } catch (error) {
      showNotification(
        error.message || "An error occurred while updating your farmer profile",
        "error"
      );
    }
  });
}

// Handle landowner profile form submission
const landownerProfileForm = document.getElementById("landownerProfileForm");
if (landownerProfileForm) {
  landownerProfileForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    try {
      const data = await submitForm(this, "landowner_profile");
      if (data.status === "success") {
        showNotification(data.message);
        window.location.reload();
      } else {
        showNotification(data.message, "error");
      }
    } catch (error) {
      showNotification(
        error.message || "An error occurred while creating your land listing",
        "error"
      );
    }
  });
}

// Handle security form submission
const securityForm = document.getElementById("securityForm");
if (securityForm) {
  securityForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    try {
      const data = await submitForm(this, "security");
      if (data.status === "success") {
        showNotification(data.message);
        this.reset();
      } else {
        showNotification(data.message, "error");
      }
    } catch (error) {
      showNotification(
        error.message || "An error occurred while updating your password",
        "error"
      );
    }
  });
}

// Handle profile picture upload
const profilePictureForm = document.getElementById("profilePictureForm");
if (profilePictureForm) {
  profilePictureForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    try {
      const data = await submitForm(this, "profile_picture");
      if (data.status === "success") {
        showNotification(data.message);
        window.location.reload();
      } else {
        showNotification(data.message, "error");
      }
    } catch (error) {
      showNotification(
        error.message ||
          "An error occurred while updating your profile picture",
        "error"
      );
    }
  });
}
