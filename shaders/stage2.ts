// Stage 2 — log-space transform.
// Maps screen UV to w-space (log radius, angle), exponentiates back to image
// coords, and samples the image. Drives both the single strip (tileCount=1)
// and the tiled animated preview (tileCount=N, u_time scrolling).
export const STAGE2_LOG_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2  u_imageSize;
uniform vec2  u_center;
uniform float u_lnR;
uniform float u_uMin;
uniform float u_tileCount;
uniform float u_time;

in  vec2 v_uv;
out vec4 outColor;

const float PI = 3.14159265358979323846;

vec2 cexp(vec2 w) {
  return exp(w.x) * vec2(cos(w.y), sin(w.y));
}

void main() {
  // Wrap into one period so the screen tiles cleanly.
  float uRaw = v_uv.x * u_lnR * u_tileCount + u_time * u_lnR;
  float u = u_uMin + mod(uRaw, u_lnR);
  float v = (v_uv.y * 2.0 - 1.0) * PI;

  vec2 w = vec2(u, v);
  vec2 z = cexp(w);
  vec2 sampleUv = (z + u_center) / u_imageSize;

  outColor = texture(u_image, fract(sampleUv));
}
`;
