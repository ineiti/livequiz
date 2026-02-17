# HEIG-SRX-2024 Chapitre 3, partie 4

## ICMP

Lesquels de ces services peuvent utiliser ICMP?

= 2
- Ping
- Traceroute
- SSH
- Telnet

## Protocol DNS

Le service DNS utilise toujours le protocol UDP.

= 1
- Faux
- Juste

Si la requête est plus grand qu'un seul paquet, DNS change pour TCP. 
C'est le cas par exemple pour les requêtes DNSSEC et des zone transfers.

## Bloquer pour bloquer

Si on a un pare-feu avec une règle par défaut de tout interdire dans la chaîne d'entrée, pourquoi voudrait-on des
fois quand même ajouter une règle (conditionnelle) "tout bloquant" pour un service dans la chaîne d'entrée?

= 1
- Pour affiner une règle "tout autorisant"
- Pour éviter un contournement de la DMZ
- Pour être sûr que le paquet passe vraiment pas

## Bloquage par défaut

Pourquoi les routeurs FAI à la maison qui utilisent le IPv4 peuvent être considéré comme
"tout bloquant" vis-à-vis des ordinateurs dans leur LAN, même s'ils n'ont pas de règle par
défaut de tout bloquer?

= 1
- Parce que la plupart des routeurs à la maison utilisent des IPs privées qui ne peuvent pas être atteint depuis l'internet de toute façon
- Parce que le service de renseignement de la Suisse s'occupe de bloquer ces attaques
- Parce que les ordinateurs dans le LAN ne sont pas intéressant pour les hackers

La plupart des routeurs internet créent un réseau privé.
Ils ont donc besoin d'un service NAT (Network Address Translation).

## Vieu pare-feu

Pour un pare-feu "stateless" qui regarde seulement les paquets IP
(couche 2 TCP/IP), quels sont les champs à disposition?

= 2
- L'adresse IP d'origine
- L'adresse IP de destination
- Le port
- Le service utilisé (http, dns, ftp, smtp)

Vu que les paquets IP ont seulement les adresses IP de source et de destination, mais pas
le numéro de port, ce genre de pare-feu ne peut pas filtrer selon le port ou le service.

## Ordre des règles

Un pare-feu a une règle par défaut drop et les deux règles suivantes. Est-ce que l'ordre des règles est important?

1. bloquer tout ce qui vient des USAs
2. accepter les paquets entrants sur le port 25 du serveur courriel

= 1
- Vrai
- Faux

## Limite pare-feu

Pourquoi un pare-feu / proxy ne peut pas vérifier tout le trafic
du réseau s'il contient des virus?

= 1
- Parce que la plupart du trafic de nos jours est chiffré
- Parce que ça demanderait trop de puissance de CPU
- Parce que ce n'est pas nécessaire avec les antivirus actuels

Avec le trafic chiffré, un pare-feu ne peut pas inspecter les données qui se trouvent dans le
paquet. Donc il ne peut pas voir s'il y a un virus ou pas.

## Pare-feu dédié / pare-feu Linux

Quels sont les avantages d'un pare-feu dédié comparé 
avec un pare-feu basé sur Linux?

- Surface d'attaque réduite
- Performance souvent supérieure
- Flexibilité pour tout genre de services supplémentaires
- Meilleur marché

## Ordre du pare-feu

Un pare-feu doit toujours venir après le routeur.

= 1
- Faux
- Vrai

Selon l'architecture, si le pare-feu vient avant le routeur, il peut aussi protéger celui-ci.

## DMZ

La DMZ (zone démilitarisé) est utile

= 2
- parce que les serveurs sont plus exposés que les clients
- pour protéger les clients par une éventuelle attaque depuis les serveurs
- pour isoler les ordinateurs où on a trouvé un virus
- parce que ça empêche les clients d'attaquer les serveurs

Vu que seulement les serveurs reçoivent des requêtes depuis l'internet, ils sont beaucoup
plus exposés. Un attaquant va donc souvent se prendre d'abord aux serveurs. Avec la
DMZ, on complique la vie d'un attaquant qui a réussi à s'introduire dans un serveur et qui
veut maintenant attaquer les clients.

## End
