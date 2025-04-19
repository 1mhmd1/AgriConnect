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
});
