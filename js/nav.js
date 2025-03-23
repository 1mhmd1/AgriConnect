const userIcon = document.getElementById("userIcon");
const dropdownMenu = document.querySelector(".dropdown-menu");

userIcon.addEventListener("click", function (e) {
  e.stopPropagation();
  dropdownMenu.classList.toggle("show");
});

document.addEventListener("click", function () {
  dropdownMenu.classList.remove("show");
});
document.addEventListener("DOMContentLoaded", function () {
  const userMenu = document.querySelector(".user-menu");

  // Optional: Keep click functionality for mobile
  userMenu.addEventListener("click", function (e) {
    if (window.innerWidth <= 768) {
      // Mobile devices
      this.classList.toggle("active");
    }
  });

  // Smooth hover behavior for desktop
  userMenu.addEventListener("mouseenter", function () {
    if (window.innerWidth > 768) {
      this.classList.add("active");
    }
  });

  userMenu.addEventListener("mouseleave", function () {
    if (window.innerWidth > 768) {
      this.classList.remove("active");
    }
  });
});
