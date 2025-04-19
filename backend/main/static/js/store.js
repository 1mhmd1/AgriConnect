document.addEventListener("DOMContentLoaded", () => {
  // Initialize action buttons for all products
  initializeProductActions();

  // Add click event to product cards
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on action buttons
      if (e.target.closest(".product-actions")) {
        return;
      }

      const productId = card.dataset.productId;
      showProductDetails(productId);
    });
  });

  // Function to show product details
  async function showProductDetails(productId) {
    try {
      const response = await fetch(`/api/products/${productId}/`);
      if (!response.ok) {
        throw new Error("Failed to fetch product details");
      }

      const product = await response.json();
      const modal = document.getElementById("productDetailsModal");

      // Populate modal with product data
      document.getElementById("productDetailsImage").src = product.image;
      document.getElementById("productDetailsCategory").textContent =
        product.category.name;
      document.getElementById("productDetailsName").textContent = product.name;

      // Set rating
      const ratingContainer = document.getElementById("productDetailsRating");
      const starsContainer = ratingContainer.querySelector(".stars");
      const ratingText = ratingContainer.querySelector(".rating-text");
      starsContainer.innerHTML = generateRatingStars(product.rating);
      ratingText.textContent = `${product.rating} out of 5`;

      // Set price
      const priceContainer = document.getElementById("productDetailsPrice");
      const currentPrice = priceContainer.querySelector(".current-price");
      const originalPrice = priceContainer.querySelector(".original-price");
      const saleBadge = priceContainer.querySelector(".sale-badge");

      if (product.is_on_sale) {
        currentPrice.textContent = `$${product.sale_price}`;
        originalPrice.textContent = `$${product.price}`;
        saleBadge.style.display = "inline-block";
      } else {
        currentPrice.textContent = `$${product.price}`;
        originalPrice.textContent = "";
        saleBadge.style.display = "none";
      }

      // Set stock status
      const stockStatus = document.getElementById("productDetailsStock");
      const stockIcon = stockStatus.querySelector("i");
      const stockText = stockStatus.querySelector("span");

      if (product.stock > 0) {
        stockIcon.className = "fas fa-check-circle";
        stockIcon.style.color = "#00a651";
        stockText.textContent = `In Stock (${product.stock} available)`;
      } else {
        stockIcon.className = "fas fa-times-circle";
        stockIcon.style.color = "#ff4444";
        stockText.textContent = "Out of Stock";
      }

      // Set description
      document.getElementById("productDetailsDescription").textContent =
        product.description;

      // Set up action buttons
      const addToCartBtn = document.getElementById("productDetailsAddToCart");
      const addToWishlistBtn = document.getElementById(
        "productDetailsAddToWishlist"
      );

      addToCartBtn.disabled = product.stock === 0;
      addToCartBtn.dataset.productId = productId;
      addToWishlistBtn.dataset.productId = productId;

      // Show modal
      modal.style.display = "block";
    } catch (error) {
      console.error("Error loading product details:", error);
      showNotification("Failed to load product details", "error");
    }
  }

  // Function to generate rating stars
  function generateRatingStars(rating) {
    let stars = "";
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }
    return stars;
  }

  // Function to show notification
  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

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

  // Handle category card clicks
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", async function () {
      const categoryId = this.dataset.categoryId;
      const categoryNameElement = this.querySelector("h3");

      if (!categoryId || !categoryNameElement) {
        console.error("Missing category data");
        return;
      }

      try {
        // Show loading state
        productsContainer.innerHTML =
          '<div class="loading">Loading products...</div>';
        modal.style.display = "block";
        modalTitle.textContent = categoryNameElement.textContent;

        // Fetch products
        const response = await fetch(`/api/categories/${categoryId}/products/`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const products = await response.json();

        // Display products
        if (products.length === 0) {
          productsContainer.innerHTML =
            "<p>No products found in this category.</p>";
          return;
        }

        productsContainer.innerHTML = products
          .map(
            (product) => `
          <div class="product-card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='/static/images/placeholder.png'">
            <h4>${product.name}</h4>
            <p class="price">$${product.price}</p>
            <div class="product-actions">
              <button class="wishlist-btn" data-product-id="${product.id}">
                <i class="fas fa-heart"></i>
              </button>
              <button class="cart-btn" data-product-id="${product.id}">
                <i class="fas fa-shopping-cart"></i>
              </button>
            </div>
          </div>
        `
          )
          .join("");

        // Initialize actions for new products
        initializeProductActions();
      } catch (error) {
        console.error("Error:", error);
        productsContainer.innerHTML =
          "<p>Error loading products. Please try again.</p>";
      }
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

  // Handle wishlist button clicks
  document.addEventListener("click", function (e) {
    if (e.target.closest(".wishlist-btn")) {
      const btn = e.target.closest(".wishlist-btn");
      btn.classList.toggle("active");
      const icon = btn.querySelector("i");
      icon.style.color = btn.classList.contains("active") ? "#ff4444" : "";
    }
  });

  // Handle cart button clicks
  document.addEventListener("click", function (e) {
    if (e.target.closest(".cart-btn")) {
      const btn = e.target.closest(".cart-btn");
      btn.classList.toggle("active");
    }
  });

  // All featured products data
  const allFeaturedProducts = [
    {
      name: "Amistar",
      price: "199",
      image: "images/amistar.jpeg",
      rating: 4.5,
      onSale: true,
      saleTag: "Sale 50%",
    },
    {
      name: "Hexa Force",
      price: "149",
      image: "images/hexaforce.jpeg",
      rating: 4,
    },
    {
      name: "Valipro",
      price: "14.99",
      image: "images/valipro.jpeg",
      rating: 4.5,
    },
    {
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
    const ratingHtml = generateRatingStars(product.rating);
    return `
      <div class="product-card">
        ${
          product.onSale
            ? `<span class="sale-tag">${product.saleTag}</span>`
            : ""
        }
        <div class="product-actions">
          <button class="action-btn wishlist-btn">
            <i class="fas fa-heart"></i>
          </button>
          <button class="action-btn cart-btn">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
        <img src="${window.STATIC_URL}${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="rating">
            ${ratingHtml}
          </div>
          <div class="price">${product.price}</div>
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
    productsGrid.innerHTML = allFeaturedProducts
      .map((product) => createProductCard(product))
      .join("");
    modal.style.display = "block";

    // Initialize wishlist buttons in the modal
    initializeWishlistButtons(modal);
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
      const productCard = document.createElement("div");
      productCard.className = "modal-product-card";
      productCard.innerHTML = `
        <div class="product-actions">
          <button class="action-btn wishlist-btn">
            <i class="fas fa-heart"></i>
          </button>
          <button class="action-btn cart-btn">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
        <img src="${window.STATIC_URL}${product.image}" alt="${product.name}" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="price">$${product.price}</div>
        </div>
      `;
      productsGrid.appendChild(productCard);
    });

    modal.style.display = "block";
    initializeProductActions();
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
      updateWishlistButton(button, isInWishlist);

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
      fetch(`/api/products/category/${categoryId}/`)
        .then((response) => response.json())
        .then((products) => {
          productsContainer.innerHTML = products
            .map(
              (product) => `
            <div class="product-card">
              <img src="${product.image}" alt="${product.name}" />
              <h3>${product.name}</h3>
              <p class="price">$${product.price}</p>
              <div class="product-actions">
                <button class="wishlist-btn" data-product-id="${product.id}">
                  <i class="fas fa-heart"></i>
                </button>
                <button class="cart-btn" data-product-id="${product.id}">
                  <i class="fas fa-shopping-cart"></i>
                </button>
              </div>
            </div>
          `
            )
            .join("");
        })
        .catch((error) => {
          console.error("Error fetching category products:", error);
          productsContainer.innerHTML =
            "<p>Error loading products. Please try again later.</p>";
        });
    });
  });

  // Handle wishlist and cart buttons
  document.addEventListener("click", function (e) {
    if (e.target.closest(".wishlist-btn")) {
      const btn = e.target.closest(".wishlist-btn");
      const productId = btn.dataset.productId;
      toggleWishlistItem(productId, btn);
    } else if (e.target.closest(".cart-btn")) {
      const btn = e.target.closest(".cart-btn");
      const productId = btn.dataset.productId;
      const productCard = btn.closest(".product-card");
      addToCart(productCard, productId);
    }
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

  return {
    id: nameElement.textContent.toLowerCase().replace(/\s+/g, "-"),
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

  let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const existingIndex = wishlist.findIndex(
    (item) => item.id === productData.id
  );

  if (existingIndex !== -1) {
    // Remove from wishlist
    wishlist.splice(existingIndex, 1);
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
        updateWishlistButtonState(btn, existingIndex === -1);
      }
    });
}

function updateWishlistButtonState(button, isInWishlist) {
  if (!button) return;

  button.classList.toggle("active", isInWishlist);
  const icon = button.querySelector("i");
  if (icon) {
    icon.style.color = isInWishlist ? "#ff4444" : "";
  }
}

async function addToCart(productCard, productId) {
  if (!productCard || !productId) {
    console.error("Missing product data");
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
      const data = await response.json();
      throw new Error(data.error || "Failed to add item to cart");
    }

    const data = await response.json();
    showNotification("Product added to cart");
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

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
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
        .map(
          (product) => `
        <div class="product-card" data-product-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" onerror="this.src='/static/images/placeholder.png'">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">${product.price}</p>
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
      `
        )
        .join("");

      // Initialize product actions for the new products
      const newProducts = productsContainer.querySelectorAll(".product-card");
      newProducts.forEach((productCard) => {
        const wishlistBtn = productCard.querySelector(".wishlist-btn");
        const cartBtn = productCard.querySelector(".cart-btn");
        const productId = productCard.dataset.productId;

        // Initialize wishlist button
        if (wishlistBtn && !wishlistBtn.dataset.initialized) {
          wishlistBtn.dataset.initialized = "true";
          const isInWishlist = wishlist.some((item) => item.id === productId);
          updateWishlistButtonState(wishlistBtn, isInWishlist);

          wishlistBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const productData = {
              id: productId,
              name: productCard.querySelector("h3").textContent,
              price: productCard.querySelector(".price").textContent,
              image: productCard.querySelector("img").src,
            };
            toggleWishlistItem(productData, this);
          });
        }

        // Initialize cart button
        if (cartBtn && !cartBtn.dataset.initialized) {
          cartBtn.dataset.initialized = "true";
          cartBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            addToCart(productCard, productId);
          });
        }
      });
    } catch (error) {
      console.error("Error:", error);
      productsContainer.innerHTML =
        "<p>Error loading products. Please try again.</p>";
    }
  });
}
