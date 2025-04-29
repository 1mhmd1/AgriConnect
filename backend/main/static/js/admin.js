document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  const navItems = document.querySelectorAll(".admin-nav li");
  const sections = document.querySelectorAll(".admin-section");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Remove active class from all items
      navItems.forEach((navItem) => navItem.classList.remove("active"));
      sections.forEach((section) => section.classList.remove("active"));

      // Add active class to clicked item
      item.classList.add("active");
      const sectionId = item.dataset.section;
      document.getElementById(sectionId).classList.add("active");
    });
  });

  // Product Modal
  const modal = document.getElementById("productModal");
  const addProductBtn = document.querySelector(".add-product-btn");
  const closeBtn = document.querySelector(".close");
  const productForm = document.getElementById("productForm");

  addProductBtn.addEventListener("click", () => {
    modal.style.display = "block";
    productForm.reset();
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Handle product form submission
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);

    try {
      const response = await fetch("/admin/products/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      if (response.ok) {
        showNotification("Product saved successfully!");
        modal.style.display = "none";
        window.location.reload();
      } else {
        showNotification("Error saving product. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error saving product. Please try again.", "error");
    }
  });

  // Handle product deletion
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this product?")) {
        const productId = btn.dataset.id;
        try {
          const response = await fetch(`/admin/products/${productId}/`, {
            method: "DELETE",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
            },
          });

          if (response.ok) {
            showNotification("Product deleted successfully!");
            window.location.reload();
          } else {
            showNotification(
              "Error deleting product. Please try again.",
              "error"
            );
          }
        } catch (error) {
          console.error("Error:", error);
          showNotification(
            "Error deleting product. Please try again.",
            "error"
          );
        }
      }
    });
  });

  // Handle order status updates
  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async () => {
      const orderId = select.dataset.id;
      const newStatus = select.value;

      try {
        const response = await fetch(`/admin/orders/${orderId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          showNotification("Order status updated successfully!");
        } else {
          showNotification(
            "Error updating order status. Please try again.",
            "error"
          );
        }
      } catch (error) {
        console.error("Error:", error);
        showNotification(
          "Error updating order status. Please try again.",
          "error"
        );
      }
    });
  });

  // Category Modal Functionality
  const categoryModal = document.getElementById("categoryModal");
  const addCategoryBtn = document.querySelector(".add-category-btn");
  const closeBtnCategory = categoryModal.querySelector(".close");
  const categoryForm = document.getElementById("categoryForm");
  const iconSelect = document.getElementById("categoryIcon");
  const iconPreview = document.getElementById("iconPreview");
  const iconSearch = document.getElementById("iconSearch");
  const iconSearchResults = document.getElementById("iconSearchResults");

  // List of available icons
  const availableIcons = [
    "fa-sun",
    "fa-cloud-rain",
    "fa-wind",
    "fa-seedling",
    "fa-leaf",
    "fa-tree",
    "fa-apple-alt",
    "fa-carrot",
    "fa-wheat-awn",
    "fa-tractor",
    "fa-truck",
    "fa-warehouse",
    "fa-box",
    "fa-boxes-stacked",
    "fa-tag",
    "fa-tags",
    "fa-store",
    "fa-shopping-cart",
    "fa-users",
    "fa-user-farmer",
    "fa-chart-line",
    "fa-chart-bar",
    "fa-chart-pie",
    "fa-chart-area",
    "fa-calendar",
    "fa-clock",
    "fa-bell",
    "fa-envelope",
    "fa-phone",
    "fa-map-marker-alt",
    "fa-globe",
    "fa-database",
    "fa-cog",
    "fa-tools",
    "fa-bug-slash",
    "fa-virus-slash",
    "fa-rat",
    "fa-worm",
    "fa-bottle-droplet",
    "fa-arrow-trend-up",
    "fa-mountain",
    "fa-flask",
  ];

  // Populate icon select dropdown
  function populateIconSelect() {
    iconSelect.innerHTML = '<option value="">Select an Icon</option>';

    // Category groupings
    const categoryGroups = {
      Pesticides: [
        { value: "fa-bug", label: "Insecticides" },
        { value: "fa-seedling", label: "Herbicides" },
        { value: "fa-leaf", label: "Fungicides" },
        { value: "fa-rat", label: "Rodenticides" },
        { value: "fa-worm", label: "Nematicides" },
      ],
      "Plant Nutrition": [
        { value: "fa-bottle-droplet", label: "Fertilizers" },
        { value: "fa-arrow-trend-up", label: "Plant Growth Regulators" },
        { value: "fa-mountain", label: "Soil Conditioners" },
      ],
      Additives: [
        { value: "fa-flask", label: "Adjuvants" },
        { value: "fa-wind", label: "Defoliants" },
        { value: "fa-sun", label: "Desiccants" },
        { value: "fa-recycle", label: "Biopesticides" },
      ],
      "General Icons": availableIcons.map((icon) => ({
        value: icon,
        label: icon.replace("fa-", ""),
      })),
    };

    // Add optgroups for each category
    Object.entries(categoryGroups).forEach(([groupName, icons]) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = groupName;

      icons.forEach((icon) => {
        const option = document.createElement("option");
        option.value = icon.value;
        option.innerHTML = `<i class="fas ${icon.value}"></i> ${icon.label}`;
        optgroup.appendChild(option);
      });

      iconSelect.appendChild(optgroup);
    });
  }

  // Search icons function
  function searchIcons(query) {
    const searchResults = availableIcons.filter((icon) =>
      icon.toLowerCase().includes(query.toLowerCase())
    );

    iconSearchResults.innerHTML = "";

    if (searchResults.length > 0) {
      searchResults.forEach((icon) => {
        const div = document.createElement("div");
        div.className = "icon-search-item";
        div.innerHTML = `<i class="fas ${icon}"></i>${icon.replace("fa-", "")}`;
        div.addEventListener("click", () => {
          selectIcon(icon);
        });
        iconSearchResults.appendChild(div);
      });
      iconSearchResults.classList.add("active");
    } else {
      iconSearchResults.classList.remove("active");
    }
  }

  // Select icon function
  function selectIcon(icon) {
    iconSelect.value = icon;
    iconPreview.className = `fas ${icon}`;
    iconSearch.value = icon.replace("fa-", "");
    iconSearchResults.classList.remove("active");
  }

  // Event listeners
  iconSearch.addEventListener("input", (e) => {
    const query = e.target.value;
    if (query.length > 0) {
      searchIcons(query);
    } else {
      iconSearchResults.classList.remove("active");
    }
  });

  iconSelect.addEventListener("change", function () {
    const selectedIcon = this.value;
    if (selectedIcon) {
      selectIcon(selectedIcon);
    } else {
      iconPreview.className = "";
      iconSearch.value = "";
    }
  });

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !iconSearch.contains(e.target) &&
      !iconSearchResults.contains(e.target)
    ) {
      iconSearchResults.classList.remove("active");
    }
  });

  // Open modal
  addCategoryBtn.addEventListener("click", function () {
    categoryModal.style.display = "block";
    categoryForm.reset();
    iconPreview.className = "fas";
    populateIconSelect();
  });

  // Close modal
  closeBtnCategory.addEventListener("click", function () {
    categoryModal.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === categoryModal) {
      categoryModal.style.display = "none";
    }
  });

  // Handle form submission
  categoryForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(categoryForm);
    const data = {
      name: formData.get("name"),
      icon: formData.get("icon"),
      description: formData.get("description"),
    };

    // Send data to server
    fetch("/admin/categories/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Refresh the page or update the categories table
          window.location.reload();
        } else {
          alert("Error: " + data.error);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while saving the category.");
      });
  });

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

  // Notification system
  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Initialize when document is ready
  document.addEventListener("DOMContentLoaded", function () {
    populateIconSelect();
  });
});
