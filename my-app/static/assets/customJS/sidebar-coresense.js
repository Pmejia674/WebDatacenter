/* ========================================
   CoreSense365 Sidebar JavaScript
   Handles collapse, mobile menu, and interactions
======================================== */

(function() {
  'use strict';

  // DOM Elements
  const sidebar = document.getElementById('sidebarCoresense');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.getElementById('sidebarOverlay');
  const toggleCollapse = document.getElementById('toggleCollapse');
  const openSidebar = document.getElementById('openSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  const navItems = document.querySelectorAll('.nav-item');

  // Check if elements exist
  if (!sidebar) {
    console.warn('Sidebar element not found');
    return;
  }

  // ========================================
  // Desktop Collapse Toggle
  // ========================================
  if (toggleCollapse) {
    toggleCollapse.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      
      // Save state to localStorage
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
      
      // Update icon
      const icon = this.querySelector('i');
      if (icon) {
        icon.classList.toggle('bi-chevron-left');
        icon.classList.toggle('bi-chevron-right');
      }
    });
  }

  // ========================================
  // Mobile Menu Open
  // ========================================
  function openMobileMenu() {
    if (sidebar) {
      sidebar.classList.add('mobile-open');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  if (openSidebar) {
    openSidebar.addEventListener('click', openMobileMenu);
  }

  // Also listen to header button
  const openSidebarHeader = document.getElementById('openSidebarHeader');
  if (openSidebarHeader) {
    openSidebarHeader.addEventListener('click', openMobileMenu);
  }

  // ========================================
  // Mobile Menu Close
  // ========================================
  function closeMobileMenu() {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (closeSidebar) {
    closeSidebar.addEventListener('click', closeMobileMenu);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }

  // ========================================
  // Close mobile menu on nav item click
  // ========================================
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      if (window.innerWidth < 992) {
        closeMobileMenu();
      }
    });
  });

  // ========================================
  // Restore collapsed state from localStorage
  // ========================================
  function restoreSidebarState() {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed && window.innerWidth >= 992) {
      sidebar.classList.add('collapsed');
      
      // Update icon
      if (toggleCollapse) {
        const icon = toggleCollapse.querySelector('i');
        if (icon) {
          icon.classList.remove('bi-chevron-left');
          icon.classList.add('bi-chevron-right');
        }
      }
    }
  }

  // ========================================
  // Handle window resize
  // ========================================
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (window.innerWidth >= 992) {
        closeMobileMenu();
        restoreSidebarState();
      } else {
        sidebar.classList.remove('collapsed');
      }
    }, 250);
  });

  // ========================================
  // Active Navigation Item
  // ========================================
  function setActiveNavItem() {
    const currentPath = window.location.pathname;
    
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      
      // Remove active class from all items
      item.classList.remove('active');
      
      // Add active class to matching item
      if (href === currentPath) {
        item.classList.add('active');
      }
    });
  }

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // ========================================
  // Tooltip Initialization (for collapsed state)
  // ========================================
  function initTooltips() {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }

  // ========================================
  // Add ripple effect on nav items
  // ========================================
  function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  }

  // Add ripple to nav items
  navItems.forEach(item => {
    item.addEventListener('click', createRipple);
  });

  // Add ripple CSS
  const style = document.createElement('style');
  style.textContent = `
    .nav-item {
      position: relative;
      overflow: hidden;
    }
    
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // ========================================
  // Badge Animation
  // ========================================
  function animateBadges() {
    const badges = document.querySelectorAll('.badge-alert');
    badges.forEach((badge, index) => {
      setTimeout(() => {
        badge.style.animation = 'pulse 2s ease-in-out infinite';
      }, index * 100);
    });
  }

  // ========================================
  // Keyboard Navigation
  // ========================================
  document.addEventListener('keydown', function(e) {
    // Close sidebar on ESC key (mobile)
    if (e.key === 'Escape' && window.innerWidth < 992) {
      closeMobileMenu();
    }
    
    // Toggle sidebar on Ctrl + B
    if (e.ctrlKey && e.key === 'b' && window.innerWidth >= 992) {
      e.preventDefault();
      if (toggleCollapse) {
        toggleCollapse.click();
      }
    }
  });

  // ========================================
  // Initialize Everything
  // ========================================
  function init() {
    restoreSidebarState();
    setActiveNavItem();
    initTooltips();
    animateBadges();
    
    console.log('CoreSense365 Sidebar initialized ✓');
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ========================================
  // Public API (optional)
  // ========================================
  window.CoreSenseSidebar = {
    collapse: function() {
      sidebar.classList.add('collapsed');
      localStorage.setItem('sidebarCollapsed', 'true');
    },
    expand: function() {
      sidebar.classList.remove('collapsed');
      localStorage.setItem('sidebarCollapsed', 'false');
    },
    toggle: function() {
      if (toggleCollapse) {
        toggleCollapse.click();
      }
    },
    openMobile: function() {
      if (openSidebar && window.innerWidth < 992) {
        openSidebar.click();
      }
    },
    closeMobile: closeMobileMenu
  };

})();
