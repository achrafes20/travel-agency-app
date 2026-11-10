/**
 * Écran unique de connexion / inscription. Après authentification, redirige vers l'espace du rôle.
 */
(() => {
  const $ = (selector) => document.querySelector(selector);
  const loginForm = $("#login-form");
  const registerForm = $("#register-form");
  const notice = $("#notice");
  const passwordRules=AccountUI.strength($("#register-password"),()=>$("#register-email").value);
  $("#register-password").closest("label").after(passwordRules);
  $("#register-email").addEventListener("input",()=>$("#register-password").dispatchEvent(new Event("input")));
  const forgot=document.createElement("a");forgot.href="mot-de-passe-oublie.html";forgot.textContent="Mot de passe oublié ?";forgot.className="account-link";loginForm.querySelector(".login-options").append(forgot);

  const showNotice = (message, kind = "error") => {
    notice.textContent = message;
    notice.className = `notice ${kind === "info" ? "info" : ""}`;
  };
  const hideNotice = () => notice.classList.add("hidden");

  const selectTab = (mode) => {
    const isLogin = mode === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    $("#tab-login").classList.toggle("active", isLogin);
    $("#tab-register").classList.toggle("active", !isLogin);
    $("#tab-login").setAttribute("aria-selected", String(isLogin));
    $("#tab-register").setAttribute("aria-selected", String(!isLogin));
    hideNotice();
  };

  // Page à retrouver après connexion (ex. l'offre qu'un invité voulait réserver).
  // Seul un nom de page du dossier frontend est accepté, jamais une URL externe.
  const redirectParam = new URLSearchParams(window.location.search).get("redirect");
  const redirectTarget = redirectParam && /^[\w-]+\.html(\?[^#\s]*)?$/.test(redirectParam) ? redirectParam : null;

  const submit = async (form, action) => {
    const button = form.querySelector("button[type=submit]");
    hideNotice();
    button.disabled = true;
    try {
      const user = await action();
      window.location.replace(redirectTarget && user.role === "CLIENT" ? redirectTarget : Auth.homeUrl(user.role));
    } catch (err) {
      showNotice(err.message === "Failed to fetch" ? "Serveur injoignable. Vérifiez que le backend est démarré." : err.message);
      button.disabled = false;
    }
  };

  $("#tab-login").addEventListener("click", () => selectTab("login"));
  $("#tab-register").addEventListener("click", () => selectTab("register"));

  document.querySelectorAll(".toggle-password").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = $("#login-email").value.trim();
    const password = $("#login-password").value;
    if (!email || !password) {
      showNotice("Saisissez votre email et votre mot de passe.");
      return;
    }
    submit(loginForm, () => Auth.login(email, password, $("#login-remember").checked));
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const fullName = $("#register-name").value.trim();
    const email = $("#register-email").value.trim();
    const password = $("#register-password").value;
    if (!fullName || !email || AccountUI.rules(password,email).some(v=>!v[0])) {
      showNotice("Renseignez votre nom, votre e-mail et respectez toutes les règles du mot de passe.");
      return;
    }
    submit(registerForm, () => Auth.register(fullName, email, password));
  });

  const reason = new URLSearchParams(window.location.search).get("reason");
  if (reason === "role") {
    showNotice("Ce compte n'a pas accès à cet espace. Connectez-vous avec un autre compte.", "info");
  } else if(reason==="expired") {
    showNotice("Votre session a expiré ou a été révoquée. Connectez-vous à nouveau.","info");
  } else if (redirectTarget && !Auth.isLoggedIn()) {
    showNotice("Connectez-vous ou créez un compte pour réserver cette offre.", "info");
  } else if (Auth.isLoggedIn()) {
    // déjà connecté : on renvoie directement vers son espace
    window.location.replace(Auth.homeUrl(Auth.getUser().role));
  }

  lucide.createIcons();
})();
