# Produkt-Scan & OpenFoodFacts API

> Dieses Dokument beschreibt die technische Integration einer Lebensmittel-Scan-Funktion in das Web-Tool. Es bildet die Grundlage für die Backend-Entwicklung.

---

## 1. OpenFoodFacts Überblick

**OpenFoodFacts** ist die größte frei verfügbare Lebensmittel-Produktdatenbank der Welt.

- **Daten:** 2.5M+ Produkte (weltweit)
- **Lizenz:** Open Database License (ODbL) - frei für nicht-kommerzielle und kommerzielle Nutzung
- **API:** REST-basiert, kostenlos, keine Anmeldung für Basis-Nutzung
- **Barcode-Abdeckung:** Für Deutschland ca. 60-70% der Supermarktprodukte

**Relevanz für das Projekt:**
- ✓ Kostenlose Nutzung
- ✓ Barcode-Scan möglich
- ✓ Nährwertdaten vorhanden (Energie, Fett, Zucker, Protein, Ballaststoffe, etc.)
- ✓ Ingredients-Liste vorhanden (für Allergen-/Zusatzstoff-Check)
- ✓ Categories für Produkttyp
- ✓ Labels für "glutenfrei", "vegan", "bio" etc.
- ⚠ Keine spezifischen "Hashimoto/PCOS-Scores" → müssen wir selbst berechnen

---

## 2. API-Endpunkte

### 2.1 Produkt-Abfrage per Barcode

```
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

**Beispiel:**
```
GET https://world.openfoodfacts.org/api/v0/product/7622210449283.json
```

**Antwort (relevante Felder):**

```json
{
  "status": 1,
  "status_verbose": "product found",
  "product": {
    "product_name": "Vollkorn-Haferflocken",
    "brands": "Märkisches Hofbräu",
    "ingredients_text": "Vollkorn-Haferflocken 100%",
    "nutriscore_grade": "a",
    "nutriments": {
      "energy-kcal_100g": 375,
      "fat_100g": 6.6,
      "saturated-fat_100g": 1.2,
      "carbohydrates_100g": 55,
      "sugars_100g": 1.0,
      "fiber_100g": 9.7,
      "proteins_100g": 14.0,
      "salt_100g": 0.01,
      "sodium_100g": 0.004
    },
    "labels": "de:Glutenfrei, de:Vegan",
    "categories": "en:Breakfast cereals,en:Oatmeals",
    "allergens_tags": ["en:gluten"],
    "additives_tags": [],
    "image_url": "https://images.openfoodfacts.org/..."
  }
}
```

### 2.2 Suche nach Produkten

```
GET https://de.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1
```

### 2.3 Barcode-Suche

```
GET https://world.openfoodfacts.org/api/v0/code/{barcode}.json
```

---

## 3. Unser Hashimoto-PCOS-Score-Algorithmus

### 3.1 Eingangsdaten aus OpenFoodFacts

|OF-Feld|Unser Nutzen|
|--------|-----------|
| `nutriments.fat_100g` | Gesamtfett |
| `nutriments.saturated-fat_100g` | Gesättigte Fette → schlecht |
| `nutriments.carbohydrates_100g` | Kohlenhydrate |
| `nutriments.sugars_100g` | Zucker → schlecht |
| `nutriments.fiber_100g` | Ballaststoffe → gut |
| `nutriments.proteins_100g` | Protein → gut |
| `nutriments.salt_100g` | Salz → in großen Mengen schlecht |
| `ingredients_text` | Für Gluten, Laktose, Zusatzstoffe |
| `labels_tags` | Für "gluten-free", "vegan", "organic" etc. |
| `nutriscore_grade` | Als sekundäre Referenz |
| `categories_tags` | Produktkategorie |

### 3.2 Score-Berechnung

```python
def calculate_hashimoto_pcos_score(product) -> tuple[int, str]:
    """
    Berechnet Score von 1-5 (1=vermeiden, 5=sehr gut)
    Returns: (score, explanation)
    """
    
    score = 3  # Start mit neutral
    penalties = []
    bonuses = []
    
    # === PENALTIES ===
    
    # Zucker
    if product.sugars_100g > 20:
        score -= 2
        penalties.append(f"Sehr hoher Zuckeranteil ({product.sugars_100g}g/100g)")
    elif product.sugars_100g > 10:
        score -= 1
        penalties.append(f"Hoher Zuckeranteil ({product.sugars_100g}g/100g)")
    
    # Gesättigte Fette
    if product.saturated_fat_100g > 10:
        score -= 1
        penalties.append(f"Hoher Anteil gesättigter Fette ({product.saturated_fat_100g}g/100g)")
    
    # Salz
    if product.salt_100g > 2.5:
        score -= 1
        penalties.append(f"Sehr hoher Salzgehalt ({product.salt_100g}g/100g)")
    elif product.salt_100g > 1.5:
        score -= 0.5
        penalties.append(f"Erhöhter Salzgehalt")
    
    # Trans-Fette (aus ingredients)
    if "hydrogenated" in product.ingredients_text.lower() or \
       "partially hydrogenated" in product.ingredients_text.lower():
        score -= 2
        penalties.append("Enthält gehärtete/palmierte Fette")
    
    # === BONUSES ===
    
    # Ballaststoffe
    if product.fiber_100g > 6:
        score += 1
        bonuses.append(f"Hoher Ballaststoffgehalt ({product.fiber_100g}g/100g)")
    elif product.fiber_100g > 3:
        score += 0.5
        bonuses.append("Gute Ballaststoffe")
    
    # Protein
    if product.proteins_100g > 20:
        score += 0.5
        bonuses.append("Hoher Proteingehalt")
    
    # Omega-3 (bei Fisch/Fischprodukten)
    if "fish" in product.categories_tags or "saumon" in product.ingredients_text.lower():
        if product.omega3_100g and product.omega3_100g > 1:
            score += 1
            bonuses.append("Reich an Omega-3")
    
    # === LABELS CHECK ===
    
    if "en:gluten-free" in product.labels_tags:
        score += 0.5
        bonuses.append("Explizit glutenfrei")
    
    if "en:organic" in product.labels_tags:
        score += 0.5
        bonuses.append("Bio-Qualität")
    
    if "en:vegan" in product.labels_tags:
        score += 0.3
        bonuses.append("Vegan")
    
    # === INGREDIENTS CHECK ===
    
    # Gluten-Check
    gluten_keywords = ["wheat", "gerste", "roggen", "hafer", "dinkel", "brot", "mehl"]
    if any(kw in product.ingredients_text.lower() for kw in gluten_keywords):
        score -= 0.5
        penalties.append("Enthält Gluten-haltige Zutaten")
    
    # Laktose-Check
    dairy_keywords = ["milk", "milch", "lactose", "laktose", "cheese", "käse", "yogurt", "joghurt", "butter", "rahm"]
    if any(kw in product.ingredients_text.lower() for kw in dairy_keywords):
        score -= 0.3
        penalties.append("Enthält Milchprodukte")
    
    # Zusatzstoffe (vereinfacht)
    if len(product.additives_tags) > 5:
        score -= 0.5
        penalties.append(f"Viele Zusatzstoffe ({len(product.additives_tags)})")
    
    # === FINALISIERUNG ===
    
    # Clamp between 1-5
    score = max(1, min(5, round(score)))
    
    # Erklärung zusammenbauen
    explanation_parts = []
    if bonuses:
        explanation_parts.append("GUT: " + "; ".join(bonuses))
    if penalties:
        explanation_parts.append("PROBLEM: " + "; ".join(penalties))
    
    return score, "\n".join(explanation_parts) if explanation_parts else "Neutral"
```

### 3.3 Score-Mapping zu Farben

| Score | Bewertung | Farbcode | Emoji |
|-------|-----------|----------|-------|
| 5 | ⭐⭐⭐⭐⭐ SEHR GUT | `#22c55e` (Grün) | 🟢 |
| 4 | ⭐⭐⭐⭐ GUT | `#84cc16` (Hellgrün) | 🟢 |
| 3 | ⭐⭐⭐ NEUTRAL | `#eab308` (Gelb) | 🟡 |
| 2 | ⭐⭐ WENIGER GUT | `#f97316` (Orange) | 🟠 |
| 1 | ⭐ VERMEIDEN | `#ef4444` (Rot) | 🔴 |

---

## 4. Barcode-Scan Integration

### 4.1 Frontend-Optionen

| Methode | Bibliothek | Vorteile | Nachteile |
|---------|-----------|----------|----------|
| **Kamera-Scan** | QuaggaJS, ZXing | Kein App-Download | Browser-Abhängig |
| **Kamera-Scan** | @aspect/barcode-scanner (React) | React-nativ | - |
| **Input-Feld** | Manual | Immer verfügbar | Weniger komfortabel |

### 4.2 Empfohlener Tech-Stack

```
Frontend: React/Next.js
Barcode-Scanning: QuaggaJS (JS-basiert, opensource)
ODer: @aspect/barcode-scanner (React-Wrapper)
Fallback: Manual Barcode Entry

API-Call: 
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

### 4.3 Offline-Caching

- ggf. lokale IndexedDB für häufig gescannte Produkte
- Score bereits berechnet cachen
- API Rate-Limiting: max 1 Anfrage/Sekunde empfohlen

---

## 5. erweiterte Produktkategorien

### 5.1 Kategorien-Mapping für schnell-Einordnung

| Kategorie | Basis-Score | Anmerkung |
|-----------|-------------|-----------|
| Frisches Gemüse | 5 | Ideal |
| Frisches Obst (Beeren) | 5 | Ideal |
| Fetter Fisch | 5 | Omega-3 reich |
| Eier | 4-5 | Protein + Nährstoffe |
| Nüsse, Samen | 5 | Gesunde Fette |
| Vollkornprodukte | 4 | Ballaststoffe |
| Olivenöl | 5 | Entzündungshemmend |
| Verarbeitetes Fleisch | 1-2 | Zu vermeiden |
| Süßigkeiten | 1 | Stark zuckerhaltig |
| Energy Drinks | 1 | Koffein + Zucker |
| Alkohol | 1 | Entzündungsfördernd |
| Milchprodukte | 2-3 | Laktose-Problem bei Hashimoto |

---

## 6. Externe Datenquellen

### 6.1 Weitere APIs

| Quelle | Nutzen | URL |
|--------|--------|-----|
| OpenFoodFacts | Primär-Lebensmittel-DB | https://world.openfoodfacts.org |
| USDA FoodData Central | US-Nährstoffdaten | https://fdc.nal.usda.gov |
| FooDB | Nährstoffe & Chemikalien | https://foodb.ca (teilweise paid) |
| Edamam Food Database | Rezept-Integration | https://developer.edamam.com |

### 6.2 Barcode-Suche

| Quelle | Nutzen | Anmerkung |
|--------|--------|-----------|
| international-barcode-database | Barcode-Lookup | opensource |
| Google Barcodes | Bild-basiert | ML-basiert |

---

## 7. Quellen

1. OpenFoodFacts API Docs: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/
2. OpenFoodFacts Wikipedia: https://en.wikipedia.org/wiki/OpenFoodFacts
3. Public APIs Directory: https://publicapis.io/open-food-facts-api
4. NutritionFacts.org Anti-Inflammatory: https://nutritionfacts.org/topics/anti-inflammatory/
