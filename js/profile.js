document.addEventListener("DOMContentLoaded", function () {
  // Initialize all components
  initializeMenuNavigation();
  initializeProfileImage();
  initializeProfileTabs();
  initializeTagsInput();
  initializeLandImageUpload();
  initializeFormSubmissions();
  initializeBackButton();
});

// Menu Navigation
function initializeMenuNavigation() {
  const menuItems = document.querySelectorAll(".menu-item");
  const contentSections = document.querySelectorAll(".content-section");

  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = item.getAttribute("href").substring(1);

      // Update menu items
      menuItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      // Update content sections
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

// Profile Tab Navigation
function initializeProfileTabs() {
  const profileTabs = document.querySelectorAll(".profile-tabs .tab-btn");
  const tabPanes = document.querySelectorAll(".tab-content .tab-pane");

  profileTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = `${tab.getAttribute("data-tab")}-tab`;

      // Update active state of tabs
      profileTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Show corresponding content
      tabPanes.forEach((pane) => {
        pane.classList.remove("active");
        if (pane.id === targetId) {
          pane.classList.add("active");
        }
      });
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

// Land Image Upload
function initializeLandImageUpload() {
  // Initialize existing land image uploads
  document.querySelectorAll(".image-upload-container").forEach((container) => {
    setupImageUpload(container);
  });

  // Add New Land Listing Button
  const landListings = document.querySelector(".land-listings");
  const addListingBtn = createAddListingButton();
  landListings.appendChild(addListingBtn);

  addListingBtn.addEventListener("click", () => {
    const listingCount = landListings.querySelectorAll(".land-card").length + 1;
    const newCard = createLandCard(listingCount);
    landListings.insertBefore(newCard, addListingBtn);

    // Initialize image upload for the new form
    setupImageUpload(newCard.querySelector(".image-upload-container"));
    initializeFormSubmission(newCard.querySelector("form"));
  });
}

function setupImageUpload(container) {
  const input = container.querySelector('input[type="file"]');
  const previewGrid = container.querySelector(".image-preview-grid");

  input.addEventListener("change", (e) => {
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
    <form class="profile-form">
      <div class="form-group">
        <label for="landImages${listingCount}">Land Images (Required)</label>
        <div class="image-upload-container">
          <div class="image-preview-grid"></div>
          <div class="image-upload-box">
            <input type="file" id="landImages${listingCount}" accept="image/*" multiple required>
            <label for="landImages${listingCount}" class="upload-label">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>Click to upload images</span>
            </label>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="landSize${listingCount}">Size (Acres)</label>
        <input type="number" id="landSize${listingCount}" min="0" step="0.1" required>
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
          <label><input type="checkbox" value="short-term"> Short-Term</label>
          <label><input type="checkbox" value="long-term"> Long-Term</label>
          <label><input type="checkbox" value="lease-to-own"> Lease-to-Own</label>
        </div>
      </div>
      <div class="form-group">
        <label for="pricePerAcre${listingCount}">Price per Acre</label>
        <input type="number" id="pricePerAcre${listingCount}" min="0" step="0.01" required>
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

// Form Submissions
function initializeFormSubmissions() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => initializeFormSubmission(form));
}

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
    }

    showNotification("Changes saved successfully!");
  });
}

// Back Button
function initializeBackButton() {
  const backButton = document.querySelector(".back-button");
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.history.back();
    });
  }
}

// Notification System
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === "success" ? "#1e6b40" : "#dc3545"};
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Remove notification after delay
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
