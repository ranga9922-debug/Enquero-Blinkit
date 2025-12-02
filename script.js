// ====== STORAGE HELPERS (users array in localStorage) ======
const STORAGE_KEY = "eb_users";

// Load users from localStorage
function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save users to localStorage
function saveUsers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// In-memory users array, initialized from storage
let users = loadUsers();

// Optional demo user (only added once if not present)
const demoEmail = "user@enquero.com";
if (!users.some((u) => u.email.toLowerCase() === demoEmail.toLowerCase())) {
  users.push({
    name: "Demo User",
    email: demoEmail,
    password: "Enquero@123",
  });
  saveUsers();
}

// ====== DOM REFERENCES ======
const forms = document.querySelectorAll(".form-panel");
const tabButtons = document.querySelectorAll(".tab-button");
const targetButtons = document.querySelectorAll("[data-form-target]");
const passwordToggles = document.querySelectorAll(".toggle-password");

const authCard = document.getElementById("auth-card");
const welcomeScreen = document.getElementById("welcome-screen");
const logoutBtn = document.getElementById("logout-btn");
const welcomeName = document.getElementById("welcome-name");
const welcomeSubtext = document.getElementById("welcome-subtext");

// Login
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

// Signup
const signupForm = document.getElementById("signup-form");
const signupError = document.getElementById("signup-error");
const signupSuccess = document.getElementById("signup-success");

// Forgot / reset password
const forgotForm = document.getElementById("forgot-form");
const forgotMsg = document.getElementById("forgot-message");
const forgotError = document.getElementById("forgot-error");

// ====== TOAST / NOTIFICATION ======
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.classList.add("toast", `toast--${type}`);

  const icon = document.createElement("div");
  icon.classList.add("toast-icon");

  if (type === "success") icon.textContent = "✅";
  else if (type === "error") icon.textContent = "⚠️";
  else icon.textContent = "ℹ️";

  const msg = document.createElement("div");
  msg.classList.add("toast-message");
  msg.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(msg);
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ====== HELPERS ======
function showForm(formId) {
  forms.forEach((form) => {
    form.classList.toggle("active", form.id === formId);
  });
  tabButtons.forEach((tab) => {
    tab.classList.toggle(
      "active",
      tab.getAttribute("data-form-target") === formId
    );
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Simpler strong password: 8+ chars, 1 uppercase, 1 number
function isStrongPassword(password) {
  const pattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return pattern.test(password);
}

// ====== FORM SWITCHING ======
targetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-form-target");
    if (target) {
      showForm(target);
    }
  });
});

// ====== PASSWORD VISIBILITY ======
passwordToggles.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.textContent = isPassword ? "🙈" : "👁";
  });
});

// ====== LOGIN ======
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!isValidEmail(email)) {
    loginError.textContent = "Please enter a valid email address.";
    showToast("Invalid email format", "error");
    return;
  }

  if (!password) {
    loginError.textContent = "Password is required.";
    showToast("Password is required", "error");
    return;
  }

  // Reload users from storage in case they changed
  users = loadUsers();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    loginError.textContent = "Incorrect email or password.";
    showToast("Login failed. Check your credentials.", "error");
    return;
  }

  // Success
  authCard.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");
  welcomeName.textContent = user.name || user.email;
  welcomeSubtext.textContent = `Signed in as ${user.email}`;
  showToast(`Welcome back, ${user.name || "user"}!`, "success");
});

// ====== SIGNUP ======
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  signupError.textContent = "";
  signupSuccess.textContent = "";

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;

  if (!name) {
    signupError.textContent = "Name is required.";
    showToast("Please enter your name", "error");
    return;
  }

  if (!isValidEmail(email)) {
    signupError.textContent = "Enter a valid email address.";
    showToast("Invalid email format", "error");
    return;
  }

  if (!isStrongPassword(password)) {
    signupError.textContent =
      "Weak password. Use 8+ chars, 1 uppercase & 1 number.";
    showToast("Password is too weak", "error");
    return;
  }

  if (password !== confirm) {
    signupError.textContent = "Passwords do not match.";
    showToast("Passwords do not match", "error");
    return;
  }

  // Reload & check duplicates
  users = loadUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    signupError.textContent = "Email is already registered. Try logging in.";
    showToast("Email already exists", "error");
    return;
  }

  // Add to users array + save
  users.push({ name, email, password });
  saveUsers();

  signupSuccess.textContent =
    "Account created successfully. You can login now with your credentials.";
  showToast("Account created successfully", "success");

  // Optional: auto-jump to login
  setTimeout(() => {
    showForm("login-form");
  }, 1200);
});

// ====== FORGOT / RESET PASSWORD ======
forgotForm.addEventListener("submit", (e) => {
  e.preventDefault();
  forgotMsg.textContent = "";
  forgotError.textContent = "";

  const email = document.getElementById("forgot-email").value.trim();
  const newPassword = document.getElementById("forgot-password").value;
  const confirmPassword = document.getElementById("forgot-confirm").value;

  if (!isValidEmail(email)) {
    forgotError.textContent = "Enter a valid registered email address.";
    showToast("Invalid email format", "error");
    return;
  }

  // Reload users from storage
  users = loadUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    forgotError.textContent = "No user found with this email.";
    showToast("User not found", "error");
    return;
  }

  if (!isStrongPassword(newPassword)) {
    forgotError.textContent =
      "Weak password. Use 8+ chars, 1 uppercase & 1 number.";
    showToast("Password is too weak", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    forgotError.textContent = "Passwords do not match.";
    showToast("Passwords do not match", "error");
    return;
  }

  // Update password + save
  user.password = newPassword;
  saveUsers();

  forgotMsg.textContent = "Password updated successfully. You can login now.";
  showToast("Password updated successfully", "success");

  setTimeout(() => {
    showForm("login-form");
  }, 1200);
});

// ====== LOGOUT ======
logoutBtn.addEventListener("click", () => {
  welcomeScreen.classList.add("hidden");
  authCard.classList.remove("hidden");
  showForm("login-form");

  loginForm.reset();
  signupForm.reset();
  forgotForm.reset();

  loginError.textContent = "";
  signupError.textContent = "";
  signupSuccess.textContent = "";
  forgotMsg.textContent = "";
  forgotError.textContent = "";

  showToast("You have been logged out.", "info");
});
