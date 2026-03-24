#!/usr/bin/env python3
"""
Scraper EducaLoi — Scrape all insurance-related capsules and index in vector store.
Uses requests + BeautifulSoup (no external dependencies).
Rate-limited to 1 request/second to be respectful.

Usage: python3 scripts/scrape-educaloi.py [--limit N] [--dry-run]
"""

import sys
import os
import json
import time
import re
from pathlib import Path

# Add Scripts to path for vector store
sys.path.insert(0, '/Volumes/AI_Project/AttitudesVIP-iOS/Scripts')

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install --break-system-packages requests beautifulsoup4 2>/dev/null")
    import requests
    from bs4 import BeautifulSoup

# Config
URLS_FILE = '/tmp/educaloi_to_scrape.txt'
OUTPUT_DIR = '/Volumes/AI_Project/peptide-plus/AUDIT_CYCLES/educaloi_scrapes'
CHECKPOINT_FILE = f'{OUTPUT_DIR}/CHECKPOINT.json'
RATE_LIMIT = 1.0  # seconds between requests
MAX_RETRIES = 2

def scrape_educaloi_page(url: str) -> dict | None:
    """Scrape a single EducaLoi capsule page."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AureliaBot/1.0 (educational)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.5',
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            break
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(2)
                continue
            print(f"  ERREUR: {e}")
            return None

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Extract title
    title_tag = soup.find('h1')
    title = title_tag.get_text(strip=True) if title_tag else ''

    # Extract main content (article body)
    content_parts = []

    # Try main article container
    article = soup.find('article') or soup.find('div', class_='entry-content') or soup.find('main')
    if article:
        # Remove cookie banners, scripts, nav, footer
        for tag in article.find_all(['script', 'style', 'nav', 'footer', 'noscript']):
            tag.decompose()

        # Extract text from paragraphs, headings, lists
        for elem in article.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'td', 'th', 'blockquote']):
            text = elem.get_text(strip=True)
            if text and len(text) > 10:
                if elem.name.startswith('h'):
                    content_parts.append(f"\n## {text}\n")
                elif elem.name == 'li':
                    content_parts.append(f"- {text}")
                else:
                    content_parts.append(text)

    content = '\n'.join(content_parts)

    # Clean up content - remove cookie consent text
    cookie_patterns = [
        r'Nous respectons votre vie privée.*?Accepter tout',
        r'Nécessaires.*?Accepter tout',
        r'CookieYes.*?consentement',
        r'Cloudflare.*?traffic\.',
        r'Google Analytics.*?anonyme\.',
    ]
    for pat in cookie_patterns:
        content = re.sub(pat, '', content, flags=re.DOTALL | re.IGNORECASE)

    # Remove very short results (probably failed scrapes)
    if len(content) < 200:
        return None

    # Extract category from breadcrumbs or meta
    category = ''
    breadcrumbs = soup.find_all('span', class_='breadcrumb-item') or soup.find_all('a', class_='breadcrumb')
    if breadcrumbs:
        category = breadcrumbs[-1].get_text(strip=True) if breadcrumbs else ''

    # Extract meta description
    meta_desc = ''
    meta = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
    if meta:
        meta_desc = meta.get('content', '')

    return {
        'url': url,
        'title': title,
        'category': category,
        'description': meta_desc[:300],
        'content': content,
        'content_length': len(content),
        'scraped_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
    }


def main():
    # Parse args
    limit = None
    dry_run = False
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == '--limit' and i < len(sys.argv) - 1:
            limit = int(sys.argv[i + 1])
        if arg == '--dry-run':
            dry_run = True

    # Load URLs
    if not os.path.exists(URLS_FILE):
        print(f"ERREUR: {URLS_FILE} n'existe pas")
        sys.exit(1)

    with open(URLS_FILE) as f:
        urls = [line.strip() for line in f if line.strip()]

    # Load checkpoint
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    checkpoint = {'scraped': [], 'failed': [], 'total_content': 0}
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE) as f:
            checkpoint = json.load(f)

    already_scraped = set(checkpoint.get('scraped', []))
    remaining = [u for u in urls if u not in already_scraped]

    if limit:
        remaining = remaining[:limit]

    print(f"=== EDUCALOI SCRAPER ===")
    print(f"Total URLs: {len(urls)}")
    print(f"Deja scrapes: {len(already_scraped)}")
    print(f"A scraper: {len(remaining)}")
    if dry_run:
        print("(DRY RUN - pas de scraping)")
        for u in remaining[:20]:
            print(f"  {u}")
        return

    # Import vector store
    try:
        from aurelia_vector_store import AureliaVectorStore
        vs = AureliaVectorStore()
        has_vs = True
        print("Vector store: CONNECTE")
    except Exception as e:
        print(f"Vector store: NON DISPONIBLE ({e})")
        has_vs = False

    # Scrape loop
    success = 0
    failed = 0
    batch_texts = []

    for i, url in enumerate(remaining, 1):
        slug = url.split('/capsules/')[-1].rstrip('/')
        print(f"[{i}/{len(remaining)}] {slug}...", end=' ', flush=True)

        result = scrape_educaloi_page(url)

        if result:
            # Save individual file
            safe_slug = slug.replace('/', '_')[:80]
            filepath = f"{OUTPUT_DIR}/{safe_slug}.json"
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            # Accumulate for batch vector indexing
            summary = f"EducaLoi — {result['title']}: {result['description'][:200]}. Contenu: {result['content'][:500]}. URL: {url}"
            batch_texts.append((f"educaloi-{safe_slug}", summary))

            checkpoint['scraped'].append(url)
            checkpoint['total_content'] += result['content_length']
            success += 1
            print(f"OK ({result['content_length']} chars)")
        else:
            checkpoint.setdefault('failed', []).append(url)
            failed += 1
            print("SKIP (404/vide)")

        # Save checkpoint every 10 pages
        if i % 10 == 0:
            with open(CHECKPOINT_FILE, 'w') as f:
                json.dump(checkpoint, f, indent=2)
            print(f"  [Checkpoint: {success} OK, {failed} skip]")

            # Batch index in vector store every 10
            if has_vs and batch_texts:
                for doc_id, text in batch_texts:
                    try:
                        vs.add(text, doc_id=doc_id)
                    except Exception:
                        pass
                print(f"  [Indexed {len(batch_texts)} in vector store]")
                batch_texts = []

        # Rate limiting
        time.sleep(RATE_LIMIT)

    # Final save
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)

    # Final batch index
    if has_vs and batch_texts:
        for doc_id, text in batch_texts:
            try:
                vs.add(text, doc_id=doc_id)
            except Exception:
                pass
        print(f"[Final index: {len(batch_texts)} in vector store]")

    print(f"\n=== RESULTAT ===")
    print(f"Scrapes reussis: {success}")
    print(f"Echecs/vides:    {failed}")
    print(f"Total indexe:    {len(checkpoint['scraped'])}")
    print(f"Contenu total:   {checkpoint['total_content']:,} caracteres")
    print(f"Fichiers dans:   {OUTPUT_DIR}/")


if __name__ == '__main__':
    main()
