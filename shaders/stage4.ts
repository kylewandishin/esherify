// Stage 4 — full Escher pipeline.
// The canvas covers a square region of radius u_viewRadius around the spiral
// fixed point, expressed in IMAGE pixel coordinates (not screen pixels — that
// was the bug). Each screen pixel becomes a complex z in image coords, is
// log-mapped to w, animated by shifting w.x by t·ln(r), twisted by β = α/ln r,
// wrapped modulo one Droste period so the spiral closes, then mapped back via
// exp and sampled.
export const STAGE4_ESCHER_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2  u_imageSize;
uniform vec2  u_center;
uniform float u_viewRadius;
uniform float u_lnR;
uniform float u_theta;
uniform float u_uMin;
uniform float u_time;

in  vec2 v_uv;
out vec4 outColor;

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 clog(vec2 z) {
  return vec2(0.5 * log(z.x*z.x + z.y*z.y), atan(z.y, z.x));
}

vec2 cexp(vec2 w) {
  return exp(w.x) * vec2(cos(w.y), sin(w.y));
}

void main() {
  // Screen UV [0,1]² -> image-coord complex z, centered, square aspect.
  vec2 zNorm = v_uv * 2.0 - 1.0;
  vec2 z = zNorm * u_viewRadius;

  vec2 w = clog(z);

  // Animate by translating along the log-radial axis.
  w.x += u_time * u_lnR;

  // Twist: β = α / ln(r) = (1, θ/lnR).
  vec2 beta = vec2(1.0, u_theta / u_lnR);
  w = cmul(w, beta);

  // Wrap into one Droste period so the spiral closes on itself.
  w.x = u_uMin + mod(w.x - u_uMin, u_lnR);

  vec2 zp = cexp(w);
  vec2 uv = (zp + u_center) / u_imageSize;
  outColor = texture(u_image, fract(uv));
}
`;
