# Custom Fonts

Place your own `.ttf` or `.otf` font files here.

## Naming convention

The font loader reads the **filename** to determine the font family, weight, and style. Use the following pattern:

```
<FamilyName>-<Variant>.ttf
```

Supported variants (case-insensitive):

| Filename suffix      | Weight   | Style   |
|----------------------|----------|---------|
| `-Regular`           | normal   | normal  |
| `-Bold`              | bold     | normal  |
| `-Italic`            | normal   | italic  |
| `-BoldItalic`        | bold     | italic  |
| *(anything else)*    | normal   | normal  |

### Examples

```
MyFont-Regular.ttf       → family: "MyFont", weight: normal, style: normal
MyFont-Bold.ttf          → family: "MyFont", weight: bold,   style: normal
MyFont-Italic.ttf        → family: "MyFont", weight: normal, style: italic
MyFont-BoldItalic.ttf    → family: "MyFont", weight: bold,   style: italic
```

## How it works

At startup the API scans this folder and registers every font it finds with the canvas renderer.
If no fonts are present here, it falls back to the system-installed Noto Sans fonts.

Once your fonts are registered you can reference them in requests using their **family name** (the part before the `-`):

```json
{
  "authorFont": "bold 36px \"MyFont\"",
  "bodyFont":   "32px \"MyFont\""
}
```
