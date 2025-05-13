// User menu dropdown functionality
document.addEventListener("DOMContentLoaded", function () {
  // Set a default STATIC_URL if it doesn't exist
  window.STATIC_URL = window.STATIC_URL || "/static/";

  // Agricultural Alert Close Function
  window.closeAlert = function () {
    try {
      const alert = document.getElementById("agriculturalAlert");
      if (alert) {
        // Get the alert title and message before removing it
        const alertTitle = alert.querySelector(
          ".agricultural-alert-title"
        ).innerText;
        const alertMessage = alert.querySelector(
          ".agricultural-alert-message"
        ).innerText;

        // Store the alert content in localStorage for later viewing in the notifications section
        const alertData = {
          title: alertTitle,
          message: alertMessage,
          date: new Date().toISOString(),
          read: false,
          type: "agricultural",
        };

        // Get existing notifications or initialize empty array
        const notifications = JSON.parse(
          localStorage.getItem("userNotifications") || "[]"
        );

        // Add new alert to notifications if it doesn't already exist
        const alertExists = notifications.some(
          (notif) =>
            notif.title === alertTitle && notif.message === alertMessage
        );
        if (!alertExists) {
          notifications.unshift(alertData); // Add to beginning of array
          localStorage.setItem(
            "userNotifications",
            JSON.stringify(notifications)
          );
        }

        // Force removal of the alert element from DOM
        alert.parentNode.removeChild(alert);

        // Mark that we've seen this alert
        localStorage.setItem("agricAlertClosed", "true");

        console.log("Alert closed and removed from DOM");
      } else {
        console.log("Alert element not found");
      }
    } catch (error) {
      console.error("Error closing alert:", error);
    }
  };

  // Check if alert should be hidden on page load
  document.addEventListener("DOMContentLoaded", function () {
    try {
      const shouldHideAlert =
        localStorage.getItem("agricAlertClosed") === "true";
      const agricAlert = document.getElementById("agriculturalAlert");
      if (shouldHideAlert && agricAlert) {
        agricAlert.parentNode.removeChild(agricAlert);
        console.log("Alert hidden on page load");
      }
    } catch (error) {
      console.error("Error checking alert visibility:", error);
    }
  });

  // Function to generate rating stars
  function generateRatingStars(rating) {
    let stars = "";
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const remainingStars = 5 - Math.ceil(rating || 0);
    for (let i = 0; i < remainingStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }
    return stars;
  }

  // Clean up wishlist to remove any invalid entries
  function cleanupWishlist() {
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const validWishlistItems = wishlist.filter(
      (item) =>
        item &&
        item.id &&
        item.name &&
        item.name !== "undefined" &&
        item.price &&
        item.image
    );

    if (validWishlistItems.length !== wishlist.length) {
      console.log(
        `Removed ${
          wishlist.length - validWishlistItems.length
        } invalid wishlist items`
      );
      localStorage.setItem("wishlist", JSON.stringify(validWishlistItems));
    }
  }

  // Call cleanup when page loads
  cleanupWishlist();

  // Function to get CSRF token from cookies
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

  // Function to show notifications
  function showNotification(message, type = "success") {
    // Check if notification container exists, if not create it
    let notificationContainer = document.querySelector(
      ".notification-container"
    );
    if (!notificationContainer) {
      notificationContainer = document.createElement("div");
      notificationContainer.className = "notification-container";
      document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to container
    notificationContainer.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => {
        notification.remove();
        // Remove container if empty
        if (notificationContainer.children.length === 0) {
          notificationContainer.remove();
        }
      }, 300);
    }, 3000);
  }

  // User menu dropdown
  const userIcon = document.getElementById("userIcon");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (userIcon) {
    userIcon.addEventListener("click", () => {
      dropdownMenu.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    window.addEventListener("click", (e) => {
      if (!e.target.matches("#userIcon")) {
        if (dropdownMenu.classList.contains("show")) {
          dropdownMenu.classList.remove("show");
        }
      }
    });
  }

  // Global function to synchronize all wishlist buttons for a product
  // This will be accessible to all JS files
  window.synchronizeWishlistButtons = function (productId, isInWishlist) {
    console.log(
      `Synchronizing wishlist status for product ${productId}: ${
        isInWishlist ? "Added" : "Removed"
      }`
    );

    // Find all wishlist buttons with this product ID across the page
    document
      .querySelectorAll(`.wishlist-btn[data-product-id="${productId}"]`)
      .forEach((button) => {
        if (isInWishlist) {
          button.classList.add("active");
          const icon = button.querySelector("i");
          if (icon) {
            icon.style.color = "#ff4444";
            icon.className = "fas fa-heart";
          }
        } else {
          button.classList.remove("active");
          const icon = button.querySelector("i");
          if (icon) {
            icon.style.color = "";
            icon.className = "far fa-heart";
          }
        }

        // Update button text if it exists
        const textSpan = button.querySelector("span");
        if (textSpan) {
          textSpan.textContent = isInWishlist
            ? "Remove from Wishlist"
            : "Add to Wishlist";
        }
      });
  };

  // Wishlist functionality
  function updateWishlistButton(button, isInWishlist) {
    if (isInWishlist) {
      button.classList.add("active");
      button.querySelector("i").style.color = "#ff4444";
    } else {
      button.classList.remove("active");
      button.querySelector("i").style.color = "";
    }
  }

  function getProductData(card) {
    if (!card) {
      console.error("Product card element not found");
      return null;
    }

    // Try to get the product ID from different sources
    let productId = card.dataset.productId;

    // If product ID is not on the card, try to get it from the wishlist button
    if (!productId) {
      const wishlistBtn = card.querySelector(".wishlist-btn");
      if (wishlistBtn && wishlistBtn.dataset.productId) {
        productId = wishlistBtn.dataset.productId;
      }
    }

    // If still no product ID, try the cart button
    if (!productId) {
      const cartBtn = card.querySelector(".cart-btn");
      if (cartBtn && cartBtn.dataset.productId) {
        productId = cartBtn.dataset.productId;
      }
    }

    // Last resort: try to create a fallback ID from the product name
    if (!productId) {
      const nameElement = card.querySelector("h3");
      if (nameElement) {
        // Create a unique ID based on product name
        productId = nameElement.textContent.toLowerCase().replace(/\s+/g, "-");
        console.warn("Using generated ID from product name:", productId);
      }
    }

    if (!productId) {
      console.error("Product ID not found in data attribute");
      return null;
    }

    const img = card.querySelector("img");
    const nameElement = card.querySelector("h3");
    const priceElement = card.querySelector(".price");

    if (!img || !nameElement || !priceElement) {
      console.error("Missing product elements in card:", card);
      return null;
    }

    return {
      id: productId,
      name: nameElement.textContent,
      price: priceElement.textContent,
      image: img.src,
    };
  }

  // Initialize wishlist from localStorage
  let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

  // Add click handlers to all wishlist buttons if they exist
  document.querySelectorAll(".wishlist-btn").forEach((button) => {
    const productCard = button.closest(".product-card");
    if (!productCard) {
      console.error("Product card not found for wishlist button");
      return;
    }

    const productData = getProductData(productCard);
    if (!productData) {
      console.error("Could not get product data");
      return;
    }

    // Set initial state
    const isInWishlist = wishlist.some((item) => item.id === productData.id);
    updateWishlistButton(button, isInWishlist);

    button.addEventListener("click", async function (e) {
      // Stop propagation to prevent card click event
      e.stopPropagation();

      try {
        // Get CSRF token
        const csrfToken = getCookie("csrftoken");
        if (!csrfToken) {
          console.error("CSRF token not found in cookies");
          throw new Error(
            "CSRF token not found. Please refresh the page and try again."
          );
        }

        console.log(
          `Attempting to toggle wishlist for product ID: ${productData.id}`
        );
        console.log(`Product data:`, productData);

        // Send request to server
        const response = await fetch(
          `/api/wishlist/toggle/${productData.id}/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
            },
            credentials: "same-origin",
          }
        );

        console.log(`Server response status: ${response.status}`);

        // Get response text for debugging
        const responseText = await response.text();
        console.log(`Server response text:`, responseText);

        // Parse the JSON response (if valid)
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
          throw new Error("Invalid JSON response from server");
        }

        if (!response.ok) {
          console.error(`Server error details:`, data);
          throw new Error(data.message || "Failed to update wishlist");
        }

        const isCurrentlyInWishlist = data.status === "added";
        console.log(
          `Wishlist status updated: ${
            isCurrentlyInWishlist ? "Added" : "Removed"
          }`
        );

        // Update localStorage to match server state
        let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

        if (isCurrentlyInWishlist) {
          // Add to wishlist if not already there
          if (!wishlist.some((item) => item.id === productData.id)) {
            wishlist.push(productData);
          }
        } else {
          // Remove from wishlist
          wishlist = wishlist.filter((item) => item.id !== productData.id);
        }

        // Save to localStorage
        localStorage.setItem("wishlist", JSON.stringify(wishlist));

        // Synchronize all wishlist buttons for this product
        window.synchronizeWishlistButtons(
          productData.id,
          isCurrentlyInWishlist
        );

        // Show notification
        showNotification(data.message);
      } catch (error) {
        console.error("Error updating wishlist:", error);
        console.error("Stack trace:", error.stack);
        showNotification("Failed to update wishlist", "error");
      }
    });
  });

  // Handle wishlist page functionality if it exists
  const wishlistGrid = document.querySelector(".wishlist-grid");
  const wishlistCount = document.querySelector(".wishlist-count");

  if (wishlistGrid && wishlistCount) {
    function updateCount() {
      const itemCount = document.querySelectorAll(".wishlist-item").length;
      wishlistCount.textContent = `${itemCount} Item${
        itemCount !== 1 ? "s" : ""
      }`;
    }

    function createWishlistItem(item) {
      // Ensure item has all required properties
      if (!item || !item.id || !item.name || !item.price) {
        console.error("Invalid wishlist item:", item);
        return "";
      }

      // Handle image URL
      let imageUrl = item.image || ""; // Add default empty string if image is undefined
      if (imageUrl && imageUrl.startsWith("images/")) {
        imageUrl = window.STATIC_URL + imageUrl;
      }

      // Ensure we have a fallback for missing image
      if (!imageUrl) {
        imageUrl = window.STATIC_URL + "images/placeholder.png";
      }

      // Generate rating stars
      const ratingStars = generateRatingStars(parseFloat(item.rating) || 0);

      return `
                <div class="wishlist-item" data-id="${item.id}">
                    <div class="item-image">
                        <img src="${imageUrl}" alt="${item.name}" onerror="this.src='${window.STATIC_URL}images/placeholder.png'" />
                        <button class="remove-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <div class="rating">
                            ${ratingStars}
                        </div>
                        <div class="price">${item.price}</div>
                        <button class="add-to-cart-btn">
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
    }

    async function loadWishlistItems() {
      try {
        // First try to load from server
        console.log("Attempting to fetch wishlist items from server");
        const response = await fetch("/api/wishlist/items/", {
          method: "GET",
          credentials: "same-origin",
        });

        console.log(`Server response status: ${response.status}`);

        // Get response text for debugging
        const responseText = await response.text();
        console.log(
          `Response first 100 chars: ${responseText.substring(0, 100)}...`
        );

        // Check if response is valid JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Successfully parsed JSON response");
        } catch (error) {
          console.error("Server returned non-JSON response:", error);
          throw new Error("Server returned invalid JSON response");
        }

        if (!response.ok) {
          console.error("Server returned error response:", data);
          throw new Error(`Server error: ${data.message || response.status}`);
        }

        if (data.status === "success" && Array.isArray(data.items)) {
          console.log(`Loaded ${data.items.length} wishlist items from server`);

          // We got items from the server, update the UI
          wishlistGrid.innerHTML = data.items
            .map((item) => createWishlistItem(item))
            .join("");

          // Also update localStorage to match server state
          localStorage.setItem("wishlist", JSON.stringify(data.items));

          updateCount();

          // Add event listeners to buttons
          addWishlistItemEventListeners();

          return;
        } else {
          console.warn("Response did not contain expected data format:", data);
          throw new Error("Server response format invalid");
        }
      } catch (error) {
        console.error("Error loading wishlist items from server:", error);
        // Fall back to localStorage if server request fails
      }

      // Fallback: Load from localStorage if server request failed
      const wishlistItems = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      );

      // Filter out any invalid items before displaying
      const validItems = wishlistItems.filter(
        (item) =>
          item &&
          item.id &&
          item.name &&
          item.name !== "undefined" &&
          item.price
      );

      // If we filtered out items, update localStorage
      if (validItems.length !== wishlistItems.length) {
        console.log(
          `Filtered out ${
            wishlistItems.length - validItems.length
          } invalid wishlist items when loading`
        );
        localStorage.setItem("wishlist", JSON.stringify(validItems));
      }

      wishlistGrid.innerHTML = validItems
        .map((item) => createWishlistItem(item))
        .join("");

      updateCount();

      // Add event listeners
      addWishlistItemEventListeners();
    }

    function addWishlistItemEventListeners() {
      // Add event listeners to new remove buttons
      document.querySelectorAll(".remove-btn").forEach((button) => {
        button.addEventListener("click", function () {
          const item = this.closest(".wishlist-item");
          const itemId = item.dataset.id;
          removeFromWishlist(itemId);
          item.remove();
          updateCount();
        });
      });

      // Add event listeners to Add to Cart buttons
      document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
        button.addEventListener("click", async function () {
          const item = this.closest(".wishlist-item");
          const itemId = item.dataset.id;

          try {
            // Get CSRF token
            const csrfToken = getCookie("csrftoken");
            if (!csrfToken) {
              console.error("CSRF token not found in cookies");
              throw new Error(
                "CSRF token not found. Please refresh the page and try again."
              );
            }

            // Add to cart
            console.log(`Attempting to add item ${itemId} to cart`);
            const response = await fetch("/cart/add/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
              },
              body: JSON.stringify({
                product_id: itemId,
                quantity: 1,
              }),
              credentials: "same-origin",
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Server error:`, errorText);
              throw new Error("Failed to add item to cart");
            }

            const result = await response.json();
            console.log("Add to cart result:", result);
            showNotification("Item added to cart!");
          } catch (error) {
            console.error("Error adding to cart:", error);
            showNotification("Failed to add item to cart", "error");
          }
        });
      });
    }

    async function removeFromWishlist(itemId) {
      try {
        // Get CSRF token
        const csrfToken = getCookie("csrftoken");
        if (!csrfToken) {
          console.error("CSRF token not found in cookies");
          throw new Error(
            "CSRF token not found. Please refresh the page and try again."
          );
        }

        console.log(`Attempting to remove item from wishlist, ID: ${itemId}`);

        // Send request to server
        const response = await fetch(`/api/wishlist/toggle/${itemId}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "same-origin",
        });

        console.log(`Server response status: ${response.status}`);

        // Get response text for debugging
        const responseText = await response.text();
        console.log(`Server response text:`, responseText);

        // Parse the JSON response (if valid)
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
          throw new Error("Invalid JSON response from server");
        }

        if (!response.ok) {
          console.error(`Server error details:`, data);
          throw new Error(data.message || "Failed to remove from wishlist");
        }

        // Also update localStorage
        const wishlistItems = JSON.parse(
          localStorage.getItem("wishlist") || "[]"
        );
        const updatedWishlist = wishlistItems.filter(
          (item) => item.id !== itemId
        );
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

        showNotification("Item removed from wishlist");
      } catch (error) {
        console.error("Error removing from wishlist:", error);
        console.error("Stack trace:", error.stack);
        showNotification("Failed to remove from wishlist", "error");

        // Still update localStorage even if server request fails
        const wishlistItems = JSON.parse(
          localStorage.getItem("wishlist") || "[]"
        );
        const updatedWishlist = wishlistItems.filter(
          (item) => item.id !== itemId
        );
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      }
    }

    // Load wishlist items if on wishlist page
    loadWishlistItems();
  }
});
