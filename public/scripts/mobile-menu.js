// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
      
      // Toggle aria-expanded
      mobileMenuButton.setAttribute('aria-expanded', String(!isExpanded));
      
      // Toggle menu visibility
      if (isExpanded) {
        mobileMenu.classList.add('hidden');
      } else {
        mobileMenu.classList.remove('hidden');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
        mobileMenu.classList.add('hidden');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        mobileMenu.classList.add('hidden');
        mobileMenuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
