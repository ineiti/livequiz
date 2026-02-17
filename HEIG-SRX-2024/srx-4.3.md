# HEIG-SRX-2024 Chapitre 4, partie 3 et 4

## Host-based IDS - avantages

Lesquels sont des avantages pour un host-based IDS?

= 2
- C'est plus intéressant au niveau des données récoltées
- C'est un accès aux données souvent déchiffrées
- C'est moins lourd pour les hôtes qu'un network-based IDS
- C'est moins intrusif pour l'utilisateur

Il faut aussi se poser la question de la sphère privée par rapport à toutes ces données. Qui
a le droit de les visualiser? Sous quelle condition? Est-ce qu'ils sont détruites? Quoi faire si
un utilisateur veut avoir une copie de toutes les données enregistrées de lui, selon le
RGPD?

## Host-based IDS - désavantages

Lesquels sont des désavantages pour un host-based IDS?

= 2
- Une intrusion de la sphère privée dû aux données collectées
- Difficulté de garder les journaux en cas d'attaque
- Moins d'informations dans les données récoltées
- Pas de possibilité de trouver des attaques du type "phising"

Normalement il faut envoyer les journaux sur un serveur central pour éviter qu'ils soient
effacés par un intrus. Mais si on le fait trop souvent, ceci va gêner l'utilisateur. Si on le fait
pas assez souvent, on pourrait manquer la partie où un intrus a réussi à s'installer sur
l'ordinateur.

## Architecture d'un NIDS

Quelle partie dans le diagram "Architecture d'un NIDS" doit être mise à jour le plus
régulièrement?

= 1
- Le Sniffer
- Le moteur de corrélation
- Les signatures

Comme on a vu avec 'snort', ce sont les signatures qui sont la partie critique d'un tel
système. Même s'il faut aussi mettre à jour le sniffer lui-même (qui contient le moteur de
corrélation), ces derniers sont moins urgents. Sauf en cas de faille de sécurité, bien sûr.

## Journalisation de paquets

Pourquoi faudrait-il journaliser autant de paquets que possible?

= 2
- Pour disséquer une attaque après-coup
- Pour éviter de ne pas détecter une attaque
- Pour détecter les attaques en temps réel
- Pour éviter d'utiliser trop d'espace

C'est une balance difficile à faire entre tout garder et pouvoir savoir comment un intrus à
réussi, et épargner l'espace disque, mais risquer de ne pas savoir à quel moment un
attaquant est entré.

## Honey-Pot

Quel genre d'attaques vont être détectées par un honey-pot?

= 4
- Des attaques automatisées
- Des attaques faites par des États
- Des attaques par des hackers débutants
- Des attaques difficile à discerner

Un honey-pot peut même être intéressant pour un attaquant. Surtout s'il arrive à se
déplacer horizontalement sur d'autres systèmes, parce que le honeypot a été mal sécurisé!

## Host-based IDS surveillance

Qu'est-ce qu'on va surveiller pour la détection d'anomalies sur un poste?

= 5
- La charge CPU
- La mémoire utilisé
- Le trafic du réseau
- Les utilisateurs connectés à l'ordinateur
- L'utilisation du clavier

Plus de données, mieux c'est!

## Détection d'anomalies

Comment on peut détecter des anomalies sans générer trop d'alertes?

= 2
- En faisant des statistiques sur plusieurs entrées et voir si ça dépasse
- En utilisant un réseau neuronal
- En alertant quand un maximum de l'utilisation de la CPU est dépassée
- En comparant l'utilisation moyenne avec l'utilisation du moment

Vu que l'utilisation d'un ordinateur est souvent très personnalisé, c'est difficile de trouver
des règles générales. On va donc utiliser des systèmes de "Machine learning" - autant des
systèmes statistiques (random forest classifier) que des systèmes basés sur des réseaux
neuronaux.

## Mauvais usage

Qu'est-ce qui rend l'approche "détection de mauvais usage" difficile?

= 2
- Il faut constamment mettre à jour les règles
- Seul les mauvais usage connus sont détectés
- C'est plus lent que la détection d'anomalies
- Il y a un taux de faux positifs élevé

C'est très similaire pour un IDS de réseau, où on doit constamment ajuster les règles pour
espérer pouvoir détecter des intrusions éventuelles.
