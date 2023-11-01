varying vec3 vTextureCoord;
uniform vec4 uColor;

uniform sampler2D uSampler;

void main(void) {

  gl_FragColor =
      texture2D(uSampler, vTextureCoord.xy / vTextureCoord.z) * uColor;
}