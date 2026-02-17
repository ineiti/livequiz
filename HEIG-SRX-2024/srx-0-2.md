# HEIG-SRX-2024 Chapitres 0 et 2

## Failles du système

Quelle faille est la plus grave pour un système?

= 1
- Ca dépend du contexte
- Une injection SQL
- Une référence directe non sécurisée
- Une clé de chiffrement à entropie basse

Même si l'injection SQL est le plus souvent le plus dangereux, selon le contexte, les deux
autres peuvent être tout aussi catastrophique.

## Vulnérabilité vs. attaque

Quelle est la différence entre une vulnérabilité et une attaque?

= 2
- Une attaque avec succès est toujours plus grave qu'une vulnérabilité
- Une vulnérabilité en soit ne dérange pas le système
- Une vulnérabilité est toujours plus grave qu'une attaque
- Une attaque est bénigne parce qu'on apprend quelque chose

Bien sûr qu'une attaque avec succès est plus grave qu'une vulnérabilité qui n'a pas encore
était exploitée.
Et si on doit apprendre ce qui s'est passé après une attaque, elle n'est pas pour autant
bénigne...

## WHITE, gray, black

Choisis ce qui s'applique sur le "White box testing"

= 2
- Toutes la documentation des structures du réseau sont à disposition du pentester
- On a des résultats très rapide
- C'est souvent l'approche la plus chère entre les trois
- C'est un bon compromis entre le temps, le coût, et les failles découvertes
- Le pentester reçoit quelques informations du réseau à attaquer

C'est souvent la version la moins chère.

## White, GRAY, black

Choisis ce qui s'applique sur le "Gray box testing"

= 2
- C'est un bon compromis entre le temps, le coût, et les failles découvertes
- Le pentester reçoit quelques informations du réseau à attaquer
- Toutes la documentation des structures du réseau sont à disposition du pentester
- C'est souvent l'approche la plus chère entre les trois
- On a des résultats très rapide

Un peu plus long que le "white box testing", mais permet des fois plus de découvertes
que le "white box testing".

## White, gray, BLACK 

Choisis ce qui s'applique sur le "Black box testing"

= 1
- C'est souvent l'approche la plus chère entre les trois
- Toutes la documentation des structures du réseau sont à disposition du pentester
- On a des résultats très rapide
- C'est un bon compromis entre le temps, le coût, et les failles découvertes
- Le pentester reçoit quelques informations du réseau à attaquer

Avec cette approche on a le plus de probabilité de trouver des failles surprenantes.

## Méthodologies pentest

Il y a une seule méthodologie pour les tests d'intrusion

= 1
- Faux
- Juste

Au cours on en a vu au moins trois, mais presque chaque pentester développe sa propre stratégie.

## Étapes pentest

Lesquels de ces points font partie d'un test d'intrusion?

= 1
- Planification et préparation
- Evaluation du réseau
- Sécurisation du réseau
- Vente des failles découvertes sur le marché noir
- Installation des backdoors pour une utilisation après le test


## Pentest - planification

Qu'est-ce qui fait partie de la planification et de la préparation?

= 2
- Faire des recherches sur internet pour mieux connaître l'entreprise
- Rechercher quels outils informatiques sont utilisé dans l'entreprise
- Lancer un nmap envers le réseau en question
- Envoyer des email pour faire du phishing

## Pentest - évaluation

Dans la partie évaluation, on peut faire

= 2
- Lancer un nmap envers le réseau en question
- Envoyer des email pour faire du phishing
- Faire de recherches sur internet pour mieux connaître l'entreprise
- Rechercher quels outils informatiques sont utilisé dans l'entreprise

## Banner grabbing

Quel est le problème du "banner grabbing" en 2024?

= 1
- La plupart des "banner" ne contiennent plus la version du logiciel
- La plupart des logiciels ne retournent plus de "banner"
- La plupart des versions sont sécurisées et pas attaquables


## Shodan

Qu'est-ce que "Shodan"?

= 1
- Un service de recherche spécialisé pour les IoT
- Un email gratuit et qui protège la sphère privée
- Un outil qui attaque d'autres sites web

## Zombie

Qu'est-ce qui désigne le "zombie" dans le "idle port scanning"?

= 1
- Un ordinateur tierce répondant malgré lui à des SYN/ACK
- Un ordinateur tierce depuis lequel on lance un portscan
- Un ordinateur sur lequel on lance des processus "zombie"

Le zombie doit être un vieil ordinateur qui répond avec des IDs des
ACKs en incrément.

## KISS

Une des attaques dans un réseau informatique les plus simples à faire est

= 1
- Une attaque déni de service distribuée
- Envoyer un virus par mail à tous les employés d'une entreprise
- Eteindre le serveur d'une entreprise à distance

## Antivirus

Si on a un antivirus à jour il n'y a pas de danger de brancher une clé USB inconnue sur son
ordinateur.

= 1
- Faux
- Juste
