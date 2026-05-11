"use client";

import { useEffect, useRef, useState } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export type UniformValue = number | readonly number[];
export type Uniforms = Record<string, UniformValue>;

export interface ShaderCanvasProps {
  fragmentSource: string;
  image: HTMLImageElement | null;
  uniforms?: Uniforms;
  width?: number;
  height?: number;
  animate?: boolean;
  loopSeconds?: number;
  className?: string;
}

interface GLState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  vbo: WebGLBuffer;
  tex: WebGLTexture | null;
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader returned null");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown error";
    gl.deleteShader(shader);
    throw new Error(`shader compile failed: ${log}`);
  }
  return shader;
}

function setUniform(
  gl: WebGL2RenderingContext,
  loc: WebGLUniformLocation,
  v: UniformValue,
) {
  if (typeof v === "number") {
    gl.uniform1f(loc, v);
    return;
  }
  switch (v.length) {
    case 2:
      gl.uniform2f(loc, v[0], v[1]);
      return;
    case 3:
      gl.uniform3f(loc, v[0], v[1], v[2]);
      return;
    case 4:
      gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
      return;
  }
}

export function ShaderCanvas({
  fragmentSource,
  image,
  uniforms,
  width = 800,
  height = 800,
  animate = false,
  loopSeconds = 4,
  className,
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GLState | null>(null);
  const uniformsRef = useRef<Uniforms | undefined>(uniforms);
  uniformsRef.current = uniforms;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) {
      setError("WebGL2 is not supported in this browser.");
      return;
    }

    let vs: WebGLShader | null = null;
    let fs: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let vbo: WebGLBuffer | null = null;
    let tex: WebGLTexture | null = null;

    try {
      vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (!program) throw new Error("createProgram returned null");
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
          `program link failed: ${gl.getProgramInfoLog(program) ?? "unknown"}`,
        );
      }
      gl.useProgram(program);

      vbo = gl.createBuffer();
      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      if (image && image.complete && image.naturalWidth > 0) {
        tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const imgLoc = gl.getUniformLocation(program, "u_image");
        if (imgLoc) gl.uniform1i(imgLoc, 0);
        const sizeLoc = gl.getUniformLocation(program, "u_imageSize");
        if (sizeLoc)
          gl.uniform2f(sizeLoc, image.naturalWidth, image.naturalHeight);
      }

      stateRef.current = { gl, program, vao, vbo, tex };
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (program) gl.deleteProgram(program);
      if (vao) gl.deleteVertexArray(vao);
      if (vbo) gl.deleteBuffer(vbo);
      if (tex) gl.deleteTexture(tex);
      stateRef.current = null;
    }

    return () => {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (program) gl.deleteProgram(program);
      if (vao) gl.deleteVertexArray(vao);
      if (vbo) gl.deleteBuffer(vbo);
      if (tex) gl.deleteTexture(tex);
      stateRef.current = null;
    };
  }, [fragmentSource, image]);

  useEffect(() => {
    const state = stateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return;
    const { gl, program, vao } = state;
    let rafId: number | null = null;
    const start = performance.now();

    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      const outLoc = gl.getUniformLocation(program, "u_outputSize");
      if (outLoc) gl.uniform2f(outLoc, canvas.width, canvas.height);

      if (animate) {
        const tLoc = gl.getUniformLocation(program, "u_time");
        if (tLoc) {
          const t =
            ((performance.now() - start) / 1000 / loopSeconds) % 1;
          gl.uniform1f(tLoc, t);
        }
      }

      const u = uniformsRef.current;
      if (u) {
        for (const [name, value] of Object.entries(u)) {
          const loc = gl.getUniformLocation(program, name);
          if (loc) setUniform(gl, loc, value);
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (animate) rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [uniforms, animate, loopSeconds, width, height]);

  if (error) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          color: "#fff",
          padding: 16,
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
}
