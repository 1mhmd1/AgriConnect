document.addEventListener("DOMContentLoaded", function () {
  // Initialize wishlist button state
  const wishlistBtn = document.querySelector(".add-to-wishlist");
  const productId = wishlistBtn.dataset.productId;

  // Check initial wishlist status
  checkWishlistStatus(productId, wishlistBtn);

  // Add wishlist click handler
  wishlistBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    try {
      const response = await fetch(`/api/wishlist/toggle/${productId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update wishlist");
      }

      const data = await response.json();
      updateWishlistButtonState(wishlistBtn, data.status === "added");
      showNotification(data.message);
    } catch (error) {
      console.error("Error updating wishlist:", error);
      showNotification("Failed to update wishlist", "error");
    }
  });

  // Add cart click handler
  const cartBtn = document.querySelector(".add-to-cart");
  cartBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    if (cartBtn.disabled) return;

    try {
      const response = await fetch("/cart/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      const data = await response.json();
      showNotification(data.message);

      // Update cart count if it exists
      const cartCount = document.querySelector(".cart-count");
      if (cartCount) {
        cartCount.textContent = data.cart_total;
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showNotification("Failed to add to cart", "error");
    }
  });
});

// Function to check wishlist status
async function checkWishlistStatus(productId, button) {
  try {
    const response = await fetch(`/api/wishlist/status/${productId}/`);
    if (!response.ok) {
      throw new Error("Failed to check wishlist status");
    }

    const data = await response.json();
    updateWishlistButtonState(button, data.is_in_wishlist);
  } catch (error) {
    console.error("Error checking wishlist status:", error);
  }
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

// Function to update wishlist button state
function updateWishlistButtonState(button, isInWishlist) {
  if (!button) return;

  button.classList.toggle("active", isInWishlist);
  const icon = button.querySelector("i");
  if (icon) {
    icon.style.color = isInWishlist ? "#ff4444" : "";
    icon.className = isInWishlist ? "fas fa-heart" : "far fa-heart";
  }

  // Update button text if it exists
  const textSpan = button.querySelector("span");
  if (textSpan) {
    textSpan.textContent = isInWishlist
      ? "Remove from Wishlist"
      : "Add to Wishlist";
  }
}

// Function to show notifications
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Add notification styles
  const style = document.createElement("style");
  style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        .notification.success {
            background-color: #00a651;
        }
        .notification.error {
            background-color: #ff4444;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
  document.head.appendChild(style);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.remove();
    style.remove();
  }, 3000);
}
