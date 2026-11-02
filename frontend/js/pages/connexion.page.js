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
  const forgot=document.createElement("a");forgot.href="mot-de-passe-oublie.html";forgot.textContent="Mot de passe oublié ?";forgot.className="account-link";loginForm.append(forgot);

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

  const submit = async (form, action) => {
    const button = form.querySelector("button[type=submit]");
    hideNotice();
    button.disabled = true;
    try {
      const user = await action();
      window.location.replace(Auth.homeUrl(user.role));
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
    const consent = $("#register-consent") ? $("#register-consent").checked : true;
    if (!consent) {
      showNotice("Vous devez accepter les conditions d'utilisation et la politique de confidentialité.");
      return;
    }
    submit(registerForm, () => Auth.register(fullName, email, password, consent));
  });

  const reason = new URLSearchParams(window.location.search).get("reason");
  if (reason === "role") {
    showNotice("Ce compte n'a pas accès à cet espace. Connectez-vous avec un autre compte.", "info");
  } else if(reason==="expired") {
    showNotice("Votre session a expiré ou a été révoquée. Connectez-vous à nouveau.","info");
  } else if (Auth.isLoggedIn()) {
    // déjà connecté : on renvoie directement vers son espace
    window.location.replace(Auth.homeUrl(Auth.getUser().role));
  }

  lucide.createIcons();
})();
