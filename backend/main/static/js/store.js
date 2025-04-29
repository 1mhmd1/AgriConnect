// Function to generate rating stars - defined in global scope
function generateRatingStars(rating) {
  let stars = "";
  const fullStars = Math.floor(rating || 4);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  const remainingStars = 5 - Math.ceil(rating || 4);
  for (let i = 0; i < remainingStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }
  return stars;
}

// Helper function to show notification - also defined globally
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Function to show product details - moved to global scope
async function showProductDetails(productId) {
  if (!productId) {
    console.error("Product ID is required");
    showNotification("Product ID is missing", "error");
    return;
  }

  console.log("Fetching details for product ID:", productId);

  // Check if this is a generated ID (not a real product in the database)
  if (productId.toString().startsWith("generated-")) {
    // For generated IDs, show a simplified product detail with available info
    const productCard = document.querySelector(
      `.product-card[data-product-id="${productId}"]`
    );

    if (!productCard) {
      console.error(`Product card with generated ID ${productId} not found`);
      showNotification("Product details not available", "error");
      return;
    }

    // Create a simplified product object from the card
    const productName =
      productCard.querySelector("h3")?.textContent || "Product";
    const price = productCard.querySelector(".price")?.textContent || "$0.00";
    const image = productCard.querySelector("img")?.src || "";
    const rating = productCard.querySelector(".rating")?.dataset.rating || "4";

    const modal = document.getElementById("productDetailsModal");
    if (!modal) {
      console.error("Product details modal not found");
      return;
    }

    // Populate modal with data from the card
    const productImage = document.getElementById("productDetailsImage");
    const productCategory = document.getElementById("productDetailsCategory");
    const productName_el = document.getElementById("productDetailsName");
    const productDescription = document.getElementById(
      "productDetailsDescription"
    );

    if (productImage) productImage.src = image;
    if (productCategory) productCategory.textContent = "Uncategorized";
    if (productName_el) productName_el.textContent = productName;
    if (productDescription)
      productDescription.textContent =
        "No description available for this product.";

    // Set rating
    const ratingContainer = document.getElementById("productDetailsRating");
    if (ratingContainer) {
      const starsContainer = ratingContainer.querySelector(".stars");
      const ratingText = ratingContainer.querySelector(".rating-text");
      if (starsContainer && ratingText) {
        starsContainer.innerHTML = generateRatingStars(parseFloat(rating));
        ratingText.textContent = `${rating} out of 5`;
      }
    }

    // Set price
    const priceContainer = document.getElementById("productDetailsPrice");
    if (priceContainer) {
      const currentPrice = priceContainer.querySelector(".current-price");
      const originalPrice = priceContainer.querySelector(".original-price");
      const saleBadge = priceContainer.querySelector(".sale-badge");

      if (currentPrice && originalPrice && saleBadge) {
        currentPrice.textContent = price;
        originalPrice.textContent = "";
        saleBadge.style.display = "none";
      }
    }

    // Set stock status
    const stockStatus = document.getElementById("productDetailsStock");
    if (stockStatus) {
      const stockIcon = stockStatus.querySelector("i");
      const stockText = stockStatus.querySelector("span");

      if (stockIcon && stockText) {
        stockIcon.className = "fas fa-check-circle";
        stockIcon.style.color = "#00a651";
        stockText.textContent = "In Stock";
      }
    }

    // Set up action buttons
    const addToCartBtn = document.getElementById("productDetailsAddToCart");
    const addToWishlistBtn = document.getElementById(
      "productDetailsAddToWishlist"
    );

    if (addToCartBtn && addToWishlistBtn) {
      addToCartBtn.disabled = false;
      addToCartBtn.dataset.productId = productId;
      addToWishlistBtn.dataset.productId = productId;

      // Initialize wishlist button state
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const isInWishlist = wishlist.some((item) => item.id === productId);
      updateWishlistButtonState(addToWishlistBtn, isInWishlist);

      // Add wishlist click handler
      addToWishlistBtn.onclick = function (e) {
        e.preventDefault();
        const productData = {
          id: productId,
          name: productName,
          price: price,
          image: image,
          category: "Uncategorized",
        };
        toggleWishlistItem(productData, addToWishlistBtn);
      };

      // Add cart click handler for generated products
      addToCartBtn.onclick = function (e) {
        e.preventDefault();

        // Since this is a generated product ID not in the database,
        // we can't use the API. Instead, show a notification
        showNotification(
          "This is a demo product and cannot be added to cart",
          "error"
        );
      };
    }

    // Show modal
    modal.style.display = "block";
    return;
  }

  // Normal API fetch for real product IDs
  try {
    const response = await fetch(`/api/products/${productId}/`);

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Product with ID ${productId} not found`);
        showNotification(`Product with ID ${productId} not found`, "error");
      } else {
        console.error(`Failed to fetch product details: ${response.status}`);
        showNotification("Failed to load product details", "error");
      }
      throw new Error(`Failed to fetch product details: ${response.status}`);
    }

    const product = await response.json();
    const modal = document.getElementById("productDetailsModal");

    if (!modal) {
      console.error("Product details modal not found");
      return;
    }

    // Populate modal with product data
    const productImage = document.getElementById("productDetailsImage");
    const productCategory = document.getElementById("productDetailsCategory");
    const productName = document.getElementById("productDetailsName");
    const productDescription = document.getElementById(
      "productDetailsDescription"
    );

    if (
      !productImage ||
      !productCategory ||
      !productName ||
      !productDescription
    ) {
      console.error("Required modal elements not found");
      return;
    }

    productImage.src = product.image;
    productCategory.textContent = product.category.name;
    productName.textContent = product.name;
    productDescription.textContent = product.description;

    // Set rating
    const ratingContainer = document.getElementById("productDetailsRating");
    if (ratingContainer) {
      const starsContainer = ratingContainer.querySelector(".stars");
      const ratingText = ratingContainer.querySelector(".rating-text");
      if (starsContainer && ratingText) {
        starsContainer.innerHTML = generateRatingStars(product.rating);
        ratingText.textContent = `${product.rating} out of 5`;
      }
    }

    // Set price
    const priceContainer = document.getElementById("productDetailsPrice");
    if (priceContainer) {
      const currentPrice = priceContainer.querySelector(".current-price");
      const originalPrice = priceContainer.querySelector(".original-price");
      const saleBadge = priceContainer.querySelector(".sale-badge");

      if (currentPrice && originalPrice && saleBadge) {
        if (product.is_on_sale) {
          currentPrice.textContent = `$${product.sale_price}`;
          originalPrice.textContent = `$${product.price}`;
          saleBadge.style.display = "inline-block";
        } else {
          currentPrice.textContent = `$${product.price}`;
          originalPrice.textContent = "";
          saleBadge.style.display = "none";
        }
      }
    }

    // Set stock status
    const stockStatus = document.getElementById("productDetailsStock");
    if (stockStatus) {
      const stockIcon = stockStatus.querySelector("i");
      const stockText = stockStatus.querySelector("span");

      if (stockIcon && stockText) {
        if (product.stock > 0) {
          stockIcon.className = "fas fa-check-circle";
          stockIcon.style.color = "#00a651";
          stockText.textContent = `In Stock (${product.stock} available)`;
        } else {
          stockIcon.className = "fas fa-times-circle";
          stockIcon.style.color = "#ff4444";
          stockText.textContent = "Out of Stock";
        }
      }
    }

    // Set up action buttons
    const addToCartBtn = document.getElementById("productDetailsAddToCart");
    const addToWishlistBtn = document.getElementById(
      "productDetailsAddToWishlist"
    );

    if (addToCartBtn && addToWishlistBtn) {
      addToCartBtn.disabled = product.stock === 0;
      addToCartBtn.dataset.productId = productId;
      addToWishlistBtn.dataset.productId = productId;

      // Initialize wishlist button state
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const isInWishlist = wishlist.some((item) => item.id === productId);
      updateWishlistButtonState(addToWishlistBtn, isInWishlist);

      // Add wishlist click handler
      addToWishlistBtn.onclick = function (e) {
        e.preventDefault();
        const productData = {
          id: productId,
          name: product.name,
          price: product.is_on_sale ? product.sale_price : product.price,
          image: product.image,
          category: product.category.name,
        };
        toggleWishlistItem(productData, addToWishlistBtn);
      };

      // Add cart click handler
      addToCartBtn.onclick = async function (e) {
        e.preventDefault();
        if (addToCartBtn.disabled) return;

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
            const errorText = await response.text();
            console.error("Server response:", errorText);
            throw new Error("Failed to add item to cart");
          }

          const data = await response.json();
          showNotification(data.message || "Product added to cart");
        } catch (error) {
          console.error("Error adding to cart:", error);
          showNotification("Failed to add product to cart", "error");
        }
      };
    }

    // Show modal
    modal.style.display = "block";
  } catch (error) {
    console.error("Error loading product details:", error);
    showNotification("Failed to load product details", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize action buttons for all products
  initializeProductActions();

  // Set data-rating attributes on product ratings for filter functionality
  document
    .querySelectorAll(".product-card .rating")
    .forEach((ratingElement) => {
      // Try to extract rating from stars
      const fullStars = ratingElement.querySelectorAll(".fa-star").length;
      const halfStars =
        ratingElement.querySelectorAll(".fa-star-half-alt").length;
      const rating = fullStars + halfStars * 0.5;

      if (rating > 0) {
        ratingElement.setAttribute("data-rating", rating);
      } else {
        // Default rating if we can't calculate from stars
        ratingElement.setAttribute("data-rating", "4");
      }
    });

  // Add click event to product cards
  document.querySelectorAll(".product-card").forEach((card, index) => {
    // Generate an ID for cards without one
    if (!card.dataset.productId) {
      // Use a prefix to make it clear this is a generated ID
      card.dataset.productId = `generated-${index + 1}`;
      console.info(
        `Assigned generated ID to product card: generated-${index + 1}`
      );
    }

    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.closest(".product-actions")) {
        return;
      }

      const productId = card.dataset.productId;
      if (!productId) {
        console.error("Product ID not found for card:", card);
        return;
      }
      showProductDetails(productId);
    });
  });

  // Search functionality
  const searchInput = document.getElementById("productSearch");
  const searchButton = document.getElementById("searchButton");
  const filterButton = document.getElementById("filterButton");
  const productsGrid = document.querySelector(".products-grid");

  // Search products function
  function searchProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const productCards = document.querySelectorAll(".product-card");
    let foundProducts = 0;

    productCards.forEach((card) => {
      const productName = card.querySelector("h3").textContent.toLowerCase();
      const productInfo = card.querySelector(".product-info");
      const productPrice = productInfo
        ? productInfo.querySelector(".price")?.textContent.toLowerCase()
        : "";

      if (
        productName.includes(searchTerm) ||
        (productPrice && productPrice.includes(searchTerm)) ||
        searchTerm === ""
      ) {
        card.style.display = "flex";
        foundProducts++;
      } else {
        card.style.display = "none";
      }
    });

    // Create or update the results count display
    let resultsCountElement = document.getElementById("searchResultsCount");
    if (!resultsCountElement) {
      resultsCountElement = document.createElement("div");
      resultsCountElement.id = "searchResultsCount";
      resultsCountElement.className = "search-results-count";
      document
        .querySelector(".search-filter-container")
        .appendChild(resultsCountElement);
    }

    if (searchTerm !== "") {
      resultsCountElement.textContent = `${foundProducts} product${
        foundProducts !== 1 ? "s" : ""
      } found`;
      resultsCountElement.style.display = "block";
    } else {
      resultsCountElement.style.display = "none";
    }

    // Show message if no products found
    if (foundProducts === 0 && searchTerm !== "") {
      showNotification("No products found matching your search.");
    }
  }

  // Event listeners for search
  searchButton.addEventListener("click", searchProducts);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      searchProducts();
    }
    // For instant search as user types
    if (searchInput.value.length >= 2 || searchInput.value.length === 0) {
      searchProducts();
    }
  });

  // Add styles for price range
  const style = document.createElement("style");
  style.textContent = `
    .price-filter {
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .price-inputs {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .price-input-group {
      flex: 1;
    }

    .price-input-group label {
      display: block;
      margin-bottom: 5px;
      color: #666;
      font-size: 0.9em;
    }

    .price-input-group input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .price-input-group input:focus {
      outline: none;
      border-color: #00a651;
      box-shadow: 0 0 0 2px rgba(0, 166, 81, 0.1);
    }

    .filter-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      min-width: 300px;
      z-index: 1000;
    }

    .filter-dropdown-content {
      padding: 20px;
    }

    .filter-section {
      margin-bottom: 20px;
    }

    .filter-section h3 {
      margin-bottom: 10px;
      color: #333;
      font-size: 1.1em;
    }

    .filter-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .filter-actions button {
      flex: 1;
      padding: 8px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .filter-actions .btn {
      background-color: #00a651;
      color: white;
    }

    .filter-actions .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .filter-actions button:hover {
      opacity: 0.9;
    }
    
    /* Sale tag styles */
    .sale-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: #ff4444;
      color: white;
      padding: 4px 8px;
      font-size: 0.8rem;
      font-weight: bold;
      border-radius: 4px;
      z-index: 2;
    }
    
    /* Sale price styles */
    .sale-price {
      color: #ff4444;
      font-weight: bold;
      margin-right: 5px;
    }
    
    .original-price {
      text-decoration: line-through;
      color: #999;
      font-size: 0.9em;
    }
  `;
  document.head.appendChild(style);

  // Initialize filter dropdown variable
  let filterDropdown = null;

  // Function to fetch categories from the backend
  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories/");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const categories = await response.json();
      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  // Function to create category checkboxes HTML
  function createCategoryCheckboxes(categories) {
    return categories
      .map(
        (category) => `
      <div class="filter-checkbox">
        <input type="checkbox" id="cat-${category.name
          .toLowerCase()
          .replace(/\s+/g, "-")}" value="${category.name}">
        <label for="cat-${category.name.toLowerCase().replace(/\s+/g, "-")}">${
          category.name
        }</label>
      </div>
    `
      )
      .join("");
  }

  // Update the filter button click handler
  filterButton.addEventListener("click", async function () {
    if (filterDropdown) {
      filterDropdown.style.display =
        filterDropdown.style.display === "none" ? "block" : "none";
      return;
    }

    // Create filter dropdown
    filterDropdown = document.createElement("div");
    filterDropdown.id = "filterDropdown";
    filterDropdown.className = "filter-dropdown";

    // Fetch categories
    const categories = await fetchCategories();

    filterDropdown.innerHTML = `
      <div class="filter-dropdown-content">
        <div class="filter-section">
          <h3>Price Range</h3>
          <div class="price-filter">
            <div class="price-inputs">
              <div class="price-input-group">
                <label for="minPrice">Min Price ($)</label>
                <input type="number" id="minPrice" min="0" value="0" step="1" placeholder="Min price">
              </div>
              <div class="price-input-group">
                <label for="maxPrice">Max Price ($)</label>
                <input type="number" id="maxPrice" min="0" value="500" step="1" placeholder="Max price">
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-section">
          <h3>Categories</h3>
          <div class="filter-checkboxes">
            ${createCategoryCheckboxes(categories)}
          </div>
        </div>
        
        <div class="filter-section">
          <h3>Rating</h3>
          <div class="rating-filter">
            <div class="filter-checkbox">
              <input type="checkbox" id="rating-4plus" value="4">
              <label for="rating-4plus">4+ Stars</label>
            </div>
            <div class="filter-checkbox">
              <input type="checkbox" id="rating-3plus" value="3">
              <label for="rating-3plus">3+ Stars</label>
            </div>
          </div>
        </div>
        
        <div class="filter-actions">
          <button id="applyFilters" class="btn">Apply Filters</button>
          <button id="resetFilters" class="btn btn-secondary">Reset</button>
        </div>
      </div>
    `;

    // Append dropdown to filter button
    const filterContainer = document.querySelector(".search-filter-container");
    filterContainer.appendChild(filterDropdown);

    // Add event listeners after the elements are created
    const applyFiltersBtn = document.getElementById("applyFilters");
    const resetFiltersBtn = document.getElementById("resetFilters");
    const minPriceInput = document.getElementById("minPrice");
    const maxPriceInput = document.getElementById("maxPrice");

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", function () {
        const minPrice = parseFloat(minPriceInput?.value) || 0;
        const maxPrice = parseFloat(maxPriceInput?.value) || 500;
        const selectedCategories = Array.from(
          document.querySelectorAll(".filter-checkboxes input:checked")
        ).map((input) => input.value);
        const selectedRating = Array.from(
          document.querySelectorAll(".rating-filter input:checked")
        ).map((input) => parseInt(input.value));
        const minRating =
          selectedRating.length > 0 ? Math.max(...selectedRating) : 0;

        applyFiltersToProducts(
          minPrice,
          maxPrice,
          selectedCategories,
          minRating
        );
        filterDropdown.style.display = "none";
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => {
        // Reset price inputs
        if (minPriceInput) minPriceInput.value = 0;
        if (maxPriceInput) maxPriceInput.value = 500;

        // Uncheck all checkboxes
        document
          .querySelectorAll(".filter-checkboxes input, .rating-filter input")
          .forEach((checkbox) => {
            checkbox.checked = false;
          });

        // Clear the stored filters
        window.currentFilters = null;

        // Show all products
        document.querySelectorAll(".product-card").forEach((card) => {
          card.style.display = "flex";
        });

        // Hide filter status
        const filterStatus = document.getElementById("filterStatus");
        if (filterStatus) {
          filterStatus.style.display = "none";
        }

        showNotification("Filters have been reset.");

        // Hide dropdown
        filterDropdown.style.display = "none";
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", function closeFilterDropdown(e) {
      if (
        !e.target.closest("#filterDropdown") &&
        !e.target.closest("#filterButton")
      ) {
        filterDropdown.style.display = "none";
      }
    });
  });

  // Enhanced product data
  const categories = {
    herbicides: [
      {
        name: "Weed Killer Pro",
        price: 24.99,
        image: "images/weedkiller.jpeg",
      },
      {
        name: "Herb Master",
        price: 19.99,
        image: "https://via.placeholder.com/200",
      },
    ],
    pesticides: [
      {
        name: "Bug Blaster",
        price: 29.99,
        image: "https://via.placeholder.com/200",
      },
      {
        name: "Pest Shield",
        price: 34.99,
        image: "https://via.placeholder.com/200",
      },
    ],
    fertilizers: [
      {
        name: "Growth Plus",
        price: 39.99,
        image: "https://via.placeholder.com/200",
      },
      {
        name: "Organic Mix",
        price: 44.99,
        image: "https://via.placeholder.com/200",
      },
    ],
  };

  // Get modal elements once
  const modal = document.getElementById("categoryModal");
  const modalTitle = document.getElementById("categoryName");
  const productsContainer = document.getElementById("categoryProducts");

  if (!modal || !modalTitle || !productsContainer) {
    console.error("Modal elements not found");
    return;
  }

  // Handle category card clicks (in both main view and modal)
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", function () {
      const categoryId = this.dataset.categoryId;
      const categoryNameText = this.querySelector("h3").textContent;

      // Close the all categories modal if it's open
      allCategoriesModal.style.display = "none";

      // Show the category products modal
      modal.style.display = "block";
      modalTitle.textContent = categoryNameText;

      // Fetch and display products for this category
      fetch(`/api/categories/${categoryId}/products/`)
        .then((response) => response.json())
        .then((products) => {
          productsContainer.innerHTML = products
            .map((product) => {
              // Check for both naming conventions
              const isOnSale = product.is_on_sale || product.onSale;
              const salePrice = product.sale_price || product.salePrice;
              const saleTag = product.saleTag || "Sale";

              return `
                <div class="product-card" data-product-id="${product.id}">
                  ${isOnSale ? `<span class="sale-tag">${saleTag}</span>` : ""}
                  <img src="${product.image}" alt="${
                product.name
              }" onerror="this.src='/static/images/placeholder.png'">
                  <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">
                      ${
                        isOnSale && salePrice
                          ? `<span class="sale-price">$${salePrice}</span>
                         <span class="original-price">$${product.price}</span>`
                          : `$${product.price}`
                      }
                    </p>
                    <div class="rating" data-rating="${product.rating || 4}">
                      ${generateRatingStars(product.rating || 4)}
                    </div>
                    <div class="product-actions">
                      <button class="wishlist-btn" data-product-id="${
                        product.id
                      }">
                        <i class="fas fa-heart"></i>
                      </button>
                      <button class="cart-btn" data-product-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("");

          // Add click handlers to product cards
          productsContainer
            .querySelectorAll(".product-card")
            .forEach((card) => {
              card.addEventListener("click", function (e) {
                // Don't trigger if clicking on action buttons
                if (e.target.closest(".product-actions")) {
                  return;
                }
                const productId = this.dataset.productId;
                if (productId) {
                  showProductDetails(productId);
                }
              });
            });

          // Initialize product actions
          initializeProductActions(productsContainer);

          // Apply current filters if they exist
          if (window.currentFilters) {
            applyFiltersToProducts(
              window.currentFilters.price,
              window.currentFilters.categories,
              window.currentFilters.minRating
            );
          }
        })
        .catch((error) => {
          console.error("Error fetching category products:", error);
          productsContainer.innerHTML =
            "<p>Error loading products. Please try again later.</p>";
        });
    });
  });

  // Close modal functionality
  const closeBtn = modal.querySelector(".close-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // Close on outside click
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Handle wishlist and cart buttons
  document.addEventListener("click", function (e) {
    if (e.target.closest(".wishlist-btn")) {
      const btn = e.target.closest(".wishlist-btn");
      const productId = btn.dataset.productId;
      const productCard = btn.closest(".product-card");

      if (productCard) {
        // Create proper product data object
        const productData = getProductData(productCard);

        if (productData) {
          toggleWishlistItem(productData, btn);
        } else {
          console.error("Unable to get product data from card", productCard);
          showNotification("Error: Could not add to wishlist", "error");
        }
      } else {
        console.error("Product card not found for wishlist button", btn);
        showNotification("Error: Could not add to wishlist", "error");
      }
    } else if (e.target.closest(".cart-btn")) {
      const btn = e.target.closest(".cart-btn");
      const productId = btn.dataset.productId;
      const productCard = btn.closest(".product-card");
      addToCart(productCard, productId);
    }
  });

  // All featured products data
  const allFeaturedProducts = [
    {
      id: 1,
      name: "Amistar",
      price: "199",
      image: "images/amistar.jpeg",
      rating: 4.5,
      onSale: true,
      saleTag: "Sale 50%",
    },
    {
      id: 2,
      name: "Hexa Force",
      price: "149",
      image: "images/hexaforce.jpeg",
      rating: 4,
    },
    {
      id: 3,
      name: "Valipro",
      price: "14.99",
      image: "images/valipro.jpeg",
      rating: 4.5,
    },
    {
      id: 4,
      name: "Dimoxa",
      price: "14.99",
      image: "images/dimoxa.jpeg",
      rating: 4,
    },
    // Add more products here
  ];

  // All categories data
  const allCategories = [
    {
      name: "Herbicides",
      icon: "fa-leaf",
      count: 165,
      products: [
        {
          name: "Weed Killer Pro",
          price: 24.99,
          image: "images/weedkiller.jpeg",
        },
        { name: "Herb Master", price: 19.99, image: "images/herbmaster.jpeg" },
      ],
    },
    {
      name: "Pesticides",
      icon: "fa-bug",
      count: 89,
      products: [
        { name: "Bug Blaster", price: 29.99, image: "images/bugblaster.jpeg" },
        { name: "Pest Shield", price: 34.99, image: "images/pestshield.jpeg" },
      ],
    },
    {
      name: "Fertilizers",
      icon: "fa-seedling",
      count: 76,
      products: [
        { name: "Growth Plus", price: 39.99, image: "images/growthplus.jpeg" },
        { name: "Organic Mix", price: 44.99, image: "images/organicmix.jpeg" },
      ],
    },
    {
      name: "Seeds",
      icon: "fa-wheat-awn",
      count: 165,
      products: [
        { name: "Premium Seeds", price: 9.99, image: "images/seeds.jpeg" },
        {
          name: "Organic Seeds",
          price: 12.99,
          image: "images/organicseeds.jpeg",
        },
      ],
    },
    {
      name: "Machinery",
      icon: "fa-tractor",
      count: 48,
      products: [
        { name: "Mini Tractor", price: 1999.99, image: "images/tractor.jpeg" },
        { name: "Harvester", price: 2499.99, image: "images/harvester.jpeg" },
      ],
    },
    {
      name: "Insecticides",
      icon: "fa-spider",
      count: 165,
      products: [
        {
          name: "Insect Control",
          price: 29.99,
          image: "images/insectcontrol.jpeg",
        },
        {
          name: "Ant Solution",
          price: 19.99,
          image: "images/antsolution.jpeg",
        },
      ],
    },
    {
      name: "Irrigation",
      icon: "fa-droplet",
      count: 92,
      products: [
        { name: "Drip System", price: 199.99, image: "images/dripsystem.jpeg" },
        {
          name: "Sprinkler Set",
          price: 149.99,
          image: "images/sprinkler.jpeg",
        },
      ],
    },
    {
      name: "Tools",
      icon: "fa-screwdriver-wrench",
      count: 124,
      products: [
        { name: "Garden Tool Set", price: 79.99, image: "images/toolset.jpeg" },
        { name: "Premium Shears", price: 34.99, image: "images/shears.jpeg" },
      ],
    },
    {
      name: "Soil & Nutrients",
      icon: "fa-mountain",
      count: 83,
      products: [
        { name: "Premium Soil", price: 19.99, image: "images/soil.jpeg" },
        { name: "Plant Food", price: 24.99, image: "images/plantfood.jpeg" },
      ],
    },
    {
      name: "Plant Protection",
      icon: "fa-shield-halved",
      count: 57,
      products: [
        { name: "Plant Cover", price: 15.99, image: "images/plantcover.jpeg" },
        { name: "Frost Guard", price: 29.99, image: "images/frostguard.jpeg" },
      ],
    },
    {
      name: "Greenhouse",
      icon: "fa-house-flood-water",
      count: 34,
      products: [
        {
          name: "Mini Greenhouse",
          price: 299.99,
          image: "images/greenhouse.jpeg",
        },
        { name: "Tunnel Cover", price: 149.99, image: "images/tunnel.jpeg" },
      ],
    },
    {
      name: "Organic Farming",
      icon: "fa-leaf",
      count: 95,
      products: [
        {
          name: "Organic Fertilizer",
          price: 34.99,
          image: "images/organicfert.jpeg",
        },
        { name: "Bio Pesticide", price: 29.99, image: "images/biopest.jpeg" },
      ],
    },
  ];

  // Function to create product card HTML
  function createProductCard(product) {
    const ratingHtml = generateRatingStars(product.rating || 0);
    // Check for both naming conventions (is_on_sale and onSale)
    const isOnSale = product.is_on_sale || product.onSale;
    const salePrice = product.sale_price || product.salePrice;
    const saleTag = product.saleTag || "Sale";

    return `
      <div class="product-card" data-product-id="${product.id}">
        ${isOnSale ? `<span class="sale-tag">${saleTag}</span>` : ""}
        <div class="product-actions">
          <button class="action-btn wishlist-btn" data-product-id="${
            product.id
          }">
            <i class="fas fa-heart"></i>
          </button>
          <button class="action-btn cart-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
        <img src="${window.STATIC_URL}${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="rating" data-rating="${product.rating || 0}">
            ${ratingHtml}
          </div>
          <div class="price">
            ${
              isOnSale
                ? `<span class="sale-price">$${salePrice}</span>
               <span class="original-price">$${product.price}</span>`
                : `$${product.price}`
            }
          </div>
        </div>
      </div>
    `;
  }

  // Function to create category card HTML
  function createCategoryCard(category) {
    return `
      <div class="category-card" data-category="${category.name.toLowerCase()}">
        <i class="fas ${category.icon} fa-2x" style="color: #00a651"></i>
        <h3>${category.name}</h3>
        <p>${category.count} Products</p>
      </div>
    `;
  }

  // Initialize modals
  const featuredModal = document.createElement("div");
  featuredModal.className = "category-modal";
  featuredModal.id = "featuredModal";
  featuredModal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h3 class="modal-title">All Featured Products</h3>
      <div class="modal-products-grid"></div>
    </div>
  `;
  document.body.appendChild(featuredModal);

  const categoriesModal = document.createElement("div");
  categoriesModal.className = "category-modal";
  categoriesModal.id = "categoriesModal";
  categoriesModal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h3 class="modal-title">All Categories</h3>
      <div class="modal-categories-grid categories-grid"></div>
    </div>
  `;
  document.body.appendChild(categoriesModal);

  // Add click handlers for "View All" buttons
  document.querySelectorAll(".view-all").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const section = button.closest("section");
      if (section.classList.contains("featured-products")) {
        showAllFeaturedProducts();
      } else if (section.classList.contains("categories")) {
        showAllCategories();
      }
    });
  });

  // Function to show all featured products
  function showAllFeaturedProducts() {
    const modal = document.getElementById("featuredModal");
    const productsGrid = modal.querySelector(".modal-products-grid");

    // Clear existing content
    productsGrid.innerHTML = "";

    // Add all products
    allFeaturedProducts.forEach((product) => {
      // Skip products without valid IDs
      if (!product.id) {
        console.warn("Skipping featured product without valid ID:", product);
        return;
      }

      // Check for both naming conventions
      const isOnSale = product.is_on_sale || product.onSale;
      const salePrice = product.sale_price || product.salePrice;
      const saleTag = product.saleTag || "Sale";

      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.dataset.productId = product.id;
      productCard.innerHTML = `
        ${isOnSale ? `<span class="sale-tag">${saleTag}</span>` : ""}
        <div class="product-actions">
          <button class="action-btn wishlist-btn" data-product-id="${
            product.id
          }">
            <i class="fas fa-heart"></i>
          </button>
          <button class="action-btn cart-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
        <img src="${window.STATIC_URL}${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="rating" data-rating="${product.rating || 4}">
            ${generateRatingStars(product.rating)}
          </div>
          <div class="price">
            ${
              isOnSale && salePrice
                ? `<span class="sale-price">$${salePrice}</span>
               <span class="original-price">$${product.price}</span>`
                : `${product.price}`
            }
          </div>
        </div>
      `;

      // Add click handler for the product card
      productCard.addEventListener("click", (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest(".product-actions")) {
          return;
        }
        showProductDetails(product.id);
      });

      productsGrid.appendChild(productCard);
    });

    modal.style.display = "block";

    // Initialize wishlist and cart buttons
    initializeProductActions(productsGrid);

    // Apply current filters if they exist
    if (window.currentFilters) {
      applyFiltersToProducts(
        window.currentFilters.price,
        window.currentFilters.categories,
        window.currentFilters.minRating
      );
    }
  }

  // Function to show all categories
  function showAllCategories() {
    const modal = document.getElementById("categoriesModal");
    const categoriesGrid = modal.querySelector(".modal-categories-grid");

    // Clear existing content
    categoriesGrid.innerHTML = "";

    // Add all categories
    allCategories.forEach((category) => {
      const categoryCard = document.createElement("div");
      categoryCard.className = "category-card";
      categoryCard.dataset.category = category.name.toLowerCase();
      categoryCard.innerHTML = `
        <i class="fas ${category.icon} fa-2x" style="color: #00a651"></i>
        <h3>${category.name}</h3>
        <p>${category.count} Products</p>
      `;

      // Add click handler for each category
      categoryCard.addEventListener("click", () => {
        const categoryData = allCategories.find(
          (c) => c.name.toLowerCase() === category.name.toLowerCase()
        );
        if (categoryData) {
          showCategoryProducts(categoryData);
        }
      });

      categoriesGrid.appendChild(categoryCard);
    });

    modal.style.display = "block";
  }

  // Function to show category products
  function showCategoryProducts(category) {
    const modal = document.getElementById("categoryModal");
    const modalTitle = modal.querySelector("#categoryName");
    const productsGrid = modal.querySelector(".modal-products-grid");

    modalTitle.textContent = category.name;
    productsGrid.innerHTML = "";

    category.products.forEach((product) => {
      // Skip products without valid IDs
      if (!product.id) {
        console.warn(
          "Skipping product without valid ID in category",
          category.name,
          product
        );
        return;
      }

      // Check for both naming conventions
      const isOnSale = product.is_on_sale || product.onSale;
      const salePrice = product.sale_price || product.salePrice;
      const saleTag = product.saleTag || "Sale";

      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.dataset.productId = product.id;
      productCard.innerHTML = `
        ${isOnSale ? `<span class="sale-tag">${saleTag}</span>` : ""}
        <div class="product-actions">
          <button class="action-btn wishlist-btn" data-product-id="${
            product.id
          }">
            <i class="fas fa-heart"></i>
          </button>
          <button class="action-btn cart-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
        <img src="${window.STATIC_URL}${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="price">
            ${
              isOnSale && salePrice
                ? `<span class="sale-price">$${salePrice}</span>
               <span class="original-price">$${product.price}</span>`
                : `$${product.price}`
            }
          </div>
          <div class="rating" data-rating="${product.rating || 4}">
            ${generateRatingStars(product.rating || 4)}
          </div>
        </div>
      `;

      // Add click handler for the product card
      productCard.addEventListener("click", (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest(".product-actions")) {
          return;
        }
        showProductDetails(product.id);
      });

      productsGrid.appendChild(productCard);
    });

    modal.style.display = "block";
    initializeProductActions(productsGrid);

    // Apply current filters if they exist
    if (window.currentFilters) {
      applyFiltersToProducts(
        window.currentFilters.price,
        window.currentFilters.categories,
        window.currentFilters.minRating
      );
    }
  }

  // Close modal functionality
  document.querySelectorAll(".close-modal").forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      closeBtn.closest(".category-modal").style.display = "none";
    });
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("category-modal")) {
      e.target.style.display = "none";
    }
  });

  // Initialize wishlist buttons
  function initializeWishlistButtons(container) {
    container.querySelectorAll(".wishlist-btn").forEach((button) => {
      const productCard = button.closest(".product-card, .modal-product-card");
      const productData = getProductData(productCard);

      // Set initial state
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const isInWishlist = wishlist.some((item) => item.id === productData.id);
      updateWishlistButtonState(button, isInWishlist);

      button.addEventListener("click", function () {
        const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const isCurrentlyInWishlist = wishlist.some(
          (item) => item.id === productData.id
        );

        if (isCurrentlyInWishlist) {
          const updatedWishlist = wishlist.filter(
            (item) => item.id !== productData.id
          );
          localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
          button.classList.remove("active");
          button.querySelector("i").style.color = "";
        } else {
          wishlist.push(productData);
          localStorage.setItem("wishlist", JSON.stringify(wishlist));
          button.classList.add("active");
          button.querySelector("i").style.color = "#ff4444";
        }
      });
    });
  }

  // Get modal elements
  const allProductsModal = document.getElementById("allProductsModal");
  const allCategoriesModal = document.getElementById("allCategoriesModal");

  // View All buttons
  const viewAllProducts = document.getElementById("viewAllProducts");
  const viewAllCategories = document.getElementById("viewAllCategories");

  // Handle View All Products click
  if (viewAllProducts) {
    viewAllProducts.addEventListener("click", function (e) {
      e.preventDefault();
      allProductsModal.style.display = "block";
      initializeProductActions(allProductsModal);
    });
  }

  // Handle View All Categories click
  if (viewAllCategories) {
    viewAllCategories.addEventListener("click", function (e) {
      e.preventDefault();
      allCategoriesModal.style.display = "block";

      // Add click handlers to category cards in the modal
      const modalCategoryCards =
        allCategoriesModal.querySelectorAll(".category-card");
      modalCategoryCards.forEach((card) => {
        if (!card.dataset.initialized) {
          card.dataset.initialized = "true";
          initializeCategoryCard(card);
        }
      });
    });
  }

  // Close modals when clicking on X or outside
  document.querySelectorAll(".close-modal").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      const modalId = this.dataset.modal || this.closest(".category-modal").id;
      document.getElementById(modalId).style.display = "none";
    });
  });

  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("category-modal")) {
      e.target.style.display = "none";
    }
  });

  // Function to apply filters to products
  function applyFiltersToProducts(minPrice, maxPrice, categories, minRating) {
    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach((card) => {
      const productPrice = parseFloat(
        card.querySelector(".price").textContent.replace("$", "")
      );
      const productCategory = card.closest("[data-category]")?.dataset.category;
      const ratingElement = card.querySelector(".rating");
      const productRating = parseFloat(ratingElement?.dataset.rating || "0");

      const matchesPrice =
        (!minPrice || productPrice >= minPrice) &&
        (!maxPrice || productPrice <= maxPrice);
      const matchesCategory =
        !categories.length || categories.includes(productCategory);
      const matchesRating = !minRating || productRating >= minRating;

      if (matchesPrice && matchesCategory && matchesRating) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Function to show all filtered products in a modal
  function showAllFilteredProducts() {
    // Check if we have filtered products
    if (!window.filteredProducts || window.filteredProducts.length === 0) {
      showNotification("No filtered products to display");
      return;
    }

    // Create or use existing filtered products modal
    let filteredModal = document.getElementById("filteredProductsModal");
    if (!filteredModal) {
      filteredModal = document.createElement("div");
      filteredModal.className = "category-modal";
      filteredModal.id = "filteredProductsModal";
      filteredModal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h3 class="modal-title">Filtered Products</h3>
          <div class="modal-products-grid" id="filteredProductsGrid"></div>
        </div>
      `;
      document.body.appendChild(filteredModal);

      // Add close functionality
      const closeBtn = filteredModal.querySelector(".close-modal");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          filteredModal.style.display = "none";
        });
      }

      // Close on outside click
      filteredModal.addEventListener("click", (e) => {
        if (e.target === filteredModal) {
          filteredModal.style.display = "none";
        }
      });
    }

    // Get the products grid
    const productsGrid = filteredModal.querySelector(".modal-products-grid");
    if (!productsGrid) return;

    // Clear existing content
    productsGrid.innerHTML = "";

    // Add all filtered products
    window.filteredProducts.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.dataset.productId = product.id;

      // Create HTML for the product card
      productCard.innerHTML = `
              <div class="product-actions">
          <button class="action-btn wishlist-btn" data-product-id="${
            product.id
          }">
                  <i class="fas fa-heart"></i>
                </button>
          <button class="action-btn cart-btn" data-product-id="${product.id}">
                  <i class="fas fa-shopping-cart"></i>
                </button>
              </div>
        <img src="${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="rating" data-rating="${product.rating || 4}">
            ${generateRatingStars(product.rating || 4)}
            </div>
          <div class="price">${product.price}</div>
          ${
            product.category
              ? `<span class="category-badge">${product.category}</span>`
              : ""
          }
        </div>
      `;

      // Add click handler for the product card
      productCard.addEventListener("click", (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest(".product-actions")) {
          return;
        }
        showProductDetails(product.id);
      });

      // Add the card to the grid
      productsGrid.appendChild(productCard);
    });

    // Initialize product actions
    initializeProductActions(productsGrid);

    // Show the modal
    filteredModal.style.display = "block";
  }

  // Add CSS for the view filtered button
  document.addEventListener("DOMContentLoaded", () => {
    // Add styles for the view filtered button
    const style = document.createElement("style");
    style.textContent = `
      .view-filtered-btn {
        background-color: #00a651;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        margin-left: 10px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.3s;
      }
      
      .view-filtered-btn:hover {
        background-color: #008542;
      }
      
      .filter-status {
        display: flex;
        align-items: center;
      }
    `;
    document.head.appendChild(style);

    // Rest of the existing DOMContentLoaded code...
  });
});

// Function to safely get product data
function getProductData(card) {
  if (!card) return null;

  const img = card.querySelector("img");
  const nameElement = card.querySelector("h3");
  const priceElement = card.querySelector(".price");

  if (!img || !nameElement || !priceElement) {
    console.error("Missing product elements");
    return null;
  }

  // First try to get product ID from data attribute
  let productId = card.dataset.productId;

  // If not found on the card, try to get it from the wishlist button
  if (!productId) {
    const wishlistBtn = card.querySelector(".wishlist-btn");
    if (wishlistBtn && wishlistBtn.dataset.productId) {
      productId = wishlistBtn.dataset.productId;
    }
  }

  // Fall back to generating an ID from the name if no ID found
  if (!productId) {
    productId = nameElement.textContent.toLowerCase().replace(/\s+/g, "-");
  }

  return {
    id: productId,
    name: nameElement.textContent,
    price: priceElement.textContent,
    image: img.src,
  };
}

// Initialize product actions (wishlist and cart buttons)
function initializeProductActions(container = document) {
  // Handle wishlist buttons
  container.querySelectorAll(".wishlist-btn").forEach((btn) => {
    if (!btn.dataset.initialized) {
      btn.dataset.initialized = "true";

      // Set initial state
      const productId = btn.dataset.productId;
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const isInWishlist = wishlist.some((item) => item.id === productId);
      updateWishlistButtonState(btn, isInWishlist);

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const productId = this.dataset.productId;
        const productCard = this.closest(".product-card");

        if (!productCard) {
          console.error("Product card not found");
          return;
        }

        // Ensure product card has the same ID as the button
        if (!productCard.dataset.productId) {
          productCard.dataset.productId = productId;
        }

        const productData = {
          id: productId,
          name: productCard.querySelector("h3").textContent,
          price: productCard.querySelector(".price").textContent,
          image: productCard.querySelector("img").src,
        };

        toggleWishlistItem(productData, this);
      });
    }
  });

  // Handle cart buttons
  container.querySelectorAll(".cart-btn").forEach((btn) => {
    if (!btn.dataset.initialized) {
      btn.dataset.initialized = "true";

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const productId = this.dataset.productId;
        const productCard = this.closest(".product-card");
        addToCart(productCard, productId);
      });
    }
  });
}

function toggleWishlistItem(productData, button) {
  if (!productData || !button) {
    console.error("Missing product data or button");
    return;
  }

  // Ensure productData is complete and valid before adding to wishlist
  if (
    !productData.id ||
    !productData.name ||
    !productData.price ||
    !productData.image
  ) {
    console.error("Invalid product data:", productData);
    showNotification("Error: Product data is incomplete", "error");
    return;
  }

  // Ensure productData has all required properties
  if (!productData.rating) {
    // Try to get rating from the product card
    const card = button.closest(".product-card");
    if (card) {
      const ratingElement = card.querySelector(".rating");
      if (ratingElement && ratingElement.dataset.rating) {
        productData.rating = ratingElement.dataset.rating;
      } else {
        productData.rating = "0"; // Default value
      }
    } else {
      productData.rating = "0"; // Default value
    }
  }

  let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const isInWishlist = wishlist.some((item) => item.id === productData.id);

  if (isInWishlist) {
    // Remove from wishlist
    wishlist = wishlist.filter((item) => item.id !== productData.id);
    updateWishlistButtonState(button, false);
    showNotification("Product removed from wishlist");
  } else {
    // Add to wishlist
    wishlist.push(productData);
    updateWishlistButtonState(button, true);
    showNotification("Product added to wishlist");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  // Update all instances of this product's wishlist button
  document
    .querySelectorAll(`.wishlist-btn[data-product-id="${productData.id}"]`)
    .forEach((btn) => {
      if (btn !== button) {
        updateWishlistButtonState(btn, !isInWishlist);
      }
    });
}

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

async function addToCart(productCard, productId) {
  if (!productCard || !productId) {
    console.error("Missing product data");
    return;
  }

  // Handle generated product IDs
  if (productId.toString().startsWith("generated-")) {
    showNotification(
      "This is a demo product and cannot be added to cart",
      "error"
    );
    return;
  }

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
      const errorText = await response.text();
      console.error("Server response:", errorText);
      throw new Error("Failed to add item to cart");
    }

    const data = await response.json();
    showNotification(data.message || "Product added to cart");
  } catch (error) {
    console.error("Error adding to cart:", error);
    showNotification("Failed to add product to cart", "error");
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

function initializeCategoryCard(card) {
  card.addEventListener("click", async function () {
    const categoryId = this.dataset.categoryId;
    const categoryNameText = this.querySelector("h3").textContent;

    if (!categoryId || !categoryNameText) {
      console.error("Missing category data");
      return;
    }

    // Close any open modals
    document.querySelectorAll(".category-modal").forEach((modal) => {
      modal.style.display = "none";
    });

    // Show the category products modal
    const categoryModal = document.getElementById("categoryModal");
    const modalTitle = document.getElementById("categoryName");
    const productsContainer = document.getElementById("categoryProducts");

    if (!categoryModal || !modalTitle || !productsContainer) {
      console.error("Modal elements not found");
      return;
    }

    try {
      // Show loading state
      productsContainer.innerHTML =
        '<div class="loading">Loading products...</div>';
      categoryModal.style.display = "block";
      modalTitle.textContent = categoryNameText;

      // Fetch products
      const response = await fetch(`/api/categories/${categoryId}/products/`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const products = await response.json();

      if (products.length === 0) {
        productsContainer.innerHTML =
          "<p>No products found in this category.</p>";
        return;
      }

      // Get current wishlist for checking initial states
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

      // Display products
      productsContainer.innerHTML = products
        .map((product) => {
          // Check for both naming conventions
          const isOnSale = product.is_on_sale || product.onSale;
          const salePrice = product.sale_price || product.salePrice;
          const saleTag = product.saleTag || "Sale";

          return `
            <div class="product-card" data-product-id="${product.id}">
              ${isOnSale ? `<span class="sale-tag">${saleTag}</span>` : ""}
              <img src="${product.image}" alt="${
            product.name
          }" onerror="this.src='/static/images/placeholder.png'">
              <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">
                  ${
                    isOnSale && salePrice
                      ? `<span class="sale-price">$${salePrice}</span>
                     <span class="original-price">$${product.price}</span>`
                      : `$${product.price}`
                  }
                </p>
                <div class="rating" data-rating="${product.rating || 4}">
                  ${generateRatingStars(product.rating || 4)}
                </div>
                <div class="product-actions">
                  <button class="wishlist-btn" data-product-id="${product.id}">
                    <i class="fas fa-heart"></i>
                  </button>
                  <button class="cart-btn" data-product-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      // Add click handlers to product cards
      productsContainer.querySelectorAll(".product-card").forEach((card) => {
        card.addEventListener("click", function (e) {
          // Don't trigger if clicking on action buttons
          if (e.target.closest(".product-actions")) {
            return;
          }
          const productId = this.dataset.productId;
          if (productId) {
            showProductDetails(productId);
          }
        });
      });

      // Initialize product actions for the new products
      initializeProductActions(productsContainer);

      // Apply current filters if they exist
      if (window.currentFilters) {
        applyFiltersToProducts(
          window.currentFilters.price,
          window.currentFilters.categories,
          window.currentFilters.minRating
        );
      }
    } catch (error) {
      console.error("Error:", error);
      productsContainer.innerHTML =
        "<p>Error loading products. Please try again.</p>";
    }
  });
}
