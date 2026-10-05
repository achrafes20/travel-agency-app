function showToast(message, type = "info") {
  let box = document.getElementById("toast");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast";
    box.className = "toast";
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.dataset.type = type;
  box.classList.add("visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => box.classList.remove("visible"), 3200);
}
