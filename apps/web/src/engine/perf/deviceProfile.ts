// apps/web/src/engine/perf/deviceProfile.ts

export type QualityTier = 'high' | 'medium' | 'low';

export function detectInitialTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';

  // Check URL override ?quality=low|medium|high
  if (typeof window.location !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const qOverride = params.get('quality');
    if (qOverride === 'low' || qOverride === 'medium' || qOverride === 'high') {
      return qOverride;
    }
  }

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 2) return 'low';

  // Check device memory if available
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (typeof mem === 'number' && mem <= 2) return 'low';

  // Mobile coarse pointer check
  const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches;
  if (isCoarse && cores <= 4) return 'medium';

  // Check WebGL renderer for software emulators (llvmpipe, SwiftShader)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)?.toLowerCase() || '';
        if (renderer.includes('swiftshader') || renderer.includes('llvmpipe') || renderer.includes('software')) {
          return 'low';
        }
      }
    }
  } catch {
    // ignore
  }

  return 'high';
}
