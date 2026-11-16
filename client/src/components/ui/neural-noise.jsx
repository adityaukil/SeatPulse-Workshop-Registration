import React, { useEffect, useRef } from 'react';

export function NeuralNoise({ color = [0.55, 0.2, 0.95], opacity = 0.85, speed = 0.0012 }) {
  const canvasRef = useRef(null);
  const pointer = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, tX: window.innerWidth / 2, tY: window.innerHeight / 2 });
  const glRef = useRef(null);
  const uniformsRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const gl = initShader(canvasEl);
    if (!gl) return;
    glRef.current = gl;

    const cleanupEvents = setupEvents();
    resizeCanvas(canvasEl, gl);
    
    const resizeListener = () => resizeCanvas(canvasEl, gl);
    window.addEventListener('resize', resizeListener);

    if (uniformsRef.current?.u_color) {
      gl.uniform3f(uniformsRef.current.u_color, color[0], color[1], color[2]);
    }
    if (uniformsRef.current?.u_speed) {
      gl.uniform1f(uniformsRef.current.u_speed, speed);
    }

    const render = () => {
      if (!gl || !uniformsRef.current) return;
      const currentTime = performance.now();
      const p = pointer.current;
      p.x += (p.tX - p.x) * 0.15;
      p.y += (p.tY - p.y) * 0.15;
      
      gl.uniform1f(uniformsRef.current.u_time, currentTime);
      gl.uniform2f(uniformsRef.current.u_pointer_position, p.x / window.innerWidth, 1 - p.y / window.innerHeight);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeListener);
      cleanupEvents();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [color, speed]);

  function initShader(canvasEl) {
    const vsSource = `
      precision mediump float;
      varying vec2 vUv;
      attribute vec2 a_position;
      void main() {
        vUv = 0.5 * (a_position + 1.0);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      uniform vec3 u_color;
      uniform float u_speed;
      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.0);
        vec2 res = vec2(0.0);
        float scale = 8.0;
        for (int j = 0; j < 15; j++) {
          uv = rotate(uv, 1.0);
          sine_acc = rotate(sine_acc, 1.0);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (0.5 + 0.5 * cos(layer)) / scale;
          scale *= 1.2;
        }
        return res.x + res.y;
      }
      void main() {
        vec2 uv = 0.5 * vUv;
        uv.x *= u_ratio;
        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0.0, 1.0);
        p = 0.5 * pow(1.0 - p, 2.0);
        float t = u_speed * u_time;
        vec3 col = vec3(0.0);
        float noise = neuro_shape(uv, t, p);
        noise = 1.2 * pow(noise, 3.0);
        noise += pow(noise, 10.0);
        noise = max(0.0, noise - 0.5);
        noise *= (1.0 - length(vUv - 0.5));
        col = u_color * noise;
        gl_FragColor = vec4(col, noise);
      }
    `;
    const gl = canvasEl.getContext('webgl') || canvasEl.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }
    const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);
    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    if (!shaderProgram) return null;
    
    uniformsRef.current = getUniforms(gl, shaderProgram);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.useProgram(shaderProgram);
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    return gl;
  }

  function createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function getUniforms(gl, program) {
    const uniforms = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformName = gl.getActiveUniform(program, i).name;
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
  }

  function resizeCanvas(canvasEl, gl) {
    if (!canvasEl || !gl) return;
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvasEl.width = window.innerWidth * devicePixelRatio;
    canvasEl.height = window.innerHeight * devicePixelRatio;
    if (uniformsRef.current && uniformsRef.current.u_ratio) {
      gl.uniform1f(uniformsRef.current.u_ratio, canvasEl.width / canvasEl.height);
    }
    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
  }

  function setupEvents() {
    const updateMousePosition = (x, y) => {
      pointer.current.tX = x;
      pointer.current.tY = y;
    };
    const pointermove = (e) => updateMousePosition(e.clientX, e.clientY);
    const touchmove = (e) => {
      if (e.targetTouches[0]) updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    };
    const click = (e) => updateMousePosition(e.clientX, e.clientY);
    window.addEventListener('pointermove', pointermove);
    window.addEventListener('touchmove', touchmove);
    window.addEventListener('click', click);
    return () => {
      window.removeEventListener('pointermove', pointermove);
      window.removeEventListener('touchmove', touchmove);
      window.removeEventListener('click', click);
    };
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        opacity,
        zIndex: 0,
      }}
    />
  );
}

export default NeuralNoise;
