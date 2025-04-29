// User menu dropdown functionality
document.addEventListener("DOMContentLoaded", function () {
  // Set a default STATIC_URL if it doesn't exist
  window.STATIC_URL = window.STATIC_URL || "/static/";

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

    button.addEventListener("click", function (e) {
      // Stop propagation to prevent card click event
      e.stopPropagation();

      const isCurrentlyInWishlist = wishlist.some(
        (item) => item.id === productData.id
      );

      if (isCurrentlyInWishlist) {
        // Remove from wishlist
        wishlist = wishlist.filter((item) => item.id !== productData.id);
        updateWishlistButton(button, false);
      } else {
        // Add to wishlist
        wishlist.push(productData);
        updateWishlistButton(button, true);
      }

      // Save to localStorage
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
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

    function loadWishlistItems() {
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
            // Convert itemId to a number if it's a string
            const productId = parseInt(itemId, 10);

            if (isNaN(productId)) {
              throw new Error("Invalid product ID");
            }

            // Get CSRF token
            const csrfToken = getCookie("csrftoken");
            if (!csrfToken) {
              throw new Error(
                "CSRF token not found. Please refresh the page and try again."
              );
            }

            console.log("Sending request to add product to cart:", productId);

            const response = await fetch("/cart/add/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
              },
              body: JSON.stringify({
                product_id: productId,
                quantity: 1,
              }),
            });

            console.log("Response status:", response.status);

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              // If not JSON, get the text content for debugging
              const textContent = await response.text();
              console.error(
                "Non-JSON response:",
                textContent.substring(0, 200) + "..."
              );
              throw new Error(
                "Server returned non-JSON response. Please try again later."
              );
            }

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.message || "Failed to add item to cart"
              );
            }

            const data = await response.json();
            showNotification("Item added to cart successfully!");

            // Remove from wishlist after adding to cart
            removeFromWishlist(itemId);
            item.remove();
            updateCount();
          } catch (error) {
            console.error("Error adding to cart:", error);
            showNotification(
              "Failed to add item to cart: " + error.message,
              "error"
            );
          }
        });
      });
    }

    function removeFromWishlist(itemId) {
      const wishlistItems = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      );
      const updatedWishlist = wishlistItems.filter(
        (item) => item.id !== itemId
      );
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    }

    // Load wishlist items if on wishlist page
    loadWishlistItems();
  }
});
