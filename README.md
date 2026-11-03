# Générateur de configuration Cisco et VyOS

🇫🇷 [Français](#français) · 🇬🇧 [English](#english)

**Essayer l'outil :** https://valentin-auger-laboratoire.github.io/portfolio/outils/generateur-config/

---

## Français

### Ce que fait l'outil
Outil web (HTML / CSS / JavaScript pur) qui écrit la configuration d'équipements réseau à partir d'une description, **après avoir vérifié les données**.

**Site Cisco (routeur + switch)**
- Routeur en **router-on-a-stick** : sous-interfaces 802.1Q, passerelle = 1ʳᵉ adresse de chaque VLAN, lien WAN.
- **DHCP** par VLAN (adresse de la passerelle exclue, DNS facultatif).
- **OSPF** : annonce des VLAN et du lien WAN, `passive-interface default` sauf sur le WAN.
- **SSH v2** uniquement sur les lignes VTY (pas de Telnet).
- Switch d'accès : VLAN, trunk vers le routeur (VLAN autorisés), ports d'accès (`Fa0/1-10`, `Gi0/1`…), PortFast.
- Vérifications : noms d'hôte, VLAN invalides, réservés (1002–1005) ou en double, réseaux qui ne commencent pas à l'adresse de réseau, **chevauchements d'adresses**, **ports attribués deux fois**, router-ID, etc.

**Pare-feu VyOS**
- Interfaces, rulesets par zone (action par défaut), règles (protocole, source, destination, ports), application par le **forward filter** selon l'interface d'entrée, pare-feu **stateful**, OSPF aire 0 en option. Syntaxe VyOS 1.4 / rolling (`set firewall ipv4 name …`).
- **Analyse des règles** :
  - règle **jamais atteinte** car une règle précédente couvre déjà tout son trafic (action inverse = règle masquée, même action = règle inutile) ;
  - **deux rulesets sur la même interface** : le second n'est jamais atteint ;
  - **interface non filtrée** (aucun ruleset en entrée) ;
  - action par défaut `accept`, règle qui accepte tout, port demandé sans protocole tcp/udp.

**Exemples intégrés** : site Paris et pare-feu du [PoC réseau de téléradiologie](https://github.com/Valentin-Auger-Laboratoire/poc-reseau-teleradiologie). L'exemple « Annexe d'origine » remet la règle 40 de l'annexe du rapport : l'outil signale qu'elle fait doublon avec la règle 10 (même interface eth4), comme documenté dans le README du PoC.

**Aucun mot de passe** n'est saisi ni généré : la configuration contient un marqueur `<MOT_DE_PASSE>` à remplacer sur l'équipement.

### Fichiers
| Fichier | Rôle |
|---|---|
| `generateur.js` | Moteur : vérifications, analyse des règles, génération du texte (testable avec Node) |
| `index.html` | Interface, bilingue FR / EN |
| `tests/test.js` | Tests du moteur |

### Lancer les tests
```bash
node tests/test.js
```

### Limites
- Les configurations générées **n'ont pas été appliquées sur un équipement réel** : à relire avant usage.
- Un seul lien WAN par routeur ; pas de NAT, d'ACL Cisco ni de VPN.
- L'analyse VyOS compare les règles deux à deux (une règle masquée par la **combinaison** de plusieurs règles n'est pas détectée).

---

## English

### What the tool does
Web tool (plain HTML / CSS / JavaScript) that writes network device configurations from a description, **after checking the data**.

**Cisco site (router + switch)**
- **Router-on-a-stick** router: 802.1Q sub-interfaces, gateway = first address of each VLAN, WAN link.
- Per-VLAN **DHCP** (gateway address excluded, optional DNS).
- **OSPF**: VLANs and WAN link advertised, `passive-interface default` except on the WAN.
- **SSH v2** only on VTY lines (no Telnet).
- Access switch: VLANs, trunk to the router (allowed VLANs), access ports (`Fa0/1-10`, `Gi0/1`…), PortFast.
- Checks: hostnames, invalid, reserved (1002–1005) or duplicate VLANs, networks not starting at the network address, **overlapping addresses**, **ports assigned twice**, router ID, etc.

**VyOS firewall**
- Interfaces, per-zone rulesets (default action), rules (protocol, source, destination, ports), applied through the **forward filter** by inbound interface, **stateful** firewall, optional OSPF area 0. VyOS 1.4 / rolling syntax (`set firewall ipv4 name …`).
- **Rule analysis**:
  - rule **never reached** because an earlier rule already covers all its traffic (opposite action = shadowed rule, same action = useless rule);
  - **two rulesets on the same interface**: the second is never reached;
  - **unfiltered interface** (no inbound ruleset);
  - `accept` default action, accept-all rule, port without tcp/udp protocol.

**Built-in examples**: Paris site and firewall of the [teleradiology network PoC](https://github.com/Valentin-Auger-Laboratoire/poc-reseau-teleradiologie). The "Original appendix" example restores rule 40 from the report appendix: the tool flags it as a duplicate of rule 10 (same interface eth4), as documented in the PoC README.

**No password** is entered or generated: the configuration contains a `<MOT_DE_PASSE>` (password) placeholder to replace on the device.

### Files
| File | Purpose |
|---|---|
| `generateur.js` | Engine: checks, rule analysis, text generation (testable with Node) |
| `index.html` | User interface, bilingual FR / EN |
| `tests/test.js` | Engine tests |

### Run the tests
```bash
node tests/test.js
```

### Limitations
- The generated configurations **have not been applied to real equipment**: review them before use.
- One WAN link per router; no NAT, Cisco ACLs or VPN.
- The VyOS analysis compares rules pairwise (a rule shadowed by a **combination** of several rules is not detected).
