# Maëldan — Portfolio

Portfolio one-page + pages projet. Réalisateur / motion / photo / graphisme.
Galerie claire, N&B pour l'interface, la couleur vient des images. Scroll fluide,
type kinétique, grain animé, flou au survol des grands titres.

## Stack
HTML / CSS / JS natif, sans build. Lenis (scroll), GSAP (animations) via CDN.
Typos (Typekit / Adobe Fonts, kit `fwk0sal`) : Helvetica Bold (titres) ·
Argent Pixel (corps) · Beth Ellen (accent). Fallbacks Helvetica Neue / Arial.
La section Travaux est une séquence verticale de projets (pas une grille).

## Structure
```
index.html            accueil (showreel Vimeo, grille, à propos, contact)
projet.html           page projet dynamique (?id=slug)
css/styles.css        styles accueil + tokens
css/project.css       styles page projet
js/projects.js        >>> DONNÉES PROJETS (à éditer)
js/main.js            accueil
js/project.js         page projet
assets/projets/<slug>/01.webp…   visuels par projet
assets/portrait/01.webp          portrait (à propos)
assets/logo.svg                  logo
docs/                 brief + moodboard (référence)
```

## Éditer / ajouter un projet
1. Créer `assets/projets/<slug>/` et y mettre les images `01.webp`, `02.webp`…
2. Ajouter une entrée dans `js/projects.js` (slug, title, type, cat, images, yt, desc…).
   - `cat` : `video` | `graphisme` | `photographie` | `motion`
   - `yt`  : ids YouTube pour les vidéos de la page projet
   - `cover` : optionnel (sinon `01.webp`)
3. Les filtres s'affichent automatiquement selon les catégories présentes.

## Showreel
Vidéo Vimeo en fond d'accueil (id `839054878`, mode background, sans overlay).
Pour la changer : modifier l'`iframe` dans `index.html`.

## Déployer (GitHub Pages)
Settings → Pages → branche `claude/quirky-curie-i5rayc`, dossier `/ (root)`.
En ligne sur `https://keltoyoubii.github.io/site/`.
