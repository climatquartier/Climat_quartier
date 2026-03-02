# Climat’Quartier – Documentation technique du module de scénarios

Ce document décrit le **modèle de calcul** utilisé pour simuler l’impact des actions d’aménagement sur les indicateurs affichés dans l’application Climat’Quartier.

Il s’adresse aux développeur·euse·s qui doivent :

- implémenter les fonctions de calcul dans une application web (JS/TS, Python, etc.) ;
- comprendre comment les **tableaux de scénarios** (Excel) sont traduits en **formules** ;
- éventuellement faire évoluer ces scénarios ou en ajouter de nouveaux.

---

## 1. Objectif du module

Le module de scénarios permet de **calculer l’évolution de plusieurs indicateurs** (température, ICU, pollution, biodiversité, etc.) en fonction des actions suivantes :

1. **Végétalisation – plantation d’arbres**  
   → fichier `Scenario_Vegetalisation.xlsx`

2. **Augmentation des espaces verts**  
   → fichier `Scenario_Espaces_Verts.xlsx`

3. **Évolution de la densité urbaine**  
   → fichier `Scenario_Densite_Urbaine.xlsx`

4. **Perméabilisation des sols**  
   → fichier `Scenario_Sols_Permeables.xlsx`

Pour chaque action, les tableaux fournissent **quelques points de référence** (par ex. “+10 % d’espaces verts”), et le module doit calculer un impact pour **n’importe quelle valeur intermédiaire** (par ex. “+18 %”).

---

## 2. Structure générale

### 2.1. Indicateurs de base

L’application dispose d’une structure de données représentant la situation de référence du quartier :

```ts
type Indicateurs = {
  temperature: number;        // °C
  icu: number;                // °C d’îlot de chaleur urbain
  pm25: number;               // µg/m³
  biodiversite: number;       // indice (1.0 = situation de référence)
  surfaceParHab: number;      // m² d’espaces verts par habitant
  surfaceEVParHab: number;    // m² d’EV/hab (si distinct)
  loisirs: number;            // indice (1.0 = situation de référence)
  infiltration: number;       // indice
  inondations: number;        // indice de risque (1.0 = référence)
  nappes: number;             // indice recharge nappes (1.0 = référence)
};
```
### 2.2. Indicateurs de base

On utilise deux types de transformations :

**Additive** – pour les grandeurs en valeur absolue (températures, ICU) :

```valeur_finale = valeur_base + delta;```

**Multiplicative** – pour les pourcentages / indices (pollution, biodiversité, loisirs, infiltration, etc.) :

```valeur_finale = valeur_base * (1 + delta_pct / 100)```

#### Exemples :
    1. ΔPM2.5 = −15 %
```pm25_finale = pm25_base * (1 - 15/100)```

    2. Δbiodiversité = +45 %
```biodiversite_finale = biodiversite_base * (1 + 45/100)```

## 3. Interpolation des scénarios

### 3.1. Représentation des points

Chaque tableau Excel est converti en une liste de points ```{x, y}``` :

* x = niveau d’action (nombre d’arbres, % d’espaces verts, % de perméabilisation, variation de densité…) ;
* y = impact sur un indicateur donné (Δ°C, Δ %, etc.).

On ajoute systématiquement un point ```(x=0, y=0)``` si le tableau ne comporte que des valeurs “positives”, pour garantir que “pas d’action = pas d’impact”.

Exemple (végétalisation, impact sur la température) :

```ts
const TREE_DELTA_TEMP = [
  { x: 0,     y: 0.0  },
  { x: 5000,  y: -0.8 },
  { x: 10000, y: -1.5 },
  { x: 20000, y: -2.5 },
];
```

### 3.2. Fonction d'interpolation linéaire 

L’algorithme d’interpolation linéaire prend :
* un niveau d’action x (ex. 7500 arbres) ;
* une liste de points triés par x.

et renvoie un y interpolé (ex. ΔTempérature ≈ −1.15 °C).

```ts
type Point = { x: number; y: number };

/**
 * Interpolation linéaire dans un ensemble de points (x, y) triés.
 *
 * @param x      Niveau d’action (ex : 7500 arbres, +18 % EV, etc.)
 * @param points Points de scénario triés par x croissant
 * @returns      Valeur interpolée de y pour x
 */
export function interpolate(x: number, points: Point[]): number {
  // Sécurité : au moins 2 points
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0].y;

  // Cas x avant le premier point : extrapolation depuis l’origine
  if (x <= points[0].x) {
    const p0 = points[0];
    if (p0.x === 0) {
      // Cas fréquent : 0 -> 0
      return p0.y * (x / 1); // y=0 en pratique
    }
    // Sinon extrapolation proportionnelle
    return p0.y * (x / p0.x);
  }

  // Recherche du segment contenant x
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    if (x >= p1.x && x <= p2.x) {
      const t = (x - p1.x) / (p2.x - p1.x);
      return p1.y + t * (p2.y - p1.y);
    }
  }

  // Cas x après le dernier point : extrapolation à partir des deux derniers
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const slope = (last.y - prev.y) / (last.x - prev.x);

  return last.y + slope * (x - last.x);
}

```
## 4. Scénario 1 – Végétalisation (plantation d’arbres)
### 4.1. Données sources (Excel)

| Action | Délai| Impact Température | Impact Pollution | Impact Biodiversité | Impact ICU |
|:-------- |:--------:| --------:|:-------- |:--------:| --------:|
| Plantation 5,000 arbres	2025    | −0.8°C  | −8%   |PM2.5    | +25%| −0.4°C |		 		
| Plantation 10,000 arbres |	2030	|−1.5°C	|−15% |PM2.5	|+45%	|−0.7°C|
Plantation 20,000 arbres| 2050	|−2.5°C|	−25%| PM2.5|	+80%	|−1.2°C|

### 4.2. Données de configuration

```Nombre d’arbres plantés (x) → ΔTempérature (°C)```
```ts
const TREE_DELTA_TEMP: Point[] = [
  { x: 0,     y: 0.0  },
  { x: 5000,  y: -0.8 },
  { x: 10000, y: -1.5 },
  { x: 20000, y: -2.5 },
];
```
```Nombre d’arbres → ΔPM2.5 (%)```
```ts
const TREE_DELTA_PM25: Point[] = [
  { x: 0,     y: 0.0  },
  { x: 5000,  y: -8.0 },
  { x: 10000, y: -15.0 },
  { x: 20000, y: -25.0 },
];
```
```Nombre d’arbres → ΔBiodiversité (%)```
```ts
const TREE_DELTA_BIODIV: Point[] = [
  { x: 0,     y: 0.0  },
  { x: 5000,  y: 25.0 },
  { x: 10000, y: 45.0 },
  { x: 20000, y: 80.0 },
];
```
```Nombre d’arbres → ΔICU (°C)```
```ts
const TREE_DELTA_ICU: Point[] = [
  { x: 0,     y: 0.0  },
  { x: 5000,  y: -0.4 },
  { x: 10000, y: -0.7 },
  { x: 20000, y: -1.2 },
];
```

### 4.3. Fonction de calcul
```ts
/**
 * Impact de la plantation d’arbres sur les indicateurs.
 *
 * @param nbArbres        Nombre d’arbres plantés
 * @param base            Indicateurs de référence
 * @returns               Nouveaux indicateurs après végétalisation
 */
export function impactVegetalisation(nbArbres: number, base: Indicateurs): Indicateurs {
  const dT    = interpolate(nbArbres, TREE_DELTA_TEMP);      // °C
  const dPM25 = interpolate(nbArbres, TREE_DELTA_PM25);      // %
  const dBio  = interpolate(nbArbres, TREE_DELTA_BIODIV);    // %
  const dICU  = interpolate(nbArbres, TREE_DELTA_ICU);       // °C

  return {
    ...base,
    temperature:  base.temperature + dT,
    icu:          base.icu + dICU,
    pm25:         base.pm25 * (1 + dPM25 / 100),
    biodiversite: base.biodiversite * (1 + dBio / 100),
  };
}
```

## 5. Scénario 2 – Espaces verts

5.1. Données sources (Excel)

|Action	|Délai	|Surface/habitant	|Impact ICU	|Impact Biodiversité |Impact Loisirs|
|:-------- |:--------:| --------:|:-------- |:--------:| --------:|
|+10% espaces verts|	2027|	+12%|	−0.5°C|	+30%|	+25% activité|
|+25% espaces verts|	2035|	+28%|	−1.0°C|	+65%|	+45% activité|
|+50% espaces verts|	2050|	+55%|	−1.8°C|	+120%|	+80% activité|

On généralise en prenant l’entrée comme un pourcentage deltaEVpct (+10, +25, +50…).

### 5.2. Données de configuration

```ΔEspaces verts (%) → ΔSurface EV/hab (%)```
```ts
const EV_DELTA_SURFACE_HAB: Point[] = [
  { x: 0,  y: 0.0  },
  { x: 10, y: 12.0 },
  { x: 25, y: 28.0 },
  { x: 50, y: 55.0 },
];
```
```ΔEspaces verts (%) → ΔICU (°C)```
```ts
const EV_DELTA_ICU: Point[] = [
  { x: 0,  y: 0.0  },
  { x: 10, y: -0.5 },
  { x: 25, y: -1.0 },
  { x: 50, y: -1.8 },
];
```
```ΔEspaces verts (%) → ΔBiodiversité (%)```
```ts
const EV_DELTA_BIODIV: Point[] = [
  { x: 0,  y: 0.0  },
  { x: 10, y: 30.0 },
  { x: 25, y: 65.0 },
  { x: 50, y: 120.0 },
];
```
```Espaces verts (%) → ΔLoisirs (%)```
```ts
const EV_DELTA_LOISIRS: Point[] = [
  { x: 0,  y: 0.0  },
  { x: 10, y: 25.0 },
  { x: 25, y: 45.0 },
  { x: 50, y: 80.0 },
];
```

### 5.3. Fonction de calcul
```ts
/**
 * Impact d’une variation d’espaces verts sur les indicateurs.
 *
 * @param deltaEVpct  Variation d’espaces verts en %, ex : 18
 * @param base        Indicateurs de référence
 */
export function impactEspacesVerts(deltaEVpct: number, base: Indicateurs): Indicateurs {
  const dSurf   = interpolate(deltaEVpct, EV_DELTA_SURFACE_HAB); // %
  const dICU    = interpolate(deltaEVpct, EV_DELTA_ICU);         // °C
  const dBio    = interpolate(deltaEVpct, EV_DELTA_BIODIV);      // %
  const dLoisir = interpolate(deltaEVpct, EV_DELTA_LOISIRS);     // %

  return {
    ...base,
    surfaceParHab: base.surfaceParHab * (1 + dSurf / 100),
    icu:           base.icu + dICU,
    biodiversite:  base.biodiversite * (1 + dBio / 100),
    loisirs:       base.loisirs * (1 + dLoisir / 100),
  };
}
```

## 6. Scénario 3 – Densité urbaine
### 6.1. Données sources (Excel)

|Action	|Délai|	Densité population|	Impact ICU|	Impact PM2.5|	Impact Espaces verts/hab|
|:-------- |:--------:| --------:|:-------- |:--------:| --------:|
|Densification|	2030|	+15%|	+0.4°C|	+10%|	−12%|
|Maintien|	2030|	0%|	0°C|	0%|	0%|
|Dédensification|	2030|	−10%|	−0.3°C|	−8%|	+15%|

On prend en entrée une variation de densité en % (deltaDensitePct), qui peut être :
* +15 (densification)
* 0 (maintien)
* −10 (dédensification)
* ou toute valeur intermédiaire.

### 6.2. Données de configuration
```ts
// ΔDensité (%) → ΔICU (°C)
const DENS_DELTA_ICU: Point[] = [
  { x: -10, y: -0.3 },
  { x: 0,   y: 0.0  },
  { x: 15,  y: 0.4  },
];

// ΔDensité (%) → ΔPM2.5 (%)
const DENS_DELTA_PM25: Point[] = [
  { x: -10, y: -8.0 },
  { x: 0,   y: 0.0  },
  { x: 15,  y: 10.0 },
];

// ΔDensité (%) → ΔEV/hab (%)
const DENS_DELTA_EV_HAB: Point[] = [
  { x: -10, y: 15.0  },
  { x: 0,   y: 0.0   },
  { x: 15,  y: -12.0 },
];
```
### 6.3. Fonction de calcul
```ts
/**
 * Impact d’une variation de densité urbaine sur les indicateurs.
 *
 * @param deltaDensitePct  Variation de densité en %, ex : +15 ou -10
 * @param base             Indicateurs de référence
 */
export function impactDensite(deltaDensitePct: number, base: Indicateurs): Indicateurs {
  const dICU   = interpolate(deltaDensitePct, DENS_DELTA_ICU);    // °C
  const dPM25  = interpolate(deltaDensitePct, DENS_DELTA_PM25);   // %
  const dEVHab = interpolate(deltaDensitePct, DENS_DELTA_EV_HAB); // %

  return {
    ...base,
    icu:             base.icu + dICU,
    pm25:            base.pm25 * (1 + dPM25 / 100),
    surfaceEVParHab: base.surfaceEVParHab * (1 + dEVHab / 100),
  };
}
```

## 7. Scénario 4 – Sols perméables
### 7.1. Données sources (Excel)

|Action|	Délai|	Infiltration|	Inondations|	Rafraîchissement|	Nappes phréatiques|
|:-------- |:--------:| --------:|:-------- |:--------:| --------:|
|20% perméabilisation|	2026|	+30%|	−25%|	−1.0°C|	+15%|
|40% perméabilisation|	2032|	+55%|	−45%|	−1.8°C|	+30%|
|70% perméabilisation|	2045|	+85%|	−70%|	−3.0°C|	+55%|

Entrée générique : pctPerm = % de surface perméabilisée (0–70, voire plus).

### 7.2. Données de configuration
```% perméabilisation → ΔInfiltration (%)```
```ts
const PERM_DELTA_INFILTRATION: Point[] = [
  { x: 0,  y: 0.0  },
  { x: 20, y: 30.0 },
  { x: 40, y: 55.0 },
  { x: 70, y: 85.0 },
];
```
```% perméabilisation → ΔInondations (%)```
```ts
const PERM_DELTA_INONDATIONS: Point[] = [
  { x: 0,  y: 0.0   },
  { x: 20, y: -25.0 },
  { x: 40, y: -45.0 },
  { x: 70, y: -70.0 },
];
```
```% perméabilisation → ΔTempérature (°C) (Rafraîchissement)```
```ts
const PERM_DELTA_TEMP: Point[] = [
  { x: 0,  y: 0.0  },
  { x: 20, y: -1.0 },
  { x: 40, y: -1.8 },
  { x: 70, y: -3.0 },
];
```
```% perméabilisation → ΔNappes (%)```
```ts
const PERM_DELTA_NAPPES: Point[] = [
  { x: 0,  y: 0.0  },
  { x: 20, y: 15.0 },
  { x: 40, y: 30.0 },
  { x: 70, y: 55.0 },
];
```
### 7.3. Fonction de calcul
```ts
/**
 * Impact de la perméabilisation des sols sur les indicateurs.
 *
 * @param pctPerm  Pourcentage de surface perméabilisée (0–100)
 * @param base     Indicateurs de référence
 */
export function impactSolsPermeables(pctPerm: number, base: Indicateurs): Indicateurs {
  const dInf   = interpolate(pctPerm, PERM_DELTA_INFILTRATION); // %
  const dInond = interpolate(pctPerm, PERM_DELTA_INONDATIONS);  // %
  const dT     = interpolate(pctPerm, PERM_DELTA_TEMP);         // °C
  const dNapp  = interpolate(pctPerm, PERM_DELTA_NAPPES);       // %

  return {
    ...base,
    infiltration: base.infiltration * (1 + dInf / 100),
    inondations: base.inondations * (1 + dInond / 100),
    temperature: base.temperature + dT,
    nappes:      base.nappes * (1 + dNapp / 100),
  };
}
```

## 8. Combinaison de plusieurs actions

Dans l’interface, plusieurs actions peuvent être activées simultanément (ex. arbres + espaces verts + sols perméables).
Le schéma de base recommandé :
On part des ```indicateursBase```.
On applique chaque action de manière séquentielle, en réutilisant la sortie de la précédente comme nouvelle base :
```ts
export function appliquerScenarioGlobal(
  base: Indicateurs,
  params: {
    nbArbres: number;
    deltaEspacesVertsPct: number;
    deltaDensitePct: number;
    pctPerm: number;
  },
): Indicateurs {
  let res = { ...base };

  res = impactVegetalisation(params.nbArbres, res);
  res = impactEspacesVerts(params.deltaEspacesVertsPct, res);
  res = impactDensite(params.deltaDensitePct, res);
  res = impactSolsPermeables(params.pctPerm, res);

  return res;
}
```

```Remarque : l’ordre d’application peut légèrement modifier le résultat.  Pour un outil pédagogique, une simple convention fixe (toujours le même ordre) est suffisante. ```
