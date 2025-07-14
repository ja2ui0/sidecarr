let discardStrategy = "remove";
let discardTimeout = 300; // seconds
let breakoutTarget = "tab"; // or "window"
let iframeMap = {};
let discardTimers = {};
let currentUrl = '';
let historyStack = [];

async function loadConfig() {
  const res = await fetch('/config/config.yaml');
  const text = await res.text();
  const parsed = jsyaml.load(text);

  discardStrategy = parsed.discard_strategy || "remove";
  discardTimeout = parsed.discard_timeout || 300;
  breakoutTarget = parsed.breakout?.target || "tab";

  buildSidebar(parsed, parsed.home?.url || '');

  if (parsed.home?.url) {
    load(parsed.home.url, true);
  }

  window.onpopstate = function (event) {
    if (event.state && event.state.url) {
      load(event.state.url, false);
    }
  };
}

function buildSidebar(config, defaultPage) {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  // Home link
  if (defaultPage) {
    const homeName = config.home?.name || 'Home';
    const homeIcon = config.home?.icon || 'home.png';

    const homeLink = document.createElement('div');
    homeLink.className = 'link';
    homeLink.onclick = () => load(defaultPage, true);

    const icon = document.createElement('img');
    icon.className = 'link-icon';
    icon.src = `/config/icons/${homeIcon}`;
    icon.alt = 'Home';

    const label = document.createElement('span');
    label.className = 'link-label';
    label.textContent = homeName;

    homeLink.appendChild(icon);
    homeLink.appendChild(label);
    sidebar.appendChild(homeLink);
  }

  // Breakout link
  const breakoutName = config.breakout?.name || 'Breakout';
  const breakoutIcon = config.breakout?.icon || 'breakout.png';

  const breakoutLink = document.createElement('div');
  breakoutLink.className = 'link';
  breakoutLink.onclick = () => breakoutCurrent();

  const breakoutImg = document.createElement('img');
  breakoutImg.className = 'link-icon';
  breakoutImg.src = `/config/icons/${breakoutIcon}`;
  breakoutImg.alt = 'Breakout';

  const breakoutLabel = document.createElement('span');
  breakoutLabel.className = 'link-label';
  breakoutLabel.textContent = breakoutName;

  breakoutLink.appendChild(breakoutImg);
  breakoutLink.appendChild(breakoutLabel);
  sidebar.appendChild(breakoutLink);

  // Reload link
  const reloadName = config.reload?.name || "Reload Frame";
  const reloadIcon = config.reload?.icon || "reload.png";

  const reloadLink = document.createElement('div');
  reloadLink.className = 'link';
  reloadLink.onclick = () => reloadCurrent();

  const reloadImg = document.createElement('img');
  reloadImg.className = 'link-icon';
  reloadImg.src = `/config/icons/${reloadIcon}`;
  reloadImg.alt = 'Reload';

  const reloadLabel = document.createElement('span');
  reloadLabel.className = 'link-label';
  reloadLabel.textContent = reloadName;

  reloadLink.appendChild(reloadImg);
  reloadLink.appendChild(reloadLabel);
  sidebar.appendChild(reloadLink);

  // Groups
  const groups = config.groups || [];
  for (const group of groups) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';

    const groupTitle = document.createElement('div');
    groupTitle.className = 'group-title';
    groupTitle.onclick = () => toggleGroup(groupTitle);

    const groupIcon = document.createElement('img');
    groupIcon.className = 'group-icon';
    groupIcon.src = `/config/icons/${group.icon}`;
    groupIcon.alt = `${group.group}`;

    const groupLabel = document.createElement('span');
    groupLabel.className = 'group-label';
    groupLabel.textContent = `${group.group} ▾`;

    groupTitle.appendChild(groupIcon);
    groupTitle.appendChild(groupLabel);
    groupDiv.appendChild(groupTitle);

    const linksContainer = document.createElement('div');
    linksContainer.className = 'links';

    for (const item of group.items) {
      const link = document.createElement('div');
      link.className = 'link';
      link.onclick = () => load(item.url, true);

      const icon = document.createElement('img');
      icon.className = 'link-icon';
      icon.src = `/config/icons/${item.icon}`;
      icon.alt = item.name;

      const label = document.createElement('span');
      label.className = 'link-label';
      label.textContent = item.name;

      link.appendChild(icon);
      link.appendChild(label);
      linksContainer.appendChild(link);
    }

    groupDiv.appendChild(linksContainer);
    sidebar.appendChild(groupDiv);
  }
}

function load(url, pushToHistory = true) {
  const container = document.getElementById('iframeContainer');

  for (const [key, iframe] of Object.entries(iframeMap)) {
    iframe.style.display = 'none';
  }

  if (discardTimers[url]) {
    clearTimeout(discardTimers[url]);
    delete discardTimers[url];
  }

  if (iframeMap[url]) {
    iframeMap[url].style.display = 'block';
  } else {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.className = 'iframe';
    iframeMap[url] = iframe;
    container.appendChild(iframe);
  }

  if (pushToHistory && url !== currentUrl) {
    history.pushState({ url }, '', '');
  }

  currentUrl = url;

  for (const [key, iframe] of Object.entries(iframeMap)) {
    if (key !== currentUrl && !discardTimers[key]) {
      discardTimers[key] = setTimeout(() => {
        if (discardStrategy === 'blank') {
          iframeMap[key].src = 'about:blank';
        } else if (discardStrategy === 'remove') {
          container.removeChild(iframeMap[key]);
          delete iframeMap[key];
        }
        delete discardTimers[key];
      }, discardTimeout * 1000);
    }
  }
}

function breakoutCurrent() {
  if (!currentUrl) return;
  if (breakoutTarget === 'window') {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  } else {
    window.open(currentUrl, '_blank');
  }
}

function reloadCurrent() {
  if (!currentUrl) return;

  const container = document.getElementById('iframeContainer');

  // Remove the old iframe if it exists
  if (iframeMap[currentUrl]) {
    container.removeChild(iframeMap[currentUrl]);
    delete iframeMap[currentUrl];
  }

  // Re-load the same URL
  load(currentUrl, false);
}

function toggleGroup(header) {
  const group = header.nextElementSibling;
  const label = header.querySelector('.group-label');
  const isHidden = group.style.display === 'none';

  group.style.display = isHidden ? 'flex' : 'none';

  if (label) {
    label.textContent = label.textContent.replace(isHidden ? '▸' : '▾', isHidden ? '▾' : '▸');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadConfig();

  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('collapsed');

  sidebar.addEventListener('mouseenter', () => {
    sidebar.classList.remove('collapsed');
  });

  sidebar.addEventListener('mouseleave', () => {
    sidebar.classList.add('collapsed');
  });
});

