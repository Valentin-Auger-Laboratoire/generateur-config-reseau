// Tests du moteur du générateur : node tests/test.js
const assert = require('assert');
const G = require('../generateur.js');
const codes = (r) => r.issues.map((i) => i.code);

// --- Cisco : site Paris du PoC, aucune erreur ---
const site = { router: 'R-Paris', switch: 'SW-Paris', trunkIf: 'Fa0/0', uplinkIf: 'Fa1/0', wanIf: 'Fa2/0', wanCidr: '10.0.1.1/24', dns: '172.16.20.10',
  vlans: [{ id: 10, name: 'USERS', cidr: '172.16.10.0/24', dhcp: true, ports: 'Fa1/1-8' }, { id: 20, name: 'SERVEURS', cidr: '172.16.20.0/24', ports: 'Fa1/9-10' }],
  ospf: { enabled: true, pid: 1, area: 0, rid: '1.1.1.1' }, ssh: { enabled: true, domain: 'paris.lab', user: 'admin' } };
let r = G.cisco(site);
assert.ok(r.ok);
assert.ok(r.router.includes('interface FastEthernet0/0.10\n description USERS\n encapsulation dot1Q 10\n ip address 172.16.10.1 255.255.255.0'));
assert.ok(r.router.includes(' network 172.16.10.0 0.0.0.255 area 0'));
assert.ok(r.router.includes('secret <MOT_DE_PASSE>'));
assert.ok(r.switch.includes('switchport trunk allowed vlan 10,20'));
assert.ok(r.switch.includes('interface range FastEthernet1/1 - 8'));

// --- Cisco : erreurs détectées ---
r = G.cisco({ ...site, vlans: [{ id: 10, name: 'A', cidr: '172.16.10.5/24', ports: 'Fa1/1' }, { id: 10, name: 'B', cidr: '10.9.0.0/24' },
  { id: 20, name: 'C', cidr: '10.0.1.128/25', ports: 'Fa1/0' }, { id: 1003, name: 'D', cidr: '1.0.0.0/8' }] });
assert.ok(!r.ok);
for (const c of ['notNetwork', 'vlanDup', 'portDup', 'vlanReserved', 'overlap']) assert.ok(codes(r).includes(c), c);

// --- VyOS : règle masquée, règle inutile, double ruleset, interface non filtrée ---
const fw = { stateful: true, ospf: { enabled: false },
  interfaces: [{ name: 'eth0', cidr: '203.0.113.2/30' }, { name: 'eth1', cidr: '192.168.50.1/24' }, { name: 'eth2', cidr: '10.0.0.1/24' }],
  rulesets: [{ name: 'WAN-IN', def: 'drop', iface: 'eth0' }, { name: 'WAN-OUT', def: 'accept', iface: 'eth0' }],
  rules: [
    { set: 'WAN-IN', n: 10, action: 'accept', proto: 'tcp', dst: '192.168.50.10', port: '80,443' },
    { set: 'WAN-IN', n: 20, action: 'drop', proto: 'tcp', src: '198.51.100.0/24', dst: '192.168.50.10', port: '443' },
    { set: 'WAN-IN', n: 30, action: 'accept', proto: 'tcp', dst: '192.168.50.0/24', port: '1-65535' },
    { set: 'WAN-IN', n: 40, action: 'accept', proto: 'tcp', dst: '192.168.50.20', port: '22' }] };
r = G.vyos(fw);
assert.ok(r.ok);
const iss = r.issues.map((i) => i.code + (i.p.r ? ':' + i.p.r : '') + (i.p.v ? ':' + i.p.v : ''));
for (const c of ['vyShadow:20', 'vyRedundant:40', 'vyBindDup:eth0', 'vyNoFilter:eth1', 'vyNoFilter:eth2']) assert.ok(iss.includes(c), c);
assert.ok(r.text.includes("set firewall ipv4 name WAN-IN rule 10 destination port 80,443"));
assert.ok(r.text.includes('set firewall ipv4 forward filter rule 10 jump-target WAN-IN'));

// --- VyOS : port sans protocole tcp/udp = erreur ---
r = G.vyos({ ...fw, rules: [{ set: 'WAN-IN', n: 10, action: 'accept', proto: 'icmp', port: '22' }] });
assert.ok(codes(r).includes('vyPortProto'));

console.log('OK : tous les tests passent');
