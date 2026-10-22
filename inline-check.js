
(() => {
'use strict';

/* ================= utilitaires ================= */
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => Array.from(e.querySelectorAll(s));
const pad = n => String(n).padStart(3, '0');
function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function hs(hex, d){
  const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;
  if(mx!==mn){const dd=mx-mn;s=l>.5?dd/(2-mx-mn):dd/(mx+mn);h=mx===r?(g-b)/dd+(g<b?6:0):mx===g?(b-r)/dd+2:(r-g)/dd+4;h/=6;}
  h=(((h*360+d)%360)+360)%360/360;
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  const t=x=>{x=(x%1+1)%1;return x<1/6?p+(q-p)*6*x:x<1/2?q:x<2/3?p+(q-p)*(2/3-x)*6:p};
  const c=s===0?[l,l,l]:[t(h+1/3),t(h),t(h-1/3)];
  return '#'+c.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
}
const f1 = n => Math.round(n*10)/10;
const star = (x,y,s,fill,op) => `<path d="M${x} ${f1(y-s)}Q${x} ${y} ${f1(x+s)} ${y}Q${x} ${y} ${x} ${f1(y+s)}Q${x} ${y} ${f1(x-s)} ${y}Q${x} ${y} ${x} ${f1(y-s)}Z" fill="${fill}" opacity="${op}"/>`;

/* ================= données du jeu ================= */
const ELS = ['feu','eau','plante','foudre','ombre','lumiere'];
const EL = {
  feu:    {n:'Feu',     c1:'#ff9a62',c2:'#6b1233',body:['#ffc27a','#ff7a45'],belly:'#ffe9b8',glow:'#ffd27a',ink:'#3d0f1f',ec:'#ff8a5b'},
  eau:    {n:'Eau',     c1:'#7fe0ff',c2:'#0f3478',body:['#a6edff','#3fa7ff'],belly:'#e6fbff',glow:'#9be7ff',ink:'#0c2450',ec:'#5cc8ff'},
  plante: {n:'Plante',  c1:'#9be88f',c2:'#0f4a3a',body:['#d4f59a','#59c86a'],belly:'#f6ffd6',glow:'#c9f08f',ink:'#0e3326',ec:'#7fe08a'},
  foudre: {n:'Foudre',  c1:'#ffe36a',c2:'#43257a',body:['#fff3a6','#ffc933'],belly:'#fffbe0',glow:'#fff08a',ink:'#33195f',ec:'#ffd84d'},
  ombre:  {n:'Ombre',   c1:'#a58bff',c2:'#150a33',body:['#b9a6ff','#6a4fd6'],belly:'#e1d8ff',glow:'#c0a8ff',ink:'#150a33',ec:'#a58bff'},
  lumiere:{n:'Lumière', c1:'#ffe0f3',c2:'#6f8cff',body:['#ffffff','#ffc2e6'],belly:'#fff6fb',glow:'#ffffff',ink:'#3a2a6a',ec:'#ffb6e0'}
};
const NAMES = {
  feu:['Braisillon','Cendrelin','Flammèche','Pyrolo','Tisonnet','Brasero','Volcanelle','Étincelle','Magmuse','Charbonne','Soufflon','Ignivore','Cratérin','Rougeoie','Fumerolle','Torchon','Embraline','Phénixelle','Solfatare','Draconflamme','Fournaison','Cœurlave','Braiseclipse','Volcanova','Astrabraise'],
  eau:['Gouttelin','Ruisselle','Bullo','Écumeur','Perlette','Vaguelet','Tourbillo','Algueron','Brumelin','Cascadin','Maréon','Glaçon','Lagunelle','Méduselle','Tritonin','Banquise','Corallin','Naïadelle','Abyssor','Léviathon','Nébuleau','Sirénova','Glacélune','Marétoile','Océanox'],
  plante:['Pousson','Brindille','Mousselin','Trèflot','Bourgeon','Lianelle','Sapinou','Champignol','Ronceline','Pâquerine','Nénuphlo','Fougeron','Glandou','Bambouli','Orchidine','Racinelle','Sylvanor','Chênelle','Pollenix','Yggdrasilou','Florétoile','Roncélia','Mousselune','Sylvaphée','Astrarbre'],
  foudre:['Étincello','Voltigeon','Statik','Fulgur','Grésillon','Tonnelet','Éclairon','Ampèrin','Zapette','Orageon','Électrine','Plasmie','Dynamo','Foudroyon','Kilovolt','Nimbus','Tonnerrion','Magnétix','Zéphyron','Thundra','Orageclipse','Voltalis','Fulgurine','Nimbéclair','Cosmovolt'],
  ombre:['Ombrelin','Noctule','Moirette','Spectrelle','Fantomin','Brumombre','Chauvelune','Hibulune','Sombrelle','Ténébrion','Corbelune','Mirage','Éclipsion','Veilleuse','Cauchemarin','Minuiton','Revenantin','Noirceline','Abîmor','Néantor','Lunombre','Voilex','Éclipsombre','Noxétoile','Obscuriel'],
  lumiere:['Lumiolo','Aurélin','Scintille','Halonie','Rayonnelle','Astrelle','Cométin','Prismelle','Opaline','Aubette','Lucioline','Séraphin','Nacrelle','Stellaire','Soleilou','Auréolia','Célestin','Irisette','Zénithor','Solarion','Aurétoile','Prismalune','Célestine','Lumivale','Astrelux']
};

// 100 nouvelles cartes originales, ambiance anime fantasy (personnages inédits).
const EXTRA_NAMES = {
feu:['Kaïro Flammevive','Mika Brasier','Ren du Soleil Rouge','Akio Cœur-Lave','Sora Pyroclaste','Yuna Étincœur','Takeshi Forgefeu','Riku Flamme-d’Aube','Hikari Cendre-d’Or','Néo Salamandre','Ayame Fournaise','Kenta Braise-Noire','Mio Danseflamme','Daï Renard-Rouge','Eiji Épée-Solaire','Shin Volcan-Céleste'],
eau:['Aomi Lame-de-Pluie','Kai Marée-Bleue','Nami Perle d’Azur','Rei Courant-Serein','Yori Dragon des Brumes','Mizuki Onde-Lunaire','Haruto Givreclair','Saya Écume-d’Argent','Toma Trident d’Abysse','Rin Danse-des-Vagues','Itsuki Lac-Miroir','Kohana Sirène d’Étoile','Jun Tempête-Calme','Airi Cristal-de-Glace','Nori Gardien des Marées','Fuyu Neige-Bleue'],
plante:['Hana Lame-de-Lierre','Mori Gardien Sylvestre','Aki Fleur-d’Aube','Kiri Ronces d’Émeraude','Tsubasa Aile-de-Cèdre','Yume Pétale-Rêve','Daichi Cœur-de-Chêne','Hotaru Luciole-Verte','Suzu Clochette-des-Bois','Kaede Épine-Royale','Renji Racine-Ancienne','Midori Danse-des-Feuilles','Kaya Lotus-Serein','Itsumi Druidesse d’Opale','Natsu Cerf-de-Mousse','Shiori Fleur-de-Lune','Roku Tronc-Étoilé'],
foudre:['Raï Lame-Éclair','Denki Faucon-d’Orage','Kaminari Éclat-Vif','Raiha Voltigeuse','Isamu Tonnerre-Bleu','Kira Arc-Céleste','Tetsu Poing-de-Foudre','Mina Étincelle-Rose','Hayate Pas-de-Foudre','Rento Cœur-Tempête','Yuki Éclair-Blanc','Akira Volt-Spectre','Sena Orage-d’Été','Goro Marteau-Tonnerre','Niko Comète-Électrique','Raiyo Dragon-Volt','Mitsu Flash-Lunaire'],
ombre:['Yoru Masque-de-Lune','Kage Lame-Silencieuse','Rin Ombre-d’Opale','Akuma Veilleur-Nocturne','Shizuku Brume-Fantôme','Kuro Renard-Obscur','Reika Éclipse-Violette','Zetsu Corbeau-Miroir','Nox Marcheur-des-Rêves','Saya Voile-Noir','Itsu Fauche-Lueur','Mugen Porte-du-Néant','Kiri Danse-Ombre','Ryo Spectre-Étoilé','Tsuki Lune-Fendue','Enma Gardien-du-Seuil','Azael Ombre-Céleste'],
lumiere:['Hikari Épée-d’Aurore','Akari Cœur-d’Étoile','Sora Aile-de-Lumière','Mei Halo-Doré','Astra Gardienne-Solaire','Yua Rayon-Serein','Kōsei Chevalier-d’Aube','Nozomi Plume-d’Argent','Ema Flèche-Céleste','Tenshi Lotus-Lumineux','Runa Éclat-de-Lune','Seiji Lance-Sacrée','Mira Cristal-d’Aube','Kohana Étoile-Vivante','Arata Soleil-Secret','Yori Halo-Azur','Lumi Gardienne-des-Cieux']
};
Object.keys(EXTRA_NAMES).forEach(el=>NAMES[el].push(...EXTRA_NAMES[el]));

const FLAVOR = {
  feu:['Dort au creux des volcans éteints.','Réchauffe les mains de ceux qui l’approchent.','Laisse une traînée de braises derrière lui.','Adore les nuits d’hiver et les feux de camp.'],
  eau:['Chante près des ruisseaux au lever du jour.','Se cache dans la première goutte de pluie.','Suit les marées depuis la nuit des temps.','Fait des bulles quand il est content.'],
  plante:['Fleurit un peu plus à chaque câlin.','Pousse mieux quand on lui parle doucement.','Garde une graine secrète sous sa feuille.','Dort sur la mousse, toujours au même endroit.'],
  foudre:['Grésille de joie à chaque orage.','Ne tient pas en place plus de trois secondes.','Fait sauter les lumières quand il rit.','Court plus vite que son propre éclair.'],
  ombre:['Veille sur les rêves des petits.','Se glisse là où la lune ne va pas.','A peur du noir, ce qui est assez gênant.','Collectionne les secrets chuchotés la nuit.'],
  lumiere:['Brille un peu plus fort quand on l’écoute.','Peint des arcs-en-ciel au réveil.','Garde un éclat d’étoile dans sa poche.','Éclaire le chemin des voyageurs perdus.']
};
const RAR = [
  {k:'C', n:'Commune',    dust:5,   atk:[20,45]},
  {k:'R', n:'Rare',       dust:15,  atk:[40,65]},
  {k:'SR',n:'Super Rare', dust:40,  atk:[60,85]},
  {k:'UR',n:'Épique', dust:100, atk:[80,105]},
  {k:'LR',n:'Légendaire', dust:250, atk:[100,130]},
  {k:'S', n:'Secrète',    dust:600, atk:[130,160]}
];
const RCOL = ['#c4cbee','#8fd3ff','#d5b5ff','#ffa6cf','#ffd966','#ffffff'];
function rankAt(el,i){
  const sec = el==='ombre'||el==='lumiere';
  if(i<8) return 0; if(i<13) return 1; if(i<16) return 2; if(i<18) return 3;
  if(i===18) return sec?4:2; if(i===19) return sec?5:4;
  if(i<25) return i===23?3:4;
  const j=i-25; if(j%17===16) return sec?5:4; if(j%17===15) return 4; if(j%17>=12) return 3; if(j%17>=8) return 2; if(j%17>=4) return 1; return 0;
}
const CARDS = [];
ELS.forEach(el => NAMES[el].forEach((name,i) => {
  const id = CARDS.length+1, rank = rankAt(el,i), seed = id*7919+13, r = mulberry32(seed+1);
  const [a,b] = RAR[rank].atk;
  const atk = a + Math.round(r()*(b-a)/5)*5;
  const pv = Math.round(atk*(1.5+r()*.8)/5)*5;
  CARDS.push({id,el,name,rank,seed,atk,pv,flavor:FLAVOR[el][id%4]});
}));
const NORMAL_CARD_COUNT = CARDS.length;
const EVENT_NAMES = [
'Orbres d’Aurore','Petit Comète','Luciolle Lunaire','Nuage d’Argent','Gardien du Zénith','Mousse Stellaire','Renard des Brumes','Chat des Constellations','Lapin de Saturne','Méduse Astrale','Renard Boréal','Colibri Cosmique','Baleine des Nuages','Dragon de Orbres','Loup d’Éclipse','Papillon Solaire','Cerf de Cristal','Renarde des Pléiades','Hibou du Vide','Serpent d’Aurore','Gardienne des Marées','Petit Trou Noir','Étoile Vagabonde','Chouette d’Orion','Licorne de Néon','Golem de Lune','Phénix d’Argent','Cygne Galactique','Renard d’Opale','Dragon des Anneaux','Séléné, danseuse des astres','Astra, veilleuse céleste','Nova, cœur solaire','Orion, roi des étoiles','Lyra, reine des comètes','Éclipse, gardien du seuil','Nébula, esprit des galaxies','Astre-Primordial','Couronne de l’Infini','Secret de l’Éclipse'
];
const EVENT_RANKS = [...Array(35).fill(0).map((_,i)=>i<10?0:i<20?1:i<28?2:3),4,4,4,4,5];
const EVENT_ELEMENTS = ['lumiere','ombre','foudre','eau','plante'];
const EVENT_CARDS = EVENT_NAMES.map((name,i)=>{const id=NORMAL_CARD_COUNT+i+1,rank=EVENT_RANKS[i],el=EVENT_ELEMENTS[i%EVENT_ELEMENTS.length],seed=id*7919+991;const r=mulberry32(seed+1),[a,b]=RAR[rank].atk;const atk=a+Math.round(r()*(b-a)/5)*5;return {id,el,name,rank,seed,atk,pv:Math.round(atk*(1.6+r()*.7)/5)*5,flavor:'Une créature rare née pendant la Pluie d’étoiles.',event:true,mutation:'night'};});
CARDS.push(...EVENT_CARDS);
// Noms de modèles de véhicules réels pour toute la collection. Les suffixes distinguent les cartes quand le catalogue dépasse la liste de modèles.
const REAL_VEHICLE_NAMES = [
'Toyota Supra','Toyota GR Yaris','Toyota Corolla','Toyota Yaris','Toyota Land Cruiser','Toyota Prius','Honda Civic Type R','Honda NSX','Honda S2000','Honda Integra Type R','Nissan GT-R R35','Nissan Skyline GT-R R34','Nissan Silvia S15','Nissan 370Z','Nissan 350Z','Mazda RX-7 FD','Mazda MX-5 Miata','Mazda RX-8','Subaru Impreza WRX STI','Subaru BRZ','Mitsubishi Lancer Evolution IX','Mitsubishi 3000GT','Mitsubishi Eclipse','Lexus LFA','Lexus LC 500','Acura NSX','Hyundai i30 N','Hyundai Ioniq 5 N','Kia Stinger GT','Genesis G70','Ford Mustang GT','Ford Mustang Shelby GT500','Ford Focus RS','Ford GT','Ford Fiesta ST','Chevrolet Corvette C8','Chevrolet Camaro ZL1','Chevrolet Camaro SS','Chevrolet Camaro IROC-Z','Dodge Challenger SRT Hellcat','Dodge Charger Daytona','Dodge Viper GTS','Chrysler 300 SRT','Jeep Wrangler Rubicon','Jeep Grand Cherokee Trackhawk','Cadillac CT5-V Blackwing','Tesla Model S Plaid','Tesla Model 3 Performance','Rivian R1T','Volkswagen Golf GTI','Volkswagen Golf R','Volkswagen Scirocco R','Volkswagen Beetle','Audi R8 V10','Audi RS3','Audi RS6 Avant','Audi Quattro','BMW M3 G80','BMW M5 CS','BMW M2','BMW M4 CSL','BMW i8','BMW Z4 M40i','Mercedes-AMG GT R','Mercedes-Benz 190E Evo II','Mercedes-AMG C 63 S','Mercedes-Benz SLS AMG','Mercedes-Benz 300 SL','Porsche 911 GT3 RS','Porsche 911 Turbo S','Porsche 918 Spyder','Porsche Cayman GT4','Porsche Taycan Turbo S','Porsche Carrera GT','Ferrari F40','Ferrari F8 Tributo','Ferrari 488 Pista','Ferrari 812 Superfast','Ferrari SF90 Stradale','Ferrari LaFerrari','Lamborghini Aventador SVJ','Lamborghini Huracán STO','Lamborghini Revuelto','Lamborghini Gallardo','Lamborghini Countach','McLaren 720S','McLaren P1','McLaren Senna','McLaren Artura','Bugatti Chiron Super Sport','Bugatti Veyron','Bugatti Divo','Pagani Huayra','Pagani Zonda F','Koenigsegg Jesko','Koenigsegg Agera RS','Koenigsegg Regera','Aston Martin Valkyrie','Aston Martin Vantage','Aston Martin DB11','Jaguar F-Type R','Jaguar XJ220','Lotus Emira','Lotus Elise','Alpine A110','Renault Clio V6','Renault Mégane RS Trophy','Peugeot 205 GTI','Peugeot 308 GTi','Citroën DS3 Racing','Volkswagen ID. Buzz','Mini Cooper S','Fiat 500 Abarth','Alfa Romeo Giulia Quadrifoglio','Maserati MC20','Maserati GranTurismo','Volvo V60 Polestar','Polestar 2','Skoda Octavia RS','Dacia Duster','Range Rover Sport SV','Land Rover Defender','Rolls-Royce Wraith','Bentley Continental GT','Caterham Seven 620R','Morgan Plus Six','Dallara Stradale','BAC Mono','Ariel Atom 4','KTM X-Bow GT-XR','Yamaha YZF-R1','Kawasaki Ninja ZX-10R','Ducati Panigale V4','BMW S 1000 RR','Honda CBR1000RR-R','Suzuki Hayabusa','Vespa GTS 300','Piaggio MP3 500','BMW CE 04','Segway Ninebot MAX G2','Porsche 919 Hybrid','Toyota TS050 Hybrid','Audi R18 e-tron quattro','Peugeot 9X8','Cadillac V-Series.R','Red Bull RB19','Ferrari SF-24','Mercedes-AMG F1 W15','Airbus A320neo','Boeing 737 MAX 8','Cessna 172 Skyhawk','Piper PA-28 Cherokee','Bell 407','Airbus H125','Sikorsky S-76'
];
CARDS.forEach((c,i)=>{const base=REAL_VEHICLE_NAMES[i%REAL_VEHICLE_NAMES.length];const edition=Math.floor(i/REAL_VEHICLE_NAMES.length);c.name=edition?`${base} · Série ${edition+1}`:base;});
// Booster spécial « Apex » : 50 nouvelles cartes inédites.
const APEX_NAMES = ['Koenigsegg Jesko Absolut','Bugatti Bolide','Pagani Huayra R','McLaren Senna GTR','Ferrari SF90 XX','Lamborghini Revuelto','Porsche Mission X','Aston Martin Valkyrie','Rimac Nevera R','Lotus Evija','Hennessey Venom F5','Czinger 21C','Gordon Murray T.50','Mercedes-AMG One','BMW XM Label Red','Audi RS e-tron GT','Polestar 6','Lucid Air Sapphire','Alpine A110 R','Renault 5 Turbo 3E','Peugeot 9X8','Toyota GR010 Hybrid','Cadillac V-Series.R','Porsche 963','Ferrari 499P','McLaren Artura','Maserati MC20 Cielo','Bentley Continental GT Speed','Rolls-Royce Spectre','Lexus LBX Morizo RR','Nissan Z Nismo','Honda Civic Type R FL5','Subaru WRX STI S209','Mitsubishi Lancer Evo X Final','Ford Mustang Dark Horse','Chevrolet Corvette ZR1','Dodge Charger Daytona EV','Ducati Panigale V4 R','Kawasaki Ninja H2R','Yamaha YZF-R1M','BMW M 1000 RR','Aprilia RSV4 Factory','KTM 1390 Super Duke R','Triumph Speed Triple 1200 RS','MV Agusta Superveloce 1000','Honda CBR1000RR-R','Suzuki Hayabusa','Kawasaki Z H2','Ducati Streetfighter V4 SP2','Yamaha R1 GYTR'];
const APEX_START_ID = CARDS.length+1;
APEX_NAMES.forEach((name,i)=>{const id=CARDS.length+1,rank=i<18?4:i<35?3:i<45?2:1,el=ELS[i%ELS.length],seed=id*7919+7123,r=mulberry32(seed+1),[a,b]=RAR[rank].atk;const atk=a+Math.round(r()*(b-a)/5)*5;CARDS.push({id,el,name,rank,seed,atk,pv:Math.round(atk*(1.6+r()*.7)/5)*5,flavor:'Une machine d’exception de la série Apex.',apex:true});});
const APEX_CARDS = CARDS.filter(c=>c.apex);
// Extension de 500 cartes de véhicules distinctes pour les boosters classiques.
const EXTRA_VEHICLE_BASES = [
 'Toyota GR86','Nissan Z','Honda Prelude','Mazda 3 Turbo','Subaru Levorg','Mitsubishi Pajero Evolution','Lexus IS 500','Infiniti Q60 Red Sport','Acura Integra Type S','Hyundai Elantra N','Kia EV6 GT','Genesis G80 Sport','Ford Escort RS Cosworth','Ford Falcon GT','Chevrolet SS','Pontiac GTO','Buick GNX','GMC Syclone','Ram TRX','Jeep Trackhawk','Volkswagen Passat R36','Audi RS4 Avant','Audi TT RS','BMW 1M Coupe','BMW 850CSi','Mercedes-Benz CLK GTR','Mercedes-AMG A45 S','Porsche 944 Turbo','Porsche 959','Porsche 718 Spyder RS','Ferrari 360 Challenge Stradale','Ferrari 599 GTO','Lamborghini Murciélago SV','Lamborghini Diablo GT','McLaren F1','McLaren 675LT','Bugatti EB110','Pagani Zonda Cinque','Koenigsegg CCX','Aston Martin DBS Superleggera','Jaguar XKR-S','Lotus Exige Cup 430','Alpine A110 S','Renault 5 Alpine Turbo','Peugeot 406 Coupé','Citroën C6','Mini John Cooper Works GP','Fiat Coupé 20V Turbo','Alfa Romeo 4C','Maserati GranSport','Polestar 1','Volvo 850 R','Saab 9-3 Viggen','Skoda Fabia RS','Cupra Formentor VZ5','SEAT Leon Cupra R','Dodge Neon SRT-4','Chrysler Crossfire SRT-6','Shelby Cobra 427','Saleen S7','SSC Tuatara','Rimac Nevera','Pininfarina Battista','De Tomaso Pantera','TVR Sagaris','Noble M600','Spyker C8','Wiesmann GT MF5','Donkervoort D8 GTO','Radical SR3','Ligier JS P4','Morgan Aero 8','Abarth 124 Spider','Toyota Celica GT-Four','Nissan Pulsar GTI-R','Honda CRX SiR','Mazda Familia GT-R','Subaru SVX','Mitsubishi Starion','Lexus GS F','Infiniti G35 Coupe','Acura TL Type S','Hyundai Genesis Coupe','Kia ProCeed GT','Ford Puma ST','Chevrolet SS Sedan','Cadillac CTS-V Wagon','Tesla Roadster','Volkswagen Phaeton W12','Audi S8 Plus','BMW Alpina B7','Mercedes-Benz E 63 AMG','Porsche Panamera Turbo GT','Ferrari Roma','Lamborghini Urus Performante','McLaren GT','Bentley Flying Spur Speed','Rolls-Royce Dawn','Range Rover Velar SVAutobiography','Toyota Hilux GR Sport','Ford Ranger Raptor','Chevrolet Colorado ZR2','GMC Hummer EV','Rivian R1S','Lucid Gravity','Lotus Eletre R','Maserati Grecale Trofeo','Alfa Romeo Stelvio Quadrifoglio','BMW X5 M Competition','Mercedes-AMG G 63','Audi SQ8','Porsche Cayenne Turbo GT','Dodge Durango SRT Hellcat','Jeep Grand Wagoneer','Nissan Patrol Nismo','Toyota GR Corolla','Honda Accord Euro R','Mazda RX-8 Spirit R','Subaru Impreza 22B','Mitsubishi FTO GPX','Lexus RC F Track Edition','Nissan Stagea 260RS','Toyota Chaser Tourer V','Honda Beat','Suzuki Cappuccino','Daihatsu Copen','Autozam AZ-1','Nissan Figaro','Toyota Sera','Isuzu VehiCROSS','Ford RS200','Lancia Delta Integrale Evo','Lancia Stratos','Fiat X1/9','Peugeot 306 Maxi','Renault Spider','Citroën Saxo VTS','Opel Speedster','Vauxhall Lotus Carlton','BMW Z8','Mercedes-Benz SLR McLaren','Porsche 911 Dakar','Ferrari 296 GTB','Lamborghini Temerario','Aston Martin Valour','Maserati MC12','Pagani Utopia','Zenvo TSR-S','Hennessey Venom GT','Gumpert Apollo','Apollo Intensa Emozione','Karma Revero GT','Fisker Karma','BYD Yangwang U9','Xiaomi SU7 Ultra','Nio EP9','XPeng P7i','Zeekr 001 FR','Hyundai N Vision 74','Kia EV9 GT','Genesis X Gran Berlinetta','Toyota GR010','Porsche 963','Cadillac V-Series.R','BMW M Hybrid V8','Acura ARX-06','Lamborghini SC63','Ferrari 499P Modificata','Peugeot 9X8 Evo','Alpine A424','Oreca 07','Ligier JS P320','Porsche 911 RSR','Ford GT LM','Corvette C7.R','Aston Martin Vantage GT3','McLaren 570S GT4','Mercedes-AMG GT3','BMW M4 GT3','Audi R8 LMS GT3','Lexus RC F GT3','Nissan GT-R GT3','Toyota Supra GT4','Honda NSX GT3','Subaru BRZ GT300','Mazda RX-Vision GT3','Porsche 935','Ferrari 488 Challenge Evo','Lamborghini Huracán Super Trofeo','McLaren 720S GT3 Evo','Bentley Continental GT3','Jaguar I-PACE eTrophy','Formula E Gen3','IndyCar Dallara DW12','Dallara SF23','Williams FW14B','Lotus 98T','McLaren MP4/4','Ferrari F2004','Red Bull RB16B','Mercedes W11','Renault R25','Brawn BGP 001','Audi RS Q e-tron','Peugeot 405 T16 Dakar','Porsche 959 Paris-Dakar','Mitsubishi Pajero Evolution Dakar','Mini John Cooper Works Rally','Ford Fiesta WRC','Toyota Yaris WRC','Hyundai i20 N Rally1','Citroën C4 WRC','Subaru Impreza WRC 2001','Lancia 037 Rally','Audi Sport Quattro S1','Ford Escort RS1600','Alpine A110 Rally','Renault Clio Rally3','Peugeot 208 Rally4','Škoda Fabia RS Rally2','Ford Bronco Raptor','Ineos Grenadier','Suzuki Jimny Sierra','Toyota FJ Cruiser','Land Rover Discovery SVX','Mercedes-Benz G 500 4x4²','Ram 1500 TRX','Ford F-150 Lightning','Chevrolet Silverado ZR2','Toyota Tacoma TRD Pro','Nissan Navara Warrior','Volkswagen Amarok V6','Mitsubishi Triton Ralliart','Isuzu D-Max Arctic Trucks','Honda Gold Wing','Yamaha MT-10 SP','Kawasaki Z900RS','Suzuki GSX-R1000R','Ducati Monster SP','Aprilia Tuono V4 Factory','Triumph Daytona 765','MV Agusta F4 RR','KTM RC 8C','Harley-Davidson LiveWire','Indian FTR R Carbon','Royal Enfield Continental GT 650','Moto Guzzi V100 Mandello','BMW R 1250 GS Adventure','Honda Africa Twin','Yamaha Ténéré 700','Kawasaki Versys 1000','Suzuki V-Strom 1050','Ducati Multistrada V4','KTM 890 Adventure R','Triumph Tiger 1200 Rally','Zero SR/F','Energica Ego+','Can-Am Spyder F3','Polaris Slingshot R','Aston Martin DBX707','Ferrari Purosangue','Lamborghini LM002','Bentley Bentayga Speed','Rolls-Royce Cullinan Black Badge','Porsche Macan GTS','Audi RS Q3','BMW X3 M','Mercedes-AMG GLB 35','Alfa Romeo Tonale Veloce','Cupra Ateca VZ','Volvo XC60 Polestar','Tesla Model X Plaid','Lucid Air Dream Edition','Mercedes-Benz EQS 580','BMW i5 M60','Audi e-tron GT RS','Porsche Taycan GTS Sport Turismo','Jaguar XJ220S','Toyota MR2 SW20','Nissan 300ZX Twin Turbo','Honda Accord Type R','Mazda Cosmo 20B','Subaru Legacy B4 RSK','Mitsubishi Galant VR-4','Lexus SC 400','Infiniti M45','Acura Legend Coupe','Ford Thunderbird Super Coupe','Chevrolet Monte Carlo SS','Pontiac Firebird Trans Am','Oldsmobile 442','Plymouth Superbird','Dodge Coronet Super Bee','AMC Javelin AMX','Buick Riviera GS','Lincoln Continental Mark II','Cadillac Eldorado Biarritz','DeLorean DMC-12','Lotus Esprit V8','TVR Cerbera Speed 12','Nissan R390 GT1','Toyota GT-One TS020','Mercedes-Benz CLK LM','Porsche 911 GT1 Straßenversion','McLaren MP4-12C','Ferrari Enzo','Lamborghini Reventón','Pagani Zonda R','Koenigsegg One:1','Bugatti Centodieci','Rimac Concept One','Nissan IDx Nismo','Toyota FT-1','Mazda Furai','Jaguar C-X75','Cadillac Cien','BMW Nazca C2','Mercedes-Benz C111','Porsche 918 RSR','Audi Avus Quattro','Volkswagen W12 Nardo','Ford GT90','Chevrolet Aerovette','Dodge Copperhead','Chrysler ME Four-Twelve','Peugeot Oxia','Renault DeZir','Citroën GT','Alpine Vision Gran Turismo','Hyundai N 2025 Vision GT','Lamborghini V12 Vision GT','Bugatti Vision Gran Turismo','McLaren Ultimate Vision GT','Ferrari Vision Gran Turismo','Genesis X Gran Racer','Pininfarina H2 Speed','Toyota FT-Se','Nissan Hyper Force','Honda Sports EV','Subaru Viziv Performance','Mitsubishi e-Evolution','Lexus Electrified Sport','Infiniti Vision Qe','Kia Vision Meta Turismo','Polestar Synergy','BMW Vision Neue Klasse X','Mercedes-Benz Vision One-Eleven','Audi Activesphere','Porsche Mission R','Lotus Theory 1','Jaguar Type 00','Renault R5 Turbo 3E','Peugeot Inception','DS E-Tense Performance','Opel Experimental','Smart #5 Brabus','Mini Aceman JCW','Fiat Grande Panda Abarth','Cupra Tavascan VZ','Skoda Enyaq RS','Volkswagen ID.7 GTX','Ford Mustang Mach-E Rally','Chevrolet Blazer EV SS','Cadillac Lyriq-V','GMC Sierra EV Denali','Rivian R1T Quad-Motor','Tesla Cybertruck Cyberbeast','Hummer EV Omega','Lucid Sapphire Air','Faraday Future FF 91','Porsche 911 GT3 Touring','BMW M8 Competition','Mercedes-AMG SL 63','Audi RS5 Competition','Lexus LC 500 Convertible','Nissan GT-R Nismo Special Edition','Toyota GR Supra Final Edition','Honda Civic Mugen RR','Mazda MX-5 RF Club','Subaru WRX tS','Mitsubishi Lancer Evo VI Tommi Mäkinen','Ford Mustang Boss 302','Chevrolet Corvette Grand Sport','Dodge Viper ACR Extreme','Porsche 911 Sport Classic','Ferrari 812 Competizione A','Lamborghini Aventador Ultimae','McLaren 765LT Spider','Bugatti Chiron Pur Sport','Pagani Huayra BC Roadster','Koenigsegg Gemera','Aston Martin DBS 770 Ultimate','Lotus Emira V6 First Edition','Alpine A110 R Ultime','Renault Mégane R.S. Ultime','Peugeot 508 PSE','Citroën C4 VTS','Volkswagen Golf R 333','Audi RS Q8 Performance','BMW M3 CS Touring','Mercedes-AMG C 63 S E Performance','Porsche Panamera Turbo S E-Hybrid','Ferrari 12Cilindri','Lamborghini Revuelto Opera Unica','McLaren W1','Bugatti Tourbillon','Pagani Zonda HP Barchetta','Koenigsegg CC850','Aston Martin Valhalla','Lotus Evija X','Rimac Nevera Time Attack','Porsche 911 S/T','Ferrari Daytona SP3','Lamborghini Sián FKP 37','McLaren Elva','Bugatti Divo Lady Bug','Pagani Imola','Zenvo Aurora','Hennessey Venom F5 Revolution','Czinger 21C V Max','Gordon Murray T.33','Mercedes-AMG GT 63 S E Performance','BMW XM Label Red','Audi RS e-tron GT Performance','Polestar 6 LA Concept','Lucid Air Grand Touring','Alpine A290 GTS','Renault Clio Williams','Peugeot 306 S16','Citroën Xantia Activa V6','Volvo S60 Polestar Engineered','Saab 900 Turbo SPG','Skoda Superb Sportline','Dacia Sandero RS','Cupra Leon VZ','SEAT Ibiza Cupra','Fiat Panda 100HP','Alfa Romeo 156 GTA','Maserati Quattroporte GTS','Jaguar XE SV Project 8','Land Rover Range Rover SV','Bentley Brooklands','Rolls-Royce Silver Shadow','Morgan 3 Wheeler','Caterham Seven 485','Ariel Nomad R','BAC Mono R','KTM X-Bow GT2','Yamaha R6 Race','Kawasaki ZX-6R','Ducati 916 SPS','BMW HP4 Race','Honda RC213V-S','Suzuki GSX-R750 SRAD','Kawasaki H2 SX SE','Yamaha VMAX','Triumph Rocket 3 R','MV Agusta Brutale 1000 RR','Aprilia RSV4 XTrenta','KTM Super Duke 1290 R','Ducati Diavel V4','Harley-Davidson Fat Boy 114','Indian Challenger Elite','BMW K 1600 B','Honda X-ADV 750','Yamaha TMAX Tech Max','Piaggio Vespa 946','Segway SuperScooter GT2','Can-Am Maverick R X RS','Polaris RZR Pro R','Yamaha YXZ1000R SS','Kawasaki Teryx KRX 1000','Honda Talon 1000R','Sea-Doo RXP-X 325','Yamaha GP1800R SVHO','Kawasaki Ultra 310LX','MasterCraft XStar','Nautique G23','Axopar 37 XC','Riva Aquariva Super','Porsche Design 928 S4','Ford GT Mk IV','Chevrolet Corvette Z06 GT3.R','Toyota GR Supra GT500','Nissan Z GT500','Honda Civic Type R TCR','Hyundai Elantra N TCR','BMW M2 CS Racing','Mercedes-AMG GT Track Series','Audi RS3 LMS','Porsche Cayman GT4 RS Clubsport','Ferrari 296 Challenge','Lamborghini Huracán GT3 EVO2','McLaren Artura Trophy','Aston Martin Vantage GT4','Bentley Speed 8','Jaguar D-Type','Ferrari 250 GTO','Mercedes-Benz 300 SLR Uhlenhaut','Porsche 550 Spyder','Aston Martin DBR1','Ford GT40 Mk II','Shelby Daytona Coupe','Lancia Fulvia HF','Renault 8 Gordini','Peugeot 504 Coupé V6','Citroën SM','BMW 2002 Turbo','Mercedes-Benz 500 E','Audi 100 Coupe S','Volkswagen Corrado VR6','Opel Calibra Turbo','Alfa Romeo Montreal','Fiat Dino Coupe','Maserati Bora','Lamborghini Jarama','Ferrari Dino 246 GT','Porsche 356 Carrera','Toyota 2000GT','Nissan Fairlady Z 432','Honda S800','Mazda Luce Rotary Coupe','Subaru 360 Young SS','Mitsubishi Colt Ralliart Version-R','Lexus IS F','Infiniti FX50 S','Acura CL Type S','Hyundai Veloster N','Kia K5 GT','Genesis Coupe 3.8 R-Spec','Ford Falcon XR8 Sprint','Chevrolet SS 2017','Pontiac Solstice GXP','Saturn Sky Red Line','Cadillac XLR-V','Lincoln LS V8 Sport','Chrysler Prowler','Dodge Magnum SRT8','Plymouth Prowler','Buick Regal GNX','GMC Typhoon','Jeep Cherokee XJ 4.0','Toyota Crown Athlete','Nissan Cedric Gran Turismo','Honda Odyssey Absolute','Mazda MPV 2.3 Turbo','Subaru Forester STI','Mitsubishi RVR Hyper Sports Gear','Lexus RX 500h F Sport','Infiniti QX70S','Acura MDX Type S','Hyundai Santa Fe XRT','Kia Sorento X-Line','Genesis GV70 3.5T Sport','Ford Explorer ST','Chevrolet Trailblazer SS','Dodge Journey R/T','Jeep Compass Trailhawk','Toyota RAV4 GR Sport','Nissan X-Trail Nismo','Honda CR-V Hybrid RS','Mazda CX-60 PHEV','Subaru Outback XT','Mitsubishi Outlander PHEV','Lexus NX 450h+ F Sport','Volvo V90 Cross Country','Audi RS2 Avant','BMW M5 Touring E34','Mercedes-Benz E 500 Limited','Porsche 911 Carrera RS 2.7','Ferrari Testarossa','Lamborghini Jalpa','Maserati Shamal','Jaguar XJR-15','Lotus Carlton','TVR Tuscan Speed Six','Noble M12 GTO-3R','Ascari KZ1','Mosler MT900','Panoz Esperante GTLM','Saleen S281 Extreme','Vector W8','Cizeta-Moroder V16T','Isdera Commendatore 112i','Ruf CTR Yellowbird','Alpina B8 Gran Coupe','Brabus Rocket 900','Mansory Carbonado','ABT RS6 Legacy Edition','Hofele Ultimate HGLS','TechArt GTstreet R','Gemballa Mirage GT','Novitec F8 N-Largo','Liberty Walk Aventador','Rocket Bunny Supra','HKS Toyota GR86','Mugen Civic Type R','Nismo 400R','TRD 3000GT','STI S209','Ralliart Colt Version-R','Polestar 1 BST Edition 270','Cupra Formentor VZ5 Taiga Grey','Alpine A110 San Remo 73','Renault Clio V6 Phase 2','Peugeot 208 GTi by Peugeot Sport','Citroën C2 VTS','Volkswagen Polo R WRC','Audi S1 EKS RX quattro','BMW M3 E46 CSL','Mercedes-Benz C 55 AMG','Porsche 911 GT2 RS Clubsport','Ferrari FXX-K Evo','Lamborghini Essenza SCV12','McLaren Solus GT','Bugatti Bolide','Pagani Huayra R Evo','Koenigsegg Agera One:1','Aston Martin Vulcan AMR Pro','Lotus 3-Eleven 430','Radical RXC GT3','Ariel Atom V8','Caterham R500 Superlight','Dallara P217','Ligier JS2 R','Toyota GR Yaris Rally1','Ford Puma Rally1','Hyundai i20 Coupe WRC','Škoda Fabia R5','Citroën C3 WRC','Volkswagen Polo GTI R5','Mitsubishi Lancer WRC05','Peugeot 307 WRC','Subaru Impreza 555','Lancia Delta S4','Audi Quattro A2','Ford RS200 Evolution','Renault 5 Maxi Turbo','Peugeot 205 T16 Evo 2','Citroën BX 4TC','Opel Manta 400','BMW M1 Procar','Porsche 935 K3','Ferrari 512 BB LM','Lamborghini Countach LP5000 QV','De Tomaso Mangusta','Iso Grifo A3/C','Shelby GT350R','Chevrolet Chevelle SS 454','Dodge Charger R/T 1969','Plymouth Barracuda Hemi','Pontiac Firebird SD-455','Oldsmobile Toronado GT','Buick GSX Stage 1','Cadillac CTS-V Blackwing Track Edition','Ford Mustang GTD','Chevrolet Corvette ZR1X','Dodge Charger Sixpack','Ram 1500 RHO','GMC Canyon AT4X AEV','Toyota Land Cruiser GR Sport','Nissan Armada Nismo','Honda Pilot TrailSport','Hyundai Palisade XRT Pro','Kia Telluride X-Pro','Genesis GV80 Coupe','BMW iX M70','Mercedes-AMG EQE SUV','Audi SQ6 e-tron','Porsche Macan Electric Turbo','Tesla Model 3 Ludicrous','Rivian R2 Performance','Lucid Gravity Grand Touring','Polestar 4 Performance','Volvo EX30 Twin Motor','Lotus Emeya R','Maserati GranCabrio Folgore','Ferrari SF90 XX Stradale','Lamborghini Huracán Tecnica','McLaren 600LT','Bugatti Veyron Grand Sport Vitesse','Pagani Zonda Tricolore','Koenigsegg CCXR Edition','Aston Martin One-77','Bentley Continental Supersports','Rolls-Royce Phantom Coupé','BMW M6 Gran Coupe','Mercedes-Benz SLS AMG Black Series','Audi R8 GT','Porsche 911 Turbo Flachbau','Ferrari 430 Scuderia','Lamborghini Murciélago LP670-4 SV','McLaren 650S Le Mans','Bugatti Chiron Sport','Pagani Zonda F Clubsport','Koenigsegg Agera Final','Aston Martin DBS GT Zagato','Lotus Evora GT430','Alpine A110 GT4','Renault Clio RS 220 Trophy','Peugeot RCZ R','Citroën C4 VTS by Loeb','Volkswagen Golf GTI Clubsport S','Audi TT RS Iconic Edition','BMW M4 GTS','Mercedes-Benz A 45 AMG Edition 1','Porsche 911 GT3 RS 4.0','Ferrari 458 Speciale A','Lamborghini Gallardo Superleggera','McLaren MP4-12C High Sport','Bugatti Veyron Super Sport','Pagani Zonda Revolucion','Koenigsegg CCXR Trevita','Aston Martin V12 Vantage S','Lotus Exige Sport 410','Alfa Romeo 8C Competizione','Maserati MC Stradale','Jaguar F-Type Project 7','Volvo C30 Polestar','Saab 9-3 Turbo X','Skoda Yeti RS Concept','Cupra Raval VZ','Dacia Logan S2000','Fiat Punto Abarth SuperSport','Abarth 695 Biposto','Toyota Starlet GT Turbo','Nissan March Super Turbo','Honda City Turbo II','Mazda Autozam AZ-3','Subaru Vivio RX-R','Mitsubishi Minica Dangan ZZ','Suzuki Swift Sport ZC33S','Daihatsu Mira TR-XX','Isuzu Piazza Turbo','Lexus LFA Nürburgring Package','Infiniti Q50 Eau Rouge','Acura RLX Sport Hybrid','Hyundai i30 Fastback N','Kia K8 GT','Genesis G90 Black','Ford Falcon Cobra','Chevrolet Impala SS 1996','Pontiac Grand Prix GXP','Cadillac CTS-V Coupe','Lincoln Mark VIII LSC','Chrysler 300C SRT8','Dodge Stealth R/T Turbo','Plymouth GTX 440','AMC AMX 390','Buick Wildcat GS','GMC Caballero Diablo','Jeep Grand Cherokee SRT8','Toyota Supra Turbo A70','Nissan Pulsar GTI-R N1','Honda Civic Ferio RS','Mazda Lantis Type R','Subaru Alcyone SVX S4','Mitsubishi Legnum VR-4','Lexus GS 430','Infiniti J30','Acura Vigor GS','Hyundai XG350','Kia Opirus 3.5','Genesis Equus VS500','Ford Taurus SHO 2010','Chevrolet Caprice PPV','Pontiac G8 GXP','Cadillac STS-V','Lincoln MKS EcoBoost','Chrysler Crossfire SRT-6','Dodge Caliber SRT4','Plymouth Neon ACR','Oldsmobile Aurora V8','Buick LaCrosse Super','GMC Envoy XUV','Jeep Commander SRT8','Toyota Harrier 3.0 4WD','Nissan Murano CrossCabriolet','Honda Element SC','Mazda CX-7 MPS','Subaru Tribeca B9','Mitsubishi Airtrek Turbo R','Lexus GX 460 Sport','Infiniti EX37','Acura RDX SH-AWD','Hyundai Veracruz Limited','Kia Mohave V8','Genesis GV60 Magma','Ford Edge ST','Chevrolet Equinox SS Concept','Dodge Nitro SRT Concept','Jeep Renegade 4xe','Toyota C-HR GR Sport','Nissan Juke-R 2.0','Honda ZR-V e:HEV','Mazda CX-30 Turbo','Subaru Crosstrek Wilderness','Mitsubishi Eclipse Cross PHEV','Lexus UX 300e','Volvo XC40 Recharge Twin','Audi Q4 Sportback e-tron','BMW i4 M50','Mercedes-Benz EQC 400','Porsche 911 GT3 R Rennsport','Ferrari 499P Le Mans','Lamborghini SC20','McLaren Speedtail','Bugatti La Voiture Noire','Pagani Zonda HP Barchetta','Koenigsegg Sadair’s Spear','Aston Martin Valiant','Lotus Evija Fittipaldi','Rimac Nevera R Founder’s Edition','Porsche 911 Dakar Sonderwunsch','Ferrari Monza SP2','Lamborghini Veneno Roadster','McLaren P1 GTR','Bugatti Chiron Super Sport 300+','Pagani Zonda Revolucion 760','Koenigsegg Agera RSN','Aston Martin Vulcan','Lotus Exige Cup 430 Final Edition','Alpine A110 R Le Mans','Renault Clio Williams Maxi','Peugeot 205 Rallye','Citroën Visa Chrono','Volkswagen Golf Rallye G60','Audi Sport Quattro S1 E2','BMW M3 Sport Evolution','Mercedes-Benz 190E 2.5-16 Evolution II','Porsche 911 Carrera Club Sport','Ferrari 288 GTO','Lamborghini Miura SV','Maserati Tipo 61 Birdcage','Jaguar XKSS','Toyota Sports 800','Nissan R380-II','Honda RA272','Mazda 787B','Subaru Impreza S201','Mitsubishi Lancer Evo IX MR','Lexus IS 300 SportCross','Infiniti M30','Acura RSX Type S','Hyundai Tiburon GT V6','Kia Forte Koup SX','Genesis G70 Shooting Brake','Ford Mustang California Special','Chevrolet Corvette Callaway Sledgehammer','Dodge Charger Daytona 1969','Pontiac GTO Judge','Cadillac CTS-V Black Diamond','Lincoln Continental Coach Door Edition','Chrysler Valiant Charger E49','Ram SRT-10','GMC Jimmy Typhoon','Jeep Grand Cherokee 5.9 Limited','Toyota Crown Majesta V8','Nissan Gloria Gran Turismo Ultima','Honda Inspire Type S','Mazda Eunos Cosmo 20B','Subaru Legacy RS Turbo','Mitsubishi Debonair AMG','Lexus LS 400 Coach Edition','Infiniti Q45t','Acura CL 3.2 Type S','Hyundai Grandeur N Line Concept','Kia K9 GT-Line','Genesis G80 Magma Special','Ford Mondeo ST220','Chevrolet Lumina Z34','Pontiac Bonneville SSEi','Cadillac Seville STS','Lincoln Town Car Cartier L','Chrysler Concorde LHS','Dodge Intrepid R/T','Plymouth Laser RS Turbo','Oldsmobile Cutlass 442 W-30','Buick GNX Stage 2','GMC S-15 Jimmy Cyclone','Jeep Wagoneer S Trailhawk','Toyota Mega Cruiser','Nissan Safari Rally Raid','Honda CR-V Mugen','Mazda CX-5 Turbo Signature','Subaru Forester STI tS','Mitsubishi Delica D:5 P','Lexus LX 600 F Sport','Infiniti QX80 Autograph','Acura ZDX Type S','Hyundai Ioniq 6 N','Kia EV3 GT','Genesis GV90 Magma','Ford Mustang Dark Horse SC','Chevrolet Corvette E-Ray Z06','Dodge Charger Daytona Banshee','Ram TRX Final Edition','GMC Sierra HD AT4X','Toyota Tundra TRD Pro','Nissan Titan Warrior','Honda Ridgeline HPD','Mazda BT-50 Thunder','Subaru Baja Turbo','Mitsubishi L200 Warrior','Lexus RC F Fuji Speedway Edition','Infiniti Q60 Project Black S','Acura NSX Type S','Hyundai RM20e','Kia Stinger GT420','Genesis Essentia','Ford GT Mk II','Chevrolet Corvette C6.R','Dodge Viper Competition Coupe','Porsche 911 GT2 Clubsport','Ferrari FXX','Lamborghini Murciélago R-GT','McLaren F1 GTR Longtail','Bugatti EB110 SS','Pagani Zonda GR','Koenigsegg CCGT','Aston Martin DBR9','Lotus Elise GT1','Alpine A442B','Renault RE40','Peugeot 905 Evo 1B','Citroën Xsara Kit Car','Volkswagen Beetle RSI','Audi RS3 Performance Edition','BMW M3 CRT','Mercedes-Benz C 63 AMG Black Series','Porsche 911 GT3 RS Manthey Kit','Ferrari 458 Italia GT3','Lamborghini Huracán STO SC 10° Anniversario','McLaren 620R','Bugatti Chiron L’Ébé','Pagani Huayra Codalunga','Koenigsegg Regera Ghost Package','Aston Martin Vantage AMR','Lotus Emira GT4','Alpine A110 Cup','Renault Mégane RS Red Bull Racing RB8','Peugeot 208 GTi 30th','Citroën DS3 Racing Sebastien Loeb','Volkswagen Golf GTI TCR','Audi S3 Competition','BMW M240i xDrive','Mercedes-AMG CLA 45 S','Porsche Cayman GTS 4.0','Ferrari California T Handling Speciale','Lamborghini Huracán LP 610-4','McLaren 540C','Bugatti Veyron Grand Sport','Pagani Zonda C12','Koenigsegg CC8S','Aston Martin DB9 GT','Lotus Evora 400','Alfa Romeo Brera 3.2 JTS Q4','Maserati GranTurismo MC Stradale','Jaguar XKR-S GT','Volvo S60 T8 Polestar','Saab 9-5 Aero','Skoda Superb 280 TSI','Cupra Leon Sportstourer VZ','SEAT Ibiza Cupra Bocanegra','Fiat 500 Abarth Assetto Corse','Alfa Romeo Giulietta QV','Toyota Altezza RS200','Nissan Laurel 25t Club S','Honda Integra DC5 Type R','Mazda RX-7 FC Turbo II','Subaru Impreza WRX STI Spec C','Mitsubishi Evo VIII MR FQ-400','Lexus IS 200 Altezza','Infiniti QX70 Sebastian Vettel Edition','Acura TLX Type S PMC','Hyundai Sonata N Line','Kia K5 GT-Line Turbo','Genesis G70 Track Day Special','Ford Falcon GT-HO Phase III','Chevrolet Camaro Z/28 2014','Pontiac Firebird Formula 400','Cadillac CTS-V Coupe Race','Lincoln LS Sport V8','Chrysler 300 SRT Core','Dodge Challenger SRT Demon 170','Plymouth Hemi Cuda','Oldsmobile 442 W-30','Buick Regal TourX GS','GMC Hummer H1 Alpha','Jeep Wrangler 392 Final Edition','Toyota GRMN Yaris','Nissan Skyline GT-R V-Spec II Nür','Honda Civic Type R EK9','Mazda RX-7 Spirit R Type A','Subaru Impreza 22B STI','Mitsubishi Lancer Evo III GSR','Lexus IS F CCS-R','Infiniti G37 IPL','Acura NSX Zanardi Edition','Hyundai i20 N Performance','Kia Cerato Koup Turbo','Genesis G90 5.0 Ultimate','Ford Mustang SVT Cobra R','Chevrolet Corvette C4 ZR-1','Dodge Viper RT/10','Pontiac G8 GT','Cadillac XLR Platinum','Lincoln LS V8','Chrysler 300M Special','Dodge Neon SRT-4 ACR','Plymouth Prowler Mulholland','Oldsmobile Intrigue GLS','Buick Park Avenue Ultra','GMC Envoy XUV Denali','Jeep Grand Cherokee 5.9 Limited','Toyota Mark II Tourer V','Nissan Silvia S14 Kouki','Honda Accord Euro R CL7','Mazda RX-3 Rotary','Subaru Impreza WRX STI RA','Mitsubishi Galant VR-4 Rally','Lexus GS 300 Aristo','Infiniti Q45 Anniversary','Acura RL SH-AWD','Hyundai Coupe F2 Evolution','Kia ProCeed GT Track','Genesis G80 Sport Prestige','Ford Focus RS500','Chevrolet Cobalt SS Turbo','Pontiac Grand Am GT','Cadillac CTS-V Sport Wagon','Lincoln MKZ 3.0T','Chrysler Crossfire SRT-6 Roadster','Dodge Charger SRT8 Super Bee','Plymouth Duster 340','Oldsmobile Cutlass Supreme 442','Buick Regal T-Type','GMC Typhoon Syclone Edition','Jeep Cherokee Chief S','Toyota Supra A80 RZ','Nissan Fairlady Z Version S','Honda S2000 CR','Mazda RX-7 Bathurst R','Subaru Impreza WRX STI S202','Mitsubishi Lancer Evo VII GT-A','Lexus SC 430 Pebble Beach','Infiniti M45 Sport','Acura RSX Type S A-Spec','Hyundai Veloster Turbo R-Spec','Kia Stinger GTS','Genesis Coupe Track 3.8','Ford Mustang Mach 1 Handling Package','Chevrolet Corvette C8 Z51','Dodge Challenger R/T Scat Pack Widebody','Pontiac GTO 2006','Cadillac ATS-V Coupe','Lincoln Continental 3.0T Black Label','Chrysler 300C SRT Design','Dodge Viper GTS-R','Plymouth GTX Hemi','Oldsmobile 442 Holiday Coupe','Buick GNX Grand National','GMC Syclone Marlboro Edition','Jeep Grand Cherokee Trackhawk Red Vapor','Toyota GR Supra A91-CF','Nissan Z Performance Proto','Honda Civic Type R Limited Edition','Mazda MX-5 30th Anniversary','Subaru WRX STI Type RA','Mitsubishi Evo X Final Edition','Lexus LFA Nürburgring','Infiniti Q50 Red Sport 400','Acura NSX Type S Lightweight','Hyundai Elantra N TCR Edition','Kia EV6 GT-Line','Genesis G70 Shooting Brake Sport','Ford Mustang Shelby GT350R Heritage','Chevrolet Corvette Z06 Carbon','Dodge Charger SRT Hellcat Redeye','Pontiac Trans Am WS6','Cadillac CTS-V Blackwing Manual','Lincoln Aviator Black Label','Chrysler 300 SRT8 Core','Dodge Challenger SRT Demon','Plymouth Road Runner Superbird','Oldsmobile 442 Hurst','Buick GNX Regal','GMC Syclone Turbo AWD','Jeep Wrangler Rubicon 392','Toyota GR86 Cup','Nissan GT-R50 Italdesign','Honda NSX-R GT','Mazda RX-7 RE Amemiya','Subaru Impreza WRX STI Type UK','Mitsubishi Lancer Evo VI GSR','Lexus IS 300 SportCross','Infiniti Q60 Red Alpha','Acura TL Type S A-Spec','Hyundai Genesis Coupe Track','Kia Stinger GT Limited','Genesis G80 Electrified Sport','Ford Mustang Cobra Jet','Chevrolet Corvette ZR1 2019','Dodge Charger Daytona 392','Pontiac Firebird Trans Am GTA','Cadillac CTS-V Coupe 2011','Lincoln MKX EcoBoost','Chrysler 300 SRT8 2012','Dodge Viper ACR 2016','Plymouth Barracuda Formula S','Oldsmobile Cutlass 442 W-30','Buick Regal GSX','GMC Syclone 1991','Jeep Grand Cherokee SRT Trackhawk','Toyota GR Supra A90 Edition','Nissan 370Z Nismo N-Attack','Honda Civic Type R Mugen','Mazda RX-8 Mazdaspeed','Subaru WRX STI S209','Mitsubishi Evo IX Wagon MR','Lexus IS F Sport Performance','Infiniti G37 IPL Convertible','Acura TLX PMC Edition','Hyundai Veloster N DCT','Kia Forte GT Manual','Genesis G70 3.3T Sport','Ford Mustang GT Performance Pack','Chevrolet Camaro ZL1 1LE','Dodge Challenger SRT Super Stock','Pontiac G8 GXP Sedan','Cadillac ATS-V Sedan','Lincoln MKZ 3.0T AWD','Chrysler 300 SRT8 2014','Dodge Charger Hellcat Widebody','Plymouth Road Runner GTX','Oldsmobile 442 W-30 Convertible','Buick GNX 1987','GMC Syclone 1992','Jeep Grand Cherokee SRT8 2012','Toyota Supra Turbo 1998','Nissan Skyline GT-R V-Spec','Honda NSX Type R','Mazda RX-7 FD Type RS','Subaru Impreza WRX STI Spec C Type RA','Mitsubishi Evo VIII MR FQ-400','Lexus LFA 2012','Infiniti Q50 Eau Rouge Concept','Acura NSX 2017 GT3','Hyundai Nexo N Vision','Kia EV6 GT1','Genesis G80 Magma Concept','Ford Mustang GTD Spirit of America','Chevrolet Corvette ZR1 2025','Dodge Charger Daytona Scat Pack','Pontiac Firebird Firehawk','Cadillac CTS-V Wagon 2014','Lincoln Continental Mark VII LSC','Chrysler 300C SRT8 2006','Dodge Viper GTS ACR','Plymouth Superbird Hemi','Oldsmobile 442 W-30 Stage 1','Buick GNX ASC McLaren','GMC Typhoon 1993','Jeep Grand Cherokee SRT Trackhawk 2021','Toyota GR Yaris Circuit Pack','Nissan GT-R Nismo 2024','Honda Civic Type R FL5 Mugen','Mazda MX-5 ND RF Kuro','Subaru WRX STI RA-R','Mitsubishi Evo X FQ-440 MR','Lexus RC F Track Edition 2020','Infiniti Q60 Project Black S Concept','Acura Integra Type S DE5','Hyundai Ioniq 5 N NPX1','Kia EV9 GT Concept','Genesis GV60 Magma Concept','Ford Mustang Dark Horse R','Chevrolet Corvette E-Ray','Dodge Charger Daytona Banshee Concept','Ram 1500 TRX Havoc','GMC Sierra EV Denali Edition 1','Toyota Tundra TRD Pro Hybrid','Nissan Titan Warrior Concept','Honda Ridgeline HPD Edition','Mazda BT-50 Thunder Pro','Subaru Baja Turbo Sport','Mitsubishi L200 Ralliart','Lexus LC 500 Inspiration Series','Infiniti QX55 Sensory','Acura TLX Type S PMC','Hyundai Elantra N Performance','Kia Stinger Tribute Edition','Genesis GV70 Electrified','Ford Focus RS Heritage Edition','Chevrolet Camaro ZL1 Collector Edition','Dodge Challenger Demon 170 Last Call','Pontiac GTO 2004','Cadillac CTS-V Blackwing 2024','Lincoln Navigator Black Label','Chrysler 300C Final Edition','Dodge Viper ACR Extreme Aero','Plymouth Barracuda Hemi Cuda','Oldsmobile 442 W-30 Holiday','Buick Regal GNX Limited','GMC Typhoon Syclone Turbo','Jeep Grand Cherokee Trackhawk Signature','Toyota Supra GRMN Concept','Nissan Skyline GT-R R34 Z-Tune','Honda S2000 Spoon Sports','Mazda RX-7 RE Amemiya Green','Subaru Impreza WRX STI S203','Mitsubishi Lancer Evo IX Wagon GT','Lexus IS F Circuit Club Sport','Infiniti G35 Coupe IPL','Acura TL Type S 6MT','Hyundai i30 N Drive-N','Kia ProCeed GT Shooting Brake','Genesis G70 3.3T Launch Edition','Ford Mustang Bullitt 2019','Chevrolet Corvette Z06 2023','Dodge Charger SRT Hellcat Jailbreak','Pontiac Firebird Trans Am 1977','Cadillac CTS-V Coupe Black Diamond','Lincoln LS V8 Sport Premium','Chrysler 300 SRT8 2010','Dodge Viper GTS Launch Edition','Plymouth GTX Hemi 1971','Oldsmobile 442 W-30 1970','Buick GNX 1987 Stage 1','GMC Syclone 1991 Marlboro','Jeep Grand Cherokee SRT8 2006','Toyota GR Corolla Circuit Edition','Nissan Z Nismo 2024','Honda Civic Type R Championship White','Mazda RX-7 Spirit R','Subaru WRX STI Type RA-R','Mitsubishi Lancer Evo VI TME','Lexus LFA Nürburgring 2012','Infiniti Q50 Red Sport 400 Sensory','Acura NSX Type S 2022','Hyundai Ioniq 5 N 2025','Kia EV6 GT 2025','Genesis G80 Magma 2025','Ford Mustang GTD Carbon Series','Chevrolet Corvette ZR1X 2026','Dodge Charger Daytona EV Scat Pack','Ram 1500 RHO 2025','GMC Sierra EV Denali Max Range','Toyota Land Cruiser 250 GR Sport','Nissan Patrol Nismo 2025','Honda Civic Type R Ultimate Edition','Mazda MX-5 35th Anniversary','Subaru WRX tS 2025','Mitsubishi Outlander Ralliart 2025','Lexus RC F Final Edition','Infiniti QX80 Red Sport Concept','Acura Integra Type S HRC','Hyundai Elantra N TCR 2025','Kia K5 GT 2025','Genesis G70 Magma Racing','Ford Mustang GTD Competition','Chevrolet Corvette Z06 GT3.R Evo','Dodge Charger Daytona SRT Concept','Pontiac Trans Am 455 SD','Cadillac CT5-V Blackwing Collector Series','Lincoln Continental Coach Door','Chrysler 300 SRT8 Core 2008','Dodge Viper ACR 1:33 Edition','Plymouth Hemi Cuda Convertible','Oldsmobile 442 W-30 Holiday Coupe','Buick GNX Turbo Regal','GMC Syclone 1991 Typhoon Twin','Jeep Wrangler 392 Final Edition 2024'
];
const EXTRA_EDITION_NAMES=['Édition Néon','Édition Circuit','Édition Minuit','Édition Aurora','Édition Turbo','Édition Chrome','Édition Tempête','Édition Astrale'];
const EXTRA_VEHICLE_NAMES = Array.from({length:500},(_,i)=>`${EXTRA_VEHICLE_BASES[i%EXTRA_VEHICLE_BASES.length]} · ${EXTRA_EDITION_NAMES[Math.floor(i/EXTRA_VEHICLE_BASES.length)%EXTRA_EDITION_NAMES.length]} ${String(i+1).padStart(3,'0')}`);
EXTRA_VEHICLE_NAMES.forEach((name,i)=>{const id=CARDS.length+1,rank=i%100<45?0:i%100<72?1:i%100<90?2:i%100<98?3:4,el=ELS[i%ELS.length],seed=id*7919+4831,r=mulberry32(seed+1),[a,b]=RAR[rank].atk;const atk=a+Math.round(r()*(b-a)/5)*5;CARDS.push({id,el,name,rank,seed,atk,pv:Math.round(atk*(1.5+r()*.8)/5)*5,flavor:'Édition automobile de la collection étendue.'});});
// Extension demandée : 260 nouvelles cartes uniques, ajoutées sans changer les anciens identifiants.
const EXTRA_260_NAMES = Array.from({length:260},(_,i)=>`${EXTRA_VEHICLE_BASES[(i*7+31)%EXTRA_VEHICLE_BASES.length]} · Collection Cosmos ${String(i+1).padStart(3,'0')}`);
EXTRA_260_NAMES.forEach((name,i)=>{const id=CARDS.length+1,rank=i%100<38?0:i%100<66?1:i%100<86?2:i%100<97?3:4,el=ELS[(i+2)%ELS.length],seed=id*7919+9269,r=mulberry32(seed+1),[a,b]=RAR[rank].atk;const atk=a+Math.round(r()*(b-a)/5)*5;CARDS.push({id,el,name,rank,seed,atk,pv:Math.round(atk*(1.65+r()*.65)/5)*5,flavor:'Modèle inédit de la collection Cosmos.'});});
// 15 cartes secrètes de rang mythique, conservées dans les mêmes systèmes de collection et de boosters.
const SECRET_NAMES=['Aurore Zéro','Phantom Violet X','Nebula GT-Ω','Éclipse 001','Comète Noire','Hyperion Nova','Spectre Quantique','Vortex 9','Orbite Fantôme','Prisme Stellaire','Tempête Astrale','Singularité R','Cosmos Ultime','Nébuleuse Royale','Nébulines Origin'];
SECRET_NAMES.forEach((name,i)=>{const id=CARDS.length+1,rank=5,el=ELS[(i+3)%ELS.length],seed=id*7919+1777,r=mulberry32(seed+1),[a,b]=RAR[rank].atk;const atk=a+Math.round(r()*(b-a)/5)*5;CARDS.push({id,el,name,rank,seed,atk,pv:Math.round(atk*(2.1+r()*.5)/5)*5,flavor:'Carte secrète mythique, réservée aux collectionneurs les plus chanceux.',secret:true});});
const BYRANK = RAR.map((_,k) => CARDS.filter(c => !c.event && !c.apex && c.rank===k));
const TOTAL = CARDS.length;

/* ================= icônes ================= */
const ICON = {
  feu:'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z',
  eau:'M12 2.5C8 8 5.5 11 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 11 16 8 12 2.5z',
  plante:'M20 4C10 4 4 9 4 16c0 1.5.4 2.8 1 4 1-4 4-7 8-9-3 3-5 6-6 9 8 1 13-5 13-16z',
  foudre:'M13 2L4 14h6l-1 8 9-12h-6z',
  ombre:'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  lumiere:'M12 2c1 5 3 8 8 10-5 2-7 5-8 10-1-5-3-8-8-10 5-2 7-5 8-10z'
};
const icon = k => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON[k]}"/></svg>`;

/* ================= art des véhicules (procédural) ================= */
function creatureInner(card){
  const E = EL[card.el], r = mulberry32(card.seed), rk = card.rank;
  const pick = a => a[Math.floor(r()*a.length)];
  const hue = Math.round((r()-.5)*(card.el==='lumiere'?30:46));
  const bA = hs(E.body[0],hue), bB = hs(E.body[1],hue), belly = hs(E.belly,hue*.5);
  const type = pick(['round','bean','pear','cloud']);
  const G = {round:{w:24,top:30,fy:51,bot:74},bean:{w:19,top:23,fy:42,bot:77},pear:{w:21,top:22,fy:47,bot:76},cloud:{w:26,top:24,fy:50,bot:76}}[type];
  const ink = E.ink;
  let s = `<defs>
<radialGradient id="PFXbg" cx="50%" cy="36%" r="78%"><stop offset="0" stop-color="${E.c1}"/><stop offset="1" stop-color="${E.c2}"/></radialGradient>
<linearGradient id="PFXbd" gradientUnits="userSpaceOnUse" x1="50" y1="${G.top}" x2="50" y2="${G.bot}"><stop offset="0" stop-color="${bA}"/><stop offset="1" stop-color="${bB}"/></linearGradient>
<radialGradient id="PFXau"><stop offset="0" stop-color="${E.glow}" stop-opacity=".85"/><stop offset="1" stop-color="${E.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="PFXfl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff6a2e"/><stop offset="1" stop-color="#ffe36a"/></linearGradient>
</defs><rect width="100" height="100" fill="url(#PFXbg)"/>`;
  const n = 9+rk;
  for(let i=0;i<n;i++){
    const x=f1(r()*100), y=f1(r()*68), z=.8+r()*2.2;
    if(card.el==='ombre'||card.el==='lumiere'||card.el==='foudre') s+=star(x,y,f1(z*1.7),E.glow,f1(.45+.4*r()));
    else if(card.el==='eau') s+=`<circle cx="${x}" cy="${y}" r="${f1(z*1.5)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/>`;
    else if(card.el==='plante') s+=`<ellipse cx="${x}" cy="${y}" rx="${f1(z*1.8)}" ry="${f1(z*.8)}" fill="${E.glow}" opacity=".55" transform="rotate(${Math.round(r()*180)} ${x} ${y})"/>`;
    else s+=`<circle cx="${x}" cy="${f1(y+22)}" r="${f1(z*.9)}" fill="${E.glow}" opacity=".6"/>`;
  }
  if(card.el==='ombre') s+=`<path d="M78 16A9 9 0 1 0 86 30A10 10 0 0 1 78 16Z" fill="#fff3b0" opacity=".9"/>`;
  if(rk>=3){
    s+=`<circle cx="50" cy="58" r="${rk>=4?50:40}" fill="url(#PFXau)"/>`;
    if(rk>=4){
      let rays='';
      for(let i=0;i<12;i++){const a=i*Math.PI/6,a1=a-.09,a2=a+.09;rays+=`<path d="M50 58L${f1(50+90*Math.cos(a1))} ${f1(58+90*Math.sin(a1))}L${f1(50+90*Math.cos(a2))} ${f1(58+90*Math.sin(a2))}Z"/>`;}
      s+=`<g fill="#fff" opacity=".13">${rays}</g>`;
    }
  }
  const spk = Math.max(0,(rk-1)*2);
  for(let i=0;i<spk;i++) s+=star(f1(8+r()*84),f1(8+r()*50),f1(2.5+r()*2.8),'#fff',.9);

  s += `<g transform="translate(0 6)">`;
  s += `<ellipse cx="50" cy="${G.bot+3}" rx="${G.w+3}" ry="4" fill="#000" opacity=".25"/>`;
  if(rk>=3){
    const wing = `<path d="M-16 0C-38-24-54-10-48 10C-44 6-40 8-38 12C-35 8-30 10-27 14Z" fill="${E.glow}" opacity=".85" stroke="${ink}" stroke-opacity=".25" stroke-width="1"/>`;
    s += `<g transform="translate(50 ${G.fy+4})">${wing}<g transform="scale(-1 1)">${wing}</g></g>`;
  }
  const tailKind = r()<.72 ? ({feu:'flame',eau:'fin',plante:'leaf',foudre:'bolt',ombre:'curl',lumiere:'curl'})[card.el] : 'curl';
  const tail = {
    curl:`<path d="M0 0C14-2 18-16 10-22" stroke="${bB}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    flame:`<path d="M0 0C10 2 16-6 14-16C20-8 24 2 12 8Z" fill="url(#PFXfl)"/>`,
    bolt:`<path d="M0 2L10-6L6-8L18-20L12-8L17-6Z" fill="#ffd23d" stroke="#b88400" stroke-width="1" stroke-linejoin="round"/>`,
    leaf:`<ellipse cx="10" cy="-8" rx="10" ry="5" fill="${bA}" transform="rotate(-40 10 -8)" stroke="#2f8f4e" stroke-width="1"/>`,
    fin:`<path d="M0 0C14 4 20-6 18-16C10-10 4-8 0-4Z" fill="${belly}" stroke="${ink}" stroke-opacity=".3" stroke-width="1"/>`
  }[tailKind];
  s += `<g transform="translate(${50+G.w-3} ${G.bot-12})">${tail}</g>`;
  const topDeco = (() => {
    switch(card.el){
      case 'feu': return `<path d="M-9 4C-14-6-6-9-8-21C0-15 3-9-1-4C5-9 9-15 7-24C16-15 15-4 9 4Z" fill="url(#PFXfl)"/>`;
      case 'eau': { const fin=`<path d="M-9 5C-22-3-27-13-25-23C-16-19-8-11-3 1Z" fill="${bA}" stroke="${ink}" stroke-opacity=".3" stroke-width="1"/>`; return fin+`<g transform="scale(-1 1)">${fin}</g>`; }
      case 'plante': return `<path d="M0 5C0-4 2-9 6-14" stroke="#2f8f4e" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="-6" cy="-9" rx="8" ry="4" fill="${bB}" transform="rotate(-35 -6 -9)"/><ellipse cx="9" cy="-16" rx="8" ry="4" fill="${bA}" transform="rotate(32 9 -16)"/>`;
      case 'foudre': { const a=`<path d="M-6 4L-12-5L-7-8L-15-19" stroke="#ffcf33" stroke-width="2.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-15" cy="-19" r="2.8" fill="#fff6a0" stroke="#ffcf33"/>`; return a+`<g transform="scale(-1 1)">${a}</g>`; }
      case 'ombre': { const ear=`<path d="M-15 8L-19-14L-3 1Z" fill="${bB}"/><path d="M-14 4L-16-8L-7 1Z" fill="${E.belly}" opacity=".7"/>`; return ear+`<g transform="scale(-1 1)">${ear}</g>`; }
      default: return `<ellipse cx="0" cy="-8" rx="14" ry="4" fill="none" stroke="#ffe27a" stroke-width="2.4"/>`;
    }
  })();
  s += `<g transform="translate(50 ${G.top+3})">${topDeco}</g>`;
  if(rk>=4 && card.el!=='lumiere') s += `<ellipse cx="50" cy="${G.top-6}" rx="13" ry="3.6" fill="none" stroke="#ffe27a" stroke-width="2"/>`;

  const stroke = `stroke="${ink}" stroke-opacity=".35" stroke-width="1.2"`;
  if(type==='round') s += `<ellipse cx="50" cy="52" rx="24" ry="22" fill="url(#PFXbd)" ${stroke}/>`;
  else if(type==='bean') s += `<ellipse cx="50" cy="50" rx="19" ry="27" fill="url(#PFXbd)" ${stroke}/>`;
  else if(type==='pear') s += `<path d="M50 22C62 22 66 34 68 46C72 60 66 76 50 76C34 76 28 60 32 46C34 34 38 22 50 22Z" fill="url(#PFXbd)" ${stroke}/>`;
  else s += `<g fill="url(#PFXbd)"><circle cx="36" cy="46" r="13"/><circle cx="64" cy="46" r="13"/><circle cx="50" cy="39" r="15"/><ellipse cx="50" cy="58" rx="26" ry="18"/></g>`;
  s += `<ellipse cx="50" cy="${G.bot-11}" rx="${f1(G.w*.42)}" ry="8" fill="${belly}" opacity=".9"/>`;
  const fx = Math.round(G.w*.45);
  s += `<ellipse cx="${50-fx}" cy="${G.bot-1}" rx="6" ry="3.6" fill="${bB}" ${stroke}/><ellipse cx="${50+fx}" cy="${G.bot-1}" rx="6" ry="3.6" fill="${bB}" ${stroke}/>`;
  const ay = G.fy+13;
  s += `<ellipse cx="${50-G.w-1}" cy="${ay}" rx="5" ry="3" fill="${bB}" transform="rotate(-35 ${50-G.w-1} ${ay})"/><ellipse cx="${50+G.w+1}" cy="${ay}" rx="5" ry="3" fill="${bB}" transform="rotate(35 ${50+G.w+1} ${ay})"/>`;

  const ex = Math.round(G.w*.42), ey = G.fy;
  let es = r()<.5 ? 0 : (r()<.6 ? 1 : 2);
  if(rk>=3 && r()<.55) es = 3;
  [-1,1].forEach(sg => {
    const x = 50+sg*ex;
    if(es===0) s += `<ellipse cx="${x}" cy="${ey}" rx="3.2" ry="4.4" fill="${ink}"/><circle cx="${x-1}" cy="${ey-1.6}" r="1.3" fill="#fff"/>`;
    else if(es===1) s += `<ellipse cx="${x}" cy="${ey}" rx="5.4" ry="6.4" fill="#fff" stroke="${ink}" stroke-opacity=".5" stroke-width=".8"/><circle cx="${x}" cy="${f1(ey+.6)}" r="3.8" fill="${ink}"/><circle cx="${f1(x-1.2)}" cy="${f1(ey-1.4)}" r="1.5" fill="#fff"/><circle cx="${f1(x+1.4)}" cy="${f1(ey+2)}" r=".8" fill="#fff"/>`;
    else if(es===2) s += `<path d="M${x-4} ${f1(ey+1.5)}Q${x} ${f1(ey-4.5)} ${x+4} ${f1(ey+1.5)}" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    else s += `<circle cx="${x}" cy="${ey}" r="5.4" fill="${E.glow}" stroke="${ink}" stroke-width="1"/><circle cx="${x}" cy="${ey}" r="3.2" fill="${ink}"/><circle cx="${f1(x-1.2)}" cy="${f1(ey-1.3)}" r="1.3" fill="#fff"/>`;
    s += `<ellipse cx="${50+sg*(ex+6)}" cy="${ey+7}" rx="3.6" ry="2.3" fill="#ff7fa6" opacity=".45"/>`;
  });
  const mt = pick([0,1,2]);
  if(mt===0) s += `<path d="M46.8 ${ey+9}Q48.4 ${ey+12} 50 ${ey+9}Q51.6 ${ey+12} 53.2 ${ey+9}" stroke="${ink}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  else if(mt===1) s += `<path d="M46.4 ${f1(ey+8.5)}Q50 ${ey+16} 53.6 ${f1(ey+8.5)}Z" fill="${ink}"/><ellipse cx="50" cy="${f1(ey+12.4)}" rx="1.8" ry="1.1" fill="#ff8fa8"/>`;
  else s += `<path d="M47 ${ey+9}Q50 ${f1(ey+12.5)} 53 ${ey+9}" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  s += `</g>`;
  return s;
}
const artCache = {};
const artFor = c => artCache[c.id] || (artCache[c.id] = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${creatureInner(c)}</svg>`);

const MASCOT = {id:0, el:'lumiere', seed:4242, rank:2};
function packInner(){
  let top='', bot='';
  for(let i=0;i<=22;i++) top += `${i?'L':'M'}${i*10} ${i%2?0:9} `;
  for(let i=22;i>=0;i--) bot += `L${i*10} ${i%2?320:311} `;
  const d = top+bot+'Z';
  return `<defs>
<linearGradient id="PFXpb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3bd0"/><stop offset=".55" stop-color="#2b1a78"/><stop offset="1" stop-color="#0f8b86"/></linearGradient>
<linearGradient id="PFXsh" x1="0" y1="0" x2="1" y2=".4"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="PFXcl"><circle cx="110" cy="158" r="60"/></clipPath></defs>
<path d="${d}" fill="url(#PFXpb)"/><path d="${d}" fill="url(#PFXsh)"/>
<rect x="0" y="9" width="220" height="14" fill="#fff" opacity=".1"/><rect x="0" y="297" width="220" height="14" fill="#fff" opacity=".1"/>
<text x="110" y="64" text-anchor="middle" font-family="Bagel Fat One,Arial Rounded MT Bold,Trebuchet MS,sans-serif" font-size="28" fill="#fff" stroke="#1a0f4d" stroke-width="5" paint-order="stroke" stroke-linejoin="round">NÉBULINES</text>
<circle cx="110" cy="158" r="68" fill="#6ff2c9" opacity=".35"/><circle cx="110" cy="158" r="62" fill="#11102e" stroke="#9e8cff" stroke-width="2"/>
<g clip-path="url(#PFXcl)"><rect x="48" y="96" width="124" height="124" fill="#17163d"/><circle cx="145" cy="119" r="16" fill="#ffdc85"/><path d="M45 156V128H59V143H68V116H82V150H91V132H103V151H112V109H127V149H137V126H149V153H161V119H174V174H45Z" fill="#29235c"/><path d="M45 190L175 151V220H45Z" fill="#111225"/><path d="M92 220L112 164L126 164L151 220Z" fill="#252647"/><path d="M119 177L123 177M111 198L119 198M101 215L111 215" stroke="#fff0a6" stroke-width="3"/><g transform="translate(0 9)"><ellipse cx="111" cy="185" rx="43" ry="7" fill="#ff4fd8" opacity=".45"/><path d="M68 178L76 165L91 160L101 148L129 148L143 162L157 167L164 178L158 186H73Z" fill="#b69cff" stroke="#f6edff" stroke-width="2"/><path d="M98 151L105 141H126L139 160H91Z" fill="#77e8ff" stroke="#fff" stroke-width="1.5"/><path d="M82 171H96M143 171H155" stroke="#fff" stroke-width="4"/><path d="M77 181H155" stroke="#ff65d4" stroke-width="3"/><circle cx="88" cy="185" r="8" fill="#090b20" stroke="#d8d9ff" stroke-width="3"/><circle cx="145" cy="185" r="8" fill="#090b20" stroke="#d8d9ff" stroke-width="3"/><path d="M76 163L65 158L66 168L77 171Z" fill="#6ff2c9"/><path d="M155 164L168 158L166 169L158 172Z" fill="#ffdc85"/></g><path d="M59 109L64 105M157 111L163 106M75 136L80 131" stroke="#fff" stroke-width="2" opacity=".8"/></g>
<text x="110" y="272" text-anchor="middle" font-family="Bagel Fat One,Arial Rounded MT Bold,Trebuchet MS,sans-serif" font-size="17" fill="#fff" letter-spacing="3">BOOSTER</text>
<text x="110" y="290" text-anchor="middle" font-family="Figtree,system-ui,sans-serif" font-weight="800" font-size="10" fill="#b8ffea" letter-spacing="2.5">5 CARTES</text>`;
}
let uid = 0;
const withPrefix = str => str.replaceAll('PFX','p'+(++uid)+'_');
const packSVG = () => withPrefix(`<svg viewBox="0 0 220 320" aria-hidden="true">${packInner()}</svg>`);

/* Véhicules générés en SVG : chaque carte possède une silhouette, une teinte et des performances. */
const vehicleMods = (()=>{try{return JSON.parse(localStorage.getItem('nebulines.vehicleMods')||'{}')}catch(e){return {}}})();
// Le type illustré suit le modèle écrit sur la carte : une Yaris reste une voiture, jamais un hélicoptère.
function inferredVehicleType(c){const n=String(c?.name||'').toLowerCase();if(/\b(airbus|boeing|cessna|piper pa-|bell 407|sikorsky|h125)\b/.test(n))return /\b(bell 407|sikorsky|h125)\b/.test(n)?'helicopter':'plane';if(/\b(vespa|piaggio mp3|ninebot|bmw ce 04)\b/.test(n))return /\b(ninebot|bmw ce 04)\b/.test(n)?'escooter':'scooter';if(/(yzf-r1|ninja|panigale|s 1000 rr|cbr1000|hayabusa|gold wing|mt-10|z900rs|gsx-r|monster sp|tuono v4|daytona 765|f4 rr|rc 8c|livewire|ftr r carbon|royal enfield|r 1250 gs|africa twin|ténéré 700|tenere 700|versys 1000|v-strom|multistrada|streetfighter v4|super duke|speed triple|rsv4|m 1000 rr|superveloce|continental gt 650)/i.test(n))return 'motorcycle';return 'car';}
function getVehicleType(c){return vehicleMods[c?.id]?.type||inferredVehicleType(c);}
const vehicleStats = c => {const m=vehicleMods[c.id]||{};const type=getVehicleType(c);let u={};try{u=JSON.parse(localStorage.getItem('nebulines.carUpgrades')||'{}')[c.id]||{}}catch(e){};const lv=k=>u[k]||0;return {speed:Math.round(130+c.atk*1.7+c.rank*14+(type==='motorcycle'?12:0)+lv('engine')*5+lv('wheels')*2),accel:Math.min(99,Math.round(35+c.atk*.52+c.rank*5+(type==='motorcycle'?8:0)+lv('accel')*6+lv('engine')*2)),handling:Math.min(99,Math.round(40+c.pv*.25+c.rank*6+(type==='motorcycle'?4:0)+lv('handling')*6+lv('wheels')*2+lv('brakes')*3))};};
function vehicleArt(c){const m=vehicleMods[c.id]||{};const color=m.color||['#7e8bd4','#52a8ff','#b69cff','#ff638d','#ffc857','#ffffff'][c.rank]||'#b69cff';const autoType=getVehicleType(c);const moto=autoType==='motorcycle';const variant=c.id%4;const glow=color;let body='';
 if(autoType==='escooter'){body=`<circle cx="66" cy="125" r="13" fill="#111225" stroke="#eaf6ff" stroke-width="4"/><circle cx="155" cy="125" r="13" fill="#111225" stroke="#eaf6ff" stroke-width="4"/><path d="M66 111L82 111L106 116L142 116L155 111" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/><path d="M83 111L83 72L72 68L92 68" fill="none" stroke="#dcecff" stroke-width="5" stroke-linecap="round"/><path d="M102 112L118 92L136 92" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>`;}
 else if(autoType==='scooter'){body=`<circle cx="66" cy="125" r="15" fill="#111225" stroke="#eaf6ff" stroke-width="4"/><circle cx="155" cy="125" r="15" fill="#111225" stroke="#eaf6ff" stroke-width="4"/><path d="M66 111L93 111L117 115L145 115L155 111L148 88L132 79L116 82L105 105" fill="${color}" stroke="#fff" stroke-width="3"/><path d="M145 88L152 68L166 68" stroke="#dcecff" stroke-width="5" fill="none" stroke-linecap="round"/>`; }
 else if(autoType==='plane'){body=`<path d="M24 94L92 91L120 39Q128 30 132 43L125 91L195 99Q204 103 195 109L126 116L135 142L122 146L101 117L40 125L25 117L77 103Z" fill="${color}" stroke="#f2f6ff" stroke-width="3" stroke-linejoin="round"/><path d="M102 95L121 63L126 94Z" fill="#d7efff"/>`; }
 else if(autoType==='helicopter'){body=`<path d="M57 91Q65 68 105 70L139 83L153 100L132 113L82 113Q55 110 57 91Z" fill="${color}" stroke="#fff" stroke-width="3"/><path d="M94 72L94 53L120 53L120 74" fill="#d9efff" stroke="#fff" stroke-width="3"/><path d="M42 61L173 61M107 48L107 37M91 37L123 37" stroke="#d9eaff" stroke-width="4" stroke-linecap="round"/><path d="M139 92L176 92L188 81" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/><circle cx="91" cy="119" r="5" fill="#d9eaff"/><circle cx="132" cy="119" r="5" fill="#d9eaff"/>`; }
 else if(moto){body=`<path d="M43 116 L65 91 L84 92 L101 116 L130 116 L146 89 L160 91 L174 118" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M69 88 L91 82 L111 91 L126 91 L142 82 L153 84 L143 96 L113 101 L95 99 L81 99Z" fill="${color}" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><path d="M88 83 L78 68 L99 68 L111 87Z" fill="#d8eaff" stroke="${color}" stroke-width="4"/><circle cx="62" cy="120" r="16" fill="#100b23" stroke="#d9e3ff" stroke-width="5"/><circle cx="158" cy="120" r="16" fill="#100b23" stroke="#d9e3ff" stroke-width="5"/><path d="M135 83 L155 78 L165 83" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;}
 else {
 const n=String(c.name||'').toLowerCase();
 const suv=/land cruiser|land rover|defender|wrangler|grand cherokee|trackhawk|range rover|duster|pajero|hilux|ranger raptor|colorado zr2|hummer ev|rivian r1s|rivian r1t|urus|suv|dacia/i.test(n);
 const truck=/hilux|ranger raptor|colorado zr2|hummer ev|rivian r1t|ram trx|gmc syclone/i.test(n);
 const hatch=/yaris|clio|golf|fiesta|focus rs|mini cooper|205 gti|308 gti|megane rs|fabia rs|renault 5|civic type r|i30 n|gti|puma st/i.test(n);
 const sedan=/corolla|prius|model 3|model s|charger|giulia|m3 |m5 |rs3|rs6|rs4|octavia|s8|lucid air|polestar 2|panamera|flying spur|continental gt|s-class|190e|ct5-v|blackwing/i.test(n);
 const hyper=/ferrari|lamborghini|bugatti|mclaren|pagani|koenigsegg|rimac|valkyrie|venom|jesko|nevera|sf90|revuelto|chiron|veyron|huayra|zonda|senna|p1\b|f40\b|laferrari|bolide|artura|720s|918 spyder|carrera gt|ford gt|corvette|viper|bac mono|ariel atom|caterham|dallara|atom 4/i.test(n);
 const shapes={
  suv:['M48 91L53 67Q55 61 65 61L136 61Q148 61 157 83L177 91Z','M24 111L37 91L48 89L53 67L137 67L157 85L181 91L197 109L190 130L29 130Z'],
  truck:['M28 78L122 78L122 99L174 99L191 111L191 130L27 130Z','M28 78L91 78L91 99L28 99Z'],
  hatch:['M57 94L73 73L127 73L149 94Z','M28 111L43 96L57 93L73 73L127 73L149 93L178 99L192 114L184 129L32 129Z'],
  sedan:['M45 99L68 81L93 75L145 80L167 99Z','M24 112L42 99L68 81L145 80L167 98L190 104L198 116L188 129L29 129Z'],
  hyper:['M25 111L48 99L77 94L101 81L151 87L174 100L198 112L190 126L29 126Z','M25 111L48 99L77 94L101 81L151 87L174 100L198 112L190 126L29 126Z'],
  sport:['M51 99L75 78L132 78L157 99Z','M25 112L44 98L51 99L75 78L132 78L157 99L182 101L197 115L188 129L29 129Z']
 };
 const shapeType=truck?'truck':suv?'suv':hatch?'hatch':sedan?'sedan':hyper?'hyper':'sport';
 const sh=shapes[shapeType];
 body=`<path d="${sh[1]}" fill="${color}" stroke="#fff" stroke-opacity=".88" stroke-width="2" stroke-linejoin="round"/><path d="${sh[0]}" fill="#cfe8ff" stroke="#f4f2ff" stroke-width="3" stroke-linejoin="round"/><path d="M36 111L56 109M166 108L184 110" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="126" r="15" fill="#100b23" stroke="#d9e3ff" stroke-width="5"/><circle cx="158" cy="126" r="15" fill="#100b23" stroke="#d9e3ff" stroke-width="5"/><path d="M72 113L147 113" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>`;
 if(shapeType==='suv') body+=`<path d="M62 72L131 72L145 84L57 84Z" fill="#14233c" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`;
 if(shapeType==='truck') body+=`<path d="M38 82L82 82L82 95L38 95Z" fill="#cfe8ff"/><path d="M97 103L158 103L158 112L97 112Z" fill="#15162b"/>`;
 if(shapeType==='hatch') body+=`<path d="M77 77L123 77L141 93L65 93Z" fill="#14233c" stroke="#fff" stroke-opacity=".65" stroke-width="2"/>`;
 if(shapeType==='hyper') body+=`<path d="M88 91L117 84L148 90L133 98L80 98Z" fill="#14233c" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><path d="M31 114L52 110M169 110L190 114" stroke="#ffef9b" stroke-width="3"/>`;
 if(shapeType==='sedan') body+=`<path d="M71 84L94 78L140 82L157 96L61 96Z" fill="#14233c" stroke="#fff" stroke-opacity=".65" stroke-width="2"/>`;
 // Détails propres à certains modèles : la silhouette reste cohérente avec le véhicule nommé.
 const modelName=String(c.name||'').toLowerCase();
 if(autoType==='car'){
   if(/yaris/.test(modelName)) body+=`<path d="M79 77L111 77L135 94L66 94Z" fill="#15233b" stroke="#e9f4ff" stroke-width="2"/><path d="M32 111L51 107L47 115L31 117Z M168 107L188 111L190 117L172 115Z" fill="#f5fbff"/><path d="M87 116L133 116" stroke="#111225" stroke-width="5" stroke-linecap="round"/><path d="M96 119L124 119" stroke="#c7d5ee" stroke-width="1.5"/>`;
   else if(/golf/.test(modelName)) body+=`<path d="M73 78L123 78L142 94L61 94Z" fill="#15233b" stroke="#e9f4ff" stroke-width="2"/><path d="M30 112L50 109L45 116L29 118Z M170 109L190 112L191 118L174 116Z" fill="#f5fbff"/><path d="M76 104L144 104" stroke="#fff" stroke-opacity=".65" stroke-width="2"/>`;
   else if(/mini cooper/.test(modelName)) body+=`<path d="M77 77L124 77L139 94L65 94Z" fill="#d9efff" stroke="#fff" stroke-width="2"/><path d="M91 78L98 94M111 78L118 94" stroke="#fff" stroke-width="3"/><path d="M30 112L50 109L45 117L29 118Z M170 109L190 112L191 118L174 117Z" fill="#fff"/>`;
   else if(/model 3|model s|lucid air|polestar 2/.test(modelName)) body+=`<path d="M69 89Q101 69 139 84L157 98L60 98Z" fill="#18233c" stroke="#e9f4ff" stroke-width="2"/><path d="M31 113L54 111M166 111L190 113" stroke="#e9f4ff" stroke-width="3" stroke-linecap="round"/><path d="M90 101L131 101" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`;
   else if(/911|carrera/.test(modelName)) body+=`<path d="M69 91Q78 70 104 77L133 81L153 96L60 98Z" fill="#15233b" stroke="#e9f4ff" stroke-width="2"/><circle cx="55" cy="103" r="5" fill="#fff1bd"/><circle cx="170" cy="103" r="5" fill="#fff1bd"/><path d="M36 111L55 109M166 109L186 111" stroke="#fff" stroke-width="3"/>`;
   else if(/ferrari|lamborghini|mclaren|bugatti|koenigsegg|pagani|rimac/.test(modelName)) body+=`<path d="M31 112L55 98L85 91L110 83L153 90L177 102L193 113L188 124L31 124Z" fill="${color}" stroke="#fff" stroke-width="2"/><path d="M91 91L116 86L143 92L126 99L76 99Z" fill="#111a30" stroke="#d9eaff" stroke-width="2"/><path d="M30 111L53 108M170 108L192 111" stroke="#fff2bb" stroke-width="4" stroke-linecap="round"/>`;
 }
 if(autoType==='motorcycle'){
   if(/yzf-r1|r1/.test(modelName)) body+=`<path d="M91 82L111 84L132 97L111 102L91 96Z" fill="#f7f8ff" opacity=".9"/><path d="M104 85L113 94L105 98" stroke="#17122f" stroke-width="3" fill="none"/>`;
   else if(/ninja/.test(modelName)) body+=`<path d="M83 87L104 81L125 91L115 101L91 98Z" fill="#15172e" stroke="#eaf4ff" stroke-width="2"/><path d="M83 89L97 87" stroke="#fff" stroke-width="3"/>`;
 }
 if(autoType==='plane') body+=`<path d="M45 103L81 101L104 105L80 111Z" fill="#fff" opacity=".8"/><path d="M127 99L179 104" stroke="#fff" stroke-opacity=".75" stroke-width="2"/>`;
 if(autoType==='helicopter') body+=`<path d="M69 88Q77 77 92 78L107 91L91 101L69 99Z" fill="#d9efff" stroke="#fff" stroke-width="2"/><path d="M177 92L188 86" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
 if(variant===0) body+=`<path d="M49 95L39 84L62 88M151 91L170 85L165 98" fill="${color}" stroke="#fff" stroke-width="2"/>`;
 }
 const name=(m.name||c.name).replace(/[&<>"']/g,'');return `<svg viewBox="0 0 220 180" role="img" aria-label="${name}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="veh${c.id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${glow}"/><stop offset="1" stop-color="#241348"/></linearGradient><filter id="gl${c.id}"><feGaussianBlur stdDeviation="7"/></filter></defs><rect x="0" y="0" width="220" height="180" rx="14" fill="#17122f"/><circle cx="171" cy="35" r="22" fill="${glow}" opacity=".15"/><path d="M0 92V61H17V76H29V45H43V88H54V58H70V91H82V38H98V91H112V63H127V91H143V50H159V91H175V66H189V91H220V150H0Z" fill="#30245e" opacity=".75"/><path d="M0 143L220 113V180H0Z" fill="#111225"/><path d="M90 180L104 127H119L145 180Z" fill="#292747"/><path d="M108 143L111 143M102 160L108 160M96 175L103 175" stroke="#fff0a6" stroke-width="2.5"/><ellipse cx="110" cy="131" rx="76" ry="18" fill="${glow}" opacity=".32" filter="url(#gl${c.id})"/>${body}<path d="M28 51 L36 43 M182 54 L191 44 M109 22 L109 34" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><text x="110" y="170" text-anchor="middle" font-size="10" font-weight="900" fill="#fff" letter-spacing="2">${({motorcycle:'MOTO',scooter:'SCOOTER',escooter:'E-SCOOTER',plane:'AVION',helicopter:'HÉLICO'})[autoType]||'RACING'} · ${String(c.id).padStart(3,'0')}</text></svg>`;
}
/* ================= rendu d'une carte ================= */
function cardHTML(c, o = {}){
  const holo = !!o.holo || c.rank===5;
  const E = EL[c.el];
  const customName = (vehicleMods[c.id]?.name || c.name);
  const locked = !!o.locked;
  return `<div class="card${o.mini?' mini':''}${locked?' locked':''}" data-r="${c.rank}" style="--c1:${E.c1};--c2:${E.c2}"><div class="cf"><div class="ci">
<div class="ct"><span class="nm">${locked?'???':escapeHTML(customName)}</span><span class="eli">${icon(c.el)}</span></div>
<div class="art vehicle-art">${vehicleArt(c)}${locked?'<span class="q">?</span>':''}</div>
<div class="cm"><span class="rr">${RAR[c.rank].n}</span><span class="num">${pad(c.id)}/${TOTAL}</span></div>
<div class="cs"><span>V-MAX <b>${vehicleStats(c).speed}</b></span><span>ACC <b>${vehicleStats(c).accel}</b></span></div>
</div>${holo&&!locked?'<i class="foil"></i>':''}</div>${o.count>1?`<span class="cnt">×${o.count}</span>`:''}${o.isNew?'<span class="tag">Nouvelle</span>':''}</div>`;
}


/* Fiche verso : statistiques détaillées de toutes les cartes */
(function setupCardBack(){
 const style=document.createElement('style');style.textContent='.card-back-overlay{position:fixed;inset:0;z-index:100100;background:#050611dd;display:grid;place-items:center;padding:16px}.card-back-panel{width:min(440px,100%);max-height:90dvh;overflow:auto;background:linear-gradient(145deg,#1a1435,#090d1c);border:1px solid #9d8cff88;border-radius:22px;padding:18px;box-shadow:0 24px 70px #000b}.card-back-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0}.card-back-stat{padding:12px;border:1px solid #ffffff20;border-radius:12px;background:#ffffff08}.card-back-stat b{display:block;font-size:1.15rem;color:#c4b5fd}.card-back-stat span{font-size:.76rem;color:#c5c2d7}.card{cursor:pointer;transition:transform .18s,filter .18s}.card:hover{transform:translateY(-3px) rotateX(2deg);filter:brightness(1.08)}';document.head.appendChild(style);
 document.addEventListener('click',e=>{const card=e.target.closest('.card');if(!card||e.target.closest('button,select,a'))return;/* Le verso détaillé est réservé à Collection et Album : jamais pendant l'ouverture d'un booster ni dans les autres écrans. */if(!card.closest('#tab-collection, #tab-albums'))return;e.stopImmediatePropagation();const wrap=card.closest('[data-card-id]');let id=+(card.dataset.id||wrap?.dataset.cardId||0);if(!id){const num=card.querySelector('.num')?.textContent||'';id=+(num.split('/')[0]||0);}const c=CARDS.find(x=>x.id===id);if(!c)return;document.querySelector('.card-back-overlay')?.remove();const st=vehicleStats(c),owned=state.owned[c.id]?.n||0,value=RAR[c.rank].dust;const overlay=document.createElement('div');overlay.className='card-back-overlay';overlay.innerHTML=`<section class="card-back-panel" role="dialog" aria-modal="true" aria-label="Statistiques de la carte"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><div class="eyebrow">VERSO DE LA CARTE · #${pad(c.id)}</div><h2 style="margin:5px 0">${escapeHTML(vehicleMods[c.id]?.name||c.name)}</h2></div><button class="btn secondary small" data-close-card-back type="button">✕</button></div><div style="max-width:250px;margin:8px auto">${vehicleArt(c)}</div><p class="quest-desc">${escapeHTML(c.flavor||'Véhicule de la collection Nébulines.')}</p><div class="card-back-grid"><div class="card-back-stat"><b>${value} Orbres</b><span>Valeur de base</span></div><div class="card-back-stat"><b>${RAR[c.rank].n}</b><span>Rareté</span></div><div class="card-back-stat"><b>${st.speed} km/h</b><span>Vitesse maximale</span></div><div class="card-back-stat"><b>${st.accel}/100</b><span>Accélération</span></div><div class="card-back-stat"><b>${st.handling}/100</b><span>Maniabilité</span></div><div class="card-back-stat"><b>${c.atk||0}</b><span>Puissance (ATK)</span></div><div class="card-back-stat"><b>${c.pv||0}</b><span>Résistance (PV)</span></div><div class="card-back-stat"><b>${owned}</b><span>Exemplaires possédés</span></div></div><button class="btn primary" style="width:100%" data-close-card-back type="button">Retour à la collection</button></section>`;document.body.appendChild(overlay);overlay.addEventListener('click',ev=>{if(ev.target===overlay||ev.target.closest('[data-close-card-back]'))overlay.remove();});});
})();

/* ================= état et sauvegarde ================= */
const KEY = 'nebulines.v1';
const INTERVAL = 10*60*1000, CAP = 10, START_STOCK = 3, PACK_COST = 80;
const fresh = () => ({v:1, owned:{}, mutations:{}, incomeSlots:['','','','',''], incomeLast:Date.now(), stock:START_STOCK, last:Date.now(), dust:0, opened:0, pity:0, recent:[], daily:{lastClaim:'',streak:0}, quests:{recycled:0,claimed:[]}, rotatingQuests:{slot:Math.floor(Date.now()/21600000),opened:0,recycled:0,claimed:[]}, albums:{claimed:[]}, auctions:[], wins:0, contest:{joined:false}, friends:[], trades:[], marketHour:Math.floor(Date.now()/3600000), marketIds:[]});
function load(){
  try{
    const s = JSON.parse(localStorage.getItem(KEY));
    if(s && s.v===1 && s.owned){
      // Migration douce : les anciennes sauvegardes restent compatibles.
      if(!s.daily || typeof s.daily!=='object') s.daily = {lastClaim:'',streak:0};
      if(!s.quests || typeof s.quests!=='object') s.quests={recycled:0,claimed:[]};
      if(!Number.isFinite(s.quests.recycled)||s.quests.recycled<0) s.quests.recycled=0;
      if(!Array.isArray(s.quests.claimed)) s.quests.claimed=[];
      if(!s.rotatingQuests || typeof s.rotatingQuests!=='object') s.rotatingQuests={slot:Math.floor(Date.now()/21600000),opened:0,recycled:0,claimed:[]};
      if(!Array.isArray(s.rotatingQuests.claimed)) s.rotatingQuests.claimed=[];
      if(!s.albums || typeof s.albums!=='object') s.albums={claimed:[]}; if(!Array.isArray(s.albums.claimed)) s.albums.claimed=[];
      if(!Array.isArray(s.auctions)) s.auctions=[]; if(!Number.isFinite(s.wins)) s.wins=0;
      if(!s.contest || typeof s.contest!=='object') s.contest={joined:false};
      if(!Array.isArray(s.friends)) s.friends=[];
      if(!Array.isArray(s.trades)) s.trades=[]; if(!s.mutations||typeof s.mutations!=='object')s.mutations={}; if(!Array.isArray(s.incomeSlots))s.incomeSlots=['','','','','']; if(!Number.isFinite(s.incomeLast))s.incomeLast=Date.now();
      if(typeof s.daily.lastClaim!=='string') s.daily.lastClaim='';
      if(!Number.isFinite(s.daily.streak) || s.daily.streak<0) s.daily.streak=0;
      if(!Array.isArray(s.recent)) s.recent=[];
      if(!Number.isFinite(s.opened) || s.opened<0) s.opened=0;
      if(!Number.isFinite(s.stock) || s.stock<0) s.stock=START_STOCK;
      if(!Number.isFinite(s.last)) s.last=Date.now();
      if(!Number.isFinite(s.dust) || s.dust<0) s.dust=0;
      if(!Number.isFinite(s.pity) || s.pity<0) s.pity=0;
      return s;
    }
  }catch(e){}
  return fresh();
}
let state = load();
// API relative : quand le jeu et le serveur sont hébergés ensemble, aucune URL à modifier.
const API_BASE = (window.NEBULINES_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'nebulines.auth.token';
let authToken = localStorage.getItem(TOKEN_KEY) || '';
let currentUser = null;
let syncTimer = null;
let lastSyncedOwned = null;
let resettingProgress = false;
async function api(path, options={}){
  const headers = {'Content-Type':'application/json', ...(options.headers||{})};
  if(authToken) headers.Authorization = 'Bearer ' + authToken;
  let response;
  try { response = await fetch(API_BASE + path, {...options, headers}); }
  catch { throw new Error('Serveur inaccessible. Il faut héberger le serveur et ouvrir le jeu depuis son adresse en ligne.'); }
  const data = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error || 'Une erreur serveur est survenue.');
  return data;
}
function accountMessage(message, good=false){ const el=$('#accountStatus'); if(el){el.textContent=message;el.style.color=good?'var(--mint)':'var(--muted)';} }
function updateAccountUI(){
  const logged=!!(authToken&&currentUser);
  $('#logoutAccount').hidden=!logged;
  $('#accountUsername').disabled=logged; $('#accountPassword').disabled=logged;
  $('#accountForm').querySelector('[data-account-mode="login"]').hidden=logged;
  $('#registerAccount').hidden=logged;
  if(logged){accountMessage('Connecté en tant que '+currentUser.username,true);$('#accountPassword').value='';}
  else if(!authToken) accountMessage('Mode local · non connecté');
}
function serverCollection(){ return state.owned || {}; }
async function syncCollection(){
  if(resettingProgress||!authToken||!currentUser) return;
  try {
    const me=await api('/api/me');
    const remote=me.user.collection||{};
    const baseline=lastSyncedOwned||{};
    const merged={...remote};
    const ids=new Set([...Object.keys(remote),...Object.keys(state.owned||{}),...Object.keys(baseline)]);
    for(const id of ids){
      const local=state.owned[id], base=baseline[id], server=remote[id];
      const delta=(Number(local?.n)||0)-(Number(base?.n)||0);
      let n=Math.max(0,(Number(server?.n)||0)+delta);
      if(n===0) delete merged[id];
      else merged[id]={n,h:Math.max(Number(server?.h)||0,Number(local?.h)||0)};
    }
    await api('/api/me/collection',{method:'PUT',body:JSON.stringify({collection:merged,dust:state.dust})});
    state.owned=merged; lastSyncedOwned=JSON.parse(JSON.stringify(merged));
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
  } catch(e){ accountMessage('Sauvegarde en ligne non synchronisée : '+e.message); }
}
function scheduleSync(){ if(resettingProgress||!authToken||!currentUser)return; clearTimeout(syncTimer); syncTimer=setTimeout(syncCollection,900); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} scheduleSync(); }
// Sauvegarde de sécurité à la fermeture / mise en arrière-plan et périodiquement.
function saveLocalSnapshot(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
window.addEventListener('pagehide',saveLocalSnapshot);
window.addEventListener('beforeunload',saveLocalSnapshot);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveLocalSnapshot();});
setInterval(saveLocalSnapshot,15000);



function tick(s, now){
  if(s.last > now) s.last = now;
  if(s.stock >= CAP){ s.last = now; return 0; }
  const k = Math.floor((now - s.last)/INTERVAL);
  if(k <= 0) return 0;
  const gain = Math.min(k, CAP - s.stock);
  s.stock += gain;
  s.last = s.stock >= CAP ? now : s.last + k*INTERVAL;
  return gain;
}

/* tirage */
// Taux pondérés par carte : légendaires nettement plus rares dans les packs standards.
const T1 = [72,22,5,0.8,0.18,0.02], T2 = [0,70,22,6.8,1.15,0.05], T3 = [0,0,78,18,3.7,0.3];
function rollRank(t){
  let x = Math.random()*t.reduce((a,b)=>a+b,0);
  for(let i=0;i<t.length;i++){ if(t[i]>0 && (x-=t[i])<0) return i; }
  return 1;
}
function rollEventPack(){
 const pulls=[];
 for(let i=0;i<5;i++){
  const r=Math.random();let card;
  if(r<.005) card=EVENT_CARDS[39];
  else if(r<.015) card=EVENT_CARDS[35];
  else if(r<.025) card=EVENT_CARDS[36];
  else if(r<.035) card=EVENT_CARDS[37];
  else if(r<.045) card=EVENT_CARDS[38];
  else card=EVENT_CARDS[Math.floor(Math.random()*35)];
  pulls.push({card,holo:card.rank>=4||Math.random()<.2});
 }
 return pulls;
}
function rollPack(){
  const ranks = [rollRank(T1),rollRank(T1),rollRank(T1),rollRank(T1)];
  let last = rollRank(T2);
  if(state.pity>=6 && ![...ranks,last].some(r=>r>=2)) last = rollRank(T3);
  ranks.push(last);
  state.pity = ranks.some(r=>r>=2) ? 0 : state.pity+1;
  ranks.sort((a,b)=>a-b);
  return ranks.map(rk => {
    const pool = selectedBoosterTheme==='apex' ? APEX_CARDS.filter(c=>c.rank===rk) : BYRANK[rk];
    const safePool=pool.length?pool:BYRANK[rk];
    return {card:safePool[Math.floor(Math.random()*safePool.length)], holo: rk===5 || Math.random()<.1};
  });
}


const MUTATIONS={normal:{name:'Normale',mult:1,rate:0},bronze:{name:'Bronze',mult:1.5,rate:0.12},argent:{name:'Argent',mult:2,rate:0.07},or:{name:'Or',mult:2.5,rate:0.03},platinum:{name:'Platine astrale',mult:3,rate:0.01},night:{name:'Nuit',mult:2.3,rate:1}};
function rollMutation(card){if(card.event)return 'night';const r=Math.random();if(r<.01)return 'platinum';if(r<.04)return 'or';if(r<.11)return 'argent';if(r<.23)return 'bronze';return 'normal';}
function mutationFor(id){const c=CARDS[id-1];return c?.event?'night':(state.mutations?.[id]||'normal');}
function mutationMult(id){return MUTATIONS[mutationFor(id)]?.mult||1;}
function addPulledCard(p){const id=p.card.id;state.owned=state.owned||{};state.mutations=state.mutations||{};if(!state.owned[id]){state.owned[id]={n:1,h:p.holo?1:0};state.mutations[id]=p.card.event?'night':rollMutation(p.card);}else{state.owned[id].n++;if(p.holo)state.owned[id].h++;if(p.card.event)state.mutations[id]='night';} }

/* recyclage */
function removableHolo(o){ return !(o.n-o.h>0); }
function recycleOne(id){
  const o = state.owned[id]; if(!o || o.n<=1) return 0;
  const c = CARDS[id-1], hol = removableHolo(o);
  o.n--; if(hol) o.h--;
  const v = RAR[c.rank].dust*(hol?2:1);
  state.dust += v; state.quests = state.quests || {recycled:0,claimed:[]}; state.quests.recycled++; return v;
}
function dupInfo(){
  let n=0, v=0;
  for(const id in state.owned){
    const o = state.owned[id], c = CARDS[id-1]; let nn=o.n, hh=o.h;
    while(nn>1){ if(nn-hh>0){nn--;v+=RAR[c.rank].dust;} else {nn--;hh--;v+=RAR[c.rank].dust*2;} n++; }
  }
  return {n,v};
}
const craftCost = c => RAR[c.rank].dust*4;

/* ================= interface ================= */
const toastEl = $('#toast'); let toastT = 0;
function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(()=>toastEl.classList.remove('show'), 2400); }

let locks = 0;
const lock = () => { if(locks++===0) document.body.style.overflow='hidden'; };
const unlock = () => { if(--locks<=0){ locks=0; document.body.style.overflow=''; } };

const fmt = ms => { const s = Math.max(0,Math.ceil(ms/1000)); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
const dustSVG = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${ICON.lumiere}"/></svg>`;

function buildPips(){
  $('#pips').innerHTML = Array.from({length:CAP},()=>'<i></i>').join('')+'<em id="extra"></em>';
}
function dateKey(d = new Date()){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dailyInfo(){
  const daily = state.daily || (state.daily={lastClaim:'',streak:0});
  const today = dateKey();
  const yd = new Date(); yd.setDate(yd.getDate()-1);
  const claimed = daily.lastClaim===today;
  const streak = claimed ? Math.max(1,daily.streak) : (daily.lastClaim===dateKey(yd) ? daily.streak+1 : 1);
  return {claimed,streak,reward:25+Math.min(streak,7)*5,weekly:streak%7===0};
}
function renderDaily(){
  const d = dailyInfo();
  const btn = $('#dailyClaim');
  if(d.claimed){
    $('#dailyTitle').textContent = 'Cadeau récupéré !';
    $('#dailySub').textContent = `Série actuelle : ${state.daily.streak} jour${state.daily.streak>1?'s':''}. Reviens demain.`;
    $('#dailyReward').textContent = 'À demain ✦';
    btn.textContent = 'Déjà récupéré'; btn.disabled = true;
  }else{
    $('#dailyTitle').textContent = 'Des Orbres t’attendent';
    $('#dailySub').textContent = `Jour ${d.streak} de ta série${d.weekly?' · booster bonus !':''}`;
    $('#dailyReward').textContent = `+${d.reward} ✦${d.weekly?' + 1 booster':''}`;
    btn.textContent = 'Récupérer'; btn.disabled = false;
  }
}
function renderStats(){
  const found = CARDS.filter(c=>state.owned[c.id]);
  const best = found.reduce((m,c)=>Math.max(m,c.rank),-1);
  $('#homeOpened').textContent = state.opened || 0;
  $('#homeUnique').textContent = `${found.length} / ${TOTAL}`;
  $('#homeBest').textContent = best<0 ? '—' : RAR[best].k;
  $('#homeBest').title = best<0 ? 'Aucune carte trouvée' : RAR[best].n;
}
function renderHome(){
  $('#dust').textContent = state.dust;
  $('#stockBadge').textContent = state.stock;
  $$('#pips i').forEach((p,i)=>p.classList.toggle('on', i<state.stock));
  const ex = $('#extra'); if(ex) ex.textContent = state.stock>CAP ? '+'+(state.stock-CAP) : '';
  const now = Date.now();
  if(state.stock>=CAP){
    $('#tLabel').textContent = 'Réserve pleine'; $('#tTime').textContent = '--:--'; $('#tBar').style.width = '100%';
  } else {
    const rem = INTERVAL-(now-state.last);
    $('#tLabel').textContent = 'Prochain booster dans'; $('#tTime').textContent = fmt(rem);
    $('#tBar').style.width = Math.max(0,Math.min(100,(1-rem/INTERVAL)*100))+'%';
  }
  $('#openBtn').disabled = state.stock<1;
  $('#openAllBtn').disabled = state.stock<1;
  const buy = $('#buyBtn');
  buy.innerHTML = `Acheter · ${PACK_COST} <span class="gold">${dustSVG}</span>`;
  buy.disabled = state.dust<PACK_COST;
  const qty = $('#buyPackCount'); const chosen = $('#buyChosenBtn');
  if(qty && chosen){ const n=Math.max(1,Math.min(500,Math.floor(Number(qty.value)||1))); chosen.textContent=`Acheter ${n} · ${PACK_COST*n} ✦`; chosen.disabled=state.dust<PACK_COST*n; }
  renderDaily(); renderStats();
  const topStock=$('#boosterTopStock'),topLabel=$('#boosterTopLabel'),topTime=$('#boosterTopTime'),topBar=$('#boosterTopBar');
  if(topStock)topStock.textContent=`${state.stock}/${CAP}`;
  if(topLabel&&topTime&&topBar){if(state.stock>=CAP){topLabel.textContent='Réserve pleine';topTime.textContent='MAX';topBar.style.width='100%';}else{const rem=INTERVAL-(Date.now()-state.last);topLabel.textContent='Prochain booster dans';topTime.textContent=fmt(rem);topBar.style.width=Math.max(0,Math.min(100,(1-rem/INTERVAL)*100))+'%';}}
}
function renderRecent(){
  const box = $('#recent');
  if(!state.recent.length){ box.innerHTML = '<p class="empty">Ouvre ton premier booster pour voir tes cartes ici.</p>'; box.style.display='block'; return; }
  box.style.display='';
  box.innerHTML = state.recent.map(id => {
    const c = CARDS[id-1], o = state.owned[id];
    return `<div class="cell" role="button" tabindex="0" data-id="${id}" aria-label="${c.name}">${cardHTML(c,{mini:true,holo:o&&o.h>0})}</div>`;
  }).join('');
}

/* collection */
const F = {el:'all', rar:'all', miss:false, search:''};
let dirty = true;
const recycleCtl = makeConfirm($('#recycleAll'), () => { const d=dupInfo(); return d.n? `Recycler ${d.n} doublon${d.n>1?'s':''} (+${d.v} ✦)` : 'Aucun doublon à recycler'; }, () => {
  const d = dupInfo(); if(!d.n) return;
  for(const id in state.owned) while(state.owned[id].n>1) recycleOne(id);
  save(); toast(`+${d.v} ✦ de Orbres`); refreshAll();
});
function makeConfirm(btn, labelFn, onOk){
  let armed=false, t=0;
  const set = () => { btn.textContent = armed ? 'Appuie encore pour confirmer' : labelFn(); };
  btn.addEventListener('click', () => {
    if(btn.dataset.empty==='1') return;
    if(!armed){ armed=true; set(); clearTimeout(t); t=setTimeout(()=>{armed=false;set();},3500); }
    else { armed=false; clearTimeout(t); onOk(); set(); }
  });
  return {refresh(){ if(!armed) set(); }};
}
function buildFilters(){
  const chips = [`<button class="chip" type="button" data-el="all" aria-pressed="true">Tous</button>`]
    .concat(ELS.map(k => `<button class="chip" type="button" data-el="${k}" aria-pressed="false" style="--ec:${EL[k].ec}">${icon(k)}${EL[k].n}</button>`));
  $('#elChips').innerHTML = chips.join('');
  $('#rarSel').innerHTML = '<option value="all">Toutes raretés</option>' + RAR.map((r,i)=>`<option value="${i}">${r.n}</option>`).join('');
  const sort=$('#sortSel');if(sort)sort.value=F.sort||'default';
}

function incomeRate(id){const c=CARDS[id-1];if(!c)return 0;return Math.max(1,Math.round((8+c.rank*7)*mutationMult(id)));}
function collectIncome(render=true){state.incomeSlots=Array.isArray(state.incomeSlots)?state.incomeSlots:['','','','',''];const now=Date.now(),elapsed=Math.max(0,Math.floor((now-(state.incomeLast||now))/3600000));let earned=0;if(elapsed>0){for(const id of state.incomeSlots){if(id&&state.owned[id])earned+=incomeRate(+id)*elapsed;}state.dust+=earned;state.incomeLast+=elapsed*3600000;save();}if(render)renderIncome();return {elapsed,earned};}
function renderIncome(){const slots=$('#incomeSlots');if(!slots)return;state.incomeSlots=Array.isArray(state.incomeSlots)?state.incomeSlots:['','','','',''];const owned=CARDS.filter(c=>state.owned[c.id]?.n>0);slots.innerHTML=state.incomeSlots.map((id,i)=>{const c=owned.find(x=>String(x.id)===String(id));const options='<option value="">Choisir une carte…</option>'+owned.map(x=>`<option value="${x.id}" ${String(x.id)===String(id)?'selected':''}>${escapeHTML(x.name)} · ${MUTATIONS[mutationFor(x.id)].name} ×${MUTATIONS[mutationFor(x.id)].mult}</option>`).join('');return `<div class="income-slot"><label>Emplacement ${i+1}</label><select id="incomeSelect${i}" class="picker-source" data-income-slot="${i}" aria-label="Carte productive ${i+1}">${options}</select><div id="incomePicker${i}" class="card-picker"></div><p>${c?`${escapeHTML(c.name)} · ${MUTATIONS[mutationFor(c.id)].name}<br><b>+${incomeRate(+id)} ✦/h</b>`:'Aucune carte placée'}</p></div>`;}).join('');const total=state.incomeSlots.reduce((n,id)=>n+(id&&state.owned[id]?incomeRate(+id):0),0);$('#incomeSummary').innerHTML=`<b>Production totale : +${total} Orbres/heure</b><p class="quest-desc">Bronze ×1,5 · Argent ×2 · Or ×2,5 · Platine astrale ×3 · Nuit ×2,3</p>`;}
$('#incomeSlots')?.addEventListener('change',e=>{const sel=e.target.closest('[data-income-slot]');if(!sel)return;const i=+sel.dataset.incomeSlot,id=sel.value;state.incomeSlots=state.incomeSlots||['','','','',''];if(id&&state.incomeSlots.some((v,j)=>j!==i&&String(v)===String(id))){toast('Chaque emplacement doit utiliser une carte différente.');sel.value=state.incomeSlots[i]||'';return;}state.incomeSlots[i]=id;save();renderIncome();renderCardPickers();});
$('#claimIncomeBtn')?.addEventListener('click',()=>{const r=collectIncome(false);renderHome();renderIncome();renderCardPickers();$('#incomeStatus').textContent=r.elapsed?`Gains récupérés : +${r.earned} ✦ pour ${r.elapsed} heure(s).`:'Pas encore une heure complète depuis la dernière récupération.';toast(r.earned?`+${r.earned} Orbres gagnés !`:'Aucun gain pour le moment.');});

function renderCollection(){
  dirty = false;
  const o = state.owned;
  const have = CARDS.filter(c=>o[c.id]).length;
  $('#cHave').textContent = `${have} / ${TOTAL}`;
  $('#cPct').textContent = Math.round(have/TOTAL*100)+' %';
  $('#cBar').style.width = (have/TOTAL*100)+'%';
  $('#legend').innerHTML = RAR.map((r,i)=>{
    const tot = BYRANK[i].length, h = BYRANK[i].filter(c=>o[c.id]).length;
    return `<span style="--rc:${RCOL[i]}"><i></i>${r.k} ${h}/${tot}</span>`;
  }).join('');
  $$('#elChips .chip').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.el===F.el)));
  $('#missChip').setAttribute('aria-pressed', String(F.miss));
  const term = F.search.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
  const list = CARDS.filter(c => (F.el==='all'||c.el===F.el) && (F.rar==='all'||c.rank===+F.rar) && (!F.miss||!o[c.id]) && (!term||c.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').includes(term)));
  const sortMode=$('#sortSel')?.value||F.sort||'default';
  if(sortMode==='rarity-desc')list.sort((a,b)=>b.rank-a.rank||a.name.localeCompare(b.name,'fr'));
  else if(sortMode==='rarity-asc')list.sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name,'fr'));
  else if(sortMode==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  F.sort=sortMode;
  $('#listCount').textContent = list.length+' carte'+(list.length>1?'s':'');
  $('#grid').innerHTML = list.length ? list.map(c => {
    const ow = o[c.id];
    return `<div class="cell" role="button" tabindex="0" data-id="${c.id}" aria-label="${ow?c.name:'Carte '+pad(c.id)+' manquante'}">${cardHTML(c,{mini:true,locked:!ow,holo:ow&&ow.h>0,count:ow?ow.n:0})}${ow?`<p class="mutation-tag">${MUTATIONS[mutationFor(c.id)].name} · ×${MUTATIONS[mutationFor(c.id)].mult}</p>`:''}</div>`;
  }).join('') : '<p class="empty" style="grid-column:1/-1">Aucune carte ne correspond à ces filtres.</p>';
  const d = dupInfo(); $('#recycleAll').dataset.empty = d.n?'0':'1'; $('#recycleAll').disabled = !d.n;
  recycleCtl.refresh();
}
const QUESTS = [
  {id:'recycle1',title:'Premier recyclage',desc:'Recycle 1 carte en double.',goal:1,reward:20,progress:()=>state.quests.recycled},
  {id:'recycle10',title:'Écolo des étoiles',desc:'Recycle 10 cartes en double au total.',goal:10,reward:100,progress:()=>state.quests.recycled},
  {id:'recycle100',title:'Maître recycleur',desc:'Recycle 100 cartes en double au total.',goal:100,reward:600,progress:()=>state.quests.recycled},
  {id:'open5',title:'Ouverture en série',desc:'Ouvre 5 boosters.',goal:5,reward:50,progress:()=>state.opened},
  {id:'open25',title:'Chasseur de nébuleuses',desc:'Ouvre 25 boosters.',goal:25,reward:180,progress:()=>state.opened},
  {id:'discover10',title:'Petit collectionneur',desc:'Découvre 10 véhicules différentes.',goal:10,reward:100,progress:()=>Object.keys(state.owned).length},
  {id:'discover60',title:'Gardien de la galaxie',desc:'Découvre 60 véhicules différentes.',goal:60,reward:500,progress:()=>Object.keys(state.owned).length}
];
function updateQuestBadge(){
  const ready=QUESTS.filter(q=>Math.min(q.goal,q.progress())>=q.goal&&!state.quests?.claimed?.includes(q.id)).length;
  const badge=$('#questBadge');if(!badge)return;
  badge.textContent=String(ready);badge.style.display=ready>0?'flex':'none';
  badge.setAttribute('aria-label',ready+' quête'+(ready>1?'s':'')+' terminée'+(ready>1?'s':'')+' à récupérer');
}
(function setupNotices(){
  // Les notifications masquées restent masquées après fermeture et redémarrage.
  let hiddenNotices=[];try{hiddenNotices=JSON.parse(localStorage.getItem('nebulines.hiddenNotices')||'[]')}catch(e){hiddenNotices=[]}
  hiddenNotices.forEach(id=>{const el=document.querySelector(`[data-notice="${id}"]`);if(el)el.hidden=true;});
  $('#noticeBoard')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-dismiss-notice]');
    if(!b)return;
    const id=b.dataset.dismissNotice;
    const el=document.querySelector(`[data-notice="${id}"]`);
    if(el)el.hidden=true;
    try{const hidden=JSON.parse(localStorage.getItem('nebulines.hiddenNotices')||'[]');if(!hidden.includes(id))hidden.push(id);localStorage.setItem('nebulines.hiddenNotices',JSON.stringify(hidden));}catch(e){}
    updateNoticeCount();
  });
})();
const ROTATING_QUESTS=[
 {id:'open2',title:'Ouverture express',desc:'Ouvre 2 boosters pendant cette période.',goal:2,reward:35,progress:()=>state.opened-(state.rotatingQuests?.opened||0)},
 {id:'discover3',title:'Nouvelle constellation',desc:'Possède au moins 3 cartes différentes.',goal:3,reward:45,progress:()=>Object.keys(state.owned).filter(id=>state.owned[id]?.n>0).length},
 {id:'recycle2',title:'Tri des doublons',desc:'Recycle 2 cartes en double pendant cette période.',goal:2,reward:40,progress:()=>state.quests.recycled-(state.rotatingQuests?.recycled||0)}
];
function rotateQuests(){
 const slot=Math.floor(Date.now()/21600000); state.rotatingQuests=state.rotatingQuests||{slot,opened:state.opened,recycled:state.quests?.recycled||0,claimed:[]};
 if(state.rotatingQuests.slot!==slot){state.rotatingQuests={slot,opened:state.opened,recycled:state.quests?.recycled||0,claimed:[]};save();}
}
function renderRotatingQuests(){
 rotateQuests(); const qstate=state.rotatingQuests; const left=21600000-(Date.now()%21600000); const hh=Math.floor(left/3600000),mm=Math.floor((left%3600000)/60000),ss=Math.floor((left%60000)/1000);
 const timer=$('#rotatingQuestTimer'); if(timer)timer.textContent=`Nouvelles quêtes dans ${hh} h ${String(mm).padStart(2,'0')} min ${String(ss).padStart(2,'0')} s`;
 const box=$('#rotatingQuestList'); if(!box)return; box.innerHTML=ROTATING_QUESTS.map(q=>{const n=Math.max(0,Math.min(q.goal,q.progress())),done=qstate.claimed.includes(q.id),ready=n>=q.goal&&!done;return `<div class="quest-card"><div class="quest-top"><div><strong>${q.title}</strong><p class="quest-desc">${q.desc}</p></div><span class="quest-reward">+${q.reward} ✦</span></div><div class="tline"><span>${done?'Récompense récupérée':n+' / '+q.goal}</span><span>${Math.floor(n/q.goal*100)}%</span></div><div class="quest-track"><i style="width:${n/q.goal*100}%"></i></div><button class="btn ${ready?'primary':'secondary'} small" data-claim-rotating="${q.id}" ${ready?'':'disabled'}>${done?'Récupérée':ready?'Récupérer la récompense':'Continuer'}</button></div>`}).join('');
}
function renderQuests(){
  state.quests=state.quests||{recycled:0,claimed:[]}; renderRotatingQuests();
  $('#questList').innerHTML=QUESTS.map(q=>{const n=Math.min(q.goal,q.progress()),done=state.quests.claimed.includes(q.id),ready=n>=q.goal&&!done;return `<div class="quest-card"><div class="quest-top"><div><strong>${q.title}</strong><p class="quest-desc">${q.desc}</p></div><span class="quest-reward">+${q.reward} ✦</span></div><div class="tline"><span>${done?'Récompense récupérée':n+' / '+q.goal}</span><span>${Math.floor(n/q.goal*100)}%</span></div><div class="quest-track"><i style="width:${n/q.goal*100}%"></i></div><button class="btn ${ready?'primary':'secondary'} small" data-claim-quest="${q.id}" ${ready?'':'disabled'}>${done?'Récupérée':ready?'Récupérer la récompense':'Continuer'}</button></div>`}).join('');
  updateQuestBadge();
  $('#friendList').innerHTML=state.friends.length?state.friends.map((f,i)=>`<div class="social-item"><span>🌙 <strong>${escapeHTML(f)}</strong></span><button class="btn secondary small" data-remove-friend="${i}" type="button">Retirer</button></div>`).join(''):'<p class="empty">Pas encore d’amis ajoutés.</p>';
  $('#tradeFriend').innerHTML='<option value="">Choisir un ami…</option>'+state.friends.map(f=>`<option value="${escapeHTML(f)}">${escapeHTML(f)}</option>`).join('');
  const doubles=CARDS.filter(c=>state.owned[c.id]?.n>1);
  $('#tradeCard').innerHTML='<option value="">Choisir une carte en double…</option>'+doubles.map(c=>`<option value="${c.id}">${escapeHTML(c.name)} ×${state.owned[c.id].n}</option>`).join('');
  $('#tradeList').innerHTML=state.trades.length?state.trades.slice().reverse().map(t=>`<div class="social-item"><span>🔁 ${escapeHTML(t.card)} → <strong>${escapeHTML(t.friend)}</strong><br><small class="quest-desc">Proposition locale · ${escapeHTML(t.status||'En attente')}</small></span></div>`).join(''):'<p class="empty">Aucune proposition pour le moment.</p>';
}
async function refreshServerSocial(){
  if(!authToken||!currentUser){renderQuests();return;}
  try{
    const [friendsData,tradesData]=await Promise.all([api('/api/friends'),api('/api/trades')]);
    const friends=friendsData.friends||[];
    $('#friendList').innerHTML=friends.length?friends.map(f=>{
      const incoming=f.status==='pending' && f.direction==='incoming';
      const status=f.status==='accepted'?'Ami':incoming?'Demande reçue':'Demande envoyée';
      return `<div class="social-item"><span>🌙 <strong>${escapeHTML(f.username)}</strong><br><small class="quest-desc">${status}</small></span>${incoming?`<button class="btn primary small" data-accept-friend="${escapeHTML(f.username)}" type="button">Accepter</button>`:''}${f.status==='accepted'?`<button class="btn secondary small" data-view-friend="${escapeHTML(f.username)}" type="button">Voir les cartes</button>`:''}</div>`;
    }).join(''):'<p class="empty">Pas encore d’amis. Ajoute un pseudo existant.</p>';
    const accepted=friends.filter(f=>f.status==='accepted').map(f=>f.username);
    $('#tradeFriend').innerHTML='<option value="">Choisir un ami…</option>'+accepted.map(f=>`<option value="${escapeHTML(f)}">${escapeHTML(f)}</option>`).join('');
    const doubles=CARDS.filter(c=>state.owned[c.id]?.n>1);
    $('#tradeCard').innerHTML='<option value="">Choisir une carte en double…</option>'+doubles.map(c=>`<option value="${c.id}">${escapeHTML(c.name)} ×${state.owned[c.id].n}</option>`).join('');
    const trades=tradesData.trades||[];
    $('#tradeList').innerHTML=trades.length?trades.map(t=>`<div class="social-item"><span>🔁 ${escapeHTML(t.fromUsername)} → <strong>${escapeHTML(t.toUsername)}</strong><br><small class="quest-desc">${escapeHTML(CARDS[(Number(t.cardId)||1)-1]?.name||('Carte '+t.cardId))} · ${escapeHTML(t.status)}</small></span>${t.status==='pending'&&t.toUsername===currentUser.username?`<span><button class="btn primary small" data-accept-trade="${t.id}" type="button">Accepter</button> <button class="btn secondary small" data-decline-trade="${t.id}" type="button">Refuser</button></span>`:''}</div>`).join(''):'<p class="empty">Aucune proposition pour le moment.</p>';
    $('#tradeHelp').textContent='Les propositions sont envoyées au serveur. Un échange accepté transfère la carte dans les collections en ligne.';
  }catch(e){accountMessage('Connecté, mais actualisation impossible : '+e.message);}
}
async function authenticate(mode){
  const username=$('#accountUsername').value.trim(),password=$('#accountPassword').value;
  const localDustBeforeRegister=Number(state.dust)||0;
  const localOwnedBeforeRegister=JSON.parse(JSON.stringify(state.owned||{}));
  try{
    const data=await api('/api/'+mode,{method:'POST',body:JSON.stringify({username,password})});
    authToken=data.token;localStorage.setItem(TOKEN_KEY,authToken);currentUser=data.user;
    const remote=data.user.collection||{};
    if(mode==='register'){
      // Migration de la partie invitée vers le compte nouvellement créé + bonus serveur de 160 Orbres.
      state.owned=Object.keys(remote).length?remote:localOwnedBeforeRegister;
      state.dust=(Number(data.user.dust)||0)+localDustBeforeRegister;
      lastSyncedOwned=JSON.parse(JSON.stringify(remote));
    } else {
      // À la connexion, le serveur est la source de vérité pour le compte et sa sauvegarde.
      state.owned=remote;
      state.dust=Number(data.user.dust)||0;
      lastSyncedOwned=JSON.parse(JSON.stringify(remote));
    }
    updateAccountUI();refreshAll();await syncCollection();save();await refreshServerSocial();
    accountMessage((mode==='register'?'Compte créé · +160 Orbres de bienvenue':'Connexion réussie')+' · '+currentUser.username,true);toast(mode==='register'?'Bienvenue sur Nébulines ! +160 Orbres':'Nébulines connecté !');
  }catch(e){accountMessage(e.message);toast(e.message);}
}

async function finishGoogleLogin(data){
  authToken=data.token;localStorage.setItem(TOKEN_KEY,authToken);currentUser=data.user;
  const remote=data.user.collection||{};
  if(data.isNew){
    // Bonus de 160 Orbres attribué par le serveur. On ne copie pas le solde local.
    state.owned=Object.keys(remote).length?remote:(state.owned||{});
    state.dust=Number(data.user.dust)||160;
    lastSyncedOwned=JSON.parse(JSON.stringify(remote));
  }else{
    state.owned=remote;state.dust=Number(data.user.dust)||0;
    lastSyncedOwned=JSON.parse(JSON.stringify(remote));
  }
  updateAccountUI();refreshAll();await syncCollection();save();await refreshServerSocial();
  const msg=data.isNew?'Compte Google créé · +160 Orbres de bienvenue':'Connexion Google réussie';
  accountMessage(msg+' · '+currentUser.username,true);toast(data.isNew?'Bienvenue sur Nébulines ! +160 Orbres':'Nébulines connecté !');
}
async function googleCredentialCallback(response){
  try{
    const data=await api('/api/google-login',{method:'POST',body:JSON.stringify({credential:response.credential})});
    await finishGoogleLogin(data);
  }catch(e){accountMessage(e.message);toast(e.message);}
}
async function configureGoogleSignIn(){
  const btn=$('#googleSignInBtn'),help=$('#googleSignInHelp');
  try{
    const cfg=await api('/api/config');
    if(!cfg.googleClientId){
      btn.disabled=true;btn.title='Configuration Google requise';
      help.textContent='À configurer avant publication : GOOGLE_CLIENT_ID sur le serveur et domaine autorisé dans Google Cloud.';
      return;
    }
    const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;
    script.onload=()=>{
      if(!window.google?.accounts?.id){help.textContent='Le service de connexion Google n’a pas pu se charger.';return;}
      window.google.accounts.id.initialize({client_id:cfg.googleClientId,callback:googleCredentialCallback,auto_select:false});
      btn.disabled=false;btn.addEventListener('click',()=>window.google.accounts.id.prompt());
      help.textContent='Connexion Google configurée.';
    };
    script.onerror=()=>{help.textContent='Impossible de charger la connexion Google. Vérifie ta connexion Internet.';};
    document.head.appendChild(script);
  }catch(e){btn.disabled=true;help.textContent='Connexion Google disponible après déploiement du serveur et configuration OAuth.';}
}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function refreshAll(){
  renderBoosterPreview(); renderHome(); renderRecent(); renderIncome(); dirty = true; renderQuests(); if(!$('#tab-collection').hidden) renderCollection(); if(!$('#tab-accueil').hidden) renderEventCards(); if(!$('#tab-battles').hidden) renderBattleSelectors(); renderSpecialSelectors(); renderGarage(); renderCardPickers(); }

// Notifications discrètes dans la cloche au-dessus des onglets.
const notifyToggle=$('#notifyToggle'), noticeBoard=$('#noticeBoard');
$('#settingsQuick')?.addEventListener('click',()=>showTab('settings')); 
notifyToggle?.addEventListener('click',()=>{const opening=noticeBoard.hidden;noticeBoard.hidden=!opening;notifyToggle.setAttribute('aria-expanded',String(opening));updateNoticeCount();});
function updateNoticeCount(){const n=$$('#noticeBoard .notice').filter(x=>!x.hidden).length;const b=$('#noticeCount');if(b){b.textContent=n;b.hidden=n===0;}}
noticeBoard?.addEventListener('click',e=>{e.stopPropagation();setTimeout(updateNoticeCount,0);});document.addEventListener('click',e=>{if(!noticeBoard?.hidden&&!noticeBoard.contains(e.target)&&!notifyToggle?.contains(e.target)){noticeBoard.hidden=true;notifyToggle?.setAttribute('aria-expanded','false');}});updateNoticeCount();
$('#showNoticesFromSettings')?.addEventListener('click',()=>{if(noticeBoard){noticeBoard.hidden=false;notifyToggle?.setAttribute('aria-expanded','true');}updateNoticeCount();});
$('#restoreNoticesBtn')?.addEventListener('click',()=>{try{localStorage.removeItem('nebulines.hiddenNotices')}catch(e){};noticeBoard?.querySelectorAll('.notice').forEach(el=>el.hidden=false);updateNoticeCount();toast('Toutes les annonces sont réaffichées.');});
let soundEnabled=localStorage.getItem('nebulines.sound')!=='off';
let gameAudioContext=null;function playGameSound(kind='tap'){if(!soundEnabled)return;try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;gameAudioContext=gameAudioContext||new Ctx();const ctx=gameAudioContext;const play=()=>{const sequences={tap:[[660,.07]],open:[[523,.09],[784,.12],[1046,.14]],race:[[392,.1],[523,.1],[784,.16]],win:[[659,.1],[784,.12],[1046,.2]],lose:[[392,.12],[294,.2]],evolve:[[784,.08],[988,.1],[1175,.2]],nitro:[[523,.06],[1046,.12]]};(sequences[kind]||sequences.tap).forEach(([freq,dur],i)=>{const t=ctx.currentTime+i*.095,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind==='lose'?'triangle':'sine';osc.frequency.setValueAtTime(freq,t);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.12,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+dur+.02);});};if(ctx.state==='suspended')ctx.resume().then(play).catch(()=>{});else play();}catch(e){}}
function renderGarage(){const sel=$('#customCar');if(!sel)return;const prev=sel.value;sel.innerHTML=CARDS.map(c=>`<option value="${c.id}">${escapeHTML((vehicleMods[c.id]?.name)||c.name)} · #${c.id}</option>`).join('');if(prev)sel.value=prev;loadVehicleEditor();}
function loadVehicleEditor(){const id=+$('#customCar')?.value,c=CARDS.find(x=>x.id===id);if(!c)return;const m=vehicleMods[id]||{};$('#vehicleType').value=m.type||inferredVehicleType(c);$('#vehicleColor').value=m.color||'#b69cff';$('#vehicleName').value=m.name||'';const st=vehicleStats(c);$('#vehiclePreview').innerHTML=`<div style="max-width:240px;margin:auto" class="card" data-r="${c.rank}">${cardHTML(c,{mini:true})}</div><p style="text-align:center"><b>${escapeHTML(m.name||c.name)}</b></p><p class="local-note" style="text-align:center">${st.speed} km/h · Accélération ${st.accel}/100 · Maniabilité ${st.handling}/100</p>`;}
$('#customCar')?.addEventListener('change',loadVehicleEditor);
$('#saveVehicle')?.addEventListener('click',()=>{const id=+$('#customCar').value;if(!id)return;vehicleMods[id]={...(vehicleMods[id]||{}),type:$('#vehicleType').value,color:$('#vehicleColor').value,name:$('#vehicleName').value.trim().slice(0,24)};try{localStorage.setItem('nebulines.vehicleMods',JSON.stringify(vehicleMods));}catch(e){}renderGarage();renderBattleSelectors();renderRaceStats();loadVehicleEditor();renderHome();toast('🚘 Véhicule personnalisé !');playGameSound('tap');});
$('#brightnessRange')?.addEventListener('input',e=>{const v=+e.target.value;document.documentElement.style.filter=`brightness(${v/100})`;$('#brightnessLabel').textContent=v+' %';localStorage.setItem('nebulines.brightness',String(v));});
$('#soundToggle')?.addEventListener('change',e=>{soundEnabled=e.target.checked;localStorage.setItem('nebulines.sound',soundEnabled?'on':'off');if(soundEnabled)playGameSound('tap');});

$('#resetProgressBtn')?.addEventListener('click',async()=>{if(!confirm('Réinitialiser toute ta progression ? Tes cartes, Orbres, boosters, quêtes et victoires seront effacés. Le bonus de bienvenue de 160 Orbres ne sera pas redonné. Cette action est irréversible.'))return;const btn=$('#resetProgressBtn');if(btn)btn.disabled=true;resettingProgress=true;if(syncTimer){clearTimeout(syncTimer);syncTimer=null;}try{if(authToken&&currentUser){const result=await api('/api/me/reset',{method:'POST',body:'{}'});if(Number(result?.user?.dust)!==0)throw new Error('Le serveur n’a pas confirmé un solde de 0 Orbre.');}try{localStorage.removeItem(KEY);localStorage.removeItem('nebulines.hiddenNotices');localStorage.removeItem('nebulines.vehicleMods');localStorage.removeItem('nebulines.carUpgrades');localStorage.removeItem('nebulines.brightness');localStorage.removeItem('nebulines.sound');localStorage.removeItem('nebulines.dailyBonus');localStorage.removeItem('nebulines.raceReadyAt');}catch(e){}state=fresh();state.dust=0;saveLocalSnapshot();alert('Progression réinitialisée : 0 Orbre. Le bonus de bienvenue ne sera pas attribué une deuxième fois. Le jeu va redémarrer.');location.reload();}catch(e){resettingProgress=false;if(btn)btn.disabled=false;alert('Impossible de réinitialiser la progression : '+e.message+' Rien n’a été effacé. Réessaie lorsque le serveur est disponible.');}});
async function setOrientation(mode){const status=$('#landscapeStatus');try{if(mode==='landscape'&&!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();if(screen.orientation&&screen.orientation.lock){await screen.orientation.lock(mode);status.textContent=mode==='landscape'?'Écran verrouillé en paysage (horizontal).':'Écran réglé en portrait (vertical).';}else{status.textContent=mode==='landscape'?'Ton navigateur ne permet pas de verrouiller ici : tourne le téléphone à l’horizontale.':'Ton navigateur ne permet pas de verrouiller ici : tourne le téléphone à la verticale.';}}catch(e){status.textContent=mode==='landscape'?'Verrouillage automatique indisponible : tourne le téléphone à l’horizontale.':'Retour automatique indisponible : tourne le téléphone à la verticale.';}}
$('#landscapeBtn')?.addEventListener('click',()=>setOrientation('landscape'));
$('#portraitBtn')?.addEventListener('click',async()=>{try{if(screen.orientation?.unlock)screen.orientation.unlock();if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();$('#landscapeStatus').textContent='Verrouillage retiré : tu peux revenir en portrait (vertical).';}catch(e){$('#landscapeStatus').textContent='Tourne le téléphone à la verticale pour revenir au format portrait.';}});
const savedBrightness=+(localStorage.getItem('nebulines.brightness')||100);if($('#brightnessRange')){$('#brightnessRange').value=savedBrightness;document.documentElement.style.filter=`brightness(${savedBrightness/100})`;$('#brightnessLabel').textContent=savedBrightness+' %';}
if($('#soundToggle'))$('#soundToggle').checked=soundEnabled;


function ensureMarket(){
  const hour=Math.floor(Date.now()/3600000);
  if(state.marketHour!==hour || !Array.isArray(state.marketIds) || state.marketIds.length!==6){
    const pool=CARDS.filter(c=>!c.event && c.rank>=4); const seed=hour*9301+17; let x=seed>>>0;
    const rnd=()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};
    const chosen=[]; while(chosen.length<Math.min(6,pool.length)){const id=pool[Math.floor(rnd()*pool.length)].id;if(!chosen.includes(id))chosen.push(id);}
    state.marketHour=hour;state.marketIds=chosen;save();
  }
}
function marketPrice(c){return c.rank===5?1200:c.rank===4?500:Math.max(10,RAR[c.rank].dust*2);}
function setupCardPicker(selectId, pickerId, getCards, getLabel){
 const sel=$('#'+selectId), box=$('#'+pickerId); if(!sel||!box)return;
 let toggle=box.previousElementSibling;
 if(!toggle||!toggle.classList.contains('picker-toggle')){toggle=document.createElement('button');toggle.type='button';toggle.className='btn secondary small picker-toggle';toggle.setAttribute('aria-expanded','false');toggle.textContent='Voir plus ↓';box.parentNode.insertBefore(toggle,box);toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));box.classList.toggle('picker-collapsed',!expanded);box.classList.toggle('picker-expanded',expanded);toggle.textContent=expanded?'Voir moins ↑':'Voir plus ↓';});}
 const cards=getCards()||[], current=String(sel.value||'');
 if(!cards.length){box.innerHTML='<p class="local-note">Aucune carte disponible.</p>';box.classList.remove('picker-collapsed','picker-expanded');toggle.hidden=true;return;}
 toggle.hidden=cards.length<=6;
 const wasExpanded=toggle.getAttribute('aria-expanded')==='true';box.classList.toggle('picker-collapsed',!wasExpanded&&cards.length>6);box.classList.toggle('picker-expanded',wasExpanded);
 toggle.textContent=wasExpanded?'Voir moins ↑':'Voir plus ↓';
 box.innerHTML=cards.map(c=>{const selected=String(c.id)===current, label=getLabel?getLabel(c):c.name;return `<button type="button" class="pick-card ${selected?'picked':''}" data-pick-card="${c.id}" aria-pressed="${selected}"><div class="pick-art">${cardHTML(c,{mini:true,locked:false,count:state.owned[c.id]?.n||0})}</div><span>${escapeHTML(label)}</span></button>`;}).join('');
 box.querySelectorAll('[data-pick-card]').forEach(b=>b.addEventListener('click',()=>{sel.value=b.dataset.pickCard;sel.dispatchEvent(new Event('change',{bubbles:true}));if(selectId==='sellCard')renderMarket();else if(selectId==='tradeCard'){}else if(selectId==='customCar')loadVehicleEditor();else if(selectId==='battleCard')renderRaceStats();setupCardPicker(selectId,pickerId,getCards,getLabel);}));
}
function refreshCardPickers(){
 const owned=CARDS.filter(c=>state.owned[c.id]?.n>0);
 setupCardPicker('sellCard','sellCardPicker',()=>owned,c=>`${c.name} · ×${state.owned[c.id]?.n||0}`);
 setupCardPicker('battleCard','battleCardPicker',()=>owned,c=>`${vehicleMods[c.id]?.name||c.name} · ${vehicleStats(c).speed} km/h`);
 setupCardPicker('auctionCard','auctionCardPicker',()=>owned,c=>`${c.name} · ×${state.owned[c.id]?.n||0}`);
 setupCardPicker('evolveCard','evolveCardPicker',()=>owned.filter(c=>state.owned[c.id]?.n>=3),c=>`${c.name} · ×${state.owned[c.id]?.n||0}`);
 setupCardPicker('customCar','customCarPicker',()=>CARDS,c=>vehicleMods[c.id]?.name||c.name);
 setupCardPicker('tradeCard','tradeCardPicker',()=>owned.filter(c=>state.owned[c.id]?.n>1),c=>`${c.name} · ×${state.owned[c.id]?.n||0}`);
 for(let i=0;i<5;i++)setupCardPicker('incomeSelect'+i,'incomePicker'+i,()=>owned,c=>`${c.name} · ${incomeRate(c.id)} Orbres/h`);
 setupCardPicker('upgradeCar','upgradeCarPicker',()=>owned,c=>`${c.name} · #${c.id}`);
}
function renderCardPickers(){refreshCardPickers();}
function renderMarket(){
 ensureMarket(); const left=3600000-(Date.now()%3600000); $('#marketTimer').textContent=fmt(left); $('#marketBar').style.width=(left/3600000*100)+'%';
 $('#marketOffers').innerHTML=state.marketIds.map(id=>{const c=CARDS[id-1],owned=!!state.owned[id],price=marketPrice(c);return `<div class="market-card"><div class="market-card-art"><div class="card mini" data-r="${c.rank}">${cardHTML(c,{mini:true,locked:false})}</div><span class="market-rarity">${RAR[c.rank].n}</span></div><div class="market-card-info"><b>${escapeHTML(c.name)}</b><p>${RAR[c.rank].n} · #${String(c.id).padStart(3,'0')}</p><div class="market-price">✦ ${price}</div><button class="btn ${state.dust>=price?'primary':'secondary'} small" data-buy-market="${id}" ${state.dust<price?'disabled':''} type="button">${owned?'Acheter encore':'Acheter'}</button></div></div>`;}).join('');
 const own=CARDS.filter(c=>state.owned[c.id]?.n>0);
 const sell=$('#sellCard');
 const previous=sell.value;
 const signature=own.map(c=>`${c.id}:${state.owned[c.id].n}`).join('|');
 if(sell.dataset.signature!==signature){
   sell.innerHTML=own.length?own.map(c=>`<option value="${c.id}">${escapeHTML(c.name)} ×${state.owned[c.id].n} — ${Math.max(2,Math.floor(RAR[c.rank].dust*.65))} ✦</option>`).join(''):'<option value="">Aucune carte à vendre</option>';
   sell.dataset.signature=signature;
   if(own.some(c=>String(c.id)===previous)) sell.value=previous;
 }
 $('#sellBtn').disabled=!own.length;
 refreshCardPickers();
}
$('#marketOffers').addEventListener('click',e=>{const b=e.target.closest('[data-buy-market]');if(!b)return;const id=+b.dataset.buyMarket,c=CARDS[id-1],price=marketPrice(c);if(state.dust<price){toast('Pas assez de ✦');return;}state.dust-=price;const o=state.owned[id]||(state.owned[id]={n:0,h:0});o.n++;save();refreshAll();renderMarket();toast(c.name+' achetée !');});
$('#sellBtn').addEventListener('click',()=>{const id=+$('#sellCard').value,c=CARDS[id-1],o=state.owned[id];if(!c||!o||o.n<1)return;const price=Math.max(2,Math.floor(RAR[c.rank].dust*.65));o.n--;if(o.n<=0)delete state.owned[id];state.dust+=price;save();refreshAll();renderMarket();toast(c.name+' vendue : +'+price+' ✦');});

function renderAlbums(){
 const ownedCount=CARDS.filter(c=>state.owned[c.id]?.n>0).length;
 const rareCount=CARDS.filter(c=>c.rank>=4 && state.owned[c.id]?.n>0).length;
 const pct=Math.round(ownedCount/Math.max(1,CARDS.length)*100);
 const lvl=1+Math.floor(ownedCount/10),nextGoal=Math.min(CARDS.length,Math.ceil((ownedCount+1)/10)*10),claimed=state.albums?.claimed||[]; const milestones=[{id:'10',n:10,reward:100,label:'Collectionneur débutant'},{id:'50',n:50,reward:350,label:'Explorateur'},{id:'100',n:100,reward:700,label:'Maître collectionneur'},{id:'200',n:200,reward:1500,label:'Légende de Nébulines'}];
 $('#collectionLevel').innerHTML=`<h3>👑 Niveau collectionneur ${lvl}</h3><p class="quest-desc">${ownedCount} cartes uniques découvertes · Prochain niveau à ${nextGoal} cartes</p><div class="prog"><i style="width:${Math.min(100,ownedCount%10*10)}%"></i></div><h3 style="margin-top:14px">🎁 Récompenses de collection</h3>${milestones.map(m=>`<div class="social-item"><span><b>${m.label}</b><br><small class="quest-desc">${Math.min(ownedCount,m.n)}/${m.n} cartes uniques · +${m.reward} ✦</small></span><button class="btn ${ownedCount>=m.n&&!claimed.includes(m.id)?'primary':'secondary'} small" data-album-reward="${m.id}" ${ownedCount>=m.n&&!claimed.includes(m.id)?'':'disabled'}>${claimed.includes(m.id)?'Récupérée':ownedCount>=m.n?'Récupérer':'Verrouillée'}</button></div>`).join('')}`;
 $('#albumContent').innerHTML=`<div class="album-summary"><p><b>Album complet</b> · ${ownedCount}/${CARDS.length} cartes découvertes (${pct} %)</p><div class="prog"><i style="width:${pct}%"></i></div><p style="margin-top:12px"><b>Album des légendes :</b> ${rareCount} cartes légendaires ou secrètes découvertes</p></div><div class="album-grid grid">${CARDS.map(c=>{const o=state.owned[c.id],got=!!(o&&o.n>0);return `<div class="cell album-cell" style="padding:6px;min-width:0" data-id="${c.id}" role="button" tabindex="0" aria-label="${got?escapeHTML(c.name):'Carte inconnue'}">${got?`<div class="card mini" data-r="${c.rank}">${cardHTML(c,{mini:true,count:o.n})}</div>`:`<div class="card mini album-unknown"><div class="cb"></div><div class="cunknown">?</div></div>`}<p style="font-size:.72rem;font-weight:800;margin:6px 0 2px;text-align:center">${got?escapeHTML(c.name):'???'}</p><p class="quest-desc" style="font-size:.68rem;text-align:center">${got?RAR[c.rank].n:'À découvrir'}</p></div>`;}).join('')}</div>`;
}
$('#collectionLevel').addEventListener('click',e=>{const b=e.target.closest('[data-album-reward]');if(!b)return;const ms={10:{n:10,reward:100},50:{n:50,reward:350},100:{n:100,reward:700},200:{n:200,reward:1500}}[b.dataset.albumReward];if(!ms)return;const owned=CARDS.filter(c=>state.owned[c.id]?.n>0).length;state.albums=state.albums||{claimed:[]};if(owned<ms.n||state.albums.claimed.includes(b.dataset.albumReward))return;state.albums.claimed.push(b.dataset.albumReward);state.dust+=ms.reward;save();renderAlbums();renderHome();toast(`Récompense de collection : +${ms.reward} ✦`);});
function renderAuctionHistory(){const box=$('#auctionHistory');if(!box)return;state.auctions=state.auctions||[];box.innerHTML=state.auctions.slice().reverse().map(a=>{const left=Math.max(0,a.ends-Date.now());return `<div class="quest-card"><div class="quest-top"><div><strong>🔨 ${escapeHTML(a.name)}</strong><p class="quest-desc">Départ : ${a.price} ✦ · ${a.status||'En cours'}</p></div><span class="quest-reward">${left?Math.floor(left/60000)+' min restantes':'Terminée'}</span></div></div>`}).join('')||'<p class="empty">Aucune enchère créée pour le moment.</p>'; }
function renderSpecialSelectors(){
 const own=CARDS.filter(c=>state.owned[c.id]?.n>0);
 const opts=own.map(c=>`<option value="${c.id}">${escapeHTML(c.name)} ×${state.owned[c.id].n}</option>`).join('')||'<option value="">Aucune carte possédée</option>';
 ['auctionCard','evolveCard'].forEach(id=>{const el=$('#'+id);if(el){const prev=el.value;el.innerHTML=opts;if(own.some(c=>String(c.id)===prev))el.value=prev;}});
 $('#evolveBtn').disabled=!own.some(c=>state.owned[c.id].n>=3);
}
function renderEventCards(){
 const box=$('#eventCardList');if(!box)return;
 box.innerHTML=EVENT_CARDS.map(c=>{const o=state.owned[c.id];return `<div class="cell" style="padding:7px"><div class="card mini" data-r="${c.rank}">${cardHTML(c,{mini:true,locked:!o,count:o?.n||0})}</div><p style="font-size:.75rem;font-weight:800;margin:7px 0 3px">${o?escapeHTML(c.name):'???'}</p><p class="quest-desc">${o?RAR[c.rank].n:'À découvrir'} · ${o?'Nuit ×2,3':'Mutation Nuit ×2,3'}</p></div>`;}).join('');
}
function renderBattleSelectors(){
 const own=CARDS.filter(c=>state.owned[c.id]?.n>0);const el=$('#battleCard');if(!el)return;const prev=el.value;
 el.innerHTML=own.length?own.map(c=>`<option value="${c.id}">${escapeHTML(vehicleMods[c.id]?.name||c.name)} · ${vehicleMods[c.id]?.type==='motorcycle'?'Moto':'Véhicule'} · ${vehicleStats(c).speed} km/h</option>`).join(''):'<option value="">Aucune carte possédée</option>';
 if(own.some(c=>String(c.id)===prev))el.value=prev;
}
const DAILY_EVENTS=[
 {title:'🌠 Pluie d’étoiles',desc:'Les constellations s’éveillent ! Collectionne les véhicules célestes.',art:'🌌✨🌙',pack:'Éclipse astrale'},
 {title:'🌃 Métropole néon',desc:'Les rues brillent et les bolides urbains prennent le contrôle.',art:'🌆💜🏎️',pack:'Néon turbo'},
 {title:'🌊 Tempête océanique',desc:'Des véhicules marins et des machines rapides surgissent des vagues.',art:'🌊⚡🚤',pack:'Marée électrique'},
 {title:'🚀 Frontière cosmique',desc:'Explore les engins volants et les prototypes venus des étoiles.',art:'🪐🚀🛸',pack:'Cosmos infini'},
 {title:'🏁 Festival mécanique',desc:'Place aux motos, scooters, trottinettes et véhicules de compétition.',art:'🏁🛵⚡',pack:'Garage extrême'}
];
function updateDailyEvent(){const now=Date.now(),week=Math.floor(now/(7*86400000)),e=DAILY_EVENTS[week%DAILY_EVENTS.length],next=(week+1)*7*86400000,remaining=next-now;const title=$('#eventTitle'),desc=$('#eventDescription'),art=document.querySelector('.event-pack-art'),pack=document.querySelector('.event-pack-panel h3'),count=$('#eventCountdown');if(title)title.textContent=e.title;if(desc)desc.textContent=e.desc;if(art)art.textContent=e.art;if(pack)pack.textContent='Booster « '+e.pack+' »';if(count){const h=Math.floor(remaining/3600000),m=Math.floor(remaining%3600000/60000);count.textContent=`Prochain événement dans ${Math.floor(remaining/86400000)} j ${h} h ${m} min · rotation hebdomadaire · mutation Nuit ×2,3`;}}
updateDailyEvent();setInterval(updateDailyEvent,60000);

$('#toggleEventCards')?.addEventListener('click',()=>{const box=$('#eventCardList'),btn=$('#toggleEventCards');const expanded=btn.getAttribute('aria-expanded')!=='true';box.classList.toggle('event-cards-collapsed',!expanded);box.classList.toggle('event-cards-expanded',expanded);btn.setAttribute('aria-expanded',String(expanded));btn.textContent=expanded?'Voir moins ↑':'Voir plus ↓';});

$('#eventBuyChosenBtn')?.addEventListener('click',()=>{
 const input=$('#eventPackCount');const count=Math.max(1,Math.min(500,Math.floor(Number(input.value)||1)));input.value=count;
 const cost=150*count;if(state.dust<cost){$('#eventBuyMaxStatus').textContent=`Il te faut ${cost} ✦ pour acheter ${count} booster(s).`;toast('Pas assez de ✦');return;}
 if(!$('#ov').hidden)return;
 state.dust-=cost;let newCards=0;const all=[];
 for(let i=0;i<count;i++){state.opened++;for(const p of rollEventPack()){const o=state.owned[p.card.id];if(!o)newCards++;addPulledCard(p);all.push({...p,isNew:!o,mutation:'night'});state.recent.unshift(p.card.id);}}
 state.recent=state.recent.slice(0,10);save();refreshAll();renderEventCards();renderBattleSelectors();
 $('#eventBuyMaxStatus').textContent=`${count} booster(s) acheté(s) · ${newCards} nouvelle(s) carte(s) · reste ${state.dust} ✦`;
 all.sort((a,b)=>a.card.rank-b.card.rank);const bestEventRank=Math.max(...all.map(p=>p.card.rank));const glow=document.querySelector('#homePack');if(glow){glow.classList.add('pack-glow');glow.style.setProperty('--best-rarity',RCOL[bestEventRank]||'#ffffff');}op={cards:all,i:all.length,flipped:true,batch:true,packs:count,eventMode:true};ov.hidden=false;lock();showSummary();playGameSound('open');
});
$('#eventPackCount')?.addEventListener('input',()=>{const n=Math.max(1,Math.min(500,Math.floor(Number($('#eventPackCount').value)||1)));$('#eventBuyChosenBtn').textContent=`Acheter ${n} · ${150*n} ✦`;});

$('#eventOpenBtn').addEventListener('click',()=>{
 const cost=150;if(state.dust<cost){toast('Il te faut 150 ✦ pour ce booster !');return;}if(!$('#ov').hidden)return;
 state.dust-=cost;state.opened++;
 const eventPulls=rollEventPack().sort((a,b)=>a.card.rank-b.card.rank);const bestEventRank=Math.max(...eventPulls.map(p=>p.card.rank));const glow=document.querySelector('#homePack');if(glow){glow.classList.add('pack-glow');glow.style.setProperty('--best-rarity',RCOL[bestEventRank]||'#ffffff');}const res=eventPulls.map(p=>{const o=state.owned[p.card.id];addPulledCard(p);return {...p,isNew:!o,mutation:'night'};});
 state.recent=[...res.map(r=>r.card.id).reverse(),...state.recent.filter(id=>!res.some(r=>r.card.id===id))].slice(0,10);save();refreshAll();renderEventCards();renderBattleSelectors();
 const summary=res.map(r=>`${r.card.name} (${RAR[r.card.rank].n})`).join(' · ');$('#eventStatus').textContent='Dernier booster : '+summary;
 op={cards:res,i:0,flipped:false,eventMode:true};ov.hidden=false;lock();showPack();playGameSound('open');
});
$('#eventClaim').addEventListener('click',()=>{
 const key='nebulines.event.'+new Date().toISOString().slice(0,10);
 if(localStorage.getItem(key)){ $('#eventStatus').textContent='Bonus déjà récupéré aujourd’hui !';return; }
 localStorage.setItem(key,'1');state.dust+=30;save();renderHome();$('#eventStatus').textContent='Bonus récupéré : +30 ✦. Reviens demain !';toast('+30 ✦ événement');
});
let battleBusy=false;
const RACE_COOLDOWN=5*60*1000;
function raceReadyAt(){return Number(localStorage.getItem('nebulines.raceReadyAt')||0)}
function updateRaceCooldown(){const btn=$('#battleBtn');if(!btn||battleBusy)return;const left=Math.max(0,raceReadyAt()-Date.now());if(left>0){btn.disabled=true;btn.textContent=`⏳ Prochaine course dans ${Math.floor(left/60000)}:${String(Math.floor((left%60000)/1000)).padStart(2,'0')}`;}else{btn.disabled=false;btn.textContent='🏁 Démarrer la course';}}
setInterval(updateRaceCooldown,1000);
function renderRaceStats(){const wins=$('#raceWins');if(wins)wins.textContent=String(state.wins||0);const id=+$('#battleCard')?.value;const c=CARDS.find(x=>x.id===id)||CARDS.find(x=>state.owned[x.id]?.n>0);const box=$('#raceStats');if(!box||!c)return;const st=vehicleStats(c);box.innerHTML=`<div class="race-stat"><b>${st.speed} km/h</b><span>Vitesse max</span></div><div class="race-stat"><b>${st.accel}/100</b><span>Accélération</span></div><div class="race-stat"><b>${st.handling}/100</b><span>Maniabilité</span></div>`;}
$('#battleCard')?.addEventListener('change',renderRaceStats);
let nitroCharges=0,nitroBoost=0,driftCharges=0,driftBoost=0;
$('#nitroBtn')?.addEventListener('click',()=>{if(!battleBusy||nitroCharges<=0)return;nitroCharges--;nitroBoost+=9;$('#nitroBtn').textContent='⚡ BOOSTER x'+nitroCharges;$('#battleStatus').textContent='⚡ NITRO ! Tu gagnes un gros avantage pour les prochaines secondes.';$('#racePlayerSprite').style.filter='drop-shadow(0 0 18px #54eaff)';playGameSound('win');if(nitroCharges===0)$('#nitroBtn').disabled=true;});
$('#driftBtn')?.addEventListener('click',()=>{if(!battleBusy||driftCharges<=0)return;driftCharges--;driftBoost+=5;$('#driftBtn').textContent='↪️ DRIFTER x'+driftCharges;$('#battleStatus').textContent='↪️ DRIFT RÉUSSI ! Tu prends le virage avec style.';$('#racePlayerSprite').style.filter='drop-shadow(0 0 18px #34d399)';playGameSound('win');if(driftCharges===0)$('#driftBtn').disabled=true;});
$('#battleBtn').addEventListener('click',()=>{
 if(battleBusy)return;
 if(Date.now()<raceReadyAt()){updateRaceCooldown();toast('Une course toutes les 5 minutes !');return;}
 const own=CARDS.filter(c=>state.owned[c.id]?.n>0);if(!own.length){$('#battleStatus').textContent='Ouvre un booster avant de faire la course !';toast('Ouvre un booster pour choisir une voiture');return;}
 const selected=CARDS.find(c=>c.id===+$('#battleCard').value)||own[0];const stage=$('#raceStage')?.value||'city';const stageData={city:{name:'Ville nocturne',difficulty:1},coast:{name:'Route côtière',difficulty:1.12},mountain:{name:'Col de montagne',difficulty:1.22},nebula:{name:'Autoroute nébuleuse',difficulty:1.32}}[stage];const available=CARDS.filter(c=>state.owned[c.id]?.n===0&&c.id!==selected.id);const enemy=available[Math.floor(Math.random()*Math.max(1,available.length))]||CARDS[(selected.id+16)%CARDS.length];
 const ps=vehicleStats(selected),es=vehicleStats(enemy),customName=vehicleMods[selected.id]?.name||selected.name,enemyName=vehicleMods[enemy.id]?.name||enemy.name;let pd=0,ed=0,second=0;const playerWins=Math.random()<0.5;
 nitroCharges=3;nitroBoost=0;driftCharges=2;driftBoost=0;$('#nitroBtn').disabled=false;$('#nitroBtn').textContent='⚡ BOOSTER x3';$('#driftBtn').disabled=false;$('#driftBtn').textContent='↪️ DRIFTER x2';$('#racePlayerSprite').style.filter='';battleBusy=true;$('#battleBtn').disabled=true;$('#battleBtn').textContent='🏁 COURSE EN COURS';$('#tab-battles').classList.add('race-fullscreen');
 $('#battlePlayerCard').innerHTML=cardHTML(selected,{mini:true});$('#battleEnemyCard').innerHTML=cardHTML(enemy,{mini:true});$('#playerHpBar').style.width='0%';$('#enemyHpBar').style.width='0%';$('#playerHpText').textContent='Distance : 0 %';$('#enemyHpText').textContent='Distance : 0 %';$('#racePlayerSprite').textContent=({motorcycle:'🏍️',scooter:'🛵',escooter:'🛴',plane:'✈️',helicopter:'🚁'})[getVehicleType(selected)]||'🚗';$('#raceEnemySprite').textContent=({motorcycle:'🏍️',scooter:'🛵',escooter:'🛴',plane:'✈️',helicopter:'🚁'})[getVehicleType(enemy)]||'🏎️';$('#racePlayerSprite').style.left='0%';$('#raceEnemySprite').style.left='0%';$('#racePlayerScore').textContent='0 %';$('#raceEnemyScore').textContent='0 %';$('#raceCountdown').classList.remove('go');$('#raceCountdown').textContent='3';$('#battleStatus').textContent=`Prépare-toi ! Départ dans 3 secondes · ${stageData.name}`;playGameSound('race');
 let count=3;const countdown=()=>{if(count>1){count--;$('#raceCountdown').textContent=String(count);$('#battleStatus').textContent=`🏁 Départ dans ${count} secondes !`;setTimeout(countdown,1000);return;}$('#raceCountdown').textContent='🚦 GO !';$('#raceCountdown').classList.add('go');$('#battleStatus').textContent=`🏁 C’EST PARTI ! ${customName} contre ${enemyName}`;setTimeout(step,1000);};
 const step=()=>{second=Math.min(20,second+.25);const turbo=Math.min(9,nitroBoost);nitroBoost=Math.max(0,nitroBoost-.375);const driftNow=Math.min(5,driftBoost);driftBoost=Math.max(0,driftBoost-.2);const boostP=Math.max(1,(ps.accel*.22+ps.handling*.1+Math.random()*3+turbo+driftNow)/stageData.difficulty);const boostE=Math.max(1,(es.accel*.19+es.handling*.08+Math.random()*3)/stageData.difficulty);pd=Math.min(100,pd+boostP);ed=Math.min(100,ed+boostE);if(pd>=100||ed>=100||second>=20){if(playerWins){pd=100;ed=Math.min(96,Math.max(ed,82));}else{ed=100;pd=Math.min(96,Math.max(pd,82));}}$('#playerHpBar').style.width=pd+'%';$('#enemyHpBar').style.width=ed+'%';$('#playerHpText').textContent=`Distance : ${Math.round(pd)} %`;$('#enemyHpText').textContent=`Distance : ${Math.round(ed)} %`;$('#racePlayerSprite').style.left=Math.min(88,pd*.88)+'%';$('#raceEnemySprite').style.left=Math.min(88,ed*.88)+'%';$('#racePlayerScore').textContent=Math.round(pd)+' %';$('#raceEnemyScore').textContent=Math.round(ed)+' %';$('#raceCountdown').textContent=`${Math.ceil(20-second)}s`;if(Math.abs(second-Math.round(second))<.01)$('#battleStatus').textContent=`${Math.round(second)}/20 s · ${Math.round(ps.speed*(.7+Math.random()*.3))} km/h · ${stageData.name}`;
 if(pd>=100||ed>=100||second>=20){const won=playerWins;if(won){state.dust+=20;state.wins=(state.wins||0)+1;$('#raceCountdown').textContent='🏆 VICTOIRE !';$('#battleStatus').textContent=`🏆 VICTOIRE ! ${customName} franchit la ligne. +20 Orbres`;toast('🏁 Course gagnée : +20 Orbres');playGameSound('win');}else{state.dust=Math.max(0,state.dust-10);$('#raceCountdown').textContent='💥 DÉFAITE';$('#battleStatus').textContent=`🏁 Le rival gagne cette fois. −10 Orbres`;toast('Course perdue : −10 Orbres');playGameSound('lose');}localStorage.setItem('nebulines.raceReadyAt',String(Date.now()+RACE_COOLDOWN));save();renderQuests();renderHome();battleBusy=false;$('#nitroBtn').disabled=true;$('#driftBtn').disabled=true;$('#racePlayerSprite').style.filter='';$('#battleBtn').disabled=false;$('#battleBtn').textContent='🏁 Course terminée';updateRaceCooldown();$('#tab-battles').classList.remove('race-fullscreen');updateRaceCooldown();return;}setTimeout(step,250);};setTimeout(countdown,1000);
});
$('#auctionBtn').addEventListener('click',()=>{
 const id=+$('#auctionCard').value,c=CARDS[id-1],o=state.owned[id];
 if(!c||!o||o.n<1){$('#auctionStatus').textContent='Choisis une carte que tu possèdes.';return;}
 const price=Math.max(5,Math.floor(RAR[c.rank].dust*.8));
 state.auctions=state.auctions||[];state.auctions.push({id:Date.now(),cardId:id,name:c.name,price,created:Date.now(),ends:Date.now()+3600000,status:'En cours'});save();renderAuctionHistory();$('#auctionStatus').innerHTML=`Enchère simulée créée pour <b>${escapeHTML(c.name)}</b>. Prix de départ : ${price} ✦. Durée : 1 heure. Elle n’est visible que dans cette sauvegarde.`;
});
$('#evolveBtn').addEventListener('click',()=>{
 const id=+$('#evolveCard').value,c=CARDS[id-1],o=state.owned[id];
 if(!c||!o||o.n<3){$('#evolveStatus').textContent='Il faut 3 exemplaires de la même carte.';return;}
 const reward=CARDS.filter(x=>x.rank===Math.min(5,c.rank+1));
 if(!reward.length){$('#evolveStatus').textContent='Cette carte ne peut pas évoluer davantage.';return;}
 o.n-=3;if(o.n<=0)delete state.owned[id];
 const next=reward[Math.floor(Math.random()*reward.length)];
 const no=state.owned[next.id]||(state.owned[next.id]={n:0,h:0});no.n++;
 $('#evolveStatus').textContent=`✨ Évolution réussie : ${next.name} obtenue !`;
 $('#evolveResult').innerHTML=`<h3 style="text-align:center">🎉 Carte obtenue !</h3><div style="max-width:220px;margin:12px auto" class="card" data-r="${next.rank}">${cardHTML(next,{count:no.n,isNew:true})}</div><p style="text-align:center"><b>${escapeHTML(next.name)}</b></p><p class="quest-desc" style="text-align:center">${RAR[next.rank].n} · Tu en possèdes ${no.n}</p>`;
 toast('Nouvelle carte : '+next.name);playGameSound('evolve');
 save();refreshAll();renderSpecialSelectors();renderAlbums();
});
// V23 : centralise enchères et échanges dans le Marché, garde les amis en bas de l’accueil.
(function arrangeMarketCommunity(){
 const market=$('#tab-market'), auction=$('#tab-auctions'), auctionMount=$('#marketAuctionMount');
 if(market&&auction&&auctionMount){auction.hidden=false;auction.classList.add('market-subsection');auctionMount.appendChild(auction);}
 const tradeForm=$('#tradeForm');
 if(tradeForm){const tradeSection=tradeForm.closest('section.block');const tradeMount=$('#marketTradeMount');if(tradeSection&&tradeMount){tradeSection.classList.add('market-trade-section');tradeMount.appendChild(tradeSection);}}
 const friendsTab=$('#tab-friends');
 if(friendsTab){const friendHeading=[...friendsTab.querySelectorAll('h2')].find(h=>h.textContent.includes('Amis'));const friendSection=friendHeading?.closest('section.block');if(friendSection){friendSection.classList.add('friends-home-section');const home=$('#tab-accueil');if(home)home.appendChild(friendSection);}}
})();

document.addEventListener('click',e=>{const b=e.target.closest('[data-shortcut-tab]');if(!b)return;showTab(b.dataset.shortcutTab);if(b.dataset.tradeShortcut==='true'){setTimeout(()=>{const t=$('#tradeForm');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});},80);}});
function showTab(name){
  $$('.tab').forEach(t => t.hidden = t.id!=='tab-'+name);
  $$('.tab-btn').forEach(b => b.setAttribute('aria-current', b.dataset.tab===name?'page':'false'));
  if(name==='collection') renderCollection();
  if(name==='quests') renderQuests();
  if(name==='friends'){ renderQuests(); if(authToken&&currentUser) refreshServerSocial(); }
  if(name==='market') renderMarket();
  if(name==='albums') renderAlbums();
  if(name==='accueil') renderEventCards();
  if(name==='income'){ renderIncome(); renderUpgrades(); renderCardPickers(); }
  if(name==='battles'){ renderBattleSelectors(); renderRaceStats(); }
  if(name==='settings') renderGarage(); if(name==='friends')renderLeaderboard();
  if(name==='auctions' || name==='evolution') renderSpecialSelectors(); if(name==='auctions') renderAuctionHistory();
  window.scrollTo(0,0);
}
// Navigation par balayage horizontal sur l’écran du jeu.
(() => {
  const UPGRADE_PARTS=[{id:'brakes',name:'Freinage',icon:'🛑',cost:35},{id:'accel',name:'Accélération',icon:'⚡',cost:45},{id:'wheels',name:'Roues',icon:'🛞',cost:30},{id:'engine',name:'Moteur',icon:'🔩',cost:60},{id:'handling',name:'Suspension',icon:'🛠️',cost:40}];
function getUpgrades(){try{return JSON.parse(localStorage.getItem('nebulines.carUpgrades')||'{}')}catch(e){return {}}}
function renderUpgrades(){const sel=$('#upgradeCar'),box=$('#upgradeParts');if(!sel||!box)return;const owned=CARDS.filter(c=>state.owned[c.id]?.n>0);const old=sel.value;sel.innerHTML=owned.map(c=>`<option value="${c.id}">${escapeHTML(c.name)} · #${c.id}</option>`).join('');if(old&&owned.some(c=>String(c.id)===old))sel.value=old;const id=+sel.value;if(!id){box.innerHTML='<p class="quest-desc">Ouvre un booster pour obtenir une voiture à améliorer.</p>';return;}const all=getUpgrades(),u=all[id]||{};box.innerHTML=UPGRADE_PARTS.map(p=>{const lvl=u[p.id]||0;return `<div class="upgrade-part"><div class="vehicle-photo" style="background-image:url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=500&q=80)"></div><h3>${p.icon} ${p.name}</h3><div class="levels">${'★'.repeat(lvl)}${'☆'.repeat(5-lvl)}</div><p class="quest-desc">Niveau ${lvl}/5 · ${lvl===5?'Maximum atteint':`Prochain niveau : ${p.cost*(lvl+1)} Orbres`}</p><button class="btn ${lvl===5?'secondary':'primary'} small" data-upgrade-part="${p.id}" ${lvl===5?'disabled':''}>Améliorer</button></div>`}).join('');}
$('#upgradeCar')?.addEventListener('change',()=>{renderUpgrades();renderCardPickers();});$('#upgradeParts')?.addEventListener('click',e=>{const b=e.target.closest('[data-upgrade-part]');if(!b)return;const id=+$('#upgradeCar').value,p=UPGRADE_PARTS.find(x=>x.id===b.dataset.upgradePart);if(!id||!p)return;const all=getUpgrades();all[id]=all[id]||{};const lvl=all[id][p.id]||0,cost=p.cost*(lvl+1);if(lvl>=5)return;if(state.dust<cost){$('#upgradeStatus').textContent=`Il te faut ${cost} Orbres pour cette amélioration.`;return;}state.dust-=cost;all[id][p.id]=lvl+1;localStorage.setItem('nebulines.carUpgrades',JSON.stringify(all));save();renderHome();renderUpgrades();$('#upgradeStatus').textContent=`${p.name} amélioré au niveau ${lvl+1}/5 !`;});
$('#copyReferral')?.addEventListener('click',async()=>{const link=location.href;try{await navigator.clipboard.writeText(link);$('#referralStatus').textContent='Lien copié ! Partage-le à un ami. Les 5 boosters nécessitent une validation.';}catch(e){$('#referralStatus').textContent='Copie impossible automatiquement : copie l’adresse de la page et partage-la.';}});
$('#sendFeedback')?.addEventListener('click',()=>{const type=$('#feedbackType').value,txt=$('#feedbackText').value.trim();const body=encodeURIComponent(`Nébulines — ${type}\n\n${txt||'(message vide)'}`);window.open('https://discord.gg/Y3HvQ5hd','_blank','noopener');$('#feedbackText').value='';toast('Discord ouvert : publie ton message dans le salon adapté.');});
function renderLeaderboard(){const el=$('#leaderboardContent');if(!el)return;const owned=Object.values(state.owned||{}).filter(x=>x?.n>0).length;const wins=Number(state.wins)||0;const dust=Number(state.dust)||0;const score=owned*100+wins*250+Math.floor(dust/10);el.innerHTML=`<div class="social-item"><span><b>👑 Ton profil local</b><br><small class="quest-desc">${owned} cartes uniques · ${wins} victoires · ${dust.toLocaleString('fr-FR')} ✦</small><br><small class="quest-desc">Score de collection : ${score.toLocaleString('fr-FR')} pts</small></span><strong>${score.toLocaleString('fr-FR')} pts</strong></div><p class="local-note">Le score est calculé sur cet appareil : 100 pts par carte unique, 250 pts par victoire et 1 pt par tranche de 10 ✦. Il ne représente pas encore un classement mondial.</p>`;}
$('#leaderboardAccountBtn')?.addEventListener('click',()=>{const b=document.querySelector('[data-tab="friends"]');if(b)b.click();else toast('Ouvre Collectif puis Compte en ligne.');});
$('#multiplayerInfoBtn')?.addEventListener('click',()=>{const el=$('#multiplayerInfo');if(el)el.hidden=!el.hidden;});
const order = ['accueil','boosters','collection','market','quests','albums','battles','evolution','income','friends','settings'];
  let startX = 0, startY = 0;
  document.addEventListener('touchstart', e => {
    if(e.touches.length!==1) return;
    startX=e.touches[0].clientX; startY=e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchend', e => {
    if(!startX || !e.changedTouches.length) return;
    const dx=e.changedTouches[0].clientX-startX, dy=e.changedTouches[0].clientY-startY;
    startX=0;
    if(Math.abs(dx)<85 || Math.abs(dx)<Math.abs(dy)*1.25) return;
    if(e.target.closest('input,textarea,select,button,a,[role=button],.modal,.overlay')) return;
    const current=document.querySelector('.tab:not([hidden])');
    if(!current) return;
    const idx=order.indexOf(current.id.replace('tab-',''));
    const next=idx+(dx<0?1:-1);
    if(next>=0 && next<order.length) showTab(order[next]);
  }, {passive:true});
})();

/* fiche carte */
const detail = $('#detail'), sheet = $('#sheet'); let lastFocus = null, detailId = 0;
function openDetail(id){
  detailId = id; lastFocus = document.activeElement;
  const c = CARDS[id-1], o = state.owned[id], E = EL[c.el];
  let actions = '';
  if(o && o.n>1){
    const v = RAR[c.rank].dust*(removableHolo(o)?2:1);
    actions += `<button class="btn secondary" type="button" data-act="recycle">Recycler un doublon · +${v} <span class="gold">${dustSVG}</span></button>`;
  }
  if(!o){
    const cost = craftCost(c), ok = state.dust>=cost;
    actions += `<button class="btn primary" type="button" data-act="craft"${ok?'':' disabled'}>Fabriquer · ${cost} ${dustSVG}</button>`;
    if(!ok) actions += `<p class="note">Il te manque ${cost-state.dust} de Orbres. Recycle des doublons pour en gagner.</p>`;
  }
  sheet.innerHTML = `<button class="xbtn" type="button" data-act="close" aria-label="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
<div class="tiltz" id="tiltz"><div class="tiltc" id="tiltc">${cardHTML(c,{locked:!o,holo:o&&o.h>0})}</div></div>
<div class="info">
  <h3>${o?c.name:'Carte mystère'}</h3>
  <div class="badges"><span class="pill" style="color:${RCOL[c.rank]}">${RAR[c.rank].n}</span><span class="pill" style="color:${E.ec}">${icon(c.el)}${E.n}</span><span class="pill" style="color:var(--muted)">${pad(c.id)} / ${TOTAL}</span><span class="pill mutation-pill">${MUTATIONS[mutationFor(c.id)].name} · ×${MUTATIONS[mutationFor(c.id)].mult}</span></div>
  ${o?`<p class="flav">${c.flavor}</p>`:`<p class="flav">Elle se cache encore dans un booster.</p>`}
  <p class="own${o?'':' no'}">${o?`Tu en possèdes ${o.n}${o.h?` dont ${o.h} holo`:''}`:'Pas encore obtenue'}</p>
</div>
<div class="actions">${actions}</div>`;
  detail.hidden = false; lock();
  const tz = $('#tiltz'), tc = $('#tiltc');
  tz.addEventListener('pointermove', e => {
    const b = tz.getBoundingClientRect(), px=(e.clientX-b.left)/b.width, py=(e.clientY-b.top)/b.height;
    tc.style.setProperty('--rx', ((py-.5)*-16).toFixed(1)+'deg'); tc.style.setProperty('--ry', ((px-.5)*20).toFixed(1)+'deg');
  });
  tz.addEventListener('pointerleave', () => { tc.style.setProperty('--rx','0deg'); tc.style.setProperty('--ry','0deg'); });
  $('.xbtn', sheet).focus();
}
function closeDetail(){
  if(detail.hidden) return;
  detail.hidden = true; unlock();
  if(lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
sheet.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if(!b) return;
  const a = b.dataset.act, c = CARDS[detailId-1];
  if(a==='close') closeDetail();
  else if(a==='recycle'){ const v = recycleOne(detailId); if(v){ save(); toast(`+${v} ✦`); refreshAll(); openDetail(detailId); } }
  else if(a==='craft'){
    const cost = craftCost(c);
    if(state.dust>=cost && !state.owned[detailId]){ state.dust-=cost; state.owned[detailId]={n:1,h:0}; save(); toast(`${c.name} fabriquée`); refreshAll(); openDetail(detailId); }
  }
});
$('#scrim').addEventListener('click', closeDetail);

/* ouverture de booster */
const ov = $('#ov'), stage = $('#ovStage'), hint = $('#ovHint'), skipBtn = $('#ovSkip'), countEl = $('#ovCount');
let op = null;
function startOpen(){
  if(state.stock<1 || (!ov.hidden)) return;
  const now = Date.now();
  if(state.stock>=CAP) state.last = now;
  state.stock--; state.opened++;
  const pulls = rollPack().sort((a,b)=>a.card.rank-b.card.rank);
  const bestRank = Math.max(...pulls.map(p=>p.card.rank));
  const glow = document.querySelector('#homePack'); if(glow){glow.classList.add('pack-glow');glow.style.setProperty('--best-rarity',RCOL[bestRank]||'#ffffff');}
  const res = pulls.map(p => {
    const o = state.owned[p.card.id];
    if(!o){ addPulledCard(p); return {...p,isNew:true,mutation:mutationFor(p.card.id)}; }
    addPulledCard(p);
    return {...p,isNew:false};
  });
  state.recent = [...res.map(r=>r.card.id).reverse(), ...state.recent.filter(id=>!res.some(r=>r.card.id===id))].slice(0,10);
  save();
  op = {cards:res, i:0, flipped:false};
  renderHome(); renderRecent(); dirty = true;
  ov.hidden = false; lock(); showPack();
}
function startOpenAll(){
  if(state.stock<1 || !ov.hidden) return;
  const packs=Math.min(Number(state.stock)||0,100), all=[]; const now=Date.now();
  if((Number(state.stock)||0)>100) toast('Ouverture sécurisée : 100 boosters maximum par lot. Les autres restent en réserve.');
  if(state.stock>=CAP) state.last=now;
  for(let j=0;j<packs;j++){
    state.stock--; state.opened++;
    const pulls=rollPack();
    for(const p of pulls){
      const o=state.owned[p.card.id];
      addPulledCard(p); all.push({...p,isNew:!o,mutation:mutationFor(p.card.id)});
    }
  }
  state.recent=[...all.map(r=>r.card.id).reverse(),...state.recent.filter(id=>!all.some(r=>r.card.id===id))].slice(0,10);
  save(); op={cards:all,i:all.length,flipped:true,batch:true,packs}; renderHome();renderRecent();dirty=true;
  ov.hidden=false;lock();showSummary();
}
function showPack(){
  countEl.textContent = ''; skipBtn.hidden = true;
  stage.className = 'stage';
  stage.innerHTML = `<div class="packbtn" id="packBtn" role="button" tabindex="0" aria-label="Déchirer le booster"><div class="pk pkb">${packSVG()}</div><div class="pk pkt">${packSVG()}</div><span class="flash"></span></div>`;
  hint.textContent = 'Touche le booster pour le déchirer';
  $('#packBtn').focus();
}
function tearPack(){
  const pb = $('#packBtn'); if(!pb || pb.classList.contains('tear')) return;
  pb.classList.add('tear'); hint.textContent = '';
  setTimeout(showCard, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850);
}
function showCard(){
  const o = op.cards[op.i], c = o.card, left = op.cards.length-op.i-1;
  op.flipped = false;
  countEl.textContent = `${op.i+1} / ${op.cards.length}`; skipBtn.hidden = false;
  stage.className = 'stage';
  stage.innerHTML = `<div class="deck" data-fx="${c.rank}">
${left>1?'<div class="bigcard under u2"><div class="cb"></div></div>':''}${left>0?'<div class="bigcard under u1"><div class="cb"></div></div>':''}
<span class="burst"></span>
<div class="bigcard flipcard booster-card-static" id="flipCard" role="button" tabindex="0" aria-label="Carte suivante">${cardHTML(c,{holo:o.holo,isNew:o.isNew,count:0})}</div>
</div>`;
  hint.textContent = 'Touche la carte pour continuer';
  $('#flipCard').focus();
}
function sparkles(deck, rank){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const n = 8+rank*5;
  for(let i=0;i<n;i++){
    const sp = document.createElement('i'); sp.className='spark'; deck.appendChild(sp);
    const a = Math.random()*Math.PI*2, d = 120+Math.random()*150;
    sp.animate([{transform:'rotate(45deg) translate(0,0) scale(1)',opacity:1},{transform:`rotate(45deg) translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.2)`,opacity:0}],{duration:700+Math.random()*500,easing:'ease-out'}).onfinish = () => sp.remove();
  }
}
function flipOrNext(){
  const fc = $('#flipCard'); if(!fc || fc.classList.contains('out')) return;
  const c = op.cards[op.i].card;
  fc.classList.add('out');
  playGameSound('tap');
  setTimeout(() => { op.i++; if(op.i<op.cards.length) showCard(); else showSummary(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180);
}
function showSummary(){
  const news = op.cards.filter(x=>x.isNew).length, dup = op.cards.length-news, holos = op.cards.filter(x=>x.holo).length;
  countEl.textContent = ''; skipBtn.hidden = true; hint.textContent = '';
  stage.className = 'stage';
  const bits = [`${news} nouvelle${news>1?'s':''}`, `${dup} doublon${dup>1?'s':''}`]; if(holos) bits.push(`${holos} holo`);
  stage.innerHTML = `<div class="sum"><h2>${op.batch?`${op.packs} boosters ouverts !`:'Booster ouvert'}</h2><p class="sub">${bits.join(' · ')}</p>
<div class="sumgrid">${op.cards.slice().reverse().map(x=>{const ow=state.owned[x.card.id];return `<div class="cell" role="button" tabindex="0" data-id="${x.card.id}" aria-label="${x.card.name}">${cardHTML(x.card,{mini:true,holo:x.holo,isNew:x.isNew,count:ow.n})}</div>`;}).join('')}</div>
<div class="actions"><button class="btn primary" id="sumMore" type="button"${(op.eventMode||state.stock<1)?' disabled':''}>${op.eventMode?'Booster événement terminé':(op.batch?'Ouvrir les suivants':'Ouvrir un autre')+' · '+state.stock+' en réserve'}</button><button class="btn secondary" id="sumClose" type="button">Terminer</button></div></div>`;
  $('#sumClose').focus();
}
function closeOpen(){
  ov.hidden = true; unlock(); op = null; stage.innerHTML = '';
  refreshAll();
}
stage.addEventListener('click', e => {
  if(e.target.closest('#packBtn')) return tearPack();
  if(e.target.closest('#flipCard')) return flipOrNext();
  if(e.target.closest('#sumMore')){ ov.hidden=true; unlock(); op=null; startOpen(); return; }
  if(e.target.closest('#sumClose')) return closeOpen();
  const cell = e.target.closest('.cell'); if(cell) openDetail(+cell.dataset.id);
});
skipBtn.addEventListener('click', () => { if(op){ op.i = op.cards.length; showSummary(); } });

/* Correctif navigation mobile : gestion directe en phase capture pour que les onglets restent cliquables même si un autre composant intercepte le clic. */
(function fixTabNavigation(){
  const nav=document.querySelector('.tabbar.compact-nav');
  const panel=document.getElementById('moreTabs');
  const plus=document.getElementById('plusNavToggle');
  if(!nav) return;
  nav.style.position='sticky'; nav.style.zIndex='500'; nav.style.pointerEvents='auto';
  nav.querySelectorAll('button[data-tab]').forEach(btn=>{btn.style.pointerEvents='auto';btn.style.touchAction='manipulation';});
  nav.addEventListener('click',function(e){
    const btn=e.target.closest('button[data-tab]'); if(!btn||!nav.contains(btn)) return;
    if(btn.id==='plusNavToggle') return;
    e.preventDefault();
    if(typeof showTab==='function') showTab(btn.dataset.tab);
    if(panel) panel.hidden=true;
    if(plus) plus.setAttribute('aria-expanded','false');
  },true);
  if(panel){panel.style.zIndex='501';panel.style.pointerEvents='auto';panel.querySelectorAll('button[data-tab]').forEach(btn=>{btn.style.pointerEvents='auto';btn.style.touchAction='manipulation';});
    panel.addEventListener('click',function(e){const btn=e.target.closest('button[data-tab]');if(!btn)return;e.preventDefault();if(typeof showTab==='function')showTab(btn.dataset.tab);panel.hidden=true;if(plus)plus.setAttribute('aria-expanded','false');},true);
  }
})();

/* Navigation Plus : les rubriques secondaires sont rangées dans un seul panneau. */
const moreTabsPanel=document.getElementById('moreTabs');
const plusNavToggle=document.getElementById('plusNavToggle');
function toggleMoreTabs(force){if(!moreTabsPanel||!plusNavToggle)return;const open=typeof force==='boolean'?force:moreTabsPanel.hidden;moreTabsPanel.hidden=!open;plusNavToggle.setAttribute('aria-expanded',String(open));}
plusNavToggle?.addEventListener('click',()=>toggleMoreTabs());
document.getElementById('closeMoreTabs')?.addEventListener('click',()=>toggleMoreTabs(false));
document.addEventListener('click',e=>{if(moreTabsPanel&&!moreTabsPanel.hidden&&!e.target.closest('#moreTabs')&&!e.target.closest('#plusNavToggle'))toggleMoreTabs(false);});
/* événements globaux */
document.addEventListener('click', e => {
  const albumCell=e.target.closest('.album-cell'); if(albumCell){const id=+albumCell.dataset.id;if(state.owned[id]?.n>0)openDetail(id);else toast('Cette carte est encore inconnue !');return;}
  const tb = e.target.closest('.tab-btn'); if(tb){ if(!tb.dataset.tab)return; showTab(tb.dataset.tab); toggleMoreTabs(false); return; }
  if(ov.contains(e.target) || detail.contains(e.target)) return;
  const cell = e.target.closest('.cell'); if(cell){ openDetail(+cell.dataset.id); return; }
  if(e.target.closest('#openAllBtn')) { startOpenAll(); return; }
  if(e.target.closest('#homePack') || e.target.closest('#openBtn')) startOpen();
});
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){ if(!detail.hidden) closeDetail(); return; }
  if(e.key==='Enter' || e.key===' '){
    const t = e.target.closest && e.target.closest('[role=button]');
    if(t){ e.preventDefault(); t.click(); }
  }
});
$('#buyBtn').addEventListener('click', () => {
  if(state.dust<PACK_COST) return;
  state.dust -= PACK_COST; state.stock++; save(); toast('Booster acheté'); renderHome();
});
$('#buyChosenBtn').addEventListener('click', () => {
  const input=$('#buyPackCount'); const n=Math.max(1,Math.min(500,Math.floor(Number(input.value)||1))); input.value=n;
  const cost=PACK_COST*n;
  if(state.dust<cost){ $('#buyPackStatus').textContent=`Il te manque ${cost-state.dust} ✦ pour acheter ${n} booster(s).`; toast('Pas assez de Orbres'); return; }
  state.dust-=cost; state.stock+=n; save(); renderHome();
  $('#buyPackStatus').textContent=`${n} booster(s) acheté(s) pour ${cost} ✦.`; toast(`${n} booster(s) acheté(s) !`);
});
$('#buyPackCount')?.addEventListener('input',()=>{const n=Math.floor(Number($('#buyPackCount').value)||1);$('#buyPackStatus').textContent=`Total : ${Math.max(1,Math.min(500,n))*PACK_COST} ✦`;renderHome();});
$('#dailyClaim').addEventListener('click', () => {
  const daily = state.daily || (state.daily={lastClaim:'',streak:0});
  const today = dateKey();
  if(daily.lastClaim===today){ renderDaily(); return; }
  const yd = new Date(); yd.setDate(yd.getDate()-1);
  const streak = daily.lastClaim===dateKey(yd) ? daily.streak+1 : 1;
  const reward = 25+Math.min(streak,7)*5;
  daily.lastClaim = today; daily.streak = streak;
  state.dust += reward;
  let extra = '';
  if(streak%7===0){ state.stock++; extra=' + 1 booster bonus !'; }
  save(); refreshAll(); toast(`+${reward} ✦${extra}`);
});
$('#questList').addEventListener('click',e=>{const b=e.target.closest('[data-claim-quest]');if(!b)return;const q=QUESTS.find(x=>x.id===b.dataset.claimQuest);if(!q||state.quests.claimed.includes(q.id)||q.progress()<q.goal)return;state.quests.claimed.push(q.id);state.dust+=q.reward;save();refreshAll();toast(`Quête terminée : +${q.reward} ✦`);});
$('#rotatingQuestList').addEventListener('click',e=>{const b=e.target.closest('[data-claim-rotating]');if(!b)return;rotateQuests();const q=ROTATING_QUESTS.find(x=>x.id===b.dataset.claimRotating);if(!q||state.rotatingQuests.claimed.includes(q.id)||q.progress()<q.goal)return;state.rotatingQuests.claimed.push(q.id);state.dust+=q.reward;save();refreshAll();toast(`Quête tournante terminée : +${q.reward} ✦`);});
$('#friendForm').addEventListener('submit',async e=>{e.preventDefault();const name=$('#friendName').value.trim();if(!name)return;if(authToken&&currentUser){try{await api('/api/friends',{method:'POST',body:JSON.stringify({username:name})});$('#friendName').value='';await refreshServerSocial();toast('Demande d’ami envoyée à '+name);}catch(err){toast(err.message);}return;}if(state.friends.some(f=>f.toLowerCase()===name.toLowerCase())){toast('Cet ami est déjà dans ta liste');return;}state.friends.push(name);$('#friendName').value='';save();renderQuests();toast(`${name} ajouté à ta liste locale`);});
$('#friendList').addEventListener('click',async e=>{const accept=e.target.closest('[data-accept-friend]');if(accept){try{await api('/api/friends/'+encodeURIComponent(accept.dataset.acceptFriend)+'/accept',{method:'POST',body:'{}'});await refreshServerSocial();toast('Ami ajouté !');}catch(err){toast(err.message);}return;}const view=e.target.closest('[data-view-friend]');if(view){try{const d=await api('/api/users/'+encodeURIComponent(view.dataset.viewFriend)+'/collection');const items=Object.entries(d.collection||{}).map(([id,c])=>`${CARDS[Number(id)-1]?.name||('Carte '+id)} ×${c.n||1}`).join('\n');alert('Collection de '+d.username+'\n\n'+(items||'Aucune carte'));}catch(err){toast(err.message);}return;}const b=e.target.closest('[data-remove-friend]');if(!b)return;state.friends.splice(+b.dataset.removeFriend,1);save();renderQuests();});
$('#tradeForm').addEventListener('submit',async e=>{e.preventDefault();const friend=$('#tradeFriend').value,id=+$('#tradeCard').value;if(!friend||!id)return;const c=CARDS[id-1],o=state.owned[id];if(!o||o.n<=1){toast('Il faut posséder un doublon');renderQuests();return;}if(authToken&&currentUser){try{await syncCollection();await api('/api/trades',{method:'POST',body:JSON.stringify({username:friend,cardId:id})});await refreshServerSocial();toast('Proposition envoyée à '+friend);}catch(err){toast(err.message);}return;}state.trades.push({friend,card:c.name,status:'Proposition locale'});save();renderQuests();toast('Proposition enregistrée localement');});
$('#tradeList').addEventListener('click',async e=>{const a=e.target.closest('[data-accept-trade]'),d=e.target.closest('[data-decline-trade]');try{if(a){await api('/api/trades/'+a.dataset.acceptTrade+'/accept',{method:'POST',body:'{}'});const me=await api('/api/me');currentUser=me.user;state.owned=me.user.collection||{};state.dust=Math.max(state.dust,Number(me.user.dust)||0);save();refreshAll();await refreshServerSocial();toast('Échange accepté !');}else if(d){await api('/api/trades/'+d.dataset.declineTrade+'/decline',{method:'POST',body:'{}'});await refreshServerSocial();toast('Échange refusé');}}catch(err){toast(err.message);}});
$('#accountForm').addEventListener('submit',e=>{e.preventDefault();authenticate('login');});
$('#registerAccount').addEventListener('click',()=>authenticate('register'));
$('#logoutAccount').addEventListener('click',()=>{authToken='';currentUser=null;localStorage.removeItem(TOKEN_KEY);updateAccountUI();renderQuests();accountMessage('Déconnecté · ta sauvegarde locale est conservée.');toast('Déconnexion réussie');});
renderCardPickers();
configureGoogleSignIn();
if(authToken){api('/api/me').then(d=>{currentUser=d.user;state.dust=Number(d.user.dust)||0;state.owned=d.user.collection||{};lastSyncedOwned=JSON.parse(JSON.stringify(state.owned));updateAccountUI();refreshAll();refreshServerSocial();}).catch(()=>{authToken='';localStorage.removeItem(TOKEN_KEY);updateAccountUI();});}else updateAccountUI();
$('#cardSearch').addEventListener('input', e => {
  F.search = e.target.value;
  if(!$('#tab-collection').hidden) renderCollection();
});
$('#elChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if(!b) return; F.el = b.dataset.el; renderCollection(); });
$('#rarSel').addEventListener('change', e => { F.rar = e.target.value; renderCollection(); });
$('#sortSel')?.addEventListener('change',e=>{F.sort=e.target.value;renderCollection();});
$('#missChip').addEventListener('click', () => { F.miss = !F.miss; renderCollection(); });

function loop(){
  const g = tick(state, Date.now()); collectIncome(false); if(!$('#tab-quests').hidden)renderRotatingQuests(); if(!$('#tab-auctions').hidden)renderAuctionHistory();
  if(!$('#tab-market').hidden){
    const left=3600000-(Date.now()%3600000);
    $('#marketTimer').textContent=fmt(left);
    $('#marketBar').style.width=(left/3600000*100)+'%';
    if(state.marketHour!==Math.floor(Date.now()/3600000)) renderMarket();
  }
  if(g>0){ save(); if(ov.hidden) toast(g>1 ? `${g} boosters sont prêts` : 'Un booster est prêt'); }
  if(!$('#tab-home').hidden) renderHome();
}

/* Aperçu du contenu de chaque booster et progression de collection */
function getBoosterCards(theme){
  if(theme==='apex') return APEX_CARDS;
  return CARDS.filter(c=>!c.event&&!c.apex);
}
function renderBoosterPreview(){
  const theme=selectedBoosterTheme||'nebula',cards=getBoosterCards(theme);
  const title=$('#boosterPreviewTitle'),count=$('#boosterOwnedCount'),box=$('#boosterPreviewCards'),btn=$('#toggleBoosterPreview');
  if(!title||!count||!box||!btn)return;
  const unique=cards.filter(c=>(state.owned?.[c.id]?.n||0)>0).length;
  title.textContent='Cartes du booster '+(BOOSTER_THEME_NAMES[theme]||'Nébuleuse').replace(/ ·.*/, '');
  count.textContent=`${unique}/${cards.length} cartes découvertes`;
  box.innerHTML=cards.map((c,i)=>{const o=state.owned?.[c.id],got=!!(o&&o.n>0);return `<div class="cell" style="padding:5px;min-width:0"><div class="card mini" data-r="${c.rank}">${cardHTML(c,{mini:true,locked:!got,count:o?.n||0})}</div><p style="font-size:.72rem;font-weight:800;margin:5px 0 2px;text-align:center">${got?escapeHTML(c.name):'???'}</p><p class="quest-desc" style="font-size:.67rem;text-align:center">${got?RAR[c.rank].n:'À découvrir'}</p></div>`}).join('');
  const expanded=btn.getAttribute('aria-expanded')==='true';box.classList.toggle('booster-preview-collapsed',!expanded);box.classList.toggle('booster-preview-expanded',expanded);btn.textContent=expanded?'Voir moins ↑':'Voir plus ↓';
}
$('#toggleBoosterPreview')?.addEventListener('click',()=>{const btn=$('#toggleBoosterPreview'),box=$('#boosterPreviewCards');const expanded=btn.getAttribute('aria-expanded')!=='true';btn.setAttribute('aria-expanded',String(expanded));box.classList.toggle('booster-preview-collapsed',!expanded);box.classList.toggle('booster-preview-expanded',expanded);btn.textContent=expanded?'Voir moins ↑':'Voir plus ↓';});

/* Choix visuel du thème de booster */
const BOOSTER_THEME_NAMES={nebula:'Nébuleuse',city:'Ville néon',nature:'Sauvage',ocean:'Océan',cyber:'Cyber',apex:'Apex · 50 nouvelles cartes'};
let selectedBoosterTheme='nebula';
function selectBoosterTheme(theme){
  if(!BOOSTER_THEME_NAMES[theme]) return;
  selectedBoosterTheme=theme;
  $$('#boosterThemes .theme-card').forEach(btn=>{const active=btn.dataset.theme===theme;btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));});
  const status=$('#themeStatus');if(status)status.textContent='Thème sélectionné : '+BOOSTER_THEME_NAMES[theme]+(theme==='apex'?' · 50 cartes exclusives':'');const openBtn=$('#openBtn');if(openBtn)openBtn.textContent=theme==='apex'?'Ouvrir un booster Apex':'Ouvrir un booster';
  const img=$('#homePackImg');if(img){const filters={nebula:'hue-rotate(0deg)',city:'hue-rotate(65deg) saturate(1.25)',nature:'hue-rotate(125deg) saturate(1.1)',ocean:'hue-rotate(175deg)',cyber:'hue-rotate(245deg) saturate(1.4)',apex:'grayscale(.5) contrast(1.1)'};img.style.filter=filters[theme];}
}
$('#boosterThemes')?.addEventListener('click',e=>{const btn=e.target.closest('[data-theme]');if(btn){selectBoosterTheme(btn.dataset.theme);renderBoosterPreview();}});
$('#toggleEventCards')?.addEventListener('click',()=>renderBoosterPreview());

/* démarrage */
function start(data){
  state = (data && data.state && data.state.v===1) ? data.state : load();
  state.quests=state.quests||{recycled:0,claimed:[]}; state.friends=state.friends||[]; state.trades=state.trades||[];
  const g = tick(state, Date.now()); collectIncome(false);
  if(g>0) save();
  ensureMarket();
  buildFilters(); buildPips();
  $('#homePackImg').innerHTML = packSVG();
  renderHome(); renderRecent(); renderQuests(); renderIncome(); updateAccountUI(); renderBoosterPreview();
  setInterval(loop, 1000);
  document.addEventListener('visibilitychange', loop);
  if(g>0) setTimeout(()=>toast(g>1 ? `${g} boosters t’attendaient` : 'Un booster t’attendait'), 500);
}
try{ if(window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({state})); }catch(e){}
const hot = window.claude && window.claude.hot;
if(hot && hot.ready) hot.ready(start); else start(hot && hot.data ? hot.data : {});
})();


(()=>{const go=document.getElementById('goOpenBoosters');if(go)go.addEventListener('click',()=>{if(typeof showTab==='function')showTab('boosters');else document.querySelector('[data-tab="boosters"]')?.click();window.scrollTo({top:0,behavior:'smooth'});});const nav=document.querySelector('.tabbar.compact-nav'),hint=document.getElementById('navSwipeHint');if(nav&&hint){let touched=false;const update=()=>{const canScroll=nav.scrollWidth>nav.clientWidth+8;hint.style.display=canScroll?'flex':'none';if(touched)hint.style.opacity='.62';};nav.addEventListener('scroll',()=>{touched=true;hint.style.opacity='.62';},{passive:true});nav.addEventListener('touchstart',()=>{touched=true;},{passive:true});window.addEventListener('resize',update);setTimeout(update,100);}}
)();
