/**
 * Navigation functionality for AgriConnect
 * Handles user menu dropdown, scroll behavior, and responsive design
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const userIcon = document.getElementById("userIcon");
  const userMenu = document.querySelector(".user-menu");
  const dropdownMenu = document.querySelector(".dropdown-menu");
  const nav = document.querySelector(".nav");

  // State variables
  let lastScrollTop = 0;
  let isMouseNearTop = false;
  const MOBILE_BREAKPOINT = 768;
  const NAV_HEIGHT = 70;

  // Event Handlers
  const handleMobileClick = (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
  };

  const handleDocumentClick = (e) => {
    if (!userMenu.contains(e.target)) {
      dropdownMenu.classList.remove("show");
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      dropdownMenu.classList.remove("show");
    }
  };

  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (!isMouseNearTop) {
      nav.style.transform =
        scrollTop > lastScrollTop && scrollTop > NAV_HEIGHT
          ? "translateY(-100%)"
          : "translateY(0)";
    }

    lastScrollTop = scrollTop;
  };

  const handleMouseMove = (e) => {
    isMouseNearTop = e.clientY <= NAV_HEIGHT;

    if (isMouseNearTop) {
      nav.style.transform = "translateY(0)";
    } else if (
      window.pageYOffset > lastScrollTop &&
      window.pageYOffset > NAV_HEIGHT
    ) {
      nav.style.transform = "translateY(-100%)";
    }
  };

  const handleResize = () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      dropdownMenu.classList.remove("show");
    }
  };

  const handleMouseEnter = () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      userMenu.classList.add("active");
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      userMenu.classList.remove("active");
    }
  };

  // Mobile-specific event listeners
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    userIcon.addEventListener("click", handleMobileClick);
    document.addEventListener("click", handleDocumentClick);
  }

  // Global event listeners
  document.addEventListener("keydown", handleEscapeKey);
  window.addEventListener("scroll", handleScroll);
  document.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("resize", handleResize);
  userMenu.addEventListener("mouseenter", handleMouseEnter);
  userMenu.addEventListener("mouseleave", handleMouseLeave);
});
