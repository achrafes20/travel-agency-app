/* Téléversement réel : aucun nom de fichier d'origine n'est transmis comme URL. */
const Uploader=(()=>{
 const create=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const action=(label,handler)=>{const b=create("button","up-action",label);b.type="button";b.onclick=handler;return b;};
 const safeUrl=value=>{try{const u=new URL(value,location.href);return ["http:","https:"].includes(u.protocol)||/^data:image\/(png|jpeg|webp);base64,/i.test(value)?value:"";}catch{return "";}};
 function createUploader({container,purpose,max=5,initial=[],onChange=()=>{}}){
  let entries=[],destroyed=false,dragged=null;let maxBytes=5*1024*1024,maxPixels=20000000;
  const root=create("section","up-root"),drop=create("div","up-drop"),input=create("input"),browse=action("Parcourir les images",()=>input.click()),message=create("p","up-message"),list=create("ol","up-list");
  input.type="file";input.accept="image/jpeg,image/png,image/webp";input.multiple=max>1;input.hidden=true;input.setAttribute("aria-label","Choisir les images");
  drop.append(create("strong","","Glissez vos images ici"),create("p","","JPEG, PNG ou WebP · 5 Mo maximum · au moins 200 × 200 pixels"),browse,input);
  message.setAttribute("role","status");list.setAttribute("aria-label","Images et ordre d’affichage");root.append(drop,message,list);container.replaceChildren(root);
  const busy=()=>entries.some(e=>["checking","uploading"].includes(e.state));
  function notify(){if(destroyed)return;onChange(entries.filter(e=>e.state==="ready").map(e=>e.url),{busy:busy(),pending:entries.filter(e=>e.state!=="ready").length});}
  function release(e){if(e.preview){URL.revokeObjectURL(e.preview);e.preview=null;}}
  function move(index,delta){const target=index+delta;if(target<0||target>=entries.length)return;const item=entries.splice(index,1)[0];entries.splice(target,0,item);render();notify();}
  async function remove(e){e.state="removed";e.xhr?.abort();entries=entries.filter(v=>v!==e);release(e);render();notify();if(e.id)try{await api.delete("/api/files/"+encodeURIComponent(e.id));}catch(error){if(error.status!==409)message.textContent=error.message;}}
  function render(){
   if(destroyed)return;list.replaceChildren();browse.disabled=entries.length>=max;
   entries.forEach((e,index)=>{
    const row=create("li","up-item");row.draggable=true;row.dataset.uid=e.uid;
    row.ondragstart=event=>{dragged=e.uid;event.dataTransfer.setData("text/atlas-image",e.uid);};row.ondragover=event=>event.preventDefault();
    row.ondrop=event=>{if(!dragged)return;event.preventDefault();event.stopPropagation();const from=entries.findIndex(v=>v.uid===dragged);if(from<0)return;entries.splice(index,0,entries.splice(from,1)[0]);dragged=null;render();notify();};
    // preview est exclusivement une ObjectURL créée ici ; les URLs distantes restent filtrées.
    const img=create("img","up-image");img.alt="Aperçu de l’image "+(index+1);img.src=e.preview||safeUrl(e.thumbnailUrl||e.url||"");row.append(img);
    const content=create("div","up-info");content.append(create("strong","",index===0?"Image principale":"Image "+(index+1)));
    const status=create("small","",({ready:"Téléversée",checking:"Vérification…",uploading:"Téléversement…",error:"Échec",cancelled:"Annulée"})[e.state]||e.state);content.append(status);
    if(e.state==="uploading"){const progress=create("progress");progress.max=100;progress.value=e.progress||0;progress.setAttribute("aria-label","Progression de l’image "+(index+1));content.append(progress);}
    if(e.error)content.append(create("p","up-error",e.error));const controls=create("div","up-actions");
    const up=action("Monter",()=>move(index,-1)),down=action("Descendre",()=>move(index,1));up.disabled=index===0;down.disabled=index===entries.length-1;up.setAttribute("aria-label","Monter l’image "+(index+1));down.setAttribute("aria-label","Descendre l’image "+(index+1));controls.append(up,down);
    if(["uploading","checking"].includes(e.state))controls.append(action("Annuler",()=>{e.state="cancelled";e.xhr?.abort();render();notify();}));
    if(["error","cancelled"].includes(e.state)&&e.file)controls.append(action("Réessayer",()=>upload(e)));
    controls.append(action("Supprimer",()=>remove(e)));content.append(controls);row.append(content);list.append(row);
   });
  }
  async function upload(e){
   if(destroyed)return;e.error="";e.state="checking";render();notify();
   try{
    const settings=await AccountUI.options();maxBytes=settings.maxImageBytes;maxPixels=settings.maxPixels;
    if(destroyed||e.state!=="checking")return;
    if(!["image/jpeg","image/png","image/webp"].includes(e.file.type))throw new Error("Choisissez une image JPEG, PNG ou WebP.");
    if(e.file.size>maxBytes)throw new Error("L’image dépasse "+Math.round(maxBytes/1024/1024)+" Mo.");
    const dimensions=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve([img.naturalWidth,img.naturalHeight]);img.onerror=()=>reject(new Error("L’image est illisible."));img.src=e.preview;});
    if(e.state!=="checking"||destroyed)return;
    if(dimensions.some(v=>v<200||v>6000)||dimensions[0]*dimensions[1]>maxPixels)throw new Error("Dimensions autorisées : 200 à 6000 pixels, "+maxPixels+" pixels maximum.");
    e.state="uploading";render();notify();
    await new Promise((resolve,reject)=>{
     const xhr=e.xhr=new XMLHttpRequest(),uploadToken=Auth.getToken();xhr.open("POST",api.baseUrl()+"/api/files/images?purpose="+encodeURIComponent(purpose));xhr.setRequestHeader("Authorization","Bearer "+uploadToken);
     xhr.upload.onprogress=event=>{if(event.lengthComputable){e.progress=Math.round(event.loaded/event.total*100);const node=Array.from(list.children).find(n=>n.dataset.uid===e.uid)?.querySelector("progress");if(node)node.value=e.progress;}};
     xhr.timeout=60000;xhr.ontimeout=()=>reject(new Error("Le serveur met trop de temps à répondre. Réessayez."));
     xhr.onload=()=>{let body;try{body=JSON.parse(xhr.responseText)||{message:"Réponse serveur invalide."};}catch{body={message:"Réponse serveur invalide."};}
      if(xhr.status===401&&Auth.getToken()===uploadToken)Auth.logout("expired");if(xhr.status>=200&&xhr.status<300&&body.id&&body.url){e.id=body.id;e.url=body.url;e.thumbnailUrl=body.thumbnailUrl;e.state="ready";release(e);resolve();}
      else reject(new Error(body.message+(Array.isArray(body.details)?" : "+body.details.map(v=>v.message).join("; "):"")));
     };xhr.onerror=()=>reject(new Error("Connexion interrompue. Réessayez."));xhr.onabort=()=>{const error=new Error("Téléversement annulé.");error.name="AbortError";reject(error);};
     const form=new FormData();form.append("file",e.file);xhr.send(form);
    });
   }catch(error){if(e.state!=="removed"&&e.state!=="cancelled"){e.state="error";e.error=error.message;}}
   finally{e.xhr=null;render();notify();}
  }
  async function add(files){message.textContent="";for(const file of files){if(entries.length>=max){message.textContent="Vous pouvez sélectionner au maximum "+max+" image(s).";break;}const e={uid:crypto.randomUUID(),file,preview:URL.createObjectURL(file),state:"checking"};entries.push(e);upload(e);}render();notify();}
  input.onchange=()=>{add(input.files);input.value="";};drop.ondragover=event=>{event.preventDefault();drop.classList.add("up-over");};drop.ondragleave=()=>drop.classList.remove("up-over");drop.ondrop=event=>{event.preventDefault();drop.classList.remove("up-over");add(event.dataTransfer.files);};
  function setValue(values){entries.forEach(e=>{e.xhr?.abort();release(e);});entries=(values||[]).slice(0,max).map(value=>({uid:crypto.randomUUID(),url:typeof value==="string"?value:value.url,thumbnailUrl:typeof value==="string"?value:value.thumbnailUrl,state:"ready"}));render();notify();}
  setValue(initial);
  return{getValue:()=>entries.filter(e=>e.state==="ready").map(e=>e.url),setValue,isBusy:busy,destroy(){destroyed=true;entries.forEach(e=>{e.xhr?.abort();release(e);});root.remove();}};
 }
 return{createUploader};
})();
window.createUploader=Uploader.createUploader;
