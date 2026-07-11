/* =========================================================================
   Projets Maëldan — données
   cat    : "video" | "motion" | "graphisme" | "photographie"  (filtre)
   images : nombre de .webp dans assets/projets/<slug>/ (01..N) — 0 si aucun
   vimeo  : ids Vimeo (fond auto muet dans la liste + lecteur complet en page projet)
   yt     : ids YouTube (façade cliquable en page projet)
   ========================================================================= */

window.PROJECTS = [
  { slug: "reflet", title: "Reflet", type: "Vidéo — Contenu produit", cat: "video", images: 2, shapes: "vv", vimeo: ["1208777629"],
    yt: ["_9e64kzqg_A","OPZN22Yxz18","11Gz2rNdVq4","Ts5ZgpUMHRw","C_J5y-JWzjM","W5rxqsUMRnI","10YRNQS3wQ8","QzQOIpLrpt8"],
    desc: "Contenus pour la marque de soin Reflet : packshots de flacons, textures et unboxing. Éclairage studio net et moderne.", ambiance: "Commerciale, moderne, épurée." },

  { slug: "nina-plage", title: "Nina — Plage", type: "Photographie — Éditorial mode & beauté", cat: "photographie", images: 9, shapes: "hhhhhvvhh",
    desc: "Éditorial de plage au crépuscule avec la mannequin Nina Albaut : robe blanche fluide, vent et embruns sur fond bleu profond.", ambiance: "Onirique, crépusculaire, éthérée." },

  { slug: "tattoo-family", title: "Tattoo Family", type: "Vidéo — Documentaire", cat: "video", images: 1, shapes: "v", vimeo: ["1208771663", "1208771666"],
    yt: ["xdJYTv6CLsg","SrHeiPzpi4M","BkD-wSJecWo"],
    desc: "Documentaire sur un salon de tatouage et ses artistes : scènes de travail, ambiance chaleureuse et tamisée.", ambiance: "Documentaire, chaleureuse, authentique." },

  { slug: "beck", title: "Beck", type: "Photographie — Éditorial mode", cat: "photographie", images: 8, shapes: "hvvhvhvv",
    desc: "Éditorial en duo à l'esprit americana vintage : t-shirts détournés, denim, guitare. Parc et murs graffés.", ambiance: "Rock, vintage, nostalgique." },

  { slug: "aescend", title: "Æscend", type: "Identité visuelle — Charte graphique", cat: "graphisme", images: 11, shapes: "hhhhhhhhhhh",
    desc: "Identité d'une marque de compléments alimentaires et nutrition sportive. Logo dynamique, typographie impactante, palette orange / noir. Signature : « Chaque jour plus haut ».", ambiance: "Énergique, sportif, premium." },

  { slug: "djullz", duo: true, duoPair: [1, 10], title: "Djullz", type: "Photographie — Portrait éditorial", cat: "photographie", images: 14, shapes: "vvvvvvvvvvvvvv",
    desc: "Portraits en extérieur pour l'influenceuse @djullz.", ambiance: "Fashion, lifestyle, extérieur." },

  { slug: "90-regards", duo: true, title: "90 Regards", type: "Identité visuelle — Charte graphique", cat: "graphisme", images: 6, shapes: "vvvvvv",
    desc: "Création d'identité visuelle pour une marque de vêtements workwear fait main, made in France.", ambiance: "" },

  { slug: "mariage-chloe-nico", title: "Chloé & Nicolas", type: "Vidéo — Aftermovie mariage", cat: "video", images: 0, vimeo: ["1208774915"],
    desc: "Aftermovie de mariage, écriture cinématographique. « Cinematic wedding video for lovers. »", ambiance: "Romantique, vintage, onirique." },

  { slug: "annihilation", duo: true, title: "Annihilation", type: "Photographie — Portrait", cat: "photographie", images: 2, shapes: "vv",
    desc: "Portrait autour d'une direction artistique surréaliste inspirée du film Annihilation.", ambiance: "Glaciale, éthérée, minimaliste." },

  { slug: "igor", duo: true, title: "Igor", type: "Direction artistique — Covers musicales", cat: "graphisme", images: 12, shapes: "vvvvvvvvvvvv",
    desc: "Pochettes pour l'univers éclectique d'Igor. Ciels de nuit, pluie numérique et silhouettes travaillées.", ambiance: "Nocturne, urbaine, cinématographique." },

  { slug: "anti", title: "Anti × Keutchi", type: "Vidéo — Publicité", cat: "video", images: 7, shapes: "hhhhvvv", vimeo: ["1208774916"],
    desc: "La marque Anti collabore avec l'artiste Keutchi pour sa collection de pièces Levi's vintage. Film de présentation tourné dans une caravane abandonnée et dans les vignes sous un ciel orageux.", ambiance: "Brute, orageuse." },

  { slug: "snaptrox", title: "Snaptrox", type: "Photographie — Automobile & lifestyle", cat: "photographie", images: 3, shapes: "hvv",
    desc: "Photoshoot autour de la Porsche 944 du youtubeur Snaptrox : toit urbain, skyline et portrait au coucher de soleil.", ambiance: "Automobile, urbaine, youngtimer." },

  { slug: "cap-metiers", title: "Cap Métiers", type: "Motion design", cat: "motion", images: 0, vimeo: ["1208776567"],
    desc: "Mix de séquences motion design réalisées pour Cap Métiers Nouvelle-Aquitaine.", ambiance: "Corporate, animé, institutionnel." },

  { slug: "web", duo: true, duoPair: [1, 3], title: "Web", type: "Photographie — Éditorial nocturne", cat: "photographie", images: 5, shapes: "vvvvh",
    desc: "Série de groupe en nocturne, flash direct et voiture. Esthétique « crew » très années 2000.", ambiance: "Nocturne, urbaine, collective." },

  { slug: "dopamoon", title: "Dopamoon — Dopalova", type: "Vidéo — Clip musical", cat: "video", images: 0, vimeo: ["1208775751"],
    yt: ["x8LqjBa711A","_MK2Iso0LaQ","JHd2XkOoGAo","-uYufwjSEfI"],
    desc: "Réalisation de clips pour le groupe Dopamoon, issus de leur album DOPALOVA produit par ALTER K.", ambiance: "Funky, vintage, lifestyle." },

  { slug: "lilou", duo: true, title: "Lilou", type: "Photographie — Portrait N&B", cat: "photographie", images: 4, shapes: "vvvv",
    desc: "Portraits argentiques noir & blanc au grain marqué, atmosphère intime, plus une variation en duotone vert.", ambiance: "Intime, argentique, brute." },

  { slug: "milinkostaud", title: "Milinkostaud", type: "Identité visuelle — Charte graphique", cat: "graphisme", images: 7, shapes: "hhhhhhh",
    desc: "Identité d'un coach musculation & coaching en ligne. Logo pictural, typographie grasse, palette vert / noir. Signature : « Transforme ton corps, dépasse tes limites ».", ambiance: "Athlétique, déterminée, premium." },

  { slug: "emma-bareille", title: "Emma Bareille — J'aime la pluie", type: "Vidéo — Clips musicaux", cat: "video", images: 0, vimeo: ["1208771667"],
    yt: ["_QW--9xcPwY","84MBrus1rCI","TwhwCnEbycw","X1RK0pT0zJQ","kiUG9SjH57I"],
    desc: "Clips pour l'artiste Emma Bareille : reflets dans les flaques, gouttes et voiles de tissu. Traitement poétique et aquatique.", ambiance: "Poétique, aquatique, onirique." },

  { slug: "luxie", title: "Luxie", type: "Photographie — Cover", cat: "photographie", images: 4, shapes: "hvhv",
    desc: "Série intimiste pour l'artiste Luxie.", ambiance: "Intime, rêveuse, musicale." },

  { slug: "amaury", duo: true, title: "Amaury × Amë Lorette", type: "Vidéo — Publicité", cat: "video", images: 0, vimeo: ["1208778430", "1208778431"],
    desc: "Campagne social pour la marque de lunettes Amaury Paris, en collaboration avec l'artiste Amë Lorette.", ambiance: "Mixed media, coloré, éditorial." },

  { slug: "nowhere-drive", title: "Nowhere Drive", type: "Photographie — Série narrative", cat: "photographie", images: 10, shapes: "hhhhvvhhhh",
    desc: "Série façon road-movie : diner américain, désert et buttes rocheuses, foulards et valises. Étalonnage chaud et cinéma.", ambiance: "Cinématographique, road-movie, narrative." },

  { slug: "jyeuhair", title: "Jyeuhair", type: "Vidéo — Clip musical", cat: "video", images: 2, shapes: "hv", yt: ["VT6PJu9v1jY"],
    desc: "Clip pour l'artiste Jyeuhair. Réalisation Reborn & Maëldan, cadrage, montage et étalonnage Maëldan.", ambiance: "Sombre, enfumée, mystérieuse.",
    credits: "Auteur/Compositeur : Jyeuhair · Réalisation : Reborn & Maëldan · Production : Ali Chergui · Cadrage / Montage / Étalonnage : Maëldan · Mix/Mastering : Chopsoe · Assistante production : Marie Bajoit · Maquillage : Eva Nieto · Graphic design : Atelier Tokyo Noir" },

  { slug: "louka", title: "Louka — Avant l'orage", type: "Direction artistique — Éditorial mode", cat: "photographie", images: 5, shapes: "vvvvv", year: "2025",
    yt: ["eAnTYUSOsh0"], videoEnd: true,
    desc: "Portraits masculins « Avant l'orage » : denim, gouttes d'eau et ciels menaçants, étalonnage froid. Tirages et annotations manuscrites.", ambiance: "Cinématographique, orageuse, romantique." },
];
