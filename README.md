# Nébulines V51 — qualité, comptes et social

Cette version reprend l'interface de V50, conserve les boosters gratuits avec une réserve maximale de **10**, et ajoute des routes serveur pour les demandes d'amis, la consultation de collection entre amis et les échanges de cartes.

## Préparé dans ce pack
- Création de compte pseudo/mot de passe, mots de passe hachés et jetons de session signés.
- Connexion Google via Google Identity Services, avec vérification du jeton côté serveur (configuration OAuth requise).
- Bonus de bienvenue de **160 Orbres par compte**, inscrit dans une transaction et un journal unique.
- Sauvegarde en ligne du solde et de la collection, avec validation du format des données.
- Routes serveur pour les amis et les échanges, avec vérifications d'accès et transfert de cartes transactionnel.
- Limitation des tentatives d'inscription/connexion, en-têtes de sécurité et limite de taille JSON.
- Réserve de boosters maximale de 10.

## Déploiement
Le dossier `public` est servi par le serveur Node.js. Pour les comptes en ligne, déployer le serveur complet, pas seulement le ZIP du site statique.

1. Utiliser Node.js 20 ou plus.
2. Configurer `JWT_SECRET` avec une clé aléatoire longue d'au moins 32 caractères.
3. Définir `GOOGLE_CLIENT_ID` après configuration d'un client OAuth Web dans Google Cloud Console.
4. Définir `DATA_DIR` vers un stockage **persistant** et sauvegardé. SQLite ne doit pas résider sur un disque éphémère.
5. Installer les dépendances (`npm install`) puis démarrer (`npm start`).
6. Tester `/api/health`, une inscription, une connexion, le bonus, la synchronisation et les échanges avec deux comptes de test.

## Limites connues avant une ouverture publique
- La connexion Google ne sera pas active tant que `GOOGLE_CLIENT_ID` et les domaines OAuth autorisés ne sont pas configurés.
- La sauvegarde d'Orbres reçoit encore le solde depuis le navigateur. La validation du format ne rend pas l'économie anti-triche : un joueur peut modifier les données client. Pour une économie réellement fiable, il faut migrer achats, tirages, récompenses et dépenses vers des actions serveur qui mettent à jour le solde côté serveur.
- Les comptes Google et mot de passe ne sont pas automatiquement liés entre eux. Un même joueur peut créer deux comptes avec des méthodes différentes.
- Pas de récupération de mot de passe, vérification d'e-mail, suppression de compte ou contrôle anti-abus avancé dans cette version.
- Les échanges concernent les cartes enregistrées dans la collection en ligne. Tester avec deux comptes avant d'ouvrir aux joueurs.
- Avant publication publique, prévoir sauvegardes régulières, politique de confidentialité, procédure de suppression des comptes et règles adaptées aux joueurs mineurs.

## Variables d'environnement
Voir `.env.example`. Ne jamais publier de secrets dans le dépôt GitHub ni dans le HTML.


## V52 — Réinitialisation réelle

La commande Réinitialiser la progression efface aussi le solde d'Orbres et la collection côté serveur pour un compte connecté. Le registre du bonus de bienvenue est conservé : les 160 Orbres ne sont jamais recrédités après une réinitialisation. Pour un joueur invité, la progression locale est supprimée.
