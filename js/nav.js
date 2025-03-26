document.addEventListener("DOMContentLoaded", function () {
  const userIcon = document.getElementById("userIcon");
  const userMenu = document.querySelector(".user-menu");
  const dropdownMenu = document.querySelector(".dropdown-menu");
  const nav = document.querySelector(".nav");
  let lastScrollTop = 0;
  let isMouseNearTop = false;

  // Only use click events for mobile
  if (window.innerWidth <= 768) {
    userIcon.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    // Close dropdown when clicking anywhere else on mobile
    document.addEventListener("click", function (e) {
      if (!userMenu.contains(e.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
  }

  // Close dropdown when pressing Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      dropdownMenu.classList.remove("show");
    }
  });

  // Handle scroll events
  window.addEventListener("scroll", () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (!isMouseNearTop) {
      if (scrollTop > lastScrollTop && scrollTop > 70) {
        // Scrolling down & past navbar height
        nav.style.transform = "translateY(-100%)";
      } else {
        // Scrolling up
        nav.style.transform = "translateY(0)";
      }
    }

    lastScrollTop = scrollTop;
  });

  // Handle mouse movement
  document.addEventListener("mousemove", (e) => {
    // Check if mouse is within 70px of the top of the page
    isMouseNearTop = e.clientY <= 70;

    if (isMouseNearTop) {
      nav.style.transform = "translateY(0)";
    } else if (window.pageYOffset > lastScrollTop && window.pageYOffset > 70) {
      nav.style.transform = "translateY(-100%)";
    }
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth <= 768) {
      // Switch to click behavior on mobile
      dropdownMenu.classList.remove("show");
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
