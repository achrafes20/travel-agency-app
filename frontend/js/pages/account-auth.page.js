/* Le jeton est conservé seulement en mémoire et retiré immédiatement de l'URL. */
(async()=>{
 const root=document.getElementById("account-auth-root"),mode=document.body.dataset.accountPage;
 const url=new URL(location.href);let token=url.searchParams.get("token")||"";url.searchParams.delete("token");history.replaceState({},"",url.pathname+(url.searchParams.size?"?"+url.searchParams:"")+url.hash);
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const message=el("p");message.className="account-message";message.setAttribute("role","status");
 const notify=(text,error=false)=>{message.textContent=text;message.className="account-message "+(error?"error":"success");};
 const title=el("h1",mode==="forgot"?"Mot de passe oublié":mode==="reset"?"Choisissez un nouveau mot de passe":"Vérifiez votre adresse e-mail");
 const card=el("section");card.className="account-card";card.append(title,message);root.append(card);
 const back=el("a","Retour à la connexion");back.href="connexion.html";card.append(back);
 if(mode==="verify"){
  if(!token){notify("Ce lien ne contient pas de jeton. Demandez un nouvel e-mail de vérification.",true);return;}
  notify("Vérification en cours…");try{const response=await Auth.verifyEmail(token);token="";notify(response.message);if(Auth.isLoggedIn())await Auth.me();}catch(e){notify(e.message,true);}return;
 }
 if(mode==="reset"&&!token){notify("Ce lien est incomplet. Demandez un nouveau lien de réinitialisation.",true);const a=el("a","Demander un nouveau lien");a.href="mot-de-passe-oublie.html";card.append(a);return;}
 const form=el("form"),submit=el("button",mode==="forgot"?"Recevoir le lien":"Réinitialiser le mot de passe");submit.type="submit";submit.className="account-button";
 function field(label,name,type){const wrap=el("label");wrap.className="account-field";const input=el("input");input.name=name;input.type=type;input.required=true;input.autocomplete=type==="password"?"new-password":"email";wrap.append(el("span",label),input);form.append(wrap);return input;}
 let email,next,confirm;
 if(mode==="forgot")email=field("Votre adresse e-mail","email","email");else{
  next=field("Nouveau mot de passe","newPassword","password");form.append(AccountUI.strength(next,""));confirm=field("Confirmer le mot de passe","confirmNewPassword","password");
  const toggle=el("button","Afficher / masquer les mots de passe");toggle.type="button";toggle.className="up-action";toggle.onclick=()=>{next.type=confirm.type=next.type==="password"?"text":"password";};form.append(toggle);
 }
 form.append(submit);card.insertBefore(form,back);form.onsubmit=async event=>{
  event.preventDefault();submit.disabled=true;message.textContent="";
  try{let response;if(mode==="forgot")response=await Auth.forgotPassword(email.value.trim());else{if(next.value!==confirm.value)throw new Error("Les mots de passe ne correspondent pas.");if(AccountUI.rules(next.value,"").some(v=>!v[0]))throw new Error("Respectez toutes les règles du mot de passe.");response=await Auth.resetPassword({token,newPassword:next.value,confirmNewPassword:confirm.value});token="";form.remove();}
   notify(response.message);
  }catch(e){notify(e.message,true);}finally{submit.disabled=false;}
 };
})();
