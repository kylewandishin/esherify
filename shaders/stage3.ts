// Stage 3 — log-space transform with twist.
// Same screen → w mapping as stage 2, then multiplies w by β = α / ln(r),
// where α = (lnR, θ). β = (1, θ/lnR), so the twist is purely a shear in
// log-space. exp(w') maps back to image coords for sampling.
export const STAGE3_TWIST_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2  u_imageSize;
uniform vec2  u_center;
uniform float u_lnR;
uniform float u_theta;
uniform float u_uMin;
uniform float u_tileCount;
uniform float u_time;

in  vec2 v_uv;
out vec4 outColor;

const float PI = 3.14159265358979323846;

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cexp(vec2 w) {
  return exp(w.x) * vec2(cos(w.y), sin(w.y));
}

void main() {
  float uRaw = v_uv.x * u_lnR * u_tileCount + u_time * u_lnR;
  float u = u_uMin + mod(uRaw, u_lnR);
  float v = (v_uv.y * 2.0 - 1.0) * PI;
  vec2 w = vec2(u, v);

  // β = α / ln(r) = (1, θ/lnR)
  vec2 beta = vec2(1.0, u_theta / u_lnR);
  w = cmul(w, beta);

  vec2 z = cexp(w);
  vec2 sampleUv = (z + u_center) / u_imageSize;
  outColor = texture(u_image, fract(sampleUv));
}
`;
