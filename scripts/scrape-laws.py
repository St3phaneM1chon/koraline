#!/usr/bin/env python3
"""
Scraper de lois — LegisQuebec + CanLII
Scrape les textes complets des lois d'assurance au Canada.
Rate-limited 2s entre requetes.

Usage: python3 scripts/scrape-laws.py [--limit N]
"""

import sys
import os
import json
import time
import re

sys.path.insert(0, '/Volumes/AI_Project/AttitudesVIP-iOS/Scripts')

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    os.system(f"{sys.executable} -m pip install --break-system-packages requests beautifulsoup4 2>/dev/null")
    import requests
    from bs4 import BeautifulSoup

OUTPUT_DIR = '/Volumes/AI_Project/peptide-plus/AUDIT_CYCLES/lois_scrapes'
RATE_LIMIT = 2.0

# URLs of laws to scrape
LAWS = [
    # QUEBEC - LegisQuebec
    {'id': 'ldpsf', 'name': 'LDPSF — Loi sur la distribution de produits et services financiers',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/D-9.2', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'code-civil-assurances', 'name': 'Code civil du Quebec — Livre 5 Titre 3 Des assurances',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/CCQ-1991', 'province': 'QC', 'type': 'legisquebec',
     'note': 'Extraire art. 2389-2628'},
    {'id': 'loi-assureurs-qc', 'name': 'Loi sur les assureurs',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/A-32.1', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'cdcsf', 'name': 'Code de deontologie de la CSF',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/rc/D-9.2,%20r.%207.1', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'loi-amf', 'name': "Loi sur l'Autorite des marches financiers",
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/A-33.2', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'loi-assurance-auto-qc', 'name': "Loi sur l'assurance automobile",
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/A-25', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'latmp', 'name': 'Loi sur les accidents du travail et les maladies professionnelles',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/A-3.001', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'loi-rrq', 'name': 'Loi sur le regime de rentes du Quebec',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/R-9', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'loi-regimes-retraite', 'name': 'Loi sur les regimes complementaires de retraite',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/R-15.1', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'loi-rver', 'name': "Loi sur les regimes volontaires d'epargne-retraite",
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/R-17.0.1', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'loi-protection-consommateur', 'name': 'Loi sur la protection du consommateur',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/P-40.1', 'province': 'QC', 'type': 'legisquebec'},
    {'id': 'loi-25-vie-privee', 'name': 'Loi sur la protection des renseignements personnels (secteur prive)',
     'url': 'https://www.legisquebec.gouv.qc.ca/fr/document/lc/P-39.1', 'province': 'QC', 'type': 'legisquebec'},

    # FEDERAL - CanLII
    {'id': 'lrpcfat', 'name': 'Loi sur le recyclage des produits de la criminalite (LRPCFAT)',
     'url': 'https://www.canlii.org/fr/ca/legis/lois/lc-2000-c-17/derniere/lc-2000-c-17.html', 'province': 'FED', 'type': 'canlii'},
    {'id': 'insurance-companies-act', 'name': 'Insurance Companies Act (federal)',
     'url': 'https://www.canlii.org/en/ca/laws/stat/sc-1991-c-47/latest/sc-1991-c-47.html', 'province': 'FED', 'type': 'canlii'},

    # OTHER PROVINCES - CanLII
    {'id': 'insurance-act-on', 'name': 'Insurance Act Ontario',
     'url': 'https://www.canlii.org/en/on/laws/stat/rso-1990-c-i8/latest/rso-1990-c-i8.html', 'province': 'ON', 'type': 'canlii'},
    {'id': 'insurance-act-ab', 'name': 'Insurance Act Alberta',
     'url': 'https://www.canlii.org/en/ab/laws/stat/rsa-2000-c-i-3/latest/rsa-2000-c-i-3.html', 'province': 'AB', 'type': 'canlii'},
    {'id': 'insurance-act-bc', 'name': 'Financial Institutions Act BC',
     'url': 'https://www.canlii.org/en/bc/laws/stat/rsbc-1996-c-141/latest/rsbc-1996-c-141.html', 'province': 'BC', 'type': 'canlii'},
]


def scrape_legisquebec(url: str) -> str | None:
    """Scrape a LegisQuebec law page — returns cleaned text."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh) AureliaBot/1.0 (educational)',
        'Accept': 'text/html',
        'Accept-Language': 'fr-CA,fr;q=0.9',
    }
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, 'html.parser')

        # LegisQuebec stores law text in specific containers
        content_div = soup.find('div', class_='document-content') or soup.find('div', id='contenu') or soup.find('main')
        if not content_div:
            # Fallback: get all text from body
            content_div = soup.find('body')

        if not content_div:
            return None

        # Remove scripts, styles, nav
        for tag in content_div.find_all(['script', 'style', 'nav', 'footer', 'header']):
            tag.decompose()

        # Extract structured text
        parts = []
        for elem in content_div.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'li', 'td', 'div']):
            text = elem.get_text(strip=True)
            if text and len(text) > 5:
                if elem.name and elem.name.startswith('h'):
                    parts.append(f"\n{'#' * int(elem.name[1])} {text}\n")
                elif elem.name == 'li':
                    parts.append(f"- {text}")
                else:
                    # Avoid duplicates from nested divs
                    if text not in parts[-3:] if parts else True:
                        parts.append(text)

        content = '\n'.join(parts)

        # Remove duplicates from nested elements
        lines = content.split('\n')
        seen = set()
        deduped = []
        for line in lines:
            stripped = line.strip()
            if stripped and stripped not in seen:
                seen.add(stripped)
                deduped.append(line)

        return '\n'.join(deduped)
    except Exception as e:
        print(f"  ERREUR: {e}")
        return None


def scrape_canlii(url: str) -> str | None:
    """Scrape a CanLII law page — returns cleaned text."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh) AureliaBot/1.0 (educational)',
        'Accept': 'text/html',
    }
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, 'html.parser')

        # CanLII law content
        content_div = soup.find('div', class_='document-content') or soup.find('div', id='document') or soup.find('main')
        if not content_div:
            content_div = soup.find('body')
        if not content_div:
            return None

        for tag in content_div.find_all(['script', 'style', 'nav', 'footer']):
            tag.decompose()

        parts = []
        for elem in content_div.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li', 'td']):
            text = elem.get_text(strip=True)
            if text and len(text) > 5:
                if elem.name and elem.name.startswith('h'):
                    parts.append(f"\n{'#' * int(elem.name[1])} {text}\n")
                elif elem.name == 'li':
                    parts.append(f"- {text}")
                else:
                    parts.append(text)

        return '\n'.join(parts)
    except Exception as e:
        print(f"  ERREUR: {e}")
        return None


def main():
    limit = None
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == '--limit' and i < len(sys.argv) - 1:
            limit = int(sys.argv[i + 1])

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    laws_to_scrape = LAWS[:limit] if limit else LAWS
    print(f"=== SCRAPER DE LOIS ===")
    print(f"Total: {len(laws_to_scrape)} lois a scraper")
    print()

    # Import vector store
    try:
        from aurelia_vector_store import AureliaVectorStore
        vs = AureliaVectorStore()
        has_vs = True
    except Exception:
        has_vs = False

    success = 0
    failed = 0
    total_chars = 0

    for i, law in enumerate(laws_to_scrape, 1):
        print(f"[{i}/{len(laws_to_scrape)}] {law['name']}...", end=' ', flush=True)

        if law['type'] == 'legisquebec':
            content = scrape_legisquebec(law['url'])
        elif law['type'] == 'canlii':
            content = scrape_canlii(law['url'])
        else:
            content = None

        if content and len(content) > 500:
            # Save to file
            filepath = f"{OUTPUT_DIR}/{law['id']}.md"
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"# {law['name']}\n")
                f.write(f"# Source: {law['url']}\n")
                f.write(f"# Province: {law['province']}\n")
                f.write(f"# Scrape: {time.strftime('%Y-%m-%d')}\n")
                f.write(f"# Taille: {len(content)} caracteres\n\n")
                f.write(content)

            # Index in vector store
            if has_vs:
                summary = f"Loi complete scrapee: {law['name']} ({law['province']}). {len(content)} caracteres. Source: {law['url']}. Contenu: {content[:500]}"
                try:
                    vs.add(summary, doc_id=f"law-{law['id']}")
                except Exception:
                    pass

            total_chars += len(content)
            success += 1
            print(f"OK ({len(content):,} chars)")
        else:
            failed += 1
            size = len(content) if content else 0
            print(f"ECHEC ({size} chars)")

        time.sleep(RATE_LIMIT)

    print(f"\n=== RESULTAT ===")
    print(f"Reussis:         {success}/{len(laws_to_scrape)}")
    print(f"Echecs:          {failed}")
    print(f"Total caracteres: {total_chars:,}")
    print(f"Fichiers dans:   {OUTPUT_DIR}/")


if __name__ == '__main__':
    main()
