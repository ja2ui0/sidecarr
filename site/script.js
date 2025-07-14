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

  const top = document.createElement('div');
  top.id = 'sidebar-top';

  const middle = document.createElement('div');
  middle.id = 'sidebar-middle';

  const bottom = document.createElement('div');
  bottom.id = 'sidebar-bottom';

  // Home link
  if (defaultPage) {
    const homeName = config.home?.name || 'Home';
    const homeIcon = config.home?.icon || 'home.png';

    const homeLink = createSidebarLink(homeIcon, homeName, () => load(defaultPage, true));
    top.appendChild(homeLink);
  }

  // Breakout link
  const breakoutName = config.breakout?.name || 'Breakout';
  const breakoutIcon = config.breakout?.icon || 'breakout.png';
  const breakoutLink = createSidebarLink(breakoutIcon, breakoutName, breakoutCurrent);
  top.appendChild(breakoutLink);

  // Reload link
  const reloadName = config.reload?.name || "Reload Frame";
  const reloadIcon = config.reload?.icon || "reload.png";
  const reloadLink = createSidebarLink(reloadIcon, reloadName, reloadCurrent);
  top.appendChild(reloadLink);

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
      const link = createSidebarLink(item.icon, item.name, () => load(item.url, true));
      linksContainer.appendChild(link);
    }

    groupDiv.appendChild(linksContainer);
    middle.appendChild(groupDiv);
  }

  // Settings button
  const settingsIcon = config.settings?.icon || 'settings.png';
  const settingsLabel = config.settings?.name || 'Settings';
  const settingsUrl = config.settings?.url || 'about:blank'; // replace as needed
  const settingsLink = createSidebarLink(settingsIcon, settingsLabel, () => load(settingsUrl, true));
  bottom.appendChild(settingsLink);

  // Build full sidebar
  sidebar.appendChild(top);
  sidebar.appendChild(middle);
  sidebar.appendChild(bottom);
}

function createSidebarLink(iconPath, labelText, onClick) {
  const link = document.createElement('div');
  link.className = 'link';
  link.onclick = onClick;

  const icon = document.createElement('img');
  icon.className = 'link-icon';
  icon.src = `/config/icons/${iconPath}`;
  icon.alt = labelText;

  const label = document.createElement('span');
  label.className = 'link-label';
  label.textContent = labelText;

  link.appendChild(icon);
  link.appendChild(label);
  return link;
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

