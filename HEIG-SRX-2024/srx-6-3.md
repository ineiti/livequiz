; Journée 3
; 4d) IPSec vocabulaire
## IPSec terminologie - SA

Qu'est-ce qu'une SA ?

= 1
- Une connexion physique entre deux hôtes.
- Une connexion virtuelle avec quelques paramètres : type de protection, algorithmes clés, etc.
- Un type de base de données pour stocker les politiques de sécurité.

## IPSec terminologie - AH

Qu'est-ce que l'AH ?
- Un identificateur unique pour sélectionner la SA correcte.
- Une connexion virtuelle avec quelques paramètres : type de protection, algorithmes clés, etc.
- Une en-tête utilisé pour vérifier l'authenticité et l'intégrité d'un paquet.

; 4e) L2TP et PPTP
## Sécurité PPTP - A VéRIFIER

Quels sont les problèmes de sécurité liés au PPTP ?

= 3
- Utilisation de RC4 sans vérification : bitflips possibles
- MSCHAP-v1 permet de retrouver le hash du mot de passe
- MSCHAP-v2 nécessite 23 heures pour extraire la clé MPPE
- Le protocole utilise le port 1701

## L2TP - A VéRIFIER

Quelles sont les caractéristiques de L2TP ?

- Utilise UDP sur le port 1701 pour un canal de contrôle et un canal de données
- Canal de contrôle chiffré obligatoire
- Peut transporter des paquets IP, PPP ou autres
- Peut utiliser IPSec en mode tunnel

; 5a) Zero Trust
## Zero Trust - authentifié I

Qu'est-ce qui est authentifié dans le Zero Trust ?

= 3
- L'utilisateur
- L'appareil (laptop, smartphone)
- L'application qui utilise le réseau

## Zero Trust - authentifié II

Quel est le principe de base de l'authentification Zero Trust ?

= 1
- Les appareils sont autorisés en fonction de leur état et de l'identité de l'utilisateur
- Tous les utilisateurs ont accès au même niveau de réseau
- L'autorisation se fait uniquement par le rôle des utilisateurs dans l'entreprise

; 5b) MPLS & SD-WAN
## MPLS??

Qu'est-ce que MPLS ?

= 1
- Une méthode de routage qui utilise des étiquettes au niveau des paquets
- Une méthode de routage qui utilise des adresses IP
- Une méthode de routage qui utilise des noms de domaine

## SD-WAN? - A VéRIFIER

Qu'est-ce qui est juste pour un SD-WAN ?

= 3
- C'est une connexion spécialisée seulement disponible avec certains FAIs.
- Ca permet une coommunication entre les succursales sans passer par le bureau principal
- Ca permet d'intégrer les services cloud d'une façon plus optimal qu'avec un VPN.
- On a besoin du matériel spécialisé.

; 5c) SCiON
## SCiON?

Quelles sont les caractéristiques de SCiON?

= 3
- Remplace le Border Gateway Protocol (BGP)
- Augmente le TCP/IP
- Contient les fonctionnalités des VPNs et SD-WAN
- Développé par Microsoft

## Rôle ISD core dans SCiON - A VéRIFIER

Quel est le rôle du ISD core dans SCiON?

- Il agit comme un routeur principal
- Il définit les règles de routage pour l'ensemble du réseau
- Il sert de centre de contrôle pour les attaques DDoS
- Il définit la Trust Root Configuration (TRC)
- Il agit comme une autorité de certification (CA) pour les certificats TLS

; 6) Attaques