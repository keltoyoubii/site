# MaëlDan — Portfolio

Site portfolio one-page : **Accueil (showreel) → Travaux → À propos → Contact**.
Minimaliste, cinématographique, image-led. Monochrome, scroll fluide, légères animations.

## Stack

HTML / CSS / JS natif. Aucun build, aucune installation.
- [Lenis](https://github.com/darkroomengineering/lenis) — scroll fluide (CDN)
- [GSAP ScrollTrigger](https://gsap.com/) — reveals + parallaxe (CDN)
- Typo : Space Grotesk + Archivo (Google Fonts)

## Lancer en local

Ouvrir `index.html` dans un navigateur. Ou, pour éviter les soucis CORS :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Structure

```
index.html        page
css/styles.css    styles + thème
js/projects.js    >>> tes projets (à éditer)
js/main.js        grille, filtre, scroll, animations
videos/showreel.mp4   >>> à ajouter (voir ci-dessous)
```

## À personnaliser

1. **Showreel** : déposer la vidéo dans `videos/showreel.mp4` (muet, démarre tout seul en boucle).
   Tant qu'elle n'est pas là, une image poster s'affiche avec un léger zoom.
2. **Projets** : éditer `js/projects.js` (titre, catégorie, image, taille).
   Les images de démo viennent de picsum.photos — **à remplacer par tes vrais visuels**.
3. **Contact** : remplacer `hello@maeldan.com` dans `index.html` (2 occurrences : footer + meta).

### Images / médias à fournir

- `videos/showreel.mp4` — showreel plein écran (16:9, idéalement < 8 Mo, H.264)
- 1 image poster du showreel (sinon picsum par défaut)
- 1 visuel par projet (mix portrait/paysage, voir `size` dans `projects.js`)

## Déployer (GitHub Pages, gratuit)

1. Repo → **Settings** → **Pages**
2. **Source** : `Deploy from a branch`
3. Branche : `main` (ou la branche voulue), dossier `/ (root)` → **Save**
4. Le site sera en ligne sur `https://<utilisateur>.github.io/<repo>/`

> Construit avec les skills `ui-ux-pro-max` (design system) et `taste-skill` (anti-slop frontend).
