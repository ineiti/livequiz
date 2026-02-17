# HEIG-SRX-2024 Chapitre 3, partie 2

## Tableaux par défaut

Lesquels de ces tableaux existent par défaut dans iptables? 
Attention, il y a un piège!

= 5
- nat
- mangle
- filter
- route
- raw
- mac

On n'a pas vu le tableau "raw" dans les slides, mais il existe aussi...

## Action par défaut

iptables: avec quelle commande est-ce qu'on peut définir une action par défaut pour
interdire tout traffic du tableau nat en sortie?

= 1
- `iptables -t nat -P OUTPUT DROP`
- `iptables -t nat -P DROP OUTPUT`
- `iptables -t nat -I OUTPUT -j DROP`

## Pas d'entrée

iptables: comment on peut rejeter tous les paquets au niveau du tableau "filter" et la chaîne
"entrée".

= 1
- `iptables -I INPUT -j REJECT`
- `iptables -P INPUT REJECT`
- `iptables -t filter -P INPUT REJECT`
- Ce n'est pas possible

Si c'est vrai qu'on ne peut pas mettre une "default policy" de REJECT, on peut très bien
ajouter une règle au début d'une chaîne pour tout rejeter. Vu qu'il y a plusieurs tableaux
avec une chaîne "INPUT", le mieux est d'utiliser le premier tableau INPUT, "mangle".

## Trop simple qu'on oublie

Dans quelle chaîne dans l'image du "Jeoss Easy Firewall" manque un tableau?
Vous pouvez comparer avec le slide de la version complète.

= 1
- INPUT
- PREROUTING
- POSTROUTING
- OUTPUT

Le but de cet exercice est surtout de regarder le tableau complet et de suivre quelques
chemins dedans.

## Permettre telnet en sortie

Si on considère que la règle par défaut de toutes les chaînes du tableau "filter" est DROP,
qu'est-ce qu'il faut écrire pour permettre des requêtes 'telnet' sortant depuis l'ordinateur?

= 1
- `iptables -I OUTPUT -p tcp --dport 23 -j ACCEPT`
- `iptables -D OUTPUT -p tcp --dport 23 -j ACCEPT`
- `iptables -t nat -I OUTPUT -p tcp --dport 23 -j ACCEPT`

## Vraiment permettre telnet

Pour un serveur avec règle par défaut DENY pour toutes les chaînes du tableau filter, on
veut permettre le telnet depuis le serveur vers l'extérieur. On met la commande de la
question 5, mais ça ne marche pas. Pourquoi?

= 1
- Les paquets sortants passent, mais les paquets entrants sont bloqués
- Les paquets telnet sont dangereux et sont effacés sur internet
- C'est une erreur connue de iptables sous Linux

## Permettre l'utilisation de telnet

Pour la suite de la question 5, comment on peut permettre juste les paquets de réponse à
une session telnet d'entrer dans le serveur?

= 1
- `iptables -I INPUT -p tcp --sport 23 -j ACCEPT`
- `iptables -I INPUT -p udp --sport 23 -j ACCEPT`
- `iptables -I INPUT -p tcp --srcport 23 -j ACCEPT`
- `iptables -D INPUT -p tcp --sport 23 -j ACCEPT`

## Problème

Quel est le problème plus grave de la solution de la question 7?

= 1
- Un attaquant peut utiliser le port de source 23 pour essayer de scanner le reste du réseau
- On doit répéter cette configuration pour chaque service
- Un attaquant peut utiliser le port de destination 23 pour essayer de scanner le reste du réseau

## Plus simple, plus sécure

Toujours la question 5: comment faire pour que tous les paquets de réponse pour une
nouvelle connexion arrivent au serveur?
Répondez spécifiquement pour le telnet, avec la version de la commande la plus courte.

= 1
- `iptables -I INPUT -m conntrack ``--ctstate ESTABLISHED -j ACCEPT`
- `iptables -I INPUT -m conntrack ``--ctstate RELATED,ESTABLISHED -j ACCEPT`
- `iptables -I INPUT -m conntrack ``--ctstate RELATED -j ACCEPT`

Le `RELATED` est pour des protocols tels que ftp qui utilisent plus qu'un port.

## nftables 101

Pour nftables, donne la commande pour ajouter un tableau 'filter' à la famille 'ip'

= 1
- `nft add table ip filter`
- `nft add table -ip filter`
- `nft add ip table filter`
- `nft add filter table ip`

## nftables ignore

Avec nftables, comment est-ce qu'on ajoute une chaîne au tableau 'filter' qui ignore tous
les paquets par défaut?

= 1
- `nft 'add chain ip filter input ` `{ type filter hook input priority 0; policy drop;}'`
- `nft add chain ip filter input ` `{ type filter hook input priority 0; policy drop;}`
- `nft 'add chain filter input ` `{ type filter hook input priority 0; policy drop;}'`
- `nft 'add chain ip filter input ` `{ type filter hook input priority 0; policy reject;}'`

## nftables icmp

Toujours avec nftables: ajoutez une règle à la chaîne 'input' du tableau 'filter' qui laisse
passer tous les paquets icmp de n'importe quel type, et qui compte le nombre de paquets.

= 1
- `nft add rule filter input ip protocol icmp counter accept`
- `nft add rule filter input ip protocol icmp accept counter`
- `nft add filter rule input ip protocol icmp counter accept`
- `nft add filter rule input ip protocol icmp accept counter`

## nftables vs. iptables

Lesquels de ces réponses sont justes pour nftables mais pas pour iptables?

= 2
- L'implémentation dans le noyau Linux est fait par une machine virtuelle
- Pour de nouveaux modules, on n'a pas besoin de modifier le noyau Linux
- C'est la version plus vieille
- La plupart des commandes simples sont plus courtes
- On peut ajouter des nouveaux tableaux et des chaînes

Il y a une réponse piège: les deux permettent d'ajouter des nouveaux tableaux et
chaînes.
