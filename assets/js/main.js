document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
      var expanded = document.body.classList.contains('nav-open');
      toggle.setAttribute('aria-expanded', expanded);
    });
  }

  var dropdownBtn = document.querySelector('.nav-item-btn');
  var navItem = document.querySelector('.nav-item.has-dropdown');
  if (dropdownBtn && navItem) {
    dropdownBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navItem.classList.toggle('open');
      dropdownBtn.setAttribute('aria-expanded', navItem.classList.contains('open'));
    });
    document.addEventListener('click', function (e) {
      if (!navItem.contains(e.target)) {
        navItem.classList.remove('open');
      }
    });
  }
});
