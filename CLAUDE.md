# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension (Manifest V3) that forces all link clicks to open in new tabs. Users can configure exclusions for specific domains, HTML tags, CSS classes, and element attributes.

## Architecture

**Core Components:**

- **background.js** - Service worker that initializes default exclusion settings in chrome.storage.sync on extension load
- **content.js** - Content script injected on all pages; intercepts left-click mousedown events on links and opens them in new tabs (unless excluded)
- **popup.js / popup.html** - Extension popup UI for configuring exclusion rules; saves settings to chrome.storage.sync on change

**Data Flow:**
1. Background script sets defaults (if not already set) in chrome.storage.sync
2. Content script loads exclusion rules from storage and listens for changes
3. On mousedown, content script checks if clicked element (or up to 2 parent levels) matches any exclusion rule
4. If no exclusion matches and element has an href, prevents default and opens link in new tab

**Exclusion Types (comma-separated except domains):**
- Tags: HTML tag names to exclude (e.g., "img")
- Classes: CSS classes or IDs to exclude (partial match)
- Domains: Domains where extension is disabled (newline-separated)
- Attributes: Data attributes to exclude elements that have them

## Development

No build system - load the unpacked extension directly in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
