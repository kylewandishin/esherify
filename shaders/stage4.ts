// Stage 4 — full Escher pipeline.
// Each output pixel becomes a complex z (relative to screen center), is
// log-mapped to w, animated by shifting w.x by t·ln(r), twisted by β = α/ln r,
// wrapped to one period in log space (so the spiral closes), then mapped
// back via exp and sampled.
export const STAGE4_ESCHER_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2  u_imageSize;
uniform vec2  u_center;
uniform vec2  u_outputSize;
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
  vec2 pix = v_uv * u_outputSize;
  vec2 z = pix - u_outputSize * 0.5;
  vec2 w = clog(z);

  // Animate by translating along the log-radial axis.
  w.x += u_time * u_lnR;

  // Twist: β = α / ln(r) = (1, θ/lnR).
  vec2 beta = vec2(1.0, u_theta / u_lnR);
  w = cmul(w, beta);

  // Wrap into one Droste period (relative to the inner-box base radius)
  // so the spiral closes on itself for the seamless zoom loop.
  w.x = u_uMin + mod(w.x - u_uMin, u_lnR);

  vec2 zp = cexp(w);
  vec2 uv = (zp + u_center) / u_imageSize;
  outColor = texture(u_image, fract(uv));
}
`;
