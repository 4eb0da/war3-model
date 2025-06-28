#version 300 es

in vec3 aPos;

out vec2 vLocalPos;

void main(void) {
    vLocalPos = aPos.xy;
    gl_Position = vec4(aPos, 1.0);
}