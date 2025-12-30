const apiBase = "/api";

const announcementForm = document.getElementById("announcement-form");
const announcementInput = document.getElementById("announcement-text");
const announcementList = document.getElementById("announcement-list");

const choreForm = document.getElementById("chore-form");
const choreTitleInput = document.getElementById("chore-title");
const choreAssigneeInput = document.getElementById("chore-assignee");
const choreList = document.getElementById("chore-list");

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
}

function renderAnnouncements(items) {
  announcementList.innerHTML = "";
  if (!items.length) {
    announcementList.innerHTML = "<li class=\"empty\">No announcements yet.</li>";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-item";

    const text = document.createElement("span");
    text.textContent = item.text;

    const time = document.createElement("time");
    time.textContent = new Date(item.createdAt).toLocaleString();
    time.dateTime = item.createdAt;
    time.className = "meta";

    li.append(text, time);
    announcementList.appendChild(li);
  });
}

function renderChores(items) {
  choreList.innerHTML = "";
  if (!items.length) {
    choreList.innerHTML = "<li class=\"empty\">No chores yet.</li>";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = item.isDone ? "list-item done" : "list-item";

    const content = document.createElement("div");
    content.className = "chore-content";

    const title = document.createElement("span");
    title.textContent = item.title;

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `Assigned to ${item.assignee}`;

    content.append(title, meta);

    const button = document.createElement("button");
    button.textContent = item.isDone ? "Completed" : "Mark Complete";
    button.disabled = item.isDone;
    button.addEventListener("click", () => markChoreComplete(item.id));

    li.append(content, button);
    choreList.appendChild(li);
  });
}

async function loadAnnouncements() {
  const data = await fetchJson(`${apiBase}/announcements`);
  renderAnnouncements(data);
}

async function loadChores() {
  const data = await fetchJson(`${apiBase}/chores`);
  renderChores(data);
}

announcementForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = announcementInput.value.trim();
  if (!text) return;

  await fetchJson(`${apiBase}/announcements`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

  announcementInput.value = "";
  await loadAnnouncements();
});

choreForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = choreTitleInput.value.trim();
  const assignee = choreAssigneeInput.value.trim();
  if (!title || !assignee) return;

  await fetchJson(`${apiBase}/chores`, {
    method: "POST",
    body: JSON.stringify({ title, assignee }),
  });

  choreTitleInput.value = "";
  choreAssigneeInput.value = "";
  await loadChores();
});

async function markChoreComplete(id) {
  await fetchJson(`${apiBase}/chores/${id}/complete`, {
    method: "POST",
  });
  await loadChores();
}

Promise.all([loadAnnouncements(), loadChores()]).catch((error) => {
  console.error(error);
  announcementList.innerHTML = "<li class=\"empty error\">Unable to load announcements.</li>";
  choreList.innerHTML = "<li class=\"empty error\">Unable to load chores.</li>";
});
