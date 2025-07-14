# ![Sidecarr logo](/site/favicon.png "Sidecarr logo") Sidecarr

A lightweight sidebar for self-hosted tools. Nothing more, nothing less.

## What It Does

**Sidecarr** is a minimal, containerized launcher that gives you a collapsible sidebar for quick access to your self-hosted services via iframes. You define the layout in a simple `config.yaml`, drop in your own icons, and go. It does exactly one thing: give you fast access to everything you already run - no bloat, no nonsense.

You can reload frames, pop them out into new tabs or windows, and keep unused ones from hogging memory with optional discard behavior.

## Why I Wrote It

I really like [Organizr](https://github.com/causefx/Organizr). It's a great app. But after running it for a while, I realized I was only using one feature - the side pane to load services in iframes. I wasn't using widgets or integrations, just the ability to switch between persistent views of my tools... without opening a dozen tabs.

At the same time, I preferred the widget ecosystem of standalone dashboard apps and wanted a clean way to use them alongside a simple menu for switching between tools.

Rather than keep running a full-featured app for just one use case, I started from scratch and built Sidecarr - something that does exactly what I need and nothing more. It's small, fast, transparent, and fits perfectly into Docker-based homelab setups.

You can even set [Homarr](https://github.com/ajnart/homarr), [Dashy](https://github.com/lissy93/dashy), or whatever dashboard you like as your homepage inside Sidecarr. That way, you get best-in-class widgets and integrations - while still embedding full admin UIs like Portainer, Grafana, or Vaultwarden without needing to launch them in new tabs (unless you want to).

I plan to keep Sidecarr updated, but feature bloat is off the table. It's meant to stay light and nimble. If the homelab world finds a new favorite dashboard, just plug it in as your home view and keep on trucking. If the "last commit" looks old, that's probably a good thing. I use this daily to manage my setup - if something breaks, I'll fix it. If a new feature makes sense, I might add it. But the goal is for Sidecarr to stay useful, stable, and out of your way.

...and no, there's probably never going to be an uptime indicator. Nearly every dashboard already does that better.

## Key Features

- Collapsible sidebar with icon-only mode
- Fully configurable via `config.yaml`
- Lightweight (vanilla HTML/CSS/JS + nginx)
- Optional iframe discard strategy (remove or blank unused tabs)
- "Breakout" button to open current iframe in a new tab or window
- "Reload frame" button to refresh just the active view
- Custom icons per app - just drop them into `config/icons/`
- Ships as a single container with config persistence

## TODO
- publish images on Docker Hub
- light / dark / use system theme
- user customizeable expanded panel width (to accommodate long labels)
- config and add images via web
- anchor panel as expanded (and re-fit content)
- implement env vars for some config options

## Quick Start
There are a million ways to run software. If you're checking out Sidecarr, you probably already know most of them. I’m opinionated about using docker compose, and especially [Portainer](https://github.com/portainer/portainer), for managing my homelab. Most of the community seems to agree, so that’s what this Quick Start is based on:

### Clone and Build
```bash
git clone https://github.com/ja2ui0/sidecarr
cd sidecarr
docker build -t sidecarr .
```

### Example `compose.yaml`
```
services:
  sidecarr:
    image: sidecarr
    container_name: sidecarr
    ports:
      - "8086:80"
    volumes:
      - config:/config
    restart: unless-stopped

volumes:
  config:
```

You can also use a bind mount if you prefer. If you don’t mount anything at all, Sidecarr will start in demo mode. It’ll show a default page with instructions and a sample sidebar (with non-functional links) so you can see how it works right out of the gate.

Check out the sample `config.yaml` in this repo to start building your own setup.

### Run it
`docker compose up -d`

## Why Some Apps Don’t Load in Sidecarr
Sidecarr is built around iframes. That works great for most self-hosted tools, but not every app plays nice.

Some services show a blank screen, fail silently, or refuse to load. That’s not a bug in Sidecarr, it’s by design.

### Why It Happens
Modern browsers respect security headers like:

`X-Frame-Options: DENY or SAMEORIGIN`

`Content-Security-Policy: frame-ancestors 'none'` (or similar)

These are there for good reason: they help prevent clickjacking and malicious embedding. But they also mean your browser will refuse to show that app inside Sidecarr, no matter how good your config is.

### What You Can Do
**Use a proxy** like NGINX Proxy Manager or Traefik to rewrite or strip the offending headers. Most apps only need a small tweak. **This is The Way**.

**Set your Home page to a dashboard** like Homarr or Dashy. Most dashboards support widgets or external links, so you can launch iframe-hostile apps in new tabs when needed.

**Expect quirks.** Vaultwarden, Grafana, Overseerr, etc. usually work out of the box. Monolithic apps like Nextcloud, or vendor appliances like Synology, might need extra steps (Synology, for example, has an iframe option in its own UI). Remotely hosted applications pose their own interesting challenges!

### App-Specific Fixes
We’re collecting working configs and known gotchas in the repo. Until that's live, open an issue and help others avoid the same problem.

If it works in Organizr, odds are it’ll work in Sidecarr. Many existing iframe fixes apply 1:1. If you find a good one, open a PR or issue and we’ll include it.

\* Synology, in fact, has a setting in its own software to allow iframe embedding.

## License
Sidecarr is licensed under the GNU General Public License v3.0 (GPLv3). That means you're free to use, share, and modify it - just keep it open and share alike.

One or more components (such as JavaScript libraries) are subject to other open-source licenses. You can find those details in the third_party/ directory of this repository.

