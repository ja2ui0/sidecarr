let discardStrategy = "remove";
let discardTimeout = 300;
let breakoutTarget = "tab";
let iframeMap = {};
let discardTimers = {};
let currentUrl = '';
let historyStack = [];

function applyTheme(pref) {
  const html = document.documentElement;
  if (pref === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (pref === 'light') {
    html.setAttribute('data-theme', 'light');
  } else {
    html.removeAttribute('data-theme'); // system
  }
}

async function loadConfig() {
  const res = await fetch('/config/config.yaml');
  const text = await res.text();
  const parsed = jsyaml.load(text);

  discardStrategy = parsed.discard_strategy || "remove";
  discardTimeout = parsed.discard_timeout || 300;
  breakoutTarget = parsed.breakout?.target || "tab";

  const userPref = localStorage.getItem('themePreference') || 'system';
  applyTheme(userPref);

  buildSidebar(parsed, parsed.home?.url || '');
  if (parsed.home?.url) load(parsed.home.url, true);

  window.onpopstate = function (event) {
    if (event.state?.url) load(event.state.url, false);
  };
}

function buildSidebar(config, defaultPage) {
  const sidebarTop = document.getElementById('sidebar-top-buttons');
  const sidebarMiddle = document.getElementById('sidebar-middle');
  const sidebarBottom = document.getElementById('sidebar-bottom-buttons');

  sidebarTop.innerHTML = '';
  sidebarMiddle.innerHTML = '';
  sidebarBottom.innerHTML = '';

  // Top: Home, Breakout, Reload
  const topLinks = [
    {
      name: config.home?.name || 'Home',
      icon: config.home?.icon || 'home.png',
      handler: () => load(config.home?.url || '', true)
    },
    {
      name: config.breakout?.name || 'Breakout',
      icon: config.breakout?.icon || 'breakout.png',
      handler: breakoutCurrent
    },
    {
      name: config.reload?.name || 'Reload',
      icon: config.reload?.icon || 'reload.png',
      handler: reloadCurrent
    }
  ];

  for (const item of topLinks) {
    const link = document.createElement('div');
    link.className = 'link';
    link.onclick = item.handler;

    const icon = document.createElement('img');
    icon.className = 'link-icon';
    icon.src = `/config/icons/${item.icon}`;
    icon.alt = item.name;

    const label = document.createElement('span');
    label.className = 'link-label';
    label.textContent = item.name;

    link.appendChild(icon);
    link.appendChild(label);
    sidebarTop.appendChild(link);
  }

  // Middle: groups + items
  for (const group of config.groups || []) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';

    const groupTitle = document.createElement('div');
    groupTitle.className = 'group-title';
    groupTitle.onclick = () => toggleGroup(groupTitle);

    const groupIcon = document.createElement('img');
    groupIcon.className = 'group-icon';
    groupIcon.src = `/config/icons/${group.icon}`;
    groupIcon.alt = group.group;

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
    sidebarMiddle.appendChild(groupDiv);
  }

  // Bottom: Settings
  const settingsLink = document.createElement('div');
  settingsLink.className = 'link';
  settingsLink.onclick = () => load('settings.html', true);

  const settingsIcon = document.createElement('img');
  settingsIcon.className = 'link-icon';
  settingsIcon.src = '/config/icons/settings.png';
  settingsIcon.alt = 'Settings';

  const settingsLabel = document.createElement('span');
  settingsLabel.className = 'link-label';
  settingsLabel.textContent = 'Settings';

  settingsLink.appendChild(settingsIcon);
  settingsLink.appendChild(settingsLabel);
  sidebarBottom.appendChild(settingsLink);
}

function load(url, pushToHistory = true) {
  const container = document.getElementById('iframeContainer');
  for (const [key, iframe] of Object.entries(iframeMap)) iframe.style.display = 'none';

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

  if (pushToHistory && url !== currentUrl) history.pushState({ url }, '', '');
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
  window.open(currentUrl, '_blank', breakoutTarget === 'window' ? 'noopener,noreferrer' : '');
}

function reloadCurrent() {
  if (!currentUrl) return;
  const container = document.getElementById('iframeContainer');
  if (iframeMap[currentUrl]) {
    container.removeChild(iframeMap[currentUrl]);
    delete iframeMap[currentUrl];
  }
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

window.addEventListener('message', (event) => {
  if (event.data?.type === 'set-theme') {
    applyTheme(event.data.value);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadConfig();

  const sidebar = document.getElementById('sidebar');
  sidebar.classList.add('collapsed');
  sidebar.addEventListener('mouseenter', () => sidebar.classList.remove('collapsed'));
  sidebar.addEventListener('mouseleave', () => sidebar.classList.add('collapsed'));
});

