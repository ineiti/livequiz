# HEIG-SRX-2024 Chapitre 4, partie 1-2

## Intrusion

Lesquels de ces points sont à considérer comme une intrusion?

= 4
- Un telnet avec l'utilisateur root qui vient de l'extérieur du réseau
- Un portscan depuis l'extérieur du réseau
- Un portscan depuis l'intérieur du réseau
- Une requête pour un fichier non-existant sur un serveur web

Selon le réseau et le niveau de sécurité voulu, chacun de ces événements doit être
considéré comme une intrusion, ou pas. Si on considère tous comme une intrusion, on aura
beaucoup de faux alertes. Dans le cas contraire, on pourrait louper des intrusions.

## Faux positifs

Pourquoi le 0% de faux positifs est un but important ?

= 1
- Pour éviter d'être débordé par des fausses alertes
- Pour ne pas louper une intrusion potentielle parce qu'elle n'est pas signalée
- Pour être sûr que toutes les intrusions sont bien signalées

Si le IDS lance une alerte pour chaque paquet, il y a 0% de faux négatifs. Mais beaucoup de
faux positifs, et ça devient inutile.

## Faux négatifs

Quel est le problème des faux négatifs?

= 1
- Une attaque peut passer inaperçu
- L'administrateur est dérangé pour rien
- Un utilisateur peut être bloqué dans son travail

## But d'un IDS

Qu'est-ce qu'un IDS peut faire?

= 2
- Analyser une attaque après coup
- Découvrir un ordinateur possédé par un hackeur à l'intérieur du réseau
- Empêcher une attaque active
- Résoudre le problème de la sphère privée

Des fois une intrusion est détectée après coup, et les journaux de l'IDS peuvent aider à
trouver comment le hacker a pu pénétrer dans le réseau.
Un IDS peut aussi découvrir les paquets suspicieux sortants, qui peuvent indiquer qu'une
machine a été compromise.

## Détection d'une attaque

Comment est-ce qu'un IDS détecte une attaque?

= 2
- En appliquant des règles à tous les paquets et en indiquant les correspondances
- Souvent avec du machine learning
- En choisissant des paquets au hasard
- Avec des gens qui doivent inspecter chaque paquet

Les IDS utilisent de plus en plus le machine learning. Dès fois ce sont des simples
algorithmes statistiques, mais de plus en plus on voit aussi des réseaux
neuronales.

## Règles externes avec Snort

Quel est l'avantage principal d'utiliser des règles externes avec Snort?

= 2
- On a moins de travail
- La détection d'attaques nouvelles est plus rapidement intégrée
- Les règles sont plus exactes

Il y a toujours la possibilité que les règles externes soient mal faites. On doit donc choisir
entre une détection rapide de nouvelles attaques, et le travail nécessaire à vérifier les
nouvelles règles avant de les appliquer au système.

## Snort comme IPS

Quelle est une action qui peut être utilisée pour faire de snort un IPS?

~ s/ *//g
- /(sdrop|drop|reject)/

C'est un IPS très simple et qui permet d'appliquer quelques règles qui sont difficiles à
appliquer avec un pare-feu.

## End