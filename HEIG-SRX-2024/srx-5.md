# HEIG-SRX-2024 Chapitre 5

## Désavantages DHCP statique

Quel sont les problèmes si on distribue des adresses statiques par DHCP pour avoir
plusieurs groupes par bâtiment / switch?

= 2
- C'est laborieux de garder à jour les MACs / IPs
- C'est facile à contourner et se trouver dans un autre réseau
- On peut facilement être à court d'adresses IPs
- Ca ne marche pas avec IPv6

## Des routeurs partout

Dans quels cas est-ce que l'installation d'un routeur dans chaque bâtiment fait du sens?

= 2
- Si l'argent n'est pas un problème
- Si le routeur contient assez de ports pour servir toutes les machines
- Si les routeurs ont un pare-feu intégré
- Si on veut faciliter les tableaux de routage

## VLAN connection entre switchs

Comment est-ce qu'on appelle la connexion entre deux switchs qui porte tous les VLANs?

~ s/ //g
- /^(Trunk|trunk)$/

## Port-based VLAN

Quels sont les désavantages d'un port-based VLAN?

= 2
- On ne réduit pas le nombre de câbles entre les switchs
- C'est compliqué d'ajouter un nouveau VLAN
- On ne peut pas faire plus de 2 VLANs par switch
- C'est plus lent qu'un tagged VLAN

## VIDs CISCO

Combien de VIDs sont utilisables pour des clients sur un switch CISCO sans problèmes?

~ s/ //g
- /^4093$/

Les IDs 0 et 4095 sont réservés. L'ID 1 est utilisé par défaut, donc il faut faire attention voir les attaques.

## Questions sur le trunking

Lesquels de ces points sont corrects?

= 2
- Un port "Trunk" contient des paquets avec les VIDs
- Un paquet dans un port "Untagged" ne porte pas d'information VLAN
- Seulement deux ports non-Trunk peuvent communiquer ensemble
- Les VLANs avec différents IDs ne peuvent jamais communiquer directement

## Attaque "Double Tagging"

Lesquels des attaques sont possibles avec un "Double tagging"?

= 1
- Procéder à un DoS
- Utiliser une reverse shell
- Faire un port scanning
- Envoyer un message phishing

## Éviter le "Switch Spoofing"

Quelle est la commande pour un routeur CISCO pour éviter un "Switch spoofing"?

~ s/ +/ /g
- /switchport mode access/

##