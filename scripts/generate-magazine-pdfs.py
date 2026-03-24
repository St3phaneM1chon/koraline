#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Koraline Magazine PDF Generator
================================
Generates professional magazine-style HTML/PDF guides for the entire
Koraline user guide (127 pages across 13 sections).

Visual concept: "Koraline — L'Encyclopedie Digitale"
Style: Magazine tech haut de gamme (Wired / Fast Company)
Palette: Bleu BioCycle (#0066CC) + Navy (#003366) + Blanc + Accents dores (#D4A843)

Usage:
    python3 scripts/generate-magazine-pdfs.py              # HTML only
    python3 scripts/generate-magazine-pdfs.py --pdf         # HTML + PDF via weasyprint
    python3 scripts/generate-magazine-pdfs.py --section 02  # Single section only
"""

import argparse
import base64
import html
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path("/Volumes/AI_Project/peptide-plus")
GUIDE_ROOT = PROJECT_ROOT / "docs" / "user-guide"
IMAGES_DIR = GUIDE_ROOT / "images" / "sections"
OUTPUT_DIR = GUIDE_ROOT / "magazine"
ASSETS_DIR = OUTPUT_DIR / "assets"

SECTION_META = {
    "00-introduction": {"title": "Introduction", "subtitle": "Bienvenue dans l'univers Koraline", "icon": "📖", "color": "#0066CC"},
    "01-dashboard": {"title": "Tableau de bord", "subtitle": "Vue d'ensemble et indicateurs cles", "icon": "📊", "color": "#0066CC"},
    "02-commerce": {"title": "Commerce", "subtitle": "Commandes, clients et operations commerciales", "icon": "🛒", "color": "#1a73e8"},
    "03-catalogue": {"title": "Catalogue", "subtitle": "Produits, categories et bundles", "icon": "📦", "color": "#0d47a1"},
    "04-marketing": {"title": "Marketing", "subtitle": "Promotions, newsletter et campagnes", "icon": "📣", "color": "#e65100"},
    "05-communaute": {"title": "Communaute", "subtitle": "Avis, questions et ambassadeurs", "icon": "👥", "color": "#2e7d32"},
    "06-fidelite": {"title": "Fidelite", "subtitle": "Programme de points et webinaires", "icon": "⭐", "color": "#D4A843"},
    "07-media": {"title": "Media", "subtitle": "Visioconference, reseaux sociaux et contenu", "icon": "🎬", "color": "#6a1b9a"},
    "08-emails": {"title": "Emails", "subtitle": "Boite de reception, campagnes et automatisations", "icon": "📧", "color": "#00838f"},
    "09-telephonie": {"title": "Telephonie", "subtitle": "Appels, IVR, analytics et campagnes", "icon": "📞", "color": "#4527a0"},
    "10-crm": {"title": "CRM", "subtitle": "Pipeline, leads et automatisations", "icon": "🎯", "color": "#c62828"},
    "11-comptabilite": {"title": "Comptabilite", "subtitle": "Plan comptable, factures et rapports financiers", "icon": "📑", "color": "#1b5e20"},
    "12-systeme": {"title": "Systeme", "subtitle": "Utilisateurs, roles, securite et parametres", "icon": "⚙️", "color": "#37474f"},
}

PAGE_TITLES = {
    # 00
    "00-introduction/01-introduction": "Introduction a la Suite Koraline",
    # 01
    "01-dashboard/01-dashboard": "Tableau de bord",
    # 02
    "02-commerce/01-commandes": "Gestion des Commandes",
    "02-commerce/02-clients": "Gestion des Clients",
    "02-commerce/03-distributeurs": "Distributeurs",
    "02-commerce/04-abonnements": "Abonnements",
    "02-commerce/05-inventaire": "Inventaire",
    "02-commerce/06-fournisseurs": "Fournisseurs",
    "02-commerce/07-paiements": "Paiements et Reconciliation",
    # 03
    "03-catalogue/01-produits": "Produits",
    "03-catalogue/02-categories": "Categories",
    "03-catalogue/03-bundles": "Bundles",
    # 04
    "04-marketing/01-promo-codes": "Codes Promo",
    "04-marketing/02-promotions": "Promotions",
    "04-marketing/03-newsletter": "Newsletter",
    "04-marketing/04-bannieres": "Bannieres",
    "04-marketing/05-upsell": "Upsell",
    "04-marketing/06-blog": "Blog",
    "04-marketing/07-blog-analytics": "Blog Analytics",
    "04-marketing/08-rapports": "Rapports Marketing",
    # 05
    "05-communaute/01-avis": "Avis Clients",
    "05-communaute/02-questions": "Questions et Reponses",
    "05-communaute/03-chat": "Chat Support",
    "05-communaute/04-ambassadeurs": "Ambassadeurs",
    # 06
    "06-fidelite/01-fidelite": "Programme de Fidelite",
    "06-fidelite/02-webinaires": "Webinaires",
    # 07
    "07-media/01-dashboard": "Dashboard Media",
    "07-media/02-analytics": "Analytics Media",
    "07-media/03-teams": "Microsoft Teams",
    "07-media/04-zoom": "Zoom",
    "07-media/05-webex": "Webex",
    "07-media/06-google-meet": "Google Meet",
    "07-media/07-whatsapp": "WhatsApp",
    "07-media/08-ads-youtube": "Publicites YouTube",
    "07-media/09-ads-x": "Publicites X",
    "07-media/10-ads-tiktok": "Publicites TikTok",
    "07-media/11-ads-google": "Publicites Google",
    "07-media/12-ads-linkedin": "Publicites LinkedIn",
    "07-media/13-ads-meta": "Publicites Meta",
    "07-media/14-api-zoom": "API Zoom",
    "07-media/15-api-teams": "API Teams",
    "07-media/16-api-whatsapp": "API WhatsApp",
    "07-media/17-api-webex": "API Webex",
    "07-media/18-api-google-meet": "API Google Meet",
    "07-media/19-api-youtube": "API YouTube",
    "07-media/20-api-vimeo": "API Vimeo",
    "07-media/21-api-x": "API X",
    "07-media/22-api-tiktok": "API TikTok",
    "07-media/23-api-google-ads": "API Google Ads",
    "07-media/24-api-linkedin": "API LinkedIn",
    "07-media/25-api-meta": "API Meta",
    "07-media/26-content-hub": "Content Hub",
    "07-media/27-videos": "Videos",
    "07-media/28-video-categories": "Categories Video",
    "07-media/29-connections": "Connexions Plateformes",
    "07-media/30-imports": "Imports",
    "07-media/31-sessions": "Sessions Video",
    "07-media/32-consents": "Consentements",
    "07-media/33-consent-templates": "Templates Consentement",
    "07-media/34-images": "Bibliotheque Images",
    "07-media/35-library": "Bibliotheque Media",
    "07-media/36-brand-kit": "Brand Kit",
    "07-media/37-social-scheduler": "Planificateur Social",
    # 08
    "08-emails/01-inbox": "Boite de Reception",
    "08-emails/02-envois": "Emails Envoyes",
    "08-emails/03-brouillons": "Brouillons",
    "08-emails/04-templates": "Templates Email",
    "08-emails/05-campagnes": "Campagnes Email",
    "08-emails/06-flows": "Flows Automatises",
    "08-emails/07-analytics": "Analytics Email",
    # 09
    "09-telephonie/01-dashboard": "Dashboard VoIP",
    "09-telephonie/02-journal": "Journal d'Appels",
    "09-telephonie/03-enregistrements": "Enregistrements",
    "09-telephonie/04-messagerie": "Messagerie Vocale",
    "09-telephonie/05-wallboard": "Wallboard",
    "09-telephonie/06-conference": "Conference",
    "09-telephonie/07-campagnes": "Campagnes d'Appels",
    "09-telephonie/08-coaching": "Coaching",
    "09-telephonie/09-transferts": "Transferts",
    "09-telephonie/10-groupes": "Groupes de Sonnerie",
    "09-telephonie/11-sondages": "Sondages Post-Appel",
    "09-telephonie/12-ivr-builder": "IVR Builder",
    "09-telephonie/13-webhooks": "Webhooks VoIP",
    "09-telephonie/14-analytics-dashboard": "Analytics Dashboard",
    "09-telephonie/15-analytics-appels": "Analytics Appels",
    "09-telephonie/16-analytics-agents": "Analytics Agents",
    "09-telephonie/17-analytics-queues": "Analytics Queues",
    "09-telephonie/18-analytics-speech": "Analytics Vocal (IA)",
    "09-telephonie/19-connexions": "Connexions VoIP",
    "09-telephonie/20-numeros": "Numeros de Telephone",
    "09-telephonie/21-extensions": "Extensions",
    "09-telephonie/22-parametres": "Parametres VoIP",
    # 10
    "10-crm/01-dashboard": "Dashboard CRM",
    "10-crm/02-contacts": "Contacts",
    "10-crm/03-pipeline": "Pipeline et Deals",
    "10-crm/04-leads": "Leads",
    "10-crm/05-taches": "Taches",
    "10-crm/06-entreprises": "Entreprises",
    "10-crm/07-listes-segments": "Listes et Segments",
    "10-crm/08-automatisations": "Automatisations",
    "10-crm/09-centre-appels": "Centre d'Appels",
    "10-crm/10-scraper": "Scraper",
    "10-crm/11-leaderboard": "Leaderboard",
    "10-crm/12-rapports": "Rapports CRM",
    "10-crm/13-import-export": "Import / Export",
    # 11
    "11-comptabilite/01-plan-comptable": "Plan Comptable",
    "11-comptabilite/02-journal": "Journal General",
    "11-comptabilite/03-ecritures": "Ecritures",
    "11-comptabilite/04-grand-livre": "Grand Livre / Balance",
    "11-comptabilite/05-bilan": "Bilan",
    "11-comptabilite/06-resultats": "Etat des Resultats",
    "11-comptabilite/07-factures": "Factures",
    "11-comptabilite/08-depenses": "Depenses",
    "11-comptabilite/09-taxes": "Taxes TPS/TVQ",
    "11-comptabilite/10-rapprochement": "Rapprochement Bancaire",
    "11-comptabilite/11-budget": "Budget",
    "11-comptabilite/12-rapports": "Rapports Financiers",
    # 12
    "12-systeme/01-utilisateurs": "Utilisateurs",
    "12-systeme/02-roles": "Roles et Permissions",
    "12-systeme/03-parametres": "Parametres Generaux",
    "12-systeme/04-integrations": "Integrations",
    "12-systeme/05-audit": "Journal d'Audit",
    "12-systeme/06-traductions": "Traductions (i18n)",
    "12-systeme/07-apparence": "Apparence et Contenu",
    "12-systeme/08-maintenance": "Maintenance",
    "12-systeme/09-securite": "Securite",
    "12-systeme/10-sauvegardes": "Sauvegardes",
}

# ---------------------------------------------------------------------------
# CSS — Magazine Style
# ---------------------------------------------------------------------------
MAGAZINE_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');

:root {
    --blue-primary: #0066CC;
    --blue-dark: #003366;
    --blue-deeper: #001a33;
    --gold: #D4A843;
    --gold-light: #f0e6cc;
    --bg-white: #ffffff;
    --bg-light: #f8f9fa;
    --bg-subtle: #f0f4ff;
    --text-primary: #1a1a2e;
    --text-secondary: #4a4a6a;
    --text-muted: #8888aa;
    --border-light: #e0e4ee;
    --border-subtle: #d0d8e8;
    --shadow-soft: 0 2px 12px rgba(0, 51, 102, 0.08);
    --shadow-card: 0 4px 20px rgba(0, 51, 102, 0.12);
    --shadow-header: 0 8px 40px rgba(0, 0, 0, 0.18);
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-xl: 24px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html {
    font-size: 16px;
    scroll-behavior: smooth;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--text-primary);
    background: var(--bg-light);
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* ===== COVER PAGE ===== */
.cover-page {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--blue-deeper) 0%, var(--blue-dark) 40%, var(--blue-primary) 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 4rem 2rem;
    position: relative;
    overflow: hidden;
    page-break-after: always;
}

.cover-page::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(ellipse at 30% 50%, rgba(212, 168, 67, 0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 30%, rgba(0, 102, 204, 0.15) 0%, transparent 50%);
    animation: coverGlow 20s ease-in-out infinite alternate;
}

@keyframes coverGlow {
    0% { transform: translate(0, 0) rotate(0deg); }
    100% { transform: translate(-5%, 5%) rotate(3deg); }
}

.cover-badge {
    position: relative;
    z-index: 1;
    display: inline-block;
    border: 1px solid rgba(212, 168, 67, 0.4);
    border-radius: 30px;
    padding: 0.5rem 1.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 2rem;
}

.cover-title {
    position: relative;
    z-index: 1;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 4.5rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: 1rem;
}

.cover-title span {
    color: var(--gold);
}

.cover-subtitle {
    position: relative;
    z-index: 1;
    font-size: 1.3rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
    max-width: 600px;
    margin-bottom: 3rem;
    letter-spacing: 0.02em;
}

.cover-divider {
    position: relative;
    z-index: 1;
    width: 80px;
    height: 2px;
    background: var(--gold);
    margin-bottom: 2rem;
}

.cover-info {
    position: relative;
    z-index: 1;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 300;
}

.cover-info strong {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
}

/* ===== TABLE OF CONTENTS ===== */
.toc-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 4rem 2rem;
    page-break-after: always;
}

.toc-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--blue-dark);
    margin-bottom: 0.5rem;
}

.toc-subtitle {
    font-size: 1rem;
    color: var(--text-muted);
    margin-bottom: 3rem;
    font-weight: 300;
}

.toc-section {
    display: flex;
    align-items: flex-start;
    padding: 1.2rem 0;
    border-bottom: 1px solid var(--border-light);
    transition: background 0.2s;
}

.toc-section:hover {
    background: var(--bg-subtle);
    margin: 0 -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
    border-radius: var(--radius-sm);
}

.toc-number {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--blue-primary);
    min-width: 3rem;
    line-height: 1;
    margin-top: 0.2rem;
}

.toc-details {
    flex: 1;
    margin-left: 1.5rem;
}

.toc-section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.2rem;
}

.toc-section-subtitle {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 300;
}

.toc-pages {
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 6rem;
    text-align: right;
    padding-top: 0.3rem;
}

/* ===== SECTION HEADER ===== */
.section-header {
    position: relative;
    margin-bottom: 0;
    padding: 0;
    overflow: hidden;
    page-break-before: always;
    min-height: 400px;
    display: flex;
    align-items: flex-end;
}

.section-header-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.4);
}

.section-header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top,
        rgba(0, 26, 51, 0.95) 0%,
        rgba(0, 51, 102, 0.6) 40%,
        rgba(0, 51, 102, 0.3) 100%);
}

.section-header-content {
    position: relative;
    z-index: 1;
    padding: 3rem;
    width: 100%;
}

.section-header-number {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 5rem;
    font-weight: 700;
    color: rgba(212, 168, 67, 0.3);
    line-height: 1;
    margin-bottom: 0.5rem;
}

.section-header h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 3rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
    margin-bottom: 0.5rem;
}

.section-header-sub {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 300;
    max-width: 600px;
}

/* ===== MAIN CONTENT WRAPPER ===== */
.content-wrapper {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* ===== PAGE ARTICLE ===== */
.page-article {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
    margin: 2rem auto;
    max-width: 1100px;
    overflow: hidden;
    page-break-inside: avoid;
}

.page-article-header {
    padding: 2.5rem 3rem 1.5rem;
    border-bottom: 1px solid var(--border-light);
}

.page-article-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
}

.page-article-meta .section-tag {
    background: var(--bg-subtle);
    color: var(--blue-primary);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
}

.page-article-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--blue-dark);
    line-height: 1.2;
    margin-bottom: 0.5rem;
}

.page-article-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    font-weight: 300;
}

/* ===== MAGAZINE CONTENT (2-column) ===== */
.magazine-content {
    padding: 2.5rem 3rem 3rem;
    columns: 2;
    column-gap: 2.5rem;
    column-rule: 1px solid var(--border-light);
    orphans: 3;
    widows: 3;
}

.magazine-content > * {
    break-inside: avoid;
}

/* ===== TYPOGRAPHY ===== */
.magazine-content h1 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--blue-dark);
    margin: 2rem 0 1rem;
    column-span: all;
    border-bottom: 2px solid var(--gold);
    padding-bottom: 0.5rem;
}

.magazine-content h2 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--blue-dark);
    margin: 1.8rem 0 0.8rem;
    column-span: all;
}

.magazine-content h3 {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 1.5rem 0 0.6rem;
}

.magazine-content h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 1.2rem 0 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.85rem;
}

.magazine-content p {
    margin-bottom: 1rem;
    text-align: justify;
    hyphens: auto;
}

/* Drop Cap */
.magazine-content .drop-cap::first-letter,
.magazine-content > p:first-of-type::first-letter {
    float: left;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 3.5rem;
    line-height: 0.8;
    padding: 0.1em 0.12em 0 0;
    color: var(--blue-primary);
    font-weight: 700;
}

/* Pull Quote */
.pull-quote,
.magazine-content blockquote {
    column-span: all;
    border-left: 4px solid var(--gold);
    padding: 1.2rem 1.8rem;
    margin: 1.8rem 0;
    font-size: 1.15rem;
    font-style: italic;
    font-family: 'Playfair Display', Georgia, serif;
    color: var(--blue-dark);
    background: linear-gradient(135deg, var(--bg-subtle), var(--gold-light));
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    position: relative;
}

.magazine-content blockquote::before {
    content: '"';
    position: absolute;
    top: -0.2rem;
    left: 0.8rem;
    font-size: 3rem;
    color: var(--gold);
    opacity: 0.3;
    font-family: 'Playfair Display', Georgia, serif;
}

/* Sidebar Box */
.sidebar-box {
    background: var(--bg-subtle);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    margin: 1.5rem 0;
    border: 1px solid var(--border-subtle);
    break-inside: avoid;
}

.sidebar-box-title {
    font-weight: 700;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--blue-primary);
    margin-bottom: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Tables */
.magazine-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.9rem;
    column-span: all;
    break-inside: avoid;
}

.magazine-content thead {
    background: var(--blue-dark);
    color: white;
}

.magazine-content th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.magazine-content td {
    padding: 0.65rem 1rem;
    border-bottom: 1px solid var(--border-light);
}

.magazine-content tbody tr:nth-child(even) {
    background: var(--bg-light);
}

.magazine-content tbody tr:hover {
    background: var(--bg-subtle);
}

/* Lists */
.magazine-content ul, .magazine-content ol {
    margin: 0.8rem 0 1rem 1.5rem;
}

.magazine-content li {
    margin-bottom: 0.4rem;
    line-height: 1.6;
}

.magazine-content li strong {
    color: var(--blue-dark);
}

/* Code */
.magazine-content code {
    background: var(--bg-light);
    border: 1px solid var(--border-light);
    border-radius: 4px;
    padding: 0.15rem 0.4rem;
    font-size: 0.85em;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    color: var(--blue-primary);
}

.magazine-content pre {
    background: var(--blue-deeper);
    color: #e0e0e0;
    padding: 1.2rem 1.5rem;
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin: 1.2rem 0;
    font-size: 0.85rem;
    line-height: 1.5;
    column-span: all;
    break-inside: avoid;
}

.magazine-content pre code {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
}

/* Horizontal rule */
.magazine-content hr {
    border: none;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--gold), transparent);
    margin: 2rem 0;
    column-span: all;
}

/* Strong / emphasis */
.magazine-content strong {
    font-weight: 600;
}

.magazine-content em {
    font-style: italic;
    color: var(--text-secondary);
}

/* ===== FOOTER ===== */
.page-footer {
    text-align: center;
    padding: 2rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    border-top: 1px solid var(--border-light);
    margin-top: 3rem;
}

.page-footer .brand {
    color: var(--blue-primary);
    font-weight: 600;
}

/* ===== BACK COVER ===== */
.back-cover {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--blue-deeper) 0%, var(--blue-dark) 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 4rem 2rem;
    page-break-before: always;
}

.back-cover-logo {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 1rem;
}

.back-cover-logo span { color: var(--gold); }

.back-cover-text {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 300;
    max-width: 400px;
    line-height: 1.8;
}

.back-cover-url {
    margin-top: 2rem;
    font-size: 0.9rem;
    color: var(--gold);
    font-weight: 500;
    letter-spacing: 0.05em;
}

/* ===== PRINT / PDF ===== */
@media print {
    body { background: white; }
    .page-article { box-shadow: none; border: 1px solid #ddd; }
    .cover-page, .back-cover { page-break-after: always; }
    .section-header { page-break-before: always; }
    .magazine-content { columns: 2; }
}

@page {
    size: A4;
    margin: 1.5cm;
}
"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def md_to_html(md_path: Path) -> str:
    """Convert markdown to HTML using pandoc."""
    try:
        result = subprocess.run(
            ["pandoc", str(md_path), "-f", "markdown", "-t", "html5",
             "--no-highlight", "--wrap=none"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return result.stdout
        print(f"  pandoc error for {md_path.name}: {result.stderr[:200]}")
        return f"<p>Error converting {md_path.name}</p>"
    except Exception as e:
        print(f"  pandoc exception for {md_path.name}: {e}")
        return f"<p>Error converting {md_path.name}: {e}</p>"


def image_to_data_uri(img_path: Path) -> str:
    """Convert image to base64 data URI for embedding in HTML."""
    if not img_path.exists():
        return ""
    with open(img_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    ext = img_path.suffix.lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "webp": "image/webp", "svg": "image/svg+xml"}.get(ext.lstrip("."), "image/png")
    return f"data:{mime};base64,{b64}"


def get_section_id(md_path: Path) -> str:
    """Extract section ID (e.g. '02-commerce') from markdown path."""
    return md_path.parent.name


def get_page_key(md_path: Path) -> str:
    """Extract page key (e.g. '02-commerce/01-commandes') from markdown path."""
    return f"{md_path.parent.name}/{md_path.stem}"


def get_section_pages(section_id: str) -> List[Path]:
    """Get all markdown files for a section, sorted."""
    section_dir = GUIDE_ROOT / section_id
    if not section_dir.is_dir():
        return []
    return sorted(section_dir.glob("*.md"))


def get_all_sections() -> List[str]:
    """Get all section IDs sorted."""
    sections = []
    for d in sorted(GUIDE_ROOT.iterdir()):
        if d.is_dir() and re.match(r'\d{2}-', d.name) and d.name in SECTION_META:
            sections.append(d.name)
    return sections


def extract_first_paragraph(html_content: str) -> str:
    """Extract text of the first paragraph for the subtitle."""
    match = re.search(r'<p>(.*?)</p>', html_content, re.DOTALL)
    if match:
        text = re.sub(r'<[^>]+>', '', match.group(1))
        if len(text) > 150:
            text = text[:147] + "..."
        return text
    return ""


def enhance_html_content(raw_html: str) -> str:
    """Enhance HTML with magazine styling elements."""
    # Remove the first h1 (it's already in the article header)
    enhanced = re.sub(r'<h1[^>]*>.*?</h1>', '', raw_html, count=1, flags=re.DOTALL)

    # Convert blockquote with "Astuce" to sidebar-box
    enhanced = re.sub(
        r'<blockquote>\s*<p>\s*<strong>(Astuce|Conseil|Note|Important|Attention)</strong>\s*:?\s*(.*?)</p>\s*</blockquote>',
        lambda m: f'<div class="sidebar-box"><div class="sidebar-box-title">{m.group(1)}</div><p>{m.group(2)}</p></div>',
        enhanced, flags=re.DOTALL
    )

    return enhanced


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------

def generate_cover_page(embed_images: bool = True) -> str:
    """Generate the magazine cover page HTML."""
    today = datetime.now().strftime("%B %Y")
    return f"""
    <div class="cover-page">
        <div class="cover-badge">Guide Utilisateur Officiel</div>
        <h1 class="cover-title">Kor<span>@</span>line</h1>
        <p class="cover-subtitle">L'Encyclopedie Digitale — Guide complet de la suite d'administration BioCycle Peptides</p>
        <div class="cover-divider"></div>
        <p class="cover-info">
            <strong>127 pages</strong> &middot; <strong>13 sections</strong> &middot; Version 1.0<br>
            {today}
        </p>
    </div>
    """


def generate_toc(sections: List[str]) -> str:
    """Generate the table of contents page."""
    items = []
    for sid in sections:
        meta = SECTION_META.get(sid, {})
        num = sid.split("-")[0]
        pages = get_section_pages(sid)
        page_count = len(pages)
        items.append(f"""
        <div class="toc-section">
            <div class="toc-number">{num}</div>
            <div class="toc-details">
                <div class="toc-section-title">{meta.get('title', sid)}</div>
                <div class="toc-section-subtitle">{meta.get('subtitle', '')}</div>
            </div>
            <div class="toc-pages">{page_count} page{'s' if page_count > 1 else ''}</div>
        </div>
        """)

    return f"""
    <div class="toc-page">
        <h2 class="toc-title">Sommaire</h2>
        <p class="toc-subtitle">13 sections — 127 pages — Guide complet</p>
        {''.join(items)}
    </div>
    """


def generate_section_header(section_id: str, embed_images: bool = True) -> str:
    """Generate a section header with the AI-generated image."""
    meta = SECTION_META.get(section_id, {})
    num = section_id.split("-")[0]
    img_path = IMAGES_DIR / f"{section_id}.png"

    if embed_images and img_path.exists():
        img_src = image_to_data_uri(img_path)
    elif img_path.exists():
        img_src = f"../images/sections/{section_id}.png"
    else:
        img_src = ""

    img_tag = f'<img class="section-header-image" src="{img_src}" alt="{meta.get("title", "")}">' if img_src else ''

    return f"""
    <div class="section-header">
        {img_tag}
        <div class="section-header-overlay"></div>
        <div class="section-header-content">
            <div class="section-header-number">{num}</div>
            <h1>{meta.get('title', section_id)}</h1>
            <p class="section-header-sub">{meta.get('subtitle', '')}</p>
        </div>
    </div>
    """


def generate_page_article(md_path: Path, section_id: str, page_num: int) -> str:
    """Generate a magazine-style article for a single page."""
    page_key = get_page_key(md_path)
    meta = SECTION_META.get(section_id, {})
    title = PAGE_TITLES.get(page_key, md_path.stem.replace("-", " ").title())
    section_title = meta.get("title", section_id)

    raw_html = md_to_html(md_path)
    subtitle = extract_first_paragraph(raw_html)
    enhanced = enhance_html_content(raw_html)

    return f"""
    <article class="page-article" id="{page_key.replace('/', '-')}">
        <div class="page-article-header">
            <div class="page-article-meta">
                <span class="section-tag">{section_title}</span>
                <span>Page {page_num}</span>
            </div>
            <h2 class="page-article-title">{html.escape(title)}</h2>
        </div>
        <div class="magazine-content">
            {enhanced}
        </div>
    </article>
    """


def generate_back_cover() -> str:
    """Generate the back cover page."""
    return """
    <div class="back-cover">
        <div class="back-cover-logo">Kor<span>@</span>line</div>
        <p class="back-cover-text">
            Suite d'administration BioCycle Peptides<br>
            Commerce, CRM, Marketing, Comptabilite,<br>
            Media, Telephonie, Emails et plus encore.
        </p>
        <p class="back-cover-url">biocyclepeptides.com/admin</p>
    </div>
    """


def generate_footer() -> str:
    """Generate footer HTML."""
    year = datetime.now().year
    return f"""
    <footer class="page-footer">
        <span class="brand">Koraline</span> &middot; L'Encyclopedie Digitale &middot;
        BioCycle Peptides &copy; {year} &middot; Tous droits reserves
    </footer>
    """


def wrap_html(title: str, body: str, embed_css: bool = True) -> str:
    """Wrap body content in a full HTML document."""
    css_block = f"<style>{MAGAZINE_CSS}</style>" if embed_css else '<link rel="stylesheet" href="assets/magazine.css">'
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(title)}</title>
    {css_block}
</head>
<body>
{body}
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Main generation
# ---------------------------------------------------------------------------

def generate_section_html(section_id: str, global_page_counter: int,
                          embed_images: bool = False) -> Tuple[str, int]:
    """Generate complete HTML for one section. Returns (html, new_page_counter)."""
    pages = get_section_pages(section_id)
    if not pages:
        return "", global_page_counter

    body_parts = []
    body_parts.append(generate_section_header(section_id, embed_images))

    for md_path in pages:
        global_page_counter += 1
        article = generate_page_article(md_path, section_id, global_page_counter)
        body_parts.append(article)
        print(f"    [{global_page_counter:03d}] {md_path.name}")

    return "\n".join(body_parts), global_page_counter


def generate_all(only_section: Optional[str] = None, make_pdf: bool = False,
                 embed_images: bool = False):
    """Generate all magazine HTML (and optionally PDF) files."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    # Write CSS file
    css_path = ASSETS_DIR / "magazine.css"
    css_path.write_text(MAGAZINE_CSS, encoding="utf-8")
    print(f"CSS written: {css_path}")

    sections = get_all_sections()
    if only_section:
        sections = [s for s in sections if s.startswith(only_section)]
        if not sections:
            print(f"No section matching '{only_section}'")
            return

    # --- Per-section HTML files ---
    page_counter = 0
    master_body_parts = []
    master_body_parts.append(generate_cover_page(embed_images))
    master_body_parts.append(generate_toc(get_all_sections()))

    for section_id in sections:
        meta = SECTION_META.get(section_id, {})
        print(f"\n=== Section {section_id}: {meta.get('title', '?')} ===")

        section_html, page_counter = generate_section_html(
            section_id, page_counter, embed_images
        )

        if section_html:
            master_body_parts.append(section_html)

            # Write per-section file
            section_title = meta.get("title", section_id)
            section_num = section_id.split("-")[0]
            filename = f"Section_{section_num}_{section_title.replace(' ', '_')}.html"
            section_full = wrap_html(
                f"Koraline — {section_title}",
                generate_section_header(section_id, embed_images) + "\n" +
                section_html.split("</div>", 1)[-1] if "</div>" in section_html else section_html,
                embed_css=True
            )
            # Actually, just wrap section html standalone
            section_standalone = wrap_html(
                f"Koraline — {section_title}",
                section_html,
                embed_css=True
            )
            out_path = OUTPUT_DIR / filename
            out_path.write_text(section_standalone, encoding="utf-8")
            print(f"  Wrote: {out_path.name} ({out_path.stat().st_size:,} bytes)")

    # --- Master HTML ---
    master_body_parts.append(generate_back_cover())
    master_body_parts.append(generate_footer())
    master_body = "\n".join(master_body_parts)
    master_html = wrap_html("Koraline — L'Encyclopedie Digitale", master_body, embed_css=True)

    master_path = OUTPUT_DIR / "Guide_Koraline_Magazine.html"
    master_path.write_text(master_html, encoding="utf-8")
    print(f"\n{'='*60}")
    print(f"MASTER HTML: {master_path}")
    print(f"  Size: {master_path.stat().st_size:,} bytes")
    print(f"  Pages: {page_counter}")

    # --- PDF generation ---
    if make_pdf:
        print(f"\nGenerating PDF via weasyprint...")
        try:
            import weasyprint
            pdf_path = OUTPUT_DIR / "Guide_Koraline_Magazine.pdf"
            doc = weasyprint.HTML(filename=str(master_path))
            doc.write_pdf(str(pdf_path))
            print(f"PDF: {pdf_path} ({pdf_path.stat().st_size:,} bytes)")
        except ImportError:
            print("weasyprint not available. Install with: pip install weasyprint")
        except Exception as e:
            print(f"PDF generation error: {e}")

    # --- Summary ---
    print(f"\n{'='*60}")
    print(f"GENERATION COMPLETE")
    print(f"  Sections: {len(sections)}")
    print(f"  Pages: {page_counter}")
    print(f"  Output: {OUTPUT_DIR}")
    all_files = list(OUTPUT_DIR.glob("*.html"))
    print(f"  HTML files: {len(all_files)}")
    total_size = sum(f.stat().st_size for f in all_files)
    print(f"  Total size: {total_size:,} bytes ({total_size / 1024 / 1024:.1f} MB)")
    if make_pdf:
        pdf_files = list(OUTPUT_DIR.glob("*.pdf"))
        if pdf_files:
            pdf_size = sum(f.stat().st_size for f in pdf_files)
            print(f"  PDF files: {len(pdf_files)} ({pdf_size / 1024 / 1024:.1f} MB)")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Koraline Magazine PDF Generator")
    parser.add_argument("--pdf", action="store_true", help="Also generate PDF via weasyprint")
    parser.add_argument("--section", type=str, help="Generate only this section (e.g. '02')")
    parser.add_argument("--embed-images", action="store_true",
                        help="Embed images as base64 data URIs (larger files but self-contained)")
    args = parser.parse_args()

    print("="*60)
    print("  KORALINE — L'Encyclopedie Digitale")
    print("  Magazine PDF Generator")
    print("="*60)

    generate_all(
        only_section=args.section,
        make_pdf=args.pdf,
        embed_images=args.embed_images,
    )


if __name__ == "__main__":
    main()
