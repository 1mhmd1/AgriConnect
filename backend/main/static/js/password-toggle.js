document.addEventListener("DOMContentLoaded", function () {
  // Function to create password toggle
  function createPasswordToggle(input) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.width = "100%";

    // Move the input into the wrapper
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    // Create the eye icon
    const eyeIcon = document.createElement("i");
    eyeIcon.className = "fas fa-eye";
    eyeIcon.style.position = "absolute";
    eyeIcon.style.right = "15px";
    eyeIcon.style.top = "50%";
    eyeIcon.style.transform = "translateY(-50%)";
    eyeIcon.style.cursor = "pointer";
    eyeIcon.style.color = "#666";
    eyeIcon.style.transition = "all 0.3s ease";

    // Add hover effect
    eyeIcon.addEventListener("mouseenter", function () {
      eyeIcon.style.color = "#1e6b40";
      eyeIcon.style.transform = "translateY(-50%) scale(1.1)";
    });

    eyeIcon.addEventListener("mouseleave", function () {
      eyeIcon.style.color = "#666";
      eyeIcon.style.transform = "translateY(-50%) scale(1)";
    });

    wrapper.appendChild(eyeIcon);

    // Toggle password visibility
    eyeIcon.addEventListener("click", function () {
      if (input.type === "password") {
        input.type = "text";
        eyeIcon.className = "fas fa-eye-slash";
      } else {
        input.type = "password";
        eyeIcon.className = "fas fa-eye";
      }
    });
  }

  // Apply to all password inputs
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(createPasswordToggle);
});
