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
      <!-- Rest of the form elements -->
    </form>
  `;

  // Updated delete functionality
  const deleteBtn = card.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this listing?")) {
      const container = card.querySelector(".image-upload-container");
      container?.removeAttribute("data-initialized");
      card.remove();
      showNotification("Land listing deleted successfully!");
    }
  });

  return card;
}

// Rest of the code remains the same as in your original version
// (Form Submissions, Back Button, Notification System, API Functions)
