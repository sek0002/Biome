Coral zone contour background scale notes
========================================

Asset: coral-zone-contour-background-map-scale.png

Scale assumptions used for generation:

- The Port Jackson player sprite remains at Phaser scale 0.72.
- The painted Port Jackson SVG content is approximately 120 px nose-to-tail.
- Rendered player length is therefore 120 * 0.72 = 86.4 world px.
- The player represents a 2 m animal.
- Visual gameplay scale is therefore 43.2 world px per meter.
- The coral zone spans from x=900 to x=10720, or about 9820 world px.
- At 43.2 world px per meter, the coral-zone background represents about 227 m of horizontal map distance.

Generation constraints:

- Match the extracted coral-zone contour.
- Keep the player out of the image.
- No bubbles or bubble columns.
- Use kelp and seagrass as small map-scale details rather than oversized foreground props.
