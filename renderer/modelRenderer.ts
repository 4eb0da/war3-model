import type {DdsInfo} from 'dds-parser';
import {
    Model, Node, AnimVector, NodeFlags, Layer, LayerShading, FilterMode,
    TextureFlags, TVertexAnim, Geoset
} from '../model';
import {vec3, quat, mat3, mat4} from 'gl-matrix';
import {mat4fromRotationOrigin, getShader, isWebGL2} from './util';
import {ModelInterp} from './modelInterp';
import {RendererData, NodeWrapper} from './rendererData';
import {ParticlesController} from './particles';
import {RibbonsController} from './ribbons';

// actually, all is number
export type DDS_FORMAT = WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT1_EXT'] |
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT3_EXT'] |
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGBA_S3TC_DXT5_EXT'] |
    WEBGL_compressed_texture_s3tc['COMPRESSED_RGB_S3TC_DXT1_EXT'];

const MAX_NODES = 256;

const ENV_MAP_SIZE = 2048;
const ENV_CONVOLUTE_DIFFUSE_SIZE = 32;
const ENV_PREFILTER_SIZE = 128;
const MAX_ENV_MIP_LEVELS = 8;
const BRDF_LUT_SIZE = 512;

const vertexShaderHardwareSkinning = `
    attribute vec3 aVertexPosition;
    attribute vec3 aNormal;
    attribute vec2 aTextureCoord;
    attribute vec4 aGroup;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    uniform mat4 uNodesMatrices[${MAX_NODES}];

    varying vec3 vNormal;
    varying vec2 vTextureCoord;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        int count = 1;
        vec4 sum = uNodesMatrices[int(aGroup[0])] * position;

        if (aGroup[1] < ${MAX_NODES}.) {
            sum += uNodesMatrices[int(aGroup[1])] * position;
            count += 1;
        }
        if (aGroup[2] < ${MAX_NODES}.) {
            sum += uNodesMatrices[int(aGroup[2])] * position;
            count += 1;
        }
        if (aGroup[3] < ${MAX_NODES}.) {
            sum += uNodesMatrices[int(aGroup[3])] * position;
            count += 1;
        }
        sum.xyz /= float(count);
        sum.w = 1.;
        position = sum;

        gl_Position = uPMatrix * uMVMatrix * position;
        vTextureCoord = aTextureCoord;
        vNormal = aNormal;
    }
`;

const vertexShaderSoftwareSkinning = `
    attribute vec3 aVertexPosition;
    attribute vec3 aNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec3 vNormal;
    varying vec2 vTextureCoord;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        gl_Position = uPMatrix * uMVMatrix * position;
        vTextureCoord = aTextureCoord;
        vNormal = aNormal;
    }
`;

const fragmentShader = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;
    uniform vec3 uReplaceableColor;
    uniform float uReplaceableType;
    uniform float uDiscardAlphaLevel;
    uniform mat3 uTVextexAnim;

    float hypot (vec2 z) {
        float t;
        float x = abs(z.x);
        float y = abs(z.y);
        t = min(x, y);
        x = max(x, y);
        t = t / x;
        return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);
    }

    void main(void) {
        vec2 texCoord = (uTVextexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;

        if (uReplaceableType == 0.) {
            gl_FragColor = texture2D(uSampler, texCoord);
        } else if (uReplaceableType == 1.) {
            gl_FragColor = vec4(uReplaceableColor, 1.0);
        } else if (uReplaceableType == 2.) {
            float dist = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
            float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
            float alpha = sin(truncateDist);
            gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
        }

        // hand-made alpha-test
        if (gl_FragColor[3] < uDiscardAlphaLevel) {
            discard;
        }
    }
`;

const vertexShaderHDHardwareSkinning = `#version 300 es
    in vec3 aVertexPosition;
    in vec3 aNormal;
    in vec2 aTextureCoord;
    in vec4 aSkin;
    in vec4 aBoneWeight;
    in vec4 aTangent;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    uniform mat4 uNodesMatrices[${MAX_NODES}];

    out vec3 vNormal;
    out vec3 vTangent;
    out vec3 vBinormal;
    out vec2 vTextureCoord;
    out mat3 vTBN;
    out vec3 vFragPos;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        mat4 sum;

        // sum += uNodesMatrices[int(aSkin[0])] * 1.;
        sum += uNodesMatrices[int(aSkin[0])] * aBoneWeight[0];
        sum += uNodesMatrices[int(aSkin[1])] * aBoneWeight[1];
        sum += uNodesMatrices[int(aSkin[2])] * aBoneWeight[2];
        sum += uNodesMatrices[int(aSkin[3])] * aBoneWeight[3];

        mat3 rotation = mat3(sum);

        position = sum * position;
        position.w = 1.;

        gl_Position = uPMatrix * uMVMatrix * position;
        vTextureCoord = aTextureCoord;

        vec3 normal = aNormal;
        vec3 tangent = aTangent.xyz;

        // https://learnopengl.com/Advanced-Lighting/Normal-Mapping
        tangent = normalize(tangent - dot(tangent, normal) * normal);

        vec3 binormal = cross(normal, tangent) * aTangent.w;

        normal = normalize(rotation * normal);
        tangent = normalize(rotation * tangent);
        binormal = normalize(rotation * binormal);

        vNormal = normal;
        vTangent = tangent;
        vBinormal = binormal;

        vTBN = mat3(tangent, binormal, normal);

        vFragPos = position.xyz;
    }
`;

const fragmentShaderHD = `#version 300 es
    precision mediump float;

    in vec2 vTextureCoord;
    in vec3 vNormal;
    in vec3 vTangent;
    in vec3 vBinormal;
    in mat3 vTBN;
    in vec3 vFragPos;

    out vec4 FragColor;

    uniform sampler2D uSampler;
    uniform sampler2D uNormalSampler;
    uniform sampler2D uOrmSampler;
    uniform vec3 uReplaceableColor;
    uniform float uDiscardAlphaLevel;
    uniform mat3 uTVextexAnim;
    uniform vec3 uLightPos;
    uniform vec3 uLightColor;
    uniform vec3 uCameraPos;
    uniform bool uHasShadowMap;
    uniform sampler2D uShadowMapSampler;
    uniform mat4 uShadowMapLightMatrix;
    uniform float uShadowBias;
    uniform float uShadowSmoothingStep;
    uniform bool uHasEnv;
    uniform samplerCube uIrradianceMap;
    uniform samplerCube uPrefilteredEnv;
    uniform sampler2D uBRDFLUT;

    const float PI = 3.14159265359;
    const float gamma = 2.2;
    const float MAX_REFLECTION_LOD = ${MAX_ENV_MIP_LEVELS.toFixed(1)};

    float distributionGGX(vec3 normal, vec3 halfWay, float roughness) {
        float a = roughness * roughness;
        float a2 = a * a;
        float nDotH = max(dot(normal, halfWay), 0.0);
        float nDotH2 = nDotH * nDotH;

        float num = a2;
        float denom = (nDotH2 * (a2 - 1.0) + 1.0);
        denom = PI * denom * denom;

        return num / denom;
    }

    float geometrySchlickGGX(float nDotV, float roughness) {
        float r = roughness + 1.;
        float k = r * r / 8.;
        // float k = roughness * roughness / 2.;

        float num = nDotV;
        float denom = nDotV * (1. - k) + k;

        return num / denom;
    }

    float geometrySmith(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness) {
        float nDotV = max(dot(normal, viewDir), .0);
        float nDotL = max(dot(normal, lightDir), .0);
        float ggx2  = geometrySchlickGGX(nDotV, roughness);
        float ggx1  = geometrySchlickGGX(nDotL, roughness);

        return ggx1 * ggx2;
    }

    vec3 fresnelSchlick(float lightFactor, vec3 f0) {
        return f0 + (1. - f0) * pow(clamp(1. - lightFactor, 0., 1.), 5.);
    }

    vec3 fresnelSchlickRoughness(float lightFactor, vec3 f0, float roughness) {
        return f0 + (max(vec3(1.0 - roughness), f0) - f0) * pow(clamp(1.0 - lightFactor, 0.0, 1.0), 5.0);
    }

    void main(void) {
        vec2 texCoord = (uTVextexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;

        vec4 orm = texture(uOrmSampler, texCoord);

        float occlusion = orm.r;
        float roughness = orm.g;
        float metallic = orm.b;
        float teamColorFactor = orm.a;

        vec4 baseColor = texture(uSampler, texCoord);
        vec3 teamColor = baseColor.rgb * uReplaceableColor;
        baseColor.rgb = mix(baseColor.rgb, teamColor, teamColorFactor);
        baseColor.rgb = pow(baseColor.rgb, vec3(gamma));

        vec3 normal = texture(uNormalSampler, texCoord).rgb;
        normal = normal * 2.0 - 1.0;
        normal.x = -normal.x;
        normal.y = -normal.y;
        normal = normalize(vTBN * -normal);

        vec3 viewDir = normalize(uCameraPos - vFragPos);
        vec3 reflected = reflect(-viewDir, normal);

        vec3 lightDir = normalize(uLightPos - vFragPos);
        float lightFactor = max(dot(normal, lightDir), .0);
        vec3 radiance = uLightColor;

        vec3 f0 = vec3(.04);
        f0 = mix(f0, baseColor.rgb, metallic);

        vec3 totalLight = vec3(0.);
        vec3 halfWay = normalize(viewDir + lightDir);
        float ndf = distributionGGX(normal, halfWay, roughness);
        float g = geometrySmith(normal, viewDir, lightDir, roughness);
        vec3 f = fresnelSchlick(max(dot(halfWay, viewDir), 0.), f0);

        vec3 kS = f;
        vec3 kD = vec3(1.) - kS;
        if (uHasEnv) {
            kD *= 1.0 - metallic;
        }
        vec3 num = ndf * g * f;
        float denom = 4. * max(dot(normal, viewDir), 0.) * max(dot(normal, lightDir), 0.) + .0001;
        vec3 specular = num / denom;

        totalLight = (kD * baseColor.rgb / PI + specular) * radiance * lightFactor;

        if (uHasShadowMap) {
            vec4 fragInLightPos = uShadowMapLightMatrix * vec4(vFragPos, 1.);
            vec3 shadowMapCoord = fragInLightPos.xyz / fragInLightPos.w;

            int passes = 5;
            float step = 1. / float(passes);

            float lightDepth = texture(uShadowMapSampler, shadowMapCoord.xy).r;
            float lightDepth0 = texture(uShadowMapSampler, vec2(shadowMapCoord.x + uShadowSmoothingStep, shadowMapCoord.y)).r;
            float lightDepth1 = texture(uShadowMapSampler, vec2(shadowMapCoord.x, shadowMapCoord.y + uShadowSmoothingStep)).r;
            float lightDepth2 = texture(uShadowMapSampler, vec2(shadowMapCoord.x, shadowMapCoord.y - uShadowSmoothingStep)).r;
            float lightDepth3 = texture(uShadowMapSampler, vec2(shadowMapCoord.x - uShadowSmoothingStep, shadowMapCoord.y)).r;
            float currentDepth = shadowMapCoord.z;

            float visibility = 0.;
            if (lightDepth > currentDepth - uShadowBias) {
                visibility += step;
            }
            if (lightDepth0 > currentDepth - uShadowBias) {
                visibility += step;
            }
            if (lightDepth1 > currentDepth - uShadowBias) {
                visibility += step;
            }
            if (lightDepth2 > currentDepth - uShadowBias) {
                visibility += step;
            }
            if (lightDepth3 > currentDepth - uShadowBias) {
                visibility += step;
            }

            totalLight *= visibility;
        }

        vec3 color;

        if (uHasEnv) {
            vec3 f = fresnelSchlickRoughness(max(dot(normal, viewDir), 0.0), f0, roughness);
            vec3 kS = f;
            vec3 kD = vec3(1.0) - kS;
            kD *= 1.0 - metallic;

            vec3 diffuse = texture(uIrradianceMap, normal).rgb * baseColor.rgb;
            vec3 prefilteredColor = textureLod(uPrefilteredEnv, reflected, roughness * MAX_REFLECTION_LOD).rgb;
            vec2 envBRDF = texture(uBRDFLUT, vec2(max(dot(normal, viewDir), 0.0), roughness)).rg;
            specular = prefilteredColor * (f * envBRDF.x + envBRDF.y);

            vec3 ambient = (kD * diffuse + specular) * occlusion;
            color = ambient + totalLight;
        } else {
            vec3 ambient = vec3(.03);
            ambient *= baseColor.rgb * occlusion;
            color = ambient + totalLight;
        }

        color = color / (vec3(1.) + color);
        color = pow(color, vec3(1. / gamma));

        FragColor = vec4(color, 1.);

        // hand-made alpha-test
        if (FragColor[3] < uDiscardAlphaLevel) {
            discard;
        }
    }
`;

const skeletonVertexShader = `
    attribute vec3 aVertexPosition;
    attribute vec3 aColor;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec3 vColor;

    void main(void) {
        vec4 position = vec4(aVertexPosition, 1.0);
        gl_Position = uPMatrix * uMVMatrix * position;
        vColor = aColor;
    }
`;

const skeletonFragmentShader = `
    precision mediump float;

    varying vec3 vColor;

    void main(void) {
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

const envToCubemapVertexShader = `
    attribute vec3 aPos;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec3 vLocalPos;

    void main(void) {
        vLocalPos = aPos;
        gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
    }
`;

const envToCubemapFragmentShader = `
    precision mediump float;

    varying vec3 vLocalPos;

    uniform sampler2D uEquirectangularMap;

    const vec2 invAtan = vec2(0.1591, 0.3183);

    vec2 SampleSphericalMap(vec3 v) {
        // vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
        vec2 uv = vec2(atan(v.x, v.y), asin(-v.z));
        uv *= invAtan;
        uv += 0.5;
        return uv;
    }

    void main(void) {
        vec2 uv = SampleSphericalMap(normalize(vLocalPos)); // make sure to normalize localPos
        vec3 color = texture2D(uEquirectangularMap, uv).rgb;

        gl_FragColor = vec4(color, 1.0);
        // gl_FragColor = vec4(vLocalPos, 1.0);
    }
`;

const envVertexShader = `#version 300 es
    in vec3 aPos;
    out vec3 vLocalPos;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main(void) {
        vLocalPos = aPos;
        mat4 rotView = mat4(mat3(uMVMatrix)); // remove translation from the view matrix
        vec4 clipPos = uPMatrix * rotView * 1000. * vec4(aPos, 1.0);

        gl_Position = clipPos.xyww;
        // gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
    }
`;

const envFragmentShader = `#version 300 es
    precision mediump float;

    in vec3 vLocalPos;

    out vec4 FragColor;

    uniform samplerCube uEnvironmentMap;

    void main(void) {
        // vec3 envColor = textureLod(uEnvironmentMap, vLocalPos, 0.0).rgb;
        vec3 envColor = texture(uEnvironmentMap, vLocalPos).rgb;

        FragColor = vec4(envColor, 1.0);
    }
`;

const convoluteEnvDiffuseVertexShader = `
    attribute vec3 aPos;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec3 vLocalPos;

    void main(void) {
        vLocalPos = aPos;
        gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
    }
`;

const convoluteEnvDiffuseFragmentShader = `
    precision mediump float;

    varying vec3 vLocalPos;

    uniform samplerCube uEnvironmentMap;

    const float PI = 3.14159265359;
    const float gamma = 2.2;

    void main(void) {
        vec3 irradiance = vec3(0.0);

        // the sample direction equals the hemisphere's orientation
        vec3 normal = normalize(vLocalPos);

        vec3 up    = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(up, normal));
        up         = normalize(cross(normal, right));

        const float sampleDelta = 0.025;
        float nrSamples = 0.0;
        for(float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta)
        {
            for(float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta)
            {
                // spherical to cartesian (in tangent space)
                vec3 tangentSample = vec3(sin(theta) * cos(phi),  sin(theta) * sin(phi), cos(theta));
                // tangent space to world
                vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * normal;

                irradiance += pow(textureCube(uEnvironmentMap, sampleVec).rgb, vec3(gamma)) * cos(theta) * sin(theta);
                nrSamples++;
            }
        }
        irradiance = PI * irradiance * (1.0 / float(nrSamples));

        gl_FragColor = vec4(irradiance, 1.0);
        // gl_FragColor = vec4(textureCube(uEnvironmentMap, vLocalPos).rgb, 1.0);
        // gl_FragColor = vec4(1.0);
    }
`;

const prefilterEnvVertexShader = `#version 300 es
    in vec3 aPos;

    out vec3 vLocalPos;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    void main(void) {
        vLocalPos = aPos;
        gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
    }
`;

const prefilterEnvFragmentShader = `#version 300 es
    precision mediump float;

    out vec4 FragColor;

    in vec3 vLocalPos;

    uniform samplerCube uEnvironmentMap;
    uniform float uRoughness;

    const float PI = 3.14159265359;
    const float gamma = 2.2;

    float RadicalInverse_VdC(uint bits) {
        bits = (bits << 16u) | (bits >> 16u);
        bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
        bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
        bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
        bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
        return float(bits) * 2.3283064365386963e-10; // / 0x100000000
    }

    vec2 Hammersley(uint i, uint N) {
        return vec2(float(i)/float(N), RadicalInverse_VdC(i));
    }

    vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
        float a = roughness * roughness;

        float phi = 2.0 * PI * Xi.x;
        float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
        float sinTheta = sqrt(1.0 - cosTheta*cosTheta);

        // from spherical coordinates to cartesian coordinates
        vec3 H;
        H.x = cos(phi) * sinTheta;
        H.y = sin(phi) * sinTheta;
        H.z = cosTheta;

        // from tangent-space vector to world-space sample vector
        vec3 up        = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
        vec3 tangent   = normalize(cross(up, N));
        vec3 bitangent = cross(N, tangent);

        vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;

        return normalize(sampleVec);
    }

    void main() {
        vec3 N = normalize(vLocalPos);
        vec3 R = N;
        vec3 V = R;

        const uint SAMPLE_COUNT = 1024u;
        float totalWeight = 0.0;
        vec3 prefilteredColor = vec3(0.0);
        for(uint i = 0u; i < SAMPLE_COUNT; ++i)
        {
            vec2 Xi = Hammersley(i, SAMPLE_COUNT);
            vec3 H  = ImportanceSampleGGX(Xi, N, uRoughness);
            vec3 L  = normalize(2.0 * dot(V, H) * H - V);

            float NdotL = max(dot(N, L), 0.0);
            if(NdotL > 0.0) {
                prefilteredColor += pow(texture(uEnvironmentMap, L).rgb, vec3(gamma)) * NdotL;
                totalWeight      += NdotL;
            }
        }
        prefilteredColor = prefilteredColor / totalWeight;

        FragColor = vec4(prefilteredColor, 1.0);
    }
`;

const integrateBRDFVertexShader = `#version 300 es
    in vec3 aPos;

    out vec2 vLocalPos;

    void main(void) {
        vLocalPos = aPos.xy;
        gl_Position = vec4(aPos, 1.0);
    }
`;

const integrateBRDFFragmentShader = `#version 300 es
    precision mediump float;

    in vec2 vLocalPos;

    out vec4 FragColor;

    const float PI = 3.14159265359;

    float RadicalInverse_VdC(uint bits) {
        bits = (bits << 16u) | (bits >> 16u);
        bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
        bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
        bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
        bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
        return float(bits) * 2.3283064365386963e-10; // / 0x100000000
    }

    vec2 Hammersley(uint i, uint N) {
        return vec2(float(i)/float(N), RadicalInverse_VdC(i));
    }

    vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
        float a = roughness * roughness;

        float phi = 2.0 * PI * Xi.x;
        float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
        float sinTheta = sqrt(1.0 - cosTheta*cosTheta);

        // from spherical coordinates to cartesian coordinates
        vec3 H;
        H.x = cos(phi) * sinTheta;
        H.y = sin(phi) * sinTheta;
        H.z = cosTheta;

        // from tangent-space vector to world-space sample vector
        vec3 up        = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
        vec3 tangent   = normalize(cross(up, N));
        vec3 bitangent = cross(N, tangent);

        vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;

        return normalize(sampleVec);
    }

    float geometrySchlickGGX(float nDotV, float roughness) {
        float r = roughness;
        float k = r * r / 2.;

        float num = nDotV;
        float denom = nDotV * (1. - k) + k;

        return num / denom;
    }

    float geometrySmith(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness) {
        float nDotV = max(dot(normal, viewDir), .0);
        float nDotL = max(dot(normal, lightDir), .0);
        float ggx2  = geometrySchlickGGX(nDotV, roughness);
        float ggx1  = geometrySchlickGGX(nDotL, roughness);

        return ggx1 * ggx2;
    }

    vec2 IntegrateBRDF(float NdotV, float roughness) {
        vec3 V;
        V.x = sqrt(1.0 - NdotV*NdotV);
        V.y = 0.0;
        V.z = NdotV;

        float A = 0.0;
        float B = 0.0;

        vec3 N = vec3(0.0, 0.0, 1.0);

        const uint SAMPLE_COUNT = 1024u;
        for(uint i = 0u; i < SAMPLE_COUNT; ++i)
        {
            vec2 Xi = Hammersley(i, SAMPLE_COUNT);
            vec3 H  = ImportanceSampleGGX(Xi, N, roughness);
            vec3 L  = normalize(2.0 * dot(V, H) * H - V);

            float NdotL = max(L.z, 0.0);
            float NdotH = max(H.z, 0.0);
            float VdotH = max(dot(V, H), 0.0);

            if(NdotL > 0.0)
            {
                float G = geometrySmith(N, V, L, roughness);
                float G_Vis = (G * VdotH) / (NdotH * NdotV);
                float Fc = pow(1.0 - VdotH, 5.0);

                A += (1.0 - Fc) * G_Vis;
                B += Fc * G_Vis;
            }
        }
        A /= float(SAMPLE_COUNT);
        B /= float(SAMPLE_COUNT);
        return vec2(A, B);
    }

    void main() {
        FragColor = vec4(IntegrateBRDF((vLocalPos.x + 1.0) * .5, (vLocalPos.y + 1.0) * .5), 0., 1.);
    }
`;

const translation = vec3.create();
const rotation = quat.create();
const scaling = vec3.create();

const defaultTranslation = vec3.fromValues(0, 0, 0);
const defaultRotation = quat.fromValues(0, 0, 0, 1);
const defaultScaling = vec3.fromValues(1, 1, 1);

const tempParentRotationQuat: quat = quat.create();
const tempParentRotationMat: mat4 = mat4.create();
const tempCameraMat: mat4 = mat4.create();
const tempTransformedPivotPoint: vec3 = vec3.create();
const tempAxis: vec3 = vec3.create();
const tempLockQuat: quat = quat.create();
const tempLockMat: mat4 = mat4.create();
const tempXAxis: vec3 = vec3.create();
const tempCameraVec: vec3 = vec3.create();
const tempCross0: vec3 = vec3.create();
const tempCross1: vec3 = vec3.create();

const tempPos: vec3 = vec3.create();
const tempSum: vec3 = vec3.create();
const tempVec3: vec3 = vec3.create();

const identifyMat3: mat3 = mat3.create();
const texCoordMat4: mat4 = mat4.create();
const texCoordMat3: mat3 = mat3.create();

export class ModelRenderer {
    private isHD: boolean;

    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private anisotropicExt: EXT_texture_filter_anisotropic | null;
    private colorBufferFloatExt: EXT_color_buffer_float | null;
    private vertexShader: WebGLShader | null;
    private fragmentShader: WebGLShader | null;
    private shaderProgram: WebGLProgram | null;
    private shaderProgramLocations: {
        vertexPositionAttribute: number | null;
        normalsAttribute: number | null;
        textureCoordAttribute: number | null;
        groupAttribute: number | null;
        skinAttribute: number | null;
        weightAttribute: number | null;
        tangentAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        samplerUniform: WebGLUniformLocation | null;
        normalSamplerUniform: WebGLUniformLocation | null;
        ormSamplerUniform: WebGLUniformLocation | null;
        replaceableColorUniform: WebGLUniformLocation | null;
        replaceableTypeUniform: WebGLUniformLocation | null;
        discardAlphaLevelUniform: WebGLUniformLocation | null;
        tVertexAnimUniform: WebGLUniformLocation | null;
        nodesMatricesAttributes: (WebGLUniformLocation | null)[];
        lightPosUniform: WebGLUniformLocation | null;
        lightColorUniform: WebGLUniformLocation | null;
        cameraPosUniform: WebGLUniformLocation | null;
        hasShadowMapUniform: WebGLUniformLocation | null;
        shadowMapSamplerUniform: WebGLUniformLocation | null;
        shadowMapLightMatrixUniform: WebGLUniformLocation | null;
        shadowBiasUniform: WebGLUniformLocation | null;
        shadowSmoothingStepUniform: WebGLUniformLocation | null;
        hasEnvUniform: WebGLUniformLocation | null;
        irradianceMapUniform: WebGLUniformLocation | null;
        prefilteredEnvUniform: WebGLUniformLocation | null;
        brdfLUTUniform: WebGLUniformLocation | null;
    };
    private skeletonShaderProgram: WebGLProgram | null;
    private skeletonVertexShader: WebGLShader | null;
    private skeletonFragmentShader: WebGLShader | null;
    private skeletonShaderProgramLocations: {
        vertexPositionAttribute: number | null;
        colorAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
    };
    private skeletonVertexBuffer: WebGLBuffer | null;
    private skeletonColorBuffer: WebGLBuffer | null;

    private model: Model;
    private interp: ModelInterp;
    private rendererData: RendererData;
    private particlesController: ParticlesController;
    private ribbonsController: RibbonsController;

    private softwareSkinning: boolean;
    private vertexBuffer: WebGLBuffer[] = [];
    private normalBuffer: WebGLBuffer[] = [];
    private vertices: Float32Array[] = []; // Array per geoset for software skinning
    private texCoordBuffer: WebGLBuffer[] = [];
    private indexBuffer: WebGLBuffer[] = [];
    private wireframeIndexBuffer: WebGLBuffer[] = [];
    private groupBuffer: WebGLBuffer[] = [];
    private skinWeightBuffer: WebGLBuffer[] = [];
    private tangentBuffer: WebGLBuffer[] = [];

    private cubeVertexBuffer: WebGLBuffer;
    private squareVertexBuffer: WebGLBuffer;
    private brdfLUT: WebGLTexture;

    private envToCubemapShaderProgramLocations: {
        vertexPositionAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        envMapSamplerUniform: WebGLUniformLocation | null;
    };
    private envToCubemapVertexShader: WebGLShader | null;
    private envToCubemapFragmentShader: WebGLShader | null;
    private envToCubemapShaderProgram: WebGLProgram | null;

    private envShaderProgramLocations: {
        vertexPositionAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        envMapSamplerUniform: WebGLUniformLocation | null;
    };
    private envVertexShader: WebGLShader | null;
    private envFragmentShader: WebGLShader | null;
    private envShaderProgram: WebGLProgram | null;

    private convoluteDiffuseEnvShaderProgramLocations: {
        vertexPositionAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        envMapSamplerUniform: WebGLUniformLocation | null;
    };
    private convoluteDiffuseEnvVertexShader: WebGLShader | null;
    private convoluteDiffuseEnvFragmentShader: WebGLShader | null;
    private convoluteDiffuseEnvShaderProgram: WebGLProgram | null;

    private prefilterEnvShaderProgramLocations: {
        vertexPositionAttribute: number | null;
        pMatrixUniform: WebGLUniformLocation | null;
        mvMatrixUniform: WebGLUniformLocation | null;
        envMapSamplerUniform: WebGLUniformLocation | null;
        roughnessUniform: WebGLUniformLocation | null;
    };
    private prefilterEnvVertexShader: WebGLShader | null;
    private prefilterEnvFragmentShader: WebGLShader | null;
    private prefilterEnvShaderProgram: WebGLProgram | null;

    private integrateBRDFShaderProgramLocations: {
        vertexPositionAttribute: number | null;
    };
    private integrateBRDFVertexShader: WebGLShader | null;
    private integrateBRDFFragmentShader: WebGLShader | null;
    private integrateBRDFShaderProgram: WebGLProgram | null;

    constructor(model: Model) {
        this.isHD = model.Geosets?.some(it => it.SkinWeights?.length > 0);

        this.shaderProgramLocations = {
            vertexPositionAttribute: null,
            normalsAttribute: null,
            textureCoordAttribute: null,
            groupAttribute: null,
            skinAttribute: null,
            weightAttribute: null,
            tangentAttribute: null,
            pMatrixUniform: null,
            mvMatrixUniform: null,
            samplerUniform: null,
            normalSamplerUniform: null,
            ormSamplerUniform: null,
            replaceableColorUniform: null,
            replaceableTypeUniform: null,
            discardAlphaLevelUniform: null,
            tVertexAnimUniform: null,
            nodesMatricesAttributes: null,
            lightPosUniform: null,
            lightColorUniform: null,
            cameraPosUniform: null,
            hasShadowMapUniform: null,
            shadowMapSamplerUniform: null,
            shadowMapLightMatrixUniform: null,
            shadowBiasUniform: null,
            shadowSmoothingStepUniform: null,
            hasEnvUniform: null,
            irradianceMapUniform: null,
            prefilteredEnvUniform: null,
            brdfLUTUniform: null
        };
        this.skeletonShaderProgramLocations = {
            vertexPositionAttribute: null,
            colorAttribute: null,
            mvMatrixUniform: null,
            pMatrixUniform: null
        };
        this.envToCubemapShaderProgramLocations = {
            vertexPositionAttribute: null,
            pMatrixUniform: null,
            mvMatrixUniform: null,
            envMapSamplerUniform: null
        };
        this.envShaderProgramLocations = {
            vertexPositionAttribute: null,
            mvMatrixUniform: null,
            pMatrixUniform: null,
            envMapSamplerUniform: null
        };
        this.convoluteDiffuseEnvShaderProgramLocations = {
            vertexPositionAttribute: null,
            mvMatrixUniform: null,
            pMatrixUniform: null,
            envMapSamplerUniform: null
        };
        this.prefilterEnvShaderProgramLocations = {
            envMapSamplerUniform: null,
            mvMatrixUniform: null,
            pMatrixUniform: null,
            roughnessUniform: null,
            vertexPositionAttribute: null
        };
        this.integrateBRDFShaderProgramLocations = {
            vertexPositionAttribute: null
        };

        this.model = model;

        this.rendererData = {
            model,
            frame: 0,
            animation: null,
            animationInfo: null,
            globalSequencesFrames: [],
            rootNode: null,
            nodes: [],
            geosetAnims: [],
            geosetAlpha: [],
            materialLayerTextureID: [],
            teamColor: null,
            cameraPos: null,
            cameraQuat: null,
            lightPos: null,
            lightColor: null,
            shadowBias: 0,
            shadowSmoothingStep: 0,
            textures: {},
            envTextures: {},
            requiredEnvMaps: {},
            irradianceMap: {},
            prefilteredEnvMap: {}
        };

        this.rendererData.teamColor = vec3.fromValues(1., 0., 0.);
        this.rendererData.cameraPos = vec3.create();
        this.rendererData.cameraQuat = quat.create();
        this.rendererData.lightPos = vec3.fromValues(1000, 1000, 1000);
        this.rendererData.lightColor = vec3.fromValues(1, 1, 1);

        this.setSequence(0);

        this.rendererData.rootNode = {
            // todo
            node: {} as Node,
            matrix: mat4.create(),
            childs: []
        };
        for (const node of model.Nodes) {
            if (node) {
                this.rendererData.nodes[node.ObjectId] = {
                    node,
                    matrix: mat4.create(),
                    childs: []
                };
            }
        }
        for (const node of model.Nodes) {
            if (node) {
                if (!node.Parent && node.Parent !== 0) {
                    this.rendererData.rootNode.childs.push(this.rendererData.nodes[node.ObjectId]);
                } else {
                    this.rendererData.nodes[node.Parent].childs.push(this.rendererData.nodes[node.ObjectId]);
                }
            }
        }

        if (model.GlobalSequences) {
            for (let i = 0; i < model.GlobalSequences.length; ++i) {
                this.rendererData.globalSequencesFrames[i] = 0;
            }
        }

        for (let i = 0; i < model.GeosetAnims.length; ++i) {
            this.rendererData.geosetAnims[model.GeosetAnims[i].GeosetId] = model.GeosetAnims[i];
        }

        for (let i = 0; i < model.Materials.length; ++i) {
            this.rendererData.materialLayerTextureID[i] = new Array(model.Materials[i].Layers.length);
        }

        this.interp = new ModelInterp(this.rendererData);
        this.particlesController = new ParticlesController(this.interp, this.rendererData);
        this.ribbonsController = new RibbonsController(this.interp, this.rendererData);
    }

    public destroy (): void {
        if (this.particlesController) {
            this.particlesController.destroy();
            this.particlesController = null;
        }
        if (this.ribbonsController) {
            this.ribbonsController.destroy();
            this.ribbonsController = null;
        }

        if (this.skeletonShaderProgram) {
            if (this.skeletonVertexShader) {
                this.gl.detachShader(this.skeletonShaderProgram, this.skeletonVertexShader);
                this.gl.deleteShader(this.skeletonVertexShader);
                this.skeletonVertexShader = null;
            }
            if (this.skeletonFragmentShader) {
                this.gl.detachShader(this.skeletonShaderProgram, this.skeletonFragmentShader);
                this.gl.deleteShader(this.skeletonFragmentShader);
                this.skeletonFragmentShader = null;
            }
            this.gl.deleteProgram(this.skeletonShaderProgram);
            this.skeletonShaderProgram = null;
        }

        if (this.shaderProgram) {
            if (this.vertexShader) {
                this.gl.detachShader(this.shaderProgram, this.vertexShader);
                this.gl.deleteShader(this.vertexShader);
                this.vertexShader = null;
            }
            if (this.fragmentShader) {
                this.gl.detachShader(this.shaderProgram, this.fragmentShader);
                this.gl.deleteShader(this.fragmentShader);
                this.fragmentShader = null;
            }
            this.gl.deleteProgram(this.shaderProgram);
            this.shaderProgram = null;
        }

        if (this.envToCubemapShaderProgram) {
            if (this.envToCubemapVertexShader) {
                this.gl.detachShader(this.envToCubemapShaderProgram, this.envToCubemapVertexShader);
                this.gl.deleteShader(this.envToCubemapVertexShader);
                this.envToCubemapVertexShader = null;
            }
            if (this.envToCubemapFragmentShader) {
                this.gl.detachShader(this.envToCubemapShaderProgram, this.envToCubemapFragmentShader);
                this.gl.deleteShader(this.envToCubemapFragmentShader);
                this.envToCubemapFragmentShader = null;
            }
            this.gl.deleteProgram(this.envToCubemapShaderProgram);
            this.envToCubemapShaderProgram = null;
        }

        if (this.envShaderProgram) {
            if (this.envVertexShader) {
                this.gl.detachShader(this.envShaderProgram, this.envVertexShader);
                this.gl.deleteShader(this.envVertexShader);
                this.envVertexShader = null;
            }
            if (this.envFragmentShader) {
                this.gl.detachShader(this.envShaderProgram, this.envFragmentShader);
                this.gl.deleteShader(this.envFragmentShader);
                this.envFragmentShader = null;
            }
            this.gl.deleteProgram(this.envShaderProgram);
            this.envShaderProgram = null;
        }

        if (this.convoluteDiffuseEnvShaderProgram) {
            if (this.convoluteDiffuseEnvVertexShader) {
                this.gl.detachShader(this.convoluteDiffuseEnvShaderProgram, this.convoluteDiffuseEnvVertexShader);
                this.gl.deleteShader(this.convoluteDiffuseEnvVertexShader);
                this.convoluteDiffuseEnvVertexShader = null;
            }
            if (this.convoluteDiffuseEnvFragmentShader) {
                this.gl.detachShader(this.convoluteDiffuseEnvShaderProgram, this.convoluteDiffuseEnvFragmentShader);
                this.gl.deleteShader(this.convoluteDiffuseEnvFragmentShader);
                this.convoluteDiffuseEnvFragmentShader = null;
            }
            this.gl.deleteProgram(this.convoluteDiffuseEnvShaderProgram);
            this.convoluteDiffuseEnvShaderProgram = null;
        }

        if (this.prefilterEnvShaderProgram) {
            if (this.prefilterEnvVertexShader) {
                this.gl.detachShader(this.prefilterEnvShaderProgram, this.prefilterEnvVertexShader);
                this.gl.deleteShader(this.prefilterEnvVertexShader);
                this.prefilterEnvVertexShader = null;
            }
            if (this.prefilterEnvFragmentShader) {
                this.gl.detachShader(this.prefilterEnvShaderProgram, this.prefilterEnvFragmentShader);
                this.gl.deleteShader(this.prefilterEnvFragmentShader);
                this.prefilterEnvFragmentShader = null;
            }
            this.gl.deleteProgram(this.prefilterEnvShaderProgram);
            this.prefilterEnvShaderProgram = null;
        }

        if (this.integrateBRDFShaderProgram) {
            if (this.integrateBRDFVertexShader) {
                this.gl.detachShader(this.integrateBRDFShaderProgram, this.integrateBRDFVertexShader);
                this.gl.deleteShader(this.integrateBRDFVertexShader);
                this.integrateBRDFVertexShader = null;
            }
            if (this.integrateBRDFFragmentShader) {
                this.gl.detachShader(this.integrateBRDFShaderProgram, this.integrateBRDFFragmentShader);
                this.gl.deleteShader(this.integrateBRDFFragmentShader);
                this.integrateBRDFFragmentShader = null;
            }
            this.gl.deleteProgram(this.integrateBRDFShaderProgram);
            this.integrateBRDFShaderProgram = null;
        }

        this.gl.deleteBuffer(this.cubeVertexBuffer);
        this.gl.deleteBuffer(this.squareVertexBuffer);
    }

    public initGL (glContext: WebGL2RenderingContext | WebGLRenderingContext): void {
        this.gl = glContext;
        // Max bones + MV + P
        this.softwareSkinning = this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS) < 4 * (MAX_NODES + 2);
        this.anisotropicExt = (
            this.gl.getExtension('EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
        );
        this.colorBufferFloatExt = this.gl.getExtension('EXT_color_buffer_float');

        if (this.model.Version >= 1000 && isWebGL2(this.gl)) {
            this.model.Materials.forEach(material => {
                if (material.Shader === 'Shader_HD_DefaultUnit' && material.Layers.length === 6 && typeof material.Layers[5].TextureID === 'number') {
                    this.rendererData.requiredEnvMaps[this.model.Textures[material.Layers[5].TextureID].Image] = true;
                }
            });
        }

        this.initShaders();
        this.initBuffers();
        this.initCube();
        this.initSquare();
        this.initBRDFLUT();
        this.particlesController.initGL(glContext);
        this.ribbonsController.initGL(glContext);
    }

    public setTextureImage (path: string, img: HTMLImageElement, flags: TextureFlags | 0): void {
        this.rendererData.textures[path] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
        this.setTextureParameters(flags, true);

        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        this.processEnvMaps(path);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public setTextureImageData (path: string, imageData: ImageData[], flags: TextureFlags): void {
        this.rendererData.textures[path] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        for (let i = 0; i < imageData.length; ++i) {
            this.gl.texImage2D(this.gl.TEXTURE_2D, i, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageData[i]);
        }
        this.setTextureParameters(flags, false);
        this.processEnvMaps(path);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public setTextureCompressedImage (path: string, format: DDS_FORMAT, imageData: ArrayBuffer, ddsInfo: DdsInfo, flags: TextureFlags): void {
        this.rendererData.textures[path] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);

        const view = new Uint8Array(imageData);

        let count = 1;
        for (let i = 1; i < ddsInfo.images.length; ++i) {
            const image = ddsInfo.images[i];
            if (image.shape.width >= 2 && image.shape.height >= 2) {
                count = i + 1;
            }
        }

        if (isWebGL2(this.gl)) {
            this.gl.texStorage2D(this.gl.TEXTURE_2D, count, format, ddsInfo.images[0].shape.width, ddsInfo.images[0].shape.height);

            for (let i = 0; i < count; ++i) {
                const image = ddsInfo.images[i];
                this.gl.compressedTexSubImage2D(this.gl.TEXTURE_2D, i, 0, 0, image.shape.width, image.shape.height, format, view.subarray(image.offset, image.offset + image.length));
            }
        } else {
            for (let i = 0; i < count; ++i) {
                const image = ddsInfo.images[i];
                this.gl.compressedTexImage2D(this.gl.TEXTURE_2D, i, format, image.shape.width, image.shape.height, 0, view.subarray(image.offset, image.offset + image.length));
            }
        }

        this.setTextureParameters(flags, isWebGL2(this.gl));
        this.processEnvMaps(path);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    public setCamera (cameraPos: vec3, cameraQuat: quat): void {
        vec3.copy(this.rendererData.cameraPos, cameraPos);
        quat.copy(this.rendererData.cameraQuat, cameraQuat);
    }

    public setLightPosition (lightPos: vec3): void {
        vec3.copy(this.rendererData.lightPos, lightPos);
    }

    public setLightColor (lightColor: vec3): void {
        vec3.copy(this.rendererData.lightColor, lightColor);
    }

    public setSequence (index: number): void {
        this.rendererData.animation = index;
        this.rendererData.animationInfo = this.model.Sequences[this.rendererData.animation];
        this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
    }

    public setTeamColor (color: vec3): void {
        vec3.copy(this.rendererData.teamColor, color);
    }

    public update (delta: number): void {
        this.rendererData.frame += delta;
        if (this.rendererData.frame > this.rendererData.animationInfo.Interval[1]) {
            this.rendererData.frame = this.rendererData.animationInfo.Interval[0];
        }
        this.updateGlobalSequences(delta);

        this.updateNode(this.rendererData.rootNode);

        this.particlesController.update(delta);
        this.ribbonsController.update(delta);

        for (let i = 0; i < this.model.Geosets.length; ++i) {
            this.rendererData.geosetAlpha[i] = this.findAlpha(i);
        }

        for (let i = 0; i < this.rendererData.materialLayerTextureID.length; ++i) {
            for (let j = 0; j < this.rendererData.materialLayerTextureID[i].length; ++j) {
                this.updateLayerTextureId(i, j);
            }
        }
    }

    public render (mvMatrix: mat4, pMatrix: mat4, {
        wireframe,
        useEnvironmentMap = false,
        shadowMapTexture,
        shadowMapMatrix,
        shadowBias,
        shadowSmoothingStep
    } : {
        wireframe: boolean;
        useEnvironmentMap?: boolean;
        shadowMapTexture?: WebGLTexture;
        shadowMapMatrix?: mat4;
        shadowBias?: number;
        shadowSmoothingStep?: number;
    }): void {
        this.gl.useProgram(this.shaderProgram);

        this.gl.uniformMatrix4fv(this.shaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(this.shaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        this.gl.enableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.normalsAttribute);
        this.gl.enableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);

        if (this.isHD) {
            this.gl.enableVertexAttribArray(this.shaderProgramLocations.skinAttribute);
            this.gl.enableVertexAttribArray(this.shaderProgramLocations.weightAttribute);
            this.gl.enableVertexAttribArray(this.shaderProgramLocations.tangentAttribute);
        } else {
            if (!this.softwareSkinning) {
                this.gl.enableVertexAttribArray(this.shaderProgramLocations.groupAttribute);
            }
        }

        if (!this.softwareSkinning) {
            for (let j = 0; j < MAX_NODES; ++j) {
                if (this.rendererData.nodes[j]) {
                    this.gl.uniformMatrix4fv(this.shaderProgramLocations.nodesMatricesAttributes[j], false,
                        this.rendererData.nodes[j].matrix);
                }
            }
        }


        for (let i = 0; i < this.model.Geosets.length; ++i) {
            const geoset = this.model.Geosets[i];
            if (this.rendererData.geosetAlpha[i] < 1e-6) {
                continue;
            }
            if (geoset.LevelOfDetail > 0) {
                continue;
            }

            if (this.softwareSkinning) {
                this.generateGeosetVertices(i);
            }

            const materialID = geoset.MaterialID;
            const material = this.model.Materials[materialID];

            // Shader_HD_DefaultUnit
            if (this.isHD) {
                this.gl.uniform3fv(this.shaderProgramLocations.lightPosUniform, this.rendererData.lightPos);
                this.gl.uniform3fv(this.shaderProgramLocations.lightColorUniform, this.rendererData.lightColor);
                // this.gl.uniform3fv(this.shaderProgramLocations.lightPosUniform, this.rendererData.cameraPos);
                this.gl.uniform3fv(this.shaderProgramLocations.cameraPosUniform, this.rendererData.cameraPos);

                if (shadowMapTexture && shadowMapMatrix) {
                    this.gl.uniform1i(this.shaderProgramLocations.hasShadowMapUniform, 1);

                    this.gl.activeTexture(this.gl.TEXTURE3);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, shadowMapTexture);
                    this.gl.uniform1i(this.shaderProgramLocations.shadowMapSamplerUniform, 3);
                    this.gl.uniformMatrix4fv(this.shaderProgramLocations.shadowMapLightMatrixUniform, false, shadowMapMatrix);

                    this.gl.uniform1f(this.shaderProgramLocations.shadowBiasUniform, shadowBias ?? 1e-6);
                    this.gl.uniform1f(this.shaderProgramLocations.shadowSmoothingStepUniform, shadowSmoothingStep ?? 1 / 1024);
                } else {
                    this.gl.uniform1i(this.shaderProgramLocations.hasShadowMapUniform, 0);
                }

                const envTexture = this.model.Textures[material.Layers[5]?.TextureID as number].Image;
                const irradianceMap = this.rendererData.irradianceMap[envTexture];
                const prefilteredEnv = this.rendererData.prefilteredEnvMap[envTexture];
                if (useEnvironmentMap && irradianceMap) {
                    this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform, 1);
                    this.gl.activeTexture(this.gl.TEXTURE4);
                    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, irradianceMap);
                    this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform, 4);
                    this.gl.activeTexture(this.gl.TEXTURE5);
                    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, prefilteredEnv);
                    this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform, 5);
                    this.gl.activeTexture(this.gl.TEXTURE6);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.brdfLUT);
                    this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform, 6);
                } else {
                    this.gl.uniform1i(this.shaderProgramLocations.hasEnvUniform, 0);
                    this.gl.uniform1i(this.shaderProgramLocations.irradianceMapUniform, 4);
                    this.gl.uniform1i(this.shaderProgramLocations.prefilteredEnvUniform, 5);
                    this.gl.uniform1i(this.shaderProgramLocations.brdfLUTUniform, 6);
                }

                this.setLayerPropsHD(materialID, material.Layers);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute, 3, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skinWeightBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.skinAttribute, 4, this.gl.UNSIGNED_BYTE, false, 8, 0);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.weightAttribute, 4, this.gl.UNSIGNED_BYTE, true, 8, 4);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tangentBuffer[i]);
                this.gl.vertexAttribPointer(this.shaderProgramLocations.tangentAttribute, 4, this.gl.FLOAT, false, 0, 0);

                if (wireframe && !this.wireframeIndexBuffer[i]) {
                    this.createWireframeBuffer(i);
                }

                this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, wireframe ? this.wireframeIndexBuffer[i] : this.indexBuffer[i]);
                this.gl.drawElements(
                    wireframe ? this.gl.LINES : this.gl.TRIANGLES,
                    wireframe ? geoset.Faces.length * 2 : geoset.Faces.length,
                    this.gl.UNSIGNED_SHORT,
                    0
                );

                if (shadowMapTexture && shadowMapMatrix) {
                    this.gl.activeTexture(this.gl.TEXTURE3);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
                }
            } else {
                for (let j = 0; j < material.Layers.length; ++j) {
                    this.setLayerProps(material.Layers[j], this.rendererData.materialLayerTextureID[materialID][j]);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                    this.gl.vertexAttribPointer(this.shaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer[i]);
                    this.gl.vertexAttribPointer(this.shaderProgramLocations.normalsAttribute, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
                    this.gl.vertexAttribPointer(this.shaderProgramLocations.textureCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);

                    if (!this.softwareSkinning) {
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.groupBuffer[i]);
                        this.gl.vertexAttribPointer(this.shaderProgramLocations.groupAttribute, 4, this.gl.UNSIGNED_SHORT, false, 0, 0);
                    }

                    if (wireframe && !this.wireframeIndexBuffer[i]) {
                        this.createWireframeBuffer(i);
                    }

                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, wireframe ? this.wireframeIndexBuffer[i] : this.indexBuffer[i]);
                    this.gl.drawElements(
                        wireframe ? this.gl.LINES : this.gl.TRIANGLES,
                        wireframe ? geoset.Faces.length * 2 : geoset.Faces.length,
                        this.gl.UNSIGNED_SHORT,
                        0
                    );
                }
            }
        }

        this.gl.disableVertexAttribArray(this.shaderProgramLocations.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.normalsAttribute);
        this.gl.disableVertexAttribArray(this.shaderProgramLocations.textureCoordAttribute);
        if (this.isHD) {
            this.gl.disableVertexAttribArray(this.shaderProgramLocations.skinAttribute);
            this.gl.disableVertexAttribArray(this.shaderProgramLocations.weightAttribute);
            this.gl.disableVertexAttribArray(this.shaderProgramLocations.tangentAttribute);
        } else {
            if (!this.softwareSkinning) {
                this.gl.disableVertexAttribArray(this.shaderProgramLocations.groupAttribute);
            }
        }

        this.particlesController.render(mvMatrix, pMatrix);
        this.ribbonsController.render(mvMatrix, pMatrix);
    }

    public renderEnvironment (mvMatrix: mat4, pMatrix: mat4): void {
        if (!isWebGL2(this.gl)) {
            return;
        }

        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);

        for (const path in this.rendererData.envTextures) {
            this.gl.useProgram(this.envShaderProgram);

            this.gl.uniformMatrix4fv(this.envShaderProgramLocations.pMatrixUniform, false, pMatrix);
            this.gl.uniformMatrix4fv(this.envShaderProgramLocations.mvMatrixUniform, false, mvMatrix);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.rendererData.envTextures[path]);
            this.gl.uniform1i(this.envShaderProgramLocations.envMapSamplerUniform, 0);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
            this.gl.enableVertexAttribArray(this.envShaderProgramLocations.vertexPositionAttribute);
            this.gl.vertexAttribPointer(this.envShaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
            this.gl.disableVertexAttribArray(this.envShaderProgramLocations.vertexPositionAttribute);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
        }
    }

    /**
     * @param mvMatrix
     * @param pMatrix
     * @param nodes Nodes to highlight. null means draw all
     */
    public renderSkeleton (mvMatrix: mat4, pMatrix: mat4, nodes: string[] | null): void {
        if (!this.skeletonShaderProgram) {
            this.skeletonShaderProgram = this.initSkeletonShaderProgram();
        }

        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);

        this.gl.useProgram(this.skeletonShaderProgram);

        this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.uniformMatrix4fv(this.skeletonShaderProgramLocations.mvMatrixUniform, false, mvMatrix);

        this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute);
        this.gl.enableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute);

        if (!this.skeletonVertexBuffer) {
            this.skeletonVertexBuffer = this.gl.createBuffer();
        }
        if (!this.skeletonColorBuffer) {
            this.skeletonColorBuffer = this.gl.createBuffer();
        }
        const coords = [];
        const colors = [];
        const line = (node0: NodeWrapper, node1: NodeWrapper) => {
            vec3.transformMat4(tempPos, node0.node.PivotPoint, node0.matrix);
            coords.push(
                tempPos[0],
                tempPos[1],
                tempPos[2]
            );
            vec3.transformMat4(tempPos, node1.node.PivotPoint, node1.matrix);
            coords.push(
                tempPos[0],
                tempPos[1],
                tempPos[2]
            );

            colors.push(
                0,
                1,
                0,
                0,
                0,
                1,
            );
        };
        const updateNode = (node: NodeWrapper) => {
            if ((node.node.Parent || node.node.Parent === 0) && (!nodes || nodes.includes(node.node.Name))) {
                line(node, this.rendererData.nodes[node.node.Parent]);
            }
            for (const child of node.childs) {
                updateNode(child);
            }
        };
        updateNode(this.rendererData.rootNode);
        const vertexBuffer = new Float32Array(coords);
        const colorBuffer = new Float32Array(colors);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skeletonVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexBuffer, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skeletonColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, colorBuffer, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(this.skeletonShaderProgramLocations.colorAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.LINES, 0, vertexBuffer.length / 3);

        this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.vertexPositionAttribute);
        this.gl.disableVertexAttribArray(this.skeletonShaderProgramLocations.colorAttribute);
    }

    private initSkeletonShaderProgram (): WebGLProgram {
        const vertex = this.skeletonVertexShader = getShader(this.gl, skeletonVertexShader, this.gl.VERTEX_SHADER);
        const fragment = this.skeletonFragmentShader = getShader(this.gl, skeletonFragmentShader, this.gl.FRAGMENT_SHADER);

        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertex);
        this.gl.attachShader(shaderProgram, fragment);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        this.gl.useProgram(shaderProgram);

        this.skeletonShaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.skeletonShaderProgramLocations.colorAttribute = this.gl.getAttribLocation(shaderProgram, 'aColor');
        this.skeletonShaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uPMatrix');
        this.skeletonShaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uMVMatrix');

        return shaderProgram;
    }

    private generateGeosetVertices (geosetIndex: number): void {
        const geoset: Geoset = this.model.Geosets[geosetIndex];
        const buffer = this.vertices[geosetIndex];

        for (let i = 0; i < buffer.length; i += 3) {
            const index = i / 3;
            const group = geoset.Groups[geoset.VertexGroup[index]];

            vec3.set(tempPos, geoset.Vertices[i], geoset.Vertices[i + 1], geoset.Vertices[i + 2]);
            vec3.set(tempSum, 0, 0, 0);
            for (let j = 0; j < group.length; ++j) {
                vec3.add(
                    tempSum, tempSum,
                    vec3.transformMat4(tempVec3, tempPos, this.rendererData.nodes[group[j]].matrix)
                );
            }
            vec3.scale(tempPos, tempSum, 1 / group.length);
            buffer[i]     = tempPos[0];
            buffer[i + 1] = tempPos[1];
            buffer[i + 2] = tempPos[2];
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[geosetIndex]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.DYNAMIC_DRAW);
    }

    private setTextureParameters (flags: TextureFlags | 0, hasMipmaps: boolean) {
        if (flags & TextureFlags.WrapWidth) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        }
        if (flags & TextureFlags.WrapHeight) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        }
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, hasMipmaps ? this.gl.LINEAR_MIPMAP_NEAREST : this.gl.LINEAR);

        if (this.anisotropicExt) {
            const max = this.gl.getParameter(this.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }
    }

    private processEnvMaps (path: string): void {
        if (!this.rendererData.requiredEnvMaps[path] || !this.rendererData.textures[path] || !isWebGL2(this.gl) || !this.colorBufferFloatExt) {
            return;
        }

        this.gl.disable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);

        const pMatrix = mat4.create();
        const mvMatrix = mat4.create();
        const eye = vec3.fromValues(0, 0, 0);
        const center = [
            vec3.fromValues(1, 0, 0),
            vec3.fromValues(-1, 0, 0),
            vec3.fromValues(0, 1, 0),
            vec3.fromValues(0, -1, 0),
            vec3.fromValues(0, 0, 1),
            vec3.fromValues(0, 0, -1)
        ];
        const up = [
            vec3.fromValues(0, -1, 0),
            vec3.fromValues(0, -1, 0),
            vec3.fromValues(0, 0, 1),
            vec3.fromValues(0, 0, -1),
            vec3.fromValues(0, -1, 0),
            vec3.fromValues(0, -1, 0)
        ];

        const framebuffer = this.gl.createFramebuffer();

        this.gl.useProgram(this.envToCubemapShaderProgram);

        const cubemap = this.rendererData.envTextures[path] = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubemap);
        for (let i = 0; i < 6; ++i) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA16F, ENV_MAP_SIZE, ENV_MAP_SIZE, 0, this.gl.RGBA, this.gl.FLOAT, null);
        }

        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.enableVertexAttribArray(this.envToCubemapShaderProgramLocations.vertexPositionAttribute);
        this.gl.vertexAttribPointer(this.envToCubemapShaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

        mat4.perspective(pMatrix, Math.PI / 2, 1, .1, 10);
        this.gl.uniformMatrix4fv(this.envToCubemapShaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[path]);
        this.gl.uniform1i(this.envToCubemapShaderProgramLocations.envMapSamplerUniform, 0);
        this.gl.viewport(0, 0, ENV_MAP_SIZE, ENV_MAP_SIZE);
        for (let i = 0; i < 6; ++i) {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, cubemap, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            mat4.lookAt(mvMatrix, eye, center[i], up[i]);
            this.gl.uniformMatrix4fv(this.envToCubemapShaderProgramLocations.mvMatrixUniform, false, mvMatrix);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
        }

        this.gl.disableVertexAttribArray(this.envToCubemapShaderProgramLocations.vertexPositionAttribute);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubemap);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);

        // Diffuse env convolution

        this.gl.useProgram(this.convoluteDiffuseEnvShaderProgram);

        const diffuseCubemap = this.rendererData.irradianceMap[path] = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, diffuseCubemap);
        for (let i = 0; i < 6; ++i) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGBA16F, ENV_CONVOLUTE_DIFFUSE_SIZE, ENV_CONVOLUTE_DIFFUSE_SIZE, 0, this.gl.RGBA, this.gl.FLOAT, null);
        }

        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.enableVertexAttribArray(this.convoluteDiffuseEnvShaderProgramLocations.vertexPositionAttribute);
        this.gl.vertexAttribPointer(this.convoluteDiffuseEnvShaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

        mat4.perspective(pMatrix, Math.PI / 2, 1, .1, 10);
        this.gl.uniformMatrix4fv(this.convoluteDiffuseEnvShaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.rendererData.envTextures[path]);
        this.gl.uniform1i(this.convoluteDiffuseEnvShaderProgramLocations.envMapSamplerUniform, 0);
        this.gl.viewport(0, 0, ENV_CONVOLUTE_DIFFUSE_SIZE, ENV_CONVOLUTE_DIFFUSE_SIZE);
        for (let i = 0; i < 6; ++i) {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, diffuseCubemap, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            mat4.lookAt(mvMatrix, eye, center[i], up[i]);
            this.gl.uniformMatrix4fv(this.convoluteDiffuseEnvShaderProgramLocations.mvMatrixUniform, false, mvMatrix);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
        }

        this.gl.disableVertexAttribArray(this.convoluteDiffuseEnvShaderProgramLocations.vertexPositionAttribute);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, diffuseCubemap);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);

        // Prefilter env map with different roughness

        this.gl.useProgram(this.prefilterEnvShaderProgram);

        const prefilterCubemap = this.rendererData.prefilteredEnvMap[path] = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, prefilterCubemap);
        this.gl.texStorage2D(this.gl.TEXTURE_CUBE_MAP, MAX_ENV_MIP_LEVELS, this.gl.RGBA16F, ENV_PREFILTER_SIZE, ENV_PREFILTER_SIZE);
        // for (let i = 0; i < 6; ++i) {
            // this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGB, ENV_PREFILTER_SIZE, ENV_PREFILTER_SIZE, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, null);
        // }
        for (let mip = 0; mip < MAX_ENV_MIP_LEVELS; ++mip) {
            for (let i = 0; i < 6; ++i) {
                const size = ENV_PREFILTER_SIZE * .5 ** mip;
                const data = new Float32Array(size * size * 4);
                this.gl.texSubImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, mip, 0, 0, size, size, this.gl.RGBA, this.gl.FLOAT, data);
            }
        }

        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.enableVertexAttribArray(this.prefilterEnvShaderProgramLocations.vertexPositionAttribute);
        this.gl.vertexAttribPointer(this.prefilterEnvShaderProgramLocations.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);

        mat4.perspective(pMatrix, Math.PI / 2, 1, .1, 10);
        this.gl.uniformMatrix4fv(this.prefilterEnvShaderProgramLocations.pMatrixUniform, false, pMatrix);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.rendererData.envTextures[path]);
        this.gl.uniform1i(this.prefilterEnvShaderProgramLocations.envMapSamplerUniform, 0);

        for (let mip = 0; mip < MAX_ENV_MIP_LEVELS; ++mip) {
            const mipWidth = ENV_PREFILTER_SIZE *.5 ** mip;
            const mipHeight = ENV_PREFILTER_SIZE *.5 ** mip;
            this.gl.viewport(0, 0, mipWidth, mipHeight);

            const roughness = mip / (MAX_ENV_MIP_LEVELS - 1);

            this.gl.uniform1f(this.prefilterEnvShaderProgramLocations.roughnessUniform, roughness);

            for (let i = 0; i < 6; ++i) {
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, prefilterCubemap, mip);
                this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

                mat4.lookAt(mvMatrix, eye, center[i], up[i]);
                this.gl.uniformMatrix4fv(this.prefilterEnvShaderProgramLocations.mvMatrixUniform, false, mvMatrix);

                this.gl.drawArrays(this.gl.TRIANGLES, 0, 6 * 6);
            }
        }

        // cleanup

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
        this.gl.deleteFramebuffer(framebuffer);
    }

    private updateLayerTextureId (materialId: number, layerId: number): void {
        const TextureID: AnimVector|number = this.model.Materials[materialId].Layers[layerId].TextureID;

        if (typeof TextureID === 'number') {
            this.rendererData.materialLayerTextureID[materialId][layerId] = TextureID;
        } else {
            this.rendererData.materialLayerTextureID[materialId][layerId] = this.interp.num(TextureID);
        }
    }

    private initShaders (): void {
        if (this.shaderProgram) {
            return;
        }

        let vertexShaderSource;
        if (this.isHD) {
            vertexShaderSource = vertexShaderHDHardwareSkinning;
        } else if (this.softwareSkinning) {
            vertexShaderSource = vertexShaderSoftwareSkinning;
        } else {
            vertexShaderSource = vertexShaderHardwareSkinning;
        }

        let fragmentShaderSource;
        if (this.isHD) {
            fragmentShaderSource = fragmentShaderHD;
        } else {
            fragmentShaderSource = fragmentShader;
        }

        const vertex = this.vertexShader = getShader(this.gl, vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragment = this.fragmentShader = getShader(this.gl, fragmentShaderSource, this.gl.FRAGMENT_SHADER);

        const shaderProgram = this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertex);
        this.gl.attachShader(shaderProgram, fragment);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            alert('Could not initialise shaders');
        }

        this.gl.useProgram(shaderProgram);

        this.shaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.shaderProgramLocations.normalsAttribute = this.gl.getAttribLocation(shaderProgram, 'aNormal');
        this.shaderProgramLocations.textureCoordAttribute = this.gl.getAttribLocation(shaderProgram, 'aTextureCoord');
        if (this.isHD) {
            this.shaderProgramLocations.skinAttribute = this.gl.getAttribLocation(shaderProgram, 'aSkin');
            this.shaderProgramLocations.weightAttribute = this.gl.getAttribLocation(shaderProgram, 'aBoneWeight');
            this.shaderProgramLocations.tangentAttribute = this.gl.getAttribLocation(shaderProgram, 'aTangent');
        } else {
            if (!this.softwareSkinning) {
                this.shaderProgramLocations.groupAttribute = this.gl.getAttribLocation(shaderProgram, 'aGroup');
            }
        }

        this.shaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uPMatrix');
        this.shaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uMVMatrix');
        this.shaderProgramLocations.samplerUniform = this.gl.getUniformLocation(shaderProgram, 'uSampler');
        this.shaderProgramLocations.replaceableColorUniform = this.gl.getUniformLocation(shaderProgram, 'uReplaceableColor');
        if (this.isHD) {
            this.shaderProgramLocations.normalSamplerUniform = this.gl.getUniformLocation(shaderProgram, 'uNormalSampler');
            this.shaderProgramLocations.ormSamplerUniform = this.gl.getUniformLocation(shaderProgram, 'uOrmSampler');
            this.shaderProgramLocations.lightPosUniform = this.gl.getUniformLocation(shaderProgram, 'uLightPos');
            this.shaderProgramLocations.lightColorUniform = this.gl.getUniformLocation(shaderProgram, 'uLightColor');
            this.shaderProgramLocations.cameraPosUniform = this.gl.getUniformLocation(shaderProgram, 'uCameraPos');

            this.shaderProgramLocations.hasShadowMapUniform = this.gl.getUniformLocation(shaderProgram, 'uHasShadowMap');
            this.shaderProgramLocations.shadowMapSamplerUniform = this.gl.getUniformLocation(shaderProgram, 'uShadowMapSampler');
            this.shaderProgramLocations.shadowMapLightMatrixUniform = this.gl.getUniformLocation(shaderProgram, 'uShadowMapLightMatrix');
            this.shaderProgramLocations.shadowBiasUniform = this.gl.getUniformLocation(shaderProgram, 'uShadowBias');
            this.shaderProgramLocations.shadowSmoothingStepUniform = this.gl.getUniformLocation(shaderProgram, 'uShadowSmoothingStep');

            this.shaderProgramLocations.hasEnvUniform = this.gl.getUniformLocation(shaderProgram, 'uHasEnv');
            this.shaderProgramLocations.irradianceMapUniform = this.gl.getUniformLocation(shaderProgram, 'uIrradianceMap');
            this.shaderProgramLocations.prefilteredEnvUniform = this.gl.getUniformLocation(shaderProgram, 'uPrefilteredEnv');
            this.shaderProgramLocations.brdfLUTUniform = this.gl.getUniformLocation(shaderProgram, 'uBRDFLUT');
        } else {
            this.shaderProgramLocations.replaceableTypeUniform = this.gl.getUniformLocation(shaderProgram, 'uReplaceableType');
        }
        this.shaderProgramLocations.discardAlphaLevelUniform = this.gl.getUniformLocation(shaderProgram, 'uDiscardAlphaLevel');
        this.shaderProgramLocations.tVertexAnimUniform = this.gl.getUniformLocation(shaderProgram, 'uTVextexAnim');

        if (!this.softwareSkinning) {
            this.shaderProgramLocations.nodesMatricesAttributes = [];
            for (let i = 0; i < MAX_NODES; ++i) {
                this.shaderProgramLocations.nodesMatricesAttributes[i] =
                    this.gl.getUniformLocation(shaderProgram, `uNodesMatrices[${i}]`);
            }
        }

        if (this.isHD && isWebGL2(this.gl)) {
            const envToCubemapVertex = this.envToCubemapVertexShader = getShader(this.gl, envToCubemapVertexShader, this.gl.VERTEX_SHADER);
            const envToCubemapFragment = this.envToCubemapFragmentShader = getShader(this.gl, envToCubemapFragmentShader, this.gl.FRAGMENT_SHADER);
            const envToCubemapShaderProgram = this.envToCubemapShaderProgram = this.gl.createProgram();
            this.gl.attachShader(envToCubemapShaderProgram, envToCubemapVertex);
            this.gl.attachShader(envToCubemapShaderProgram, envToCubemapFragment);
            this.gl.linkProgram(envToCubemapShaderProgram);

            if (!this.gl.getProgramParameter(envToCubemapShaderProgram, this.gl.LINK_STATUS)) {
                alert('Could not initialise shaders');
            }

            this.gl.useProgram(envToCubemapShaderProgram);

            this.envToCubemapShaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(envToCubemapShaderProgram, 'aPos');
            this.envToCubemapShaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(envToCubemapShaderProgram, 'uPMatrix');
            this.envToCubemapShaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(envToCubemapShaderProgram, 'uMVMatrix');
            this.envToCubemapShaderProgramLocations.envMapSamplerUniform = this.gl.getUniformLocation(envToCubemapShaderProgram, 'uEquirectangularMap');

            const envVertex = this.envVertexShader = getShader(this.gl, envVertexShader, this.gl.VERTEX_SHADER);
            const envFragment = this.envFragmentShader = getShader(this.gl, envFragmentShader, this.gl.FRAGMENT_SHADER);
            const envShaderProgram = this.envShaderProgram = this.gl.createProgram();
            this.gl.attachShader(envShaderProgram, envVertex);
            this.gl.attachShader(envShaderProgram, envFragment);
            this.gl.linkProgram(envShaderProgram);

            if (!this.gl.getProgramParameter(envShaderProgram, this.gl.LINK_STATUS)) {
                alert('Could not initialise shaders');
            }

            this.gl.useProgram(envShaderProgram);

            this.envShaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(envShaderProgram, 'aPos');
            this.envShaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(envShaderProgram, 'uPMatrix');
            this.envShaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(envShaderProgram, 'uMVMatrix');
            this.envShaderProgramLocations.envMapSamplerUniform = this.gl.getUniformLocation(envShaderProgram, 'uEnvironmentMap');


            const convoluteDiffuseEnvVertex = this.convoluteDiffuseEnvVertexShader = getShader(this.gl, convoluteEnvDiffuseVertexShader, this.gl.VERTEX_SHADER);
            const convoluteDiffuseEnvFragment = this.convoluteDiffuseEnvFragmentShader = getShader(this.gl, convoluteEnvDiffuseFragmentShader, this.gl.FRAGMENT_SHADER);
            const convoluteDiffuseEnvShaderProgram = this.convoluteDiffuseEnvShaderProgram = this.gl.createProgram();
            this.gl.attachShader(convoluteDiffuseEnvShaderProgram, convoluteDiffuseEnvVertex);
            this.gl.attachShader(convoluteDiffuseEnvShaderProgram, convoluteDiffuseEnvFragment);
            this.gl.linkProgram(convoluteDiffuseEnvShaderProgram);

            if (!this.gl.getProgramParameter(convoluteDiffuseEnvShaderProgram, this.gl.LINK_STATUS)) {
                alert('Could not initialise shaders');
            }

            this.gl.useProgram(convoluteDiffuseEnvShaderProgram);

            this.convoluteDiffuseEnvShaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(convoluteDiffuseEnvShaderProgram, 'aPos');
            this.convoluteDiffuseEnvShaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(convoluteDiffuseEnvShaderProgram, 'uPMatrix');
            this.convoluteDiffuseEnvShaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(convoluteDiffuseEnvShaderProgram, 'uMVMatrix');
            this.convoluteDiffuseEnvShaderProgramLocations.envMapSamplerUniform = this.gl.getUniformLocation(convoluteDiffuseEnvShaderProgram, 'uEnvironmentMap');


            const prefilterEnvVertex = this.prefilterEnvVertexShader = getShader(this.gl, prefilterEnvVertexShader, this.gl.VERTEX_SHADER);
            const prefilterEnvFragment = this.prefilterEnvFragmentShader = getShader(this.gl, prefilterEnvFragmentShader, this.gl.FRAGMENT_SHADER);
            const prefilterEnvShaderProgram = this.prefilterEnvShaderProgram = this.gl.createProgram();
            this.gl.attachShader(prefilterEnvShaderProgram, prefilterEnvVertex);
            this.gl.attachShader(prefilterEnvShaderProgram, prefilterEnvFragment);
            this.gl.linkProgram(prefilterEnvShaderProgram);

            if (!this.gl.getProgramParameter(prefilterEnvShaderProgram, this.gl.LINK_STATUS)) {
                alert('Could not initialise shaders');
            }

            this.gl.useProgram(prefilterEnvShaderProgram);

            this.prefilterEnvShaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(prefilterEnvShaderProgram, 'aPos');
            this.prefilterEnvShaderProgramLocations.pMatrixUniform = this.gl.getUniformLocation(prefilterEnvShaderProgram, 'uPMatrix');
            this.prefilterEnvShaderProgramLocations.mvMatrixUniform = this.gl.getUniformLocation(prefilterEnvShaderProgram, 'uMVMatrix');
            this.prefilterEnvShaderProgramLocations.envMapSamplerUniform = this.gl.getUniformLocation(prefilterEnvShaderProgram, 'uEnvironmentMap');
            this.prefilterEnvShaderProgramLocations.roughnessUniform = this.gl.getUniformLocation(prefilterEnvShaderProgram, 'uRoughness');


            const integrateBRDFVertex = this.integrateBRDFVertexShader = getShader(this.gl, integrateBRDFVertexShader, this.gl.VERTEX_SHADER);
            const integrateBRDFFragment = this.integrateBRDFFragmentShader = getShader(this.gl, integrateBRDFFragmentShader, this.gl.FRAGMENT_SHADER);
            const integrateBRDFShaderProgram = this.integrateBRDFShaderProgram = this.gl.createProgram();
            this.gl.attachShader(integrateBRDFShaderProgram, integrateBRDFVertex);
            this.gl.attachShader(integrateBRDFShaderProgram, integrateBRDFFragment);
            this.gl.linkProgram(integrateBRDFShaderProgram);

            if (!this.gl.getProgramParameter(integrateBRDFShaderProgram, this.gl.LINK_STATUS)) {
                alert('Could not initialise shaders');
            }

            this.gl.useProgram(integrateBRDFShaderProgram);

            this.integrateBRDFShaderProgramLocations.vertexPositionAttribute = this.gl.getAttribLocation(integrateBRDFShaderProgram, 'aPos');
        }
    }

    private createWireframeBuffer (index: number): void {
        const faces = this.model.Geosets[index].Faces;
        const lines = new Uint16Array(faces.length * 2);

        for (let i = 0; i < faces.length; i += 3) {
            lines[i * 2]     = faces[i];
            lines[i * 2 + 1] = faces[i + 1];
            lines[i * 2 + 2] = faces[i + 1];
            lines[i * 2 + 3] = faces[i + 2];
            lines[i * 2 + 4] = faces[i + 2];
            lines[i * 2 + 5] = faces[i];
        }

        this.wireframeIndexBuffer[index] = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.wireframeIndexBuffer[index]);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, lines, this.gl.STATIC_DRAW);
    }

    private initBuffers (): void {
        for (let i = 0; i < this.model.Geosets.length; ++i) {
            const geoset = this.model.Geosets[i];

            if (geoset.LevelOfDetail > 0) {
                continue;
            }

            this.vertexBuffer[i] = this.gl.createBuffer();
            if (this.softwareSkinning) {
                this.vertices[i] = new Float32Array(geoset.Vertices.length);
            } else {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.Vertices, this.gl.STATIC_DRAW);
            }

            this.normalBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer[i]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.Normals, this.gl.STATIC_DRAW);

            this.texCoordBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer[i]);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.TVertices[0], this.gl.STATIC_DRAW);

            if (this.isHD) {
                this.skinWeightBuffer[i] = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.skinWeightBuffer[i]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.SkinWeights, this.gl.STATIC_DRAW);

                this.tangentBuffer[i] = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tangentBuffer[i]);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, geoset.Tangents, this.gl.STATIC_DRAW);
            } else {
                if (!this.softwareSkinning) {
                    this.groupBuffer[i] = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.groupBuffer[i]);
                    const buffer = new Uint16Array(geoset.VertexGroup.length * 4);
                    for (let j = 0; j < buffer.length; j += 4) {
                        const index = j / 4;
                        const group = geoset.Groups[geoset.VertexGroup[index]];
                        buffer[j] = group[0];
                        buffer[j + 1] = group.length > 1 ? group[1] : MAX_NODES;
                        buffer[j + 2] = group.length > 2 ? group[2] : MAX_NODES;
                        buffer[j + 3] = group.length > 3 ? group[3] : MAX_NODES;
                    }
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, buffer, this.gl.STATIC_DRAW);
                }
            }

            this.indexBuffer[i] = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, geoset.Faces, this.gl.STATIC_DRAW);
        }
    }

    private initCube (): void {
        this.cubeVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -0.5, -0.5,  -0.5,
            -0.5,  0.5,  -0.5,
             0.5, -0.5,  -0.5,
            -0.5,  0.5,  -0.5,
             0.5,  0.5,  -0.5,
             0.5, -0.5,  -0.5,

            -0.5, -0.5,   0.5,
             0.5, -0.5,   0.5,
            -0.5,  0.5,   0.5,
            -0.5,  0.5,   0.5,
             0.5, -0.5,   0.5,
             0.5,  0.5,   0.5,

            -0.5,   0.5, -0.5,
            -0.5,   0.5,  0.5,
             0.5,   0.5, -0.5,
            -0.5,   0.5,  0.5,
             0.5,   0.5,  0.5,
             0.5,   0.5, -0.5,

            -0.5,  -0.5, -0.5,
             0.5,  -0.5, -0.5,
            -0.5,  -0.5,  0.5,
            -0.5,  -0.5,  0.5,
             0.5,  -0.5, -0.5,
             0.5,  -0.5,  0.5,

            -0.5,  -0.5, -0.5,
            -0.5,  -0.5,  0.5,
            -0.5,   0.5, -0.5,
            -0.5,  -0.5,  0.5,
            -0.5,   0.5,  0.5,
            -0.5,   0.5, -0.5,

             0.5,  -0.5, -0.5,
             0.5,   0.5, -0.5,
             0.5,  -0.5,  0.5,
             0.5,  -0.5,  0.5,
             0.5,   0.5, -0.5,
             0.5,   0.5,  0.5,
        ]), this.gl.STATIC_DRAW);
    }

    private initSquare(): void {
        this.squareVertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0,
            -1.0, 1.0,
        ]), this.gl.STATIC_DRAW);
    }

    private initBRDFLUT(): void {
        if (!isWebGL2(this.gl) || !this.colorBufferFloatExt) {
            return;
        }

        this.brdfLUT = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.brdfLUT);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RG16F, BRDF_LUT_SIZE, BRDF_LUT_SIZE, 0, this.gl.RG, this.gl.FLOAT, null);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        const framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.brdfLUT, 0);

        this.gl.useProgram(this.integrateBRDFShaderProgram);

        this.gl.viewport(0, 0, BRDF_LUT_SIZE, BRDF_LUT_SIZE);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexBuffer);
        this.gl.enableVertexAttribArray(this.integrateBRDFShaderProgramLocations.vertexPositionAttribute);
        this.gl.vertexAttribPointer(this.integrateBRDFShaderProgramLocations.vertexPositionAttribute, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.deleteFramebuffer(framebuffer);
    }

    /*private resetGlobalSequences (): void {
        for (let i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] = 0;
        }
    }*/

    private updateGlobalSequences (delta: number): void {
        for (let i = 0; i < this.rendererData.globalSequencesFrames.length; ++i) {
            this.rendererData.globalSequencesFrames[i] += delta;
            if (this.rendererData.globalSequencesFrames[i] > this.model.GlobalSequences[i]) {
                this.rendererData.globalSequencesFrames[i] = 0;
            }
        }
    }

    private updateNode (node: NodeWrapper): void {
        const translationRes = this.interp.vec3(translation, node.node.Translation);
        const rotationRes = this.interp.quat(rotation, node.node.Rotation);
        const scalingRes = this.interp.vec3(scaling, node.node.Scaling);

        if (!translationRes && !rotationRes && !scalingRes) {
            mat4.identity(node.matrix);
        } else if (translationRes && !rotationRes && !scalingRes) {
            mat4.fromTranslation(node.matrix, translationRes);
        } else if (!translationRes && rotationRes && !scalingRes) {
            mat4fromRotationOrigin(node.matrix, rotationRes, node.node.PivotPoint as vec3);
        } else {
            mat4.fromRotationTranslationScaleOrigin(node.matrix,
                rotationRes || defaultRotation,
                translationRes || defaultTranslation,
                scalingRes || defaultScaling,
                node.node.PivotPoint as vec3
            );
        }

        if (node.node.Parent || node.node.Parent === 0) {
            mat4.mul(node.matrix, this.rendererData.nodes[node.node.Parent].matrix, node.matrix);
        }

        const billboardedLock = node.node.Flags & NodeFlags.BillboardedLockX ||
            node.node.Flags & NodeFlags.BillboardedLockY ||
            node.node.Flags & NodeFlags.BillboardedLockZ;

        if (node.node.Flags & NodeFlags.Billboarded) {
            vec3.transformMat4(tempTransformedPivotPoint, node.node.PivotPoint as vec3, node.matrix);

            if (node.node.Parent || node.node.Parent === 0) {
                // cancel parent rotation from PivotPoint
                mat4.getRotation(tempParentRotationQuat, this.rendererData.nodes[node.node.Parent].matrix);
                quat.invert(tempParentRotationQuat, tempParentRotationQuat);
                mat4fromRotationOrigin(tempParentRotationMat, tempParentRotationQuat,
                    tempTransformedPivotPoint);
                mat4.mul(node.matrix, tempParentRotationMat, node.matrix);
            }

            // rotate to camera
            mat4fromRotationOrigin(tempCameraMat, this.rendererData.cameraQuat,
                tempTransformedPivotPoint);
            mat4.mul(node.matrix, tempCameraMat, node.matrix);
        } else if (billboardedLock) {
            vec3.transformMat4(tempTransformedPivotPoint, node.node.PivotPoint as vec3, node.matrix);
            vec3.copy(tempAxis, node.node.PivotPoint as vec3);

            // todo BillboardedLockX ?
            if (node.node.Flags & NodeFlags.BillboardedLockX) {
                tempAxis[0] += 1;
            } else if (node.node.Flags & NodeFlags.BillboardedLockY) {
                tempAxis[1] += 1;
            } else if (node.node.Flags & NodeFlags.BillboardedLockZ) {
                tempAxis[2] += 1;
            }

            vec3.transformMat4(tempAxis, tempAxis, node.matrix);
            vec3.sub(tempAxis, tempAxis, tempTransformedPivotPoint);

            vec3.set(tempXAxis, 1, 0, 0);
            vec3.add(tempXAxis, tempXAxis, node.node.PivotPoint as vec3);
            vec3.transformMat4(tempXAxis, tempXAxis, node.matrix);
            vec3.sub(tempXAxis, tempXAxis, tempTransformedPivotPoint);

            vec3.set(tempCameraVec, -1, 0, 0);
            vec3.transformQuat(tempCameraVec, tempCameraVec, this.rendererData.cameraQuat);

            vec3.cross(tempCross0, tempAxis, tempCameraVec);
            vec3.cross(tempCross1, tempAxis, tempCross0);

            vec3.normalize(tempCross1, tempCross1);

            quat.rotationTo(tempLockQuat, tempXAxis, tempCross1);
            mat4fromRotationOrigin(tempLockMat, tempLockQuat, tempTransformedPivotPoint);
            mat4.mul(node.matrix, tempLockMat, node.matrix);
        }

        for (const child of node.childs) {
            this.updateNode(child);
        }
    }

    private findAlpha (geosetId: number): number {
        const geosetAnim = this.rendererData.geosetAnims[geosetId];

        if (!geosetAnim || geosetAnim.Alpha === undefined) {
            return 1;
        }

        if (typeof geosetAnim.Alpha === 'number') {
            return geosetAnim.Alpha;
        }

        const interpRes = this.interp.num(geosetAnim.Alpha);

        if (interpRes === null) {
            return 1;
        }
        return interpRes;
    }

    private setLayerProps (layer: Layer, textureID: number): void {
        const texture = this.model.Textures[textureID];

        if (layer.Shading & LayerShading.TwoSided) {
            this.gl.disable(this.gl.CULL_FACE);
        } else {
            this.gl.enable(this.gl.CULL_FACE);
        }

        if (layer.FilterMode === FilterMode.Transparent) {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.75);
        } else {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }

        if (layer.FilterMode === FilterMode.None) {
            this.gl.disable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (layer.FilterMode === FilterMode.Transparent) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (layer.FilterMode === FilterMode.Blend) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Additive) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_COLOR, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.AddAlpha) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Modulate) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.ZERO, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (layer.FilterMode === FilterMode.Modulate2x) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.DST_COLOR, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        }

        if (texture.Image) {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[texture.Image]);
            this.gl.uniform1i(this.shaderProgramLocations.samplerUniform, 0);
            this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform, 0);
        } else if (texture.ReplaceableId === 1 || texture.ReplaceableId === 2) {
            this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
            this.gl.uniform1f(this.shaderProgramLocations.replaceableTypeUniform, texture.ReplaceableId);
        }

        if (layer.Shading & LayerShading.NoDepthTest) {
            this.gl.disable(this.gl.DEPTH_TEST);
        }
        if (layer.Shading & LayerShading.NoDepthSet) {
            this.gl.depthMask(false);
        }

        if (typeof layer.TVertexAnimId === 'number') {
            const anim: TVertexAnim = this.rendererData.model.TextureAnims[layer.TVertexAnimId];
            const translationRes = this.interp.vec3(translation, anim.Translation);
            const rotationRes = this.interp.quat(rotation, anim.Rotation);
            const scalingRes = this.interp.vec3(scaling, anim.Scaling);
            mat4.fromRotationTranslationScale(
                texCoordMat4,
                rotationRes || defaultRotation,
                translationRes || defaultTranslation,
                scalingRes || defaultScaling
            );
            mat3.set(
                texCoordMat3,
                texCoordMat4[0], texCoordMat4[1], 0,
                texCoordMat4[4], texCoordMat4[5], 0,
                texCoordMat4[12], texCoordMat4[13], 0
            );

            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, texCoordMat3);
        } else {
            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, identifyMat3);
        }
    }

    private setLayerPropsHD (materialID: number, layers: Layer[]): void {
        const baseLayer = layers[0];
        const textures = this.rendererData.materialLayerTextureID[materialID];
        const diffuseTextureID = textures[0];
        const diffuseTexture = this.model.Textures[diffuseTextureID];
        const normalTextureID = textures[1];
        const normalTexture = this.model.Textures[normalTextureID];
        const ormTextureID = textures[2];
        const ormTexture = this.model.Textures[ormTextureID];
        // const emissiveTextureID = textures[3];
        // const emissiveTexture = this.model.Textures[emissiveTextureID];
        // const teamColorTextureID = textures[4];
        // const teamColorTexture = this.model.Textures[teamColorTextureID];
        // const envTextureID = textures[5];
        // const envTexture = this.model.Textures[envTextureID];

        if (baseLayer.Shading & LayerShading.TwoSided) {
            this.gl.disable(this.gl.CULL_FACE);
        } else {
            this.gl.enable(this.gl.CULL_FACE);
        }

        if (baseLayer.FilterMode === FilterMode.Transparent) {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.75);
        } else {
            this.gl.uniform1f(this.shaderProgramLocations.discardAlphaLevelUniform, 0.);
        }

        if (baseLayer.FilterMode === FilterMode.None) {
            this.gl.disable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (baseLayer.FilterMode === FilterMode.Transparent) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(true);
        } else if (baseLayer.FilterMode === FilterMode.Blend) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.Additive) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_COLOR, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.AddAlpha) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.Modulate) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.ZERO, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        } else if (baseLayer.FilterMode === FilterMode.Modulate2x) {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.blendFuncSeparate(this.gl.DST_COLOR, this.gl.SRC_COLOR, this.gl.ZERO, this.gl.ONE);
            this.gl.depthMask(false);
        }

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[diffuseTexture.Image]);
        this.gl.uniform1i(this.shaderProgramLocations.samplerUniform, 0);

        if (baseLayer.Shading & LayerShading.NoDepthTest) {
            this.gl.disable(this.gl.DEPTH_TEST);
        }
        if (baseLayer.Shading & LayerShading.NoDepthSet) {
            this.gl.depthMask(false);
        }

        if (typeof baseLayer.TVertexAnimId === 'number') {
            const anim: TVertexAnim = this.rendererData.model.TextureAnims[baseLayer.TVertexAnimId];
            const translationRes = this.interp.vec3(translation, anim.Translation);
            const rotationRes = this.interp.quat(rotation, anim.Rotation);
            const scalingRes = this.interp.vec3(scaling, anim.Scaling);
            mat4.fromRotationTranslationScale(
                texCoordMat4,
                rotationRes || defaultRotation,
                translationRes || defaultTranslation,
                scalingRes || defaultScaling
            );
            mat3.set(
                texCoordMat3,
                texCoordMat4[0], texCoordMat4[1], 0,
                texCoordMat4[4], texCoordMat4[5], 0,
                texCoordMat4[12], texCoordMat4[13], 0
            );

            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, texCoordMat3);
        } else {
            this.gl.uniformMatrix3fv(this.shaderProgramLocations.tVertexAnimUniform, false, identifyMat3);
        }

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[normalTexture.Image]);
        this.gl.uniform1i(this.shaderProgramLocations.normalSamplerUniform, 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.rendererData.textures[ormTexture.Image]);
        this.gl.uniform1i(this.shaderProgramLocations.ormSamplerUniform, 2);

        this.gl.uniform3fv(this.shaderProgramLocations.replaceableColorUniform, this.rendererData.teamColor);
    }
}
