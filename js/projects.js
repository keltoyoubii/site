/* =========================================================================
   Projets Maëldan — données réelles
   cat  : "video" | "graphisme" | "photographie" | "motion"  (filtre)
   size : "" (1/2) | "wide" (2/3) | "narrow" (1/3) | "full" (pleine largeur)
   images : nombre de .webp dans assets/projets/<slug>/ (01..N)
   yt   : ids YouTube (pour la page projet)
   cover: (optionnel) forcer une couverture, sinon 01.webp
   ========================================================================= */

window.PROJECTS = [
  { slug: "nowhere-drive", title: "Nowhere Drive", type: "Photographie — Série narrative", cat: "photographie", size: "wide", images: 11,
    desc: "Série façon road-movie : diner américain, désert et buttes rocheuses, foulards et valises. Étalonnage chaud et cinéma.", ambiance: "Cinématographique, road-movie, narrative." },

  { slug: "anti", title: "Anti × Keutchi", type: "Vidéo — Publicité", cat: "video", size: "narrow", images: 10, yt: ["F3DGYBijeaU"],
    desc: "La marque Anti collabore avec l'artiste Keutchi pour sa nouvelle collection de pièces Levi's vintage. Vidéo de présentation tournée dans une caravane abandonnée et dans les vignes sous un ciel orageux.", ambiance: "Brute, orageuse." },

  { slug: "igor", title: "Igor", type: "Direction artistique — Covers musicales", cat: "graphisme", size: "narrow", images: 7,
    desc: "Pochettes pour un univers rap nocturne (« DiRTYPOP! », « Doberman »). Ciels de nuit, pluie numérique et silhouettes travaillées.", ambiance: "Nocturne, urbaine, cinématographique." },

  { slug: "beck", title: "Beck", type: "Photographie — Éditorial mode", cat: "photographie", size: "wide", images: 8,
    desc: "Éditorial en duo à l'esprit americana vintage : t-shirts détournés, denim, guitare. Parc et murs graffés.", ambiance: "Rock, vintage, nostalgique." },

  { slug: "reflet", title: "Reflet", type: "Vidéo — Contenu produit", cat: "video", size: "", images: 2,
    yt: ["-h1tnskpJeo","_9e64kzqg_A","OPZN22Yxz18","11Gz2rNdVq4","Ts5ZgpUMHRw","C_J5y-JWzjM","W5rxqsUMRnI","10YRNQS3wQ8","QzQOIpLrpt8"],
    desc: "Contenus pour la marque de soin Reflet : packshots de flacons, textures et unboxing. Éclairage studio net et moderne.", ambiance: "Commerciale, moderne, épurée." },

  { slug: "lea", title: "Léa", type: "Direction artistique — Visuel", cat: "graphisme", size: "", images: 3,
    desc: "Silhouette en contre-jour sur fond bleu nuit, recouverte d'écritures à la craie grasse. Superposition de l'image et du texte manuscrit.", ambiance: "Poétique, nocturne, expérimentale." },

  { slug: "nina-plage", title: "Nina — Plage", type: "Photographie — Éditorial mode & beauté", cat: "photographie", size: "wide", images: 5,
    desc: "Éditorial de plage au crépuscule : cheveux roses, robe blanche fluide, vent et embruns sur fond bleu profond.", ambiance: "Onirique, crépusculaire, éthérée." },

  { slug: "dopamoon", title: "Dopamoon — Dopalova", type: "Vidéo — Clip musical", cat: "video", size: "narrow",
    cover: "https://i.ytimg.com/vi/_MK2Iso0LaQ/maxresdefault.jpg", images: 0,
    yt: ["_MK2Iso0LaQ","x8LqjBa711A","n3_M_kEzoks","JHd2XkOoGAo","-uYufwjSEfI"],
    desc: "Réalisation de clips pour le groupe Dopamoon, issus de leur album DOPALOVA produit par ALTER K.", ambiance: "Funky, vintage, lifestyle." },

  { slug: "milinkostaud", title: "Milinkostaud", type: "Identité visuelle — Charte graphique", cat: "graphisme", size: "narrow", images: 8,
    desc: "Identité d'un coach musculation & coaching en ligne. Logo pictural, typographie grasse, palette vert / noir. Signature : « Transforme ton corps, dépasse tes limites ».", ambiance: "Athlétique, déterminée, premium." },

  { slug: "chaimae", title: "Chaimae", type: "Photographie — Portrait studio", cat: "photographie", size: "wide", images: 5,
    desc: "Portraits studio en lumière rouge dramatique : casquette militaire à étoile, gants rouges, poses affirmées.", ambiance: "Dramatique, sensuelle, graphique." },

  { slug: "louka", title: "Louka — Avant l'orage", type: "Direction artistique — Éditorial mode", cat: "graphisme", size: "", images: 6, year: "2025",
    desc: "Portraits masculins « Avant l'orage » : denim, gouttes d'eau et ciels menaçants, étalonnage froid. Tirages et annotations manuscrites.", ambiance: "Cinématographique, orageuse, romantique." },

  { slug: "jyeuhair", title: "Jyeuhair", type: "Vidéo — Clip musical", cat: "video", size: "", images: 2, yt: ["VT6PJu9v1jY"],
    desc: "Clip pour l'artiste Jyeuhair. Réalisation Reborn & Maëldan, cadrage, montage et étalonnage Maëldan.", ambiance: "Sombre, enfumée, mystérieuse.",
    credits: "Auteur/Compositeur : Jyeuhair · Réalisation : Reborn & Maëldan · Production : Ali Chergui · Cadrage / Montage / Étalonnage : Maëldan · Mix/Mastering : Chopsoe · Assistante production : Marie Bajoit · Maquillage : Eva Nieto · Graphic design : Atelier Tokyo Noir" },

  { slug: "web", title: "Web", type: "Photographie — Éditorial nocturne", cat: "photographie", size: "narrow", images: 5,
    desc: "Série de groupe en nocturne, flash direct et voiture. Esthétique « crew » très années 2000.", ambiance: "Nocturne, urbaine, collective." },

  { slug: "aescend", title: "Æscend", type: "Identité visuelle — Charte graphique", cat: "graphisme", size: "wide", images: 11,
    desc: "Identité d'une marque de compléments alimentaires et nutrition sportive. Logo dynamique, typographie impactante, palette orange / noir. Signature : « Chaque jour plus haut ».", ambiance: "Énergique, sportif, premium." },

  { slug: "montignac", title: "Montignac", type: "Vidéo — Contenu de marque", cat: "video", size: "narrow",
    cover: "https://i.ytimg.com/vi/eAnTYUSOsh0/hqdefault.jpg", images: 0, yt: ["eAnTYUSOsh0"],
    desc: "Vidéo verticale pour la marque Montignac : silhouette en pleine nature, lumière chaude et logo monogramme élégant.", ambiance: "Naturelle, élégante, lifestyle." },

  { slug: "lilou", title: "Lilou", type: "Photographie — Portrait N&B", cat: "photographie", size: "", images: 4,
    desc: "Portraits argentiques noir & blanc au grain marqué, atmosphère intime, plus une variation en duotone vert.", ambiance: "Intime, argentique, brute." },

  { slug: "djoulie", title: "Djoulie — la Comète Rouge", type: "Direction artistique — Cover art", cat: "graphisme", size: "", images: 3,
    desc: "Visuels de sortie pour l'artiste Julie : portraits éthérés sur fonds brumeux et pochette forte au portrait viré rouge.", ambiance: "Onirique, sensible, incandescente." },

  { slug: "snaptrox", title: "Snaptrox", type: "Photographie — Automobile & lifestyle", cat: "photographie", size: "wide", images: 3,
    desc: "Série automobile autour d'une Porsche 944 : toit urbain, skyline et portrait au coucher de soleil.", ambiance: "Automobile, urbaine, youngtimer." },

  { slug: "emma-bareille", title: "Emma Bareille — J'aime la pluie", type: "Vidéo — Clips musicaux", cat: "video", size: "narrow",
    cover: "https://i.ytimg.com/vi/zi3Wra7u8dM/maxresdefault.jpg", images: 0,
    yt: ["zi3Wra7u8dM","_QW--9xcPwY","84MBrus1rCI","TwhwCnEbycw","X1RK0pT0zJQ","kiUG9SjH57I"],
    desc: "Clips pour l'artiste Emma Bareille : reflets dans les flaques, gouttes et voiles de tissu. Traitement poétique et aquatique.", ambiance: "Poétique, aquatique, onirique." },

  { slug: "lollipop", title: "Lullipop", type: "Direction artistique — Affiche", cat: "graphisme", size: "narrow", images: 4,
    desc: "Concept pop et acidulé : bigoudis roses, sucette et lettrage manuscrit sur fond clair.", ambiance: "Pop, acidulée, ludique." },

  { slug: "kleen", title: "Kleen", type: "Photographie — Streetwear", cat: "photographie", size: "wide", images: 3,
    desc: "Série streetwear devant des rideaux métalliques bleus et rouges, silhouette saisie en mouvement.", ambiance: "Urbaine, dynamique, graphique." },

  { slug: "tattoo-family", title: "Tattoo Family", type: "Vidéo — Documentaire", cat: "video", size: "", images: 1,
    yt: ["xdJYTv6CLsg","SrHeiPzpi4M","BkD-wSJecWo"],
    desc: "Documentaire sur un salon de tatouage et ses artistes : scènes de travail, ambiance chaleureuse et tamisée.", ambiance: "Documentaire, chaleureuse, authentique." },

  { slug: "luxie", title: "Luxie", type: "Photographie — Série intime", cat: "photographie", size: "", images: 4,
    desc: "Série intimiste autour de l'écoute musicale : casque, chambre et lumière chaude et tamisée.", ambiance: "Intime, chaleureuse, contemplative." },

  { slug: "mariage-chloe-nico", title: "Chloé & Nicolas", type: "Vidéo — Aftermovie mariage", cat: "video", size: "narrow",
    cover: "https://i.ytimg.com/vi/14ipRgkVXvw/maxresdefault.jpg", images: 0, yt: ["14ipRgkVXvw"],
    desc: "Aftermovie de mariage, écriture cinématographique. « Cinematic wedding video for lovers. »", ambiance: "Romantique, vintage, onirique." },

  { slug: "anyhilation", title: "Anyhilation", type: "Photographie — Portrait", cat: "photographie", size: "", images: 2,
    desc: "Portrait de profil aux tons bleus glacials, lumière froide et diffuse pour une atmosphère éthérée.", ambiance: "Glaciale, éthérée, minimaliste." }
];
