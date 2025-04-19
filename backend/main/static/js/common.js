// User menu dropdown functionality
document.addEventListener("DOMContentLoaded", function () {
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
    const img = card.querySelector("img");
    const name = card.querySelector("h3").textContent;
    const price = card.querySelector(".price").textContent;
    const rating = card.querySelector(".rating").innerHTML;

    // Convert relative URL to absolute URL if needed
    let imageUrl = img.src;
    if (imageUrl.startsWith("/")) {
      imageUrl = window.location.origin + imageUrl;
    }

    return {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name: name,
      price: price,
      image: imageUrl,
      rating: rating,
    };
  }

  // Initialize wishlist from localStorage
  let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

  // Add click handlers to all wishlist buttons if they exist
  document.querySelectorAll(".wishlist-btn").forEach((button) => {
    const productCard = button.closest(".product-card");
    const productData = getProductData(productCard);

    // Set initial state
    const isInWishlist = wishlist.some((item) => item.id === productData.id);
    updateWishlistButton(button, isInWishlist);

    button.addEventListener("click", function () {
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
      // Handle image URL
      let imageUrl = item.image;
      if (imageUrl.startsWith("images/")) {
        imageUrl = window.STATIC_URL + imageUrl;
      }

      return `
                <div class="wishlist-item" data-id="${item.id}">
                    <div class="item-image">
                        <img src="${imageUrl}" alt="${item.name}" />
                        <button class="remove-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <div class="rating">
                            ${item.rating}
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
      wishlistGrid.innerHTML = wishlistItems
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
