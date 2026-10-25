function wireNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  toggle?.addEventListener("click", () => links?.classList.toggle("open"));
}

function wireContact() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (status) {
      status.textContent = "Thanks. AJ Laundry Services will confirm your pickup shortly.";
    }
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireNav();
  wireContact();
});
