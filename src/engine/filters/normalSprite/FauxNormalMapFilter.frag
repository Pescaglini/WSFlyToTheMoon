
varying vec2 vTextureCoord;

uniform sampler2D uSampler;

//values used for shading algorithm...
uniform vec2 texelSize;		// size of a pixel of the input image in 0...1
uniform vec2 Resolution;      //resolution of screen
uniform vec3 LightPos[%numLights%];        //light position -- normalized
uniform vec4 LightColor[%numLights%];      //light RGBA -- alpha is intensity
uniform vec4 AmbientColor[%numLights%];    //ambient RGBA -- alpha is intensity 
uniform vec3 Falloff[%numLights%];         //attenuation coefficients


float grayScale(in vec3 color){
    return dot(vec3(0.2126, 0.7152, 0.0722), color);
}

float sampleSobel(in vec2 uv)
{
    float weight = 1.0;
    float f = grayScale(texture2D(uSampler, uv).rgb);
    return f * weight - (weight * 0.5);
}

vec2 sobel(in vec2 uv)
{   
    vec2 offset = texelSize * 1.0;
    float x = offset.x;
    float y = offset.y;
    
    // |-1  0  1|
    // |-2  0  2| 
    // |-1  0  1|
    
    float gX = 0.0;
    gX += -1.0 * sampleSobel(uv + vec2(-x, -y));
    gX += -2.0 * sampleSobel(uv + vec2(-x,  0));
    gX += -1.0 * sampleSobel(uv + vec2(-x, +y));
    gX += +1.0 * sampleSobel(uv + vec2(+x, -y));
    gX += +2.0 * sampleSobel(uv + vec2(+x,  0));
    gX += +1.0 * sampleSobel(uv + vec2(+x, +y));
    
    // |-1 -2 -1|
    // | 0  0  0| 
    // | 1  2  1|
    
    float gY = 0.0;
    gY += -1.0 * sampleSobel(uv + vec2(-x, -y));
    gY += -2.0 * sampleSobel(uv + vec2( 0, -y));
    gY += -1.0 * sampleSobel(uv + vec2(+x, -y));
    gY += +1.0 * sampleSobel(uv + vec2(-x, +y));
    gY += +2.0 * sampleSobel(uv + vec2( 0, +y));
    gY += +1.0 * sampleSobel(uv + vec2(+x, +y));
    
    return vec2(sqrt(gX * gX + gY * gY), atan(gY, gX));
}

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
	vec2 f = sobel(vTextureCoord); //sobel on the current pixel
	vec2 gradientDirection = f.x * vec2(cos(f.y), sin(f.y)); //direction of the growth
    NormalMap = normalize(vec3(gradientDirection, 1.0)) * 0.5 + 0.5;
	NormalMap.g = 1.0 - NormalMap.g;

	juanCarlos = gl_FragCoord.xy;
	juanCarlos.y = Resolution.y - juanCarlos.y;

	// for i = 0 < %numLights%...
	%insertLoopHere%
	
	// finally!

	//gl_FragColor = vec4( FinalColor, DiffuseColor.a);
	gl_FragColor = vec4( FinalColor, DiffuseColor.a);
}