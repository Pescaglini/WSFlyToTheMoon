attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute float aQ;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;

varying vec3 vTextureCoord;

void main(void) {

  gl_Position = vec4(
      (projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy,
      0.0, 1.0);

  // vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy; // pixi OG
  vTextureCoord = vec3((uTextureMatrix * vec3(aTextureCoord, 1.0)).xy, aQ);
}