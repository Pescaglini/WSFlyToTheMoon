
varying vec2 vNormalCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D uNomal;

//values used for shading algorithm...
uniform vec2 Resolution;      //resolution of screen
uniform vec3 LightPos[%numLights%];        //light position -- normalized
uniform vec4 LightColor[%numLights%];      //light RGBA -- alpha is intensity
uniform vec4 AmbientColor[%numLights%];    //ambient RGBA -- alpha is intensity 
uniform vec3 Falloff[%numLights%];         //attenuation coefficients


void main(void)
{
	vec3 FinalColor = vec3(0,0,0);
	vec3 NormalMap;
	vec3 LightDir;
	vec3 N;
	vec3 L;
	vec3 Diffuse;
	vec3 Ambient;
	vec3 Intensity;
	vec4 DiffuseColor;
	vec2 juanCarlos;
	float D;
	float Attenuation;

	// outside the loop because this is always the same

	//RGBA of our diffuse color
	DiffuseColor = texture2D(uSampler, vTextureCoord);

	//RGB of our normal map
	NormalMap = texture2D(uNomal, vNormalCoord).rgb;
	NormalMap.g = 1.0 - NormalMap.g;

	juanCarlos = gl_FragCoord.xy;
	juanCarlos.y = Resolution.y - juanCarlos.y;

	// for i = 0 < %numLights%...
	%insertLoopHere%
	
	// finally!

	gl_FragColor = vec4(FinalColor, DiffuseColor.a);
}