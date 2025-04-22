document.addEventListener("DOMContentLoaded", function () {
  loadCart();
  initializeEventListeners();
});

function loadCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const cart = getCart();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4>Your cart is empty</h4>
                <a href="/store" class="btn btn-primary mt-3">Continue Shopping</a>
            </div>
        `;
    updateCartSummary(0);
    return;
  }

  cartItemsContainer.innerHTML = "";
  const template = document.getElementById("cart-item-template");

  cart.forEach((item) => {
    const clone = template.content.cloneNode(true);

    // Set product details
    clone.querySelector(".product-image").src = item.image;
    clone.querySelector(".product-name").textContent = item.name;
    clone.querySelector(".product-price").textContent = formatPrice(item.price);
    clone.querySelector(".quantity-input").value = item.quantity;

    // Add product ID data attribute
    const cartItem = clone.querySelector(".col-12");
    cartItem.dataset.productId = item.id;

    cartItemsContainer.appendChild(clone);
  });

  updateCartSummary(calculateTotal(cart));
}

function initializeEventListeners() {
  const cartItemsContainer = document.getElementById("cart-items");

  // Delegate events for quantity controls and remove buttons
  cartItemsContainer.addEventListener("click", function (e) {
    const target = e.target;
    const cartItem = target.closest(".col-12");

    if (!cartItem) return;

    const productId = cartItem.dataset.productId;
    const quantityInput = cartItem.querySelector(".quantity-input");

    if (target.classList.contains("decrease-quantity")) {
      updateQuantity(productId, parseInt(quantityInput.value) - 1);
    } else if (target.classList.contains("increase-quantity")) {
      updateQuantity(productId, parseInt(quantityInput.value) + 1);
    } else if (target.classList.contains("remove-item")) {
      removeFromCart(productId);
    }
  });

  // Handle manual quantity input
  cartItemsContainer.addEventListener("change", function (e) {
    if (e.target.classList.contains("quantity-input")) {
      const cartItem = e.target.closest(".col-12");
      const productId = cartItem.dataset.productId;
      const newQuantity = parseInt(e.target.value);

      if (newQuantity > 0) {
        updateQuantity(productId, newQuantity);
      } else {
        e.target.value = 1;
        updateQuantity(productId, 1);
      }
    }
  });

  // Handle checkout button
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      // TODO: Implement checkout functionality
      alert("Checkout functionality will be implemented soon!");
    });
  }
}

function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) return;

  let cart = getCart();
  const itemIndex = cart.findIndex((item) => item.id === productId);

  if (itemIndex !== -1) {
    cart[itemIndex].quantity = newQuantity;
    saveCart(cart);
    loadCart();
    showNotification("Cart updated");
  }
}

function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== productId);
  saveCart(cart);
  loadCart();
  showNotification("Item removed from cart");
}

function updateCartSummary(total) {
  const subtotalElement = document.getElementById("cart-subtotal");
  const totalElement = document.getElementById("cart-total");

  if (subtotalElement && totalElement) {
    subtotalElement.textContent = formatPrice(total);
    totalElement.textContent = formatPrice(total); // Add shipping costs here if needed
  }
}

// Helper functions
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function calculateTotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function formatPrice(price) {
  return `$${parseFloat(price).toFixed(2)}`;
}

function showNotification(message) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;
  notification.textContent = message;

  // Add to document
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => (notification.style.opacity = "1"), 10);

  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
