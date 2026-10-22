# Architecture Nébulines V51

- `public/index.html` : interface du jeu, servie par Express.
- `server.js` : API comptes, vérification Google, sauvegarde, amis et échanges.
- SQLite : comptes, journal des récompenses, relations d'amitié et échanges.
- `users.dust` et `users.collection_json` : données synchronisées par compte.
- `reward_ledger` : clé unique `welcome-160-v1` par compte, utilisée pour tracer la récompense initiale.

## Sécurité
Les mots de passe sont hachés avec bcrypt et les jetons sont vérifiés côté serveur. Les échanges se font dans une transaction SQLite. La sauvegarde d'Orbres n'est pas encore une économie anti-triche, car le navigateur peut proposer un nouveau solde. La prochaine étape de sécurité est une API d'actions économiques (ouvrir booster, achat, quête, vente) qui calcule et applique les variations côté serveur.
