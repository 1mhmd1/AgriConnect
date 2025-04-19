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
});

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
