#version 300 es

in vec3 aPos;

out vec3 vLocalPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    vLocalPos = aPos;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}